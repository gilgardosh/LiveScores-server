require("dotenv").config();
const request = require("request");

function LivescoreAPI() {
  const apiUrl = "https://livescore-api.com/api-client/";
  const key = process.env.LS_KEY;
  const secret = process.env.LS_SECRET;

  this.setKeySecret = (inputKey, inputSecret) => {
    this.key = inputKey;
    this.secret = inputSecret;
  };

  //function to build the url for the request
  this.buildUrl = (route, parameters = []) => {
    let url = apiUrl + route;

    const params = new URLSearchParams();
    params.set("key", key);
    params.set("secret", secret);
    parameters.forEach(paramObj => {
      params.set(paramObj.name, paramObj.value);
    });

    url += "?" + params.toString() + "&package=nodejs";
    return url;
  };

  //verify account
  this.verify = (req, res) => {
    request(
      this.buildUrl("users/pair.json"),
      {
        json: true
      },
      (err, results, body) => {
        if (err) {
          throw err;
        }
        res.status(200).json(results.body.data.message);
      }
    );
  };

  //function to check if country/competition/page/team/federation is integer and > 0
  // 0 -> no integer, -1 -> <0, 1 -> correct
  this.checkCouComPagTeaFed = couComPagTeaFed => {
    if (!Number.isInteger(parseInt(couComPagTeaFed))) {
      return 0;
    } else if (parseInt(couComPagTeaFed) <= 0) {
      return -1;
    } else {
      return 1;
    }
  };

  // function to check if language is string and if it is from [ar, fa, en, ru]
  // 0 => no string, -1 => it's not part of the list, 1 => correct
  this.checkLanguage = language => {
    const languages = ["ar", "fa", "ru"];
    if (typeof language !== "string") {
      return 0;
    } else if (languages.indexOf(language) >= 0) {
      return 1;
    } else {
      return -1;
    }
  };

  // function to check if the date is in the right format
  // 0 => no string, -1 => incorrect date format, 2 => incorrect year, 3 => incorrect month, 4 => incorrect day, 1 => correct date
  this.checkDate = date => {
    if (typeof date !== "string") {
      return 0;
    }
    dateArray = date.split("-");
    if (dateArray.length == 3) {
      if (dateArray[0].length != 4 && parseInte(dateArray[0], 10) > 1990) {
        return 2;
      } else if (
        dateArray[1].length != 2 &&
        parseInt(dateArray[1], 10) > 0 &&
        parseInt(dateArray[1], 10) <= 12
      ) {
        return 3;
      } else if (
        dateArray[2].length != 2 &&
        parseInt(dateArray[2], 10) > 0 &&
        parseInt(dateArray[2], 10) <= 31
      ) {
        return 4;
      }
      return 1;
    } else {
      return -1;
    }
  };

  //get all countries
  this.getAllCountries = (req, res) => {
    request(
      this.buildUrl("countries/list.json"),
      {
        json: true
      },
      (err, results, body) => {
        if (err) {
          throw err;
        }
        res.status(200).json(results.body.data.country);
      }
    );
  };

  //get all federations
  this.getAllFederations = (req, res) => {
    request(
      this.buildUrl("federations/list.json"),
      {
        json: true
      },
      (err, results, body) => {
        if (err) {
          throw err;
        }
        res.status(200).json(results.body.data.federation);
      }
    );
  };

  //get all fixtures
  this.getAllFixtures = (req, res) => {
    request(
      this.buildUrl("fixtures/matches.json"),
      {
        json: true
      },
      (err, results, body) => {
        if (err) {
          throw err;
        }
        res.status(200).json(results.body.data.fixtures);
      }
    );
  };

  /* get fixtures with filters:
       date => string (yyyy-mm-dd)
       language => string [ar, fa, en, ru]
       page => integer(pageNo)
       competition_id => integer(competition_id)
       team => integer(team))
       round => string (round) */
  this.getFixtursWithFilters = (req, res) => {
    const filters = req.query;
    let curFilter = [];
    
    if (filters.date != undefined) {
      checkDate = this.checkDate(filters.date);
      if (checkDate == 0 || checkDate == -1) {
        throw (
          new Error(
            "Incorrect parameter! The date must be a string in this format: YYYY-MM-DD!"
          )
        );
      } else if (checkDate == 2) {
        throw (
          new Error(
            "Incorrect parameter! The year must be in this format: YYYY"
          )
        );
      } else if (checkDate == 3) {
        throw (
          new Error("Incorrect parameter! The month must be in this format: MM")
        );
      } else if (checkDate == 4) {
        throw (
          new Error("Incorrect parameter! The day must be in this format: DD")
        );
      } else if (checkDate == 1) {
        curFilter.push({
          name: "date",
          value: filters.date
        });
      }
    }
    
    if (filters.language != undefined) {
      checkLanguage = this.checkLanguage(filters.language);
      if (checkLanguage == 0) {
        throw (
          new Error("Incorrect parameter! The language must be a string!")
        );
      } else if (checkLanguage == -1) {
        throw (
          new Error(
            "Incorrect parameter! The language must be one of the following: [ar, fa, en, ru]!"
          )
        );
      } else if (checkLanguage == 1) {
        curFilter.push({
          name: "lang",
          value: filters.language
        });
      }
    }

    if (filters.page != undefined) {
      checkPage = this.checkCouComPagTeaFed(filters.page);
      if (checkPage == 0) {
        throw (
          new Error("Incorrect parameter! The page must be an integer!")
        );
      } else if (checkPage == -1) {
        throw (
          new Error("Incorrect parameter! The page must be bigger than 0!")
        );
      } else if (checkPage == 1) {
        curFilter.push({
          name: "page",
          value: filters.page
        });
      }
    }

    if (filters.competition_id != undefined) {
      checkCompetition = this.checkCouComPagTeaFed(filters.competition_id);
      if (checkCompetition == 0) {
        throw (
          new Error(
            "Incorrect parameter! The competition id must be an integer!"
          )
        );
      } else if (checkCompetition == -1) {
        throw (
          new Error(
            "Incorrect parameter! The competition id must be bigger than 0!"
          )
        );
      } else if (checkCompetition == 1) {
        curFilter.push({
          name: "competition_id",
          value: filters.competition_id
        });
      }
    }

    if (filters.team != undefined) {
      checkTeam = this.checkCouComPagTeaFed(filters.team);
      if (checkTeam == 0) {
        throw (
          new Error("Incorrect parameter! The team id must be an integer!")
        );
      } else if (checkTeam == -1) {
        throw (
          new Error("Incorrect parameter! The team id be bigger than 0!")
        );
      } else if (checkTeam == 1) {
        curFilter.push({
          name: "team",
          value: filters.team
        });
      }
    }

    if (filters.round != undefined) {
      curFilter.push({
        name: "round",
        value: filters.round
      });
    }
    
    if (curFilter.length >= 1) {
      request(
        this.buildUrl("fixtures/matches.json", curFilter),
        {
          json: true
        },
        (err, results, body) => {
          if (err) {
            throw err;
          }

          res.status(200).json(results.body.data.fixtures);
        }
      );
    } else {
      throw (
        new Error(
          "No needed filters were provided!"
        )
      );
    }
  };

  //get all competitions
  this.getAllCompetitions = (req, res) => {
    request(
      this.buildUrl("competitions/list.json"),
      {
        json: true
      },
      (err, results, body) => {
        if (err) {
          throw err;
        }

        res.status(200).json(results.body.data.competition);
      }
    );
  };

  /* get competitions with filters:
       country_id => integer(country_id)
       federation_id => integer(federation_id) */
  this.getCompetitionsWithFilters = (req, res) => {
    const filters = req.query;
    let curFilter = [];

    if (filters.country_id != undefined) {
      checkCountry = this.checkCouComPagTeaFed(filters.country_id);
      if (checkCountry == 0) {
        throw (
          new Error("Incorrect parameter! The country id must be an integer!")
        );
      } else if (checkCountry == -1) {
        throw (
          new Error(
            "Incorrect parameter! The country id must be bigger than 0!"
          )
        );
      } else if (checkCountry == 1) {
        curFilter.push({
          name: "country_id",
          value: filters.country_id
        });
      }
    }

    if (filters.federation_id != undefined) {
      checkFederation = this.checkCouComPagTeaFed(filters.federation_id);
      if (checkFederation == 0) {
        throw (
          new Error(
            "Incorrect parameter! The federation id must be an integer!"
          )
        );
      } else if (checkFederation == -1) {
        throw (
          new Error(
            "Incorrect parameter! The federation id must be bigger than 0!"
          )
        );
      } else if (checkFederation == 1) {
        curFilter.push({
          name: "federation_id",
          value: filters.federation_id
        });
      }
    }

    if (curFilter.length >= 1) {
      request(
        this.buildUrl("competitions/list.json", curFilter),
        {
          json: true
        },
        (err, results, body) => {
          if (err) {
            throw err;
          }

          res.status(200).json(results.body.data.competition);
        }
      );
    } else {
      throw (
        new Error(
          "No needed filters were provided!"
        )
      );
    }
  };

  //get all teams
  this.getAllTeams = (req, res) => {
    request(
      this.buildUrl("teams/list.json"),
      {
        json: true
      },
      (err, results, body) => {
        if (err) {
          throw err;
        }
        res.status(200).json(results.body.data.teams);
      }
    );
  };

  /* get teams with filters:
       country_id => integer(country_id)
       federation_id => integer(federation_id)
       language => string [ar, fa, en, ru]
       size => integer (itemsNo)
       page => integer(pageNo) */
  this.getTeamsWithFilters = (req, res) => {
    const filters = req.query;
    let curFilter = [];

    if (filters.country_id != undefined) {
      checkCountry = this.checkCouComPagTeaFed(filters.country_id);
      if (checkCountry == 0) {
        throw (
          new Error("Incorrect parameter! The country id must be an integer!")
        );
      } else if (checkCountry == -1) {
        throw (
          new Error(
            "Incorrect parameter! The country id must be bigger than 0!"
          )
        );
      } else if (checkCountry == 1) {
        curFilter.push({
          name: "country_id",
          value: filters.country_id
        });
      }
    }

    if (filters.federation_id != undefined) {
      checkFederation = this.checkCouComPagTeaFed(filters.federation_id);
      if (checkFederation == 0) {
        throw (
          new Error(
            "Incorrect parameter! The federation id must be an integer!"
          )
        );
      } else if (checkFederation == -1) {
        throw (
          new Error(
            "Incorrect parameter! The federation id must be bigger than 0!"
          )
        );
      } else if (checkFederation == 1) {
        curFilter.push({
          name: "federation_id",
          value: filters.federation_id
        });
      }
    }

    if (filters.language != undefined) {
      checkLanguage = this.checkLanguage(filters.language);
      if (checkLanguage == 0) {
        throw (
          new Error("Incorrect parameter! The language must be a string!")
        );
      } else if (checkLanguage == -1) {
        throw (
          new Error(
            "Incorrect parameter! The language must be one of the following: [ar, fa, en, ru]!"
          )
        );
      } else if (checkLanguage == 1) {
        curFilter.push({
          name: "lang",
          value: filters.language
        });
      }
    }

    if (filters.page != undefined) {
      checkPage = this.checkCouComPagTeaFed(filters.page);
      if (checkPage == 0) {
        throw (
          new Error("Incorrect parameter! The page must be an integer!")
        );
      } else if (checkPage == -1) {
        throw (
          new Error("Incorrect parameter! The page must be bigger than 0!")
        );
      } else if (checkPage == 1) {
        curFilter.push({
          name: "page",
          value: filters.page
        });
      }
    }

    if (filters.size != undefined) {
      if (!Number.isInteger(filters.size)) {
        throw (
          new Error("Incorrect parameter! The size must be an integer!")
        );
      } else if (filters.size <= 0 || filters.size >= 101) {
        throw (
          new Error("Incorrect parameter! The size must be in range 1-100!")
        );
      } else {
        curFilter.push({
          name: "size",
          value: filters.size
        });
      }
    }

    if (curFilter.length >= 1) {
      request(
        this.buildUrl("teams/list.json", curFilter),
        {
          json: true
        },
        (err, results, body) => {
          if (err) {
            throw err;
          }

          res.status(200).json(results.body.data.teams);
        }
      );
    } else {
      throw (
        new Error(
          "No needed filters were provided!"
        )
      );
    }
  };

  /* get fixtures with filters:
    competition_id => integer(competition_id)
    season_id => integer (season id)
    language => string [ar, fa, en, ru] */
  this.getStandings = (req, res) => {
    const filters = req.query;
    let curFilter = [];

    if (filters.competition_id != undefined) {
      checkCompetition = this.checkCouComPagTeaFed(filters.competition_id);
      if (checkCompetition == 0) {
        throw (
          new Error(
            "Incorrect parameter! The competition id must be an integer!"
          )
        );
      } else if (checkCompetition == -1) {
        throw (
          new Error(
            "Incorrect parameter! The competition id must be bigger than 0!"
          )
        );
      } else if (checkCompetition == 1) {
        curFilter.push({
          name: "competition_id",
          value: filters.competition_id
        });
      }
    }

    if (filters.season_id != undefined) {
      if (!Number.isInteger(filters.season_id)) {
        throw (
          new Error("Incorrect parameter! The seson_id must be an integer!")
        );
      } else if (filters.season_id <= 0 || filters.season_id >= 6) {
        throw (
          new Error("Incorrect parameter! The season_id must be in range 1-5!")
        );
      } else {
        curFilter.push({
          name: "season",
          value: filters.season_id
        });
      }
    }

    if (filters.language != undefined) {
      checkLanguage = this.checkLanguage(filters.language);
      if (checkLanguage == 0) {
        throw (
          new Error("Incorrect parameter! The language must be a string!")
        );
      } else if (checkLanguage == -1) {
        throw (
          new Error(
            "Incorrect parameter! The language must be one of the following: [ar, fa, en, ru]!"
          )
        );
      } else if (checkLanguage == 1) {
        curFilter.push({
          name: "lang",
          value: filters.language
        });
      }
    }

    if (curFilter.length >= 2) {
      request(
        this.buildUrl("leagues/table.json", curFilter),
        {
          json: true
        },
        (err, results, body) => {
          if (err) {
            throw err;
          }

          res.status(200).json(results.body.data.table);
        }
      );
    } else {
      throw (
        new Error(
          "No needed filters were provided!"
        )
      );
    }
  };

  //get full history
  this.getFullHistory = (req, res) => {
    request(
      this.buildUrl("scores/history.json"),
      {
        json: true
      },
      (err, results, body) => {
        if (err) {
          throw err;
        }

        res.status(200).json(results.body.data.match);
      }
    );
  };

  /* get history with filters:
       fromDate => string (yyyy-mm-dd)
       toDate => string (yyyy-mm-dd)
       competition_id => integer(competition_id)
       team => integer(team))
       page => integer(pageNo)
       language => string [ar, fa, en, ru] */
  this.getHistoryWithFilters = (req, res) => {
    const filters = req.query;
    let curFilter = [];

    if (filters.fromDate != undefined) {
      checkDate = this.checkDate(filters.fromDate);
      if (checkDate == 0 || checkDate == -1) {
        throw (
          new Error(
            "Incorrect parameter! The date must be a string in this format: YYYY-MM-DD!"
          )
        );
      } else if (checkDate == 2) {
        throw (
          new Error(
            "Incorrect parameter! The year must be in this format: YYYY"
          )
        );
      } else if (checkDate == 3) {
        throw (
          new Error("Incorrect parameter! The month must be in this format: MM")
        );
      } else if (checkDate == 4) {
        throw (
          new Error("Incorrect parameter! The day must be in this format: DD")
        );
      } else if (checkDate == 1) {
        curFilter.push({
          name: "from",
          value: filters.fromDate
        });
      }
    }

    if (filters.toDate != undefined) {
      checkDate = this.checkDate(filters.toDate);
      if (checkDate == 0 || checkDate == -1) {
        throw (
          new Error(
            "Incorrect parameter! The date must be a string in this format: YYYY-MM-DD!"
          )
        );
      } else if (checkDate == 2) {
        throw (
          new Error(
            "Incorrect parameter! The year must be in this format: YYYY"
          )
        );
      } else if (checkDate == 3) {
        throw (
          new Error("Incorrect parameter! The month must be in this format: MM")
        );
      } else if (checkDate == 4) {
        throw (
          new Error("Incorrect parameter! The day must be in this format: DD")
        );
      } else if (checkDate == 1) {
        curFilter.push({
          name: "to",
          value: filters.toDate
        });
      }
    }

    if (filters.competition_id != undefined) {
      checkCompetition = this.checkCouComPagTeaFed(filters.competition_id);
      if (checkCompetition == 0) {
        throw (
          new Error(
            "Incorrect parameter! The competition id must be an integer!"
          )
        );
      } else if (checkCompetition == -1) {
        throw (
          new Error(
            "Incorrect parameter! The competition id must be bigger than 0!"
          )
        );
      } else if (checkCompetition == 1) {
        curFilter.push({
          name: "competition_id",
          value: filters.competition_id
        });
      }
    }

    if (filters.team != undefined) {
      checkTeam = this.checkCouComPagTeaFed(filters.team);
      if (checkTeam == 0) {
        throw (
          new Error("Incorrect parameter! The team id must be an integer!")
        );
      } else if (checkTeam == -1) {
        throw (
          new Error("Incorrect parameter! The team id be bigger than 0!")
        );
      } else if (checkTeam == 1) {
        curFilter.push({
          name: "team",
          value: filters.team
        });
      }
    }

    if (filters.page != undefined) {
      checkPage = this.checkCouComPagTeaFed(filters.page);
      if (checkPage == 0) {
        throw (
          new Error("Incorrect parameter! The page must be an integer!")
        );
      } else if (checkPage == -1) {
        throw (
          new Error("Incorrect parameter! The page must be bigger than 0!")
        );
      } else if (checkPage == 1) {
        curFilter.push({
          name: "page",
          value: filters.page
        });
      }
    }

    if (filters.language != undefined) {
      checkLanguage = this.checkLanguage(filters.language);
      if (checkLanguage == 0) {
        throw (
          new Error("Incorrect parameter! The language must be a string!")
        );
      } else if (checkLanguage == -1) {
        throw (
          new Error(
            "Incorrect parameter! The language must be one of the following: [ar, fa, en, ru]!"
          )
        );
      } else if (checkLanguage == 1) {
        curFilter.push({
          name: "lang",
          value: filters.language
        });
      }
    }

    if (curFilter.length >= 1) {
      request(
        this.buildUrl("scores/history.json", curFilter),
        {
          json: true
        },
        (err, results, body) => {
          if (err) {
            throw err;
          }

          res.status(200).json(results.body.data.match);
        }
      );
    } else {
      throw (
        new Error(
          "No needed filters were provided!"
        )
      );
    }
  };

  //get all livescores
  this.getAllLiveScores = (req, res) => {
    request(
      this.buildUrl("scores/live.json"),
      {
        json: true
      },
      (err, results, body) => {
        if (err) {
          throw err;
        }

        res.status(200).json(results.body.data.match);
      }
    );
  };

  /* get livescores with filters:
       country_id => integer(country_id)
       language => string [ar, fa, en, ru]
       competition_id => integer(competition_id)*/
  this.getLiveScoresWithFilters = (req, res) => {
    const filters = req.query;    
    let curFilter = [];

    if (filters.country_id != undefined) {
      checkCountry = this.checkCouComPagTeaFed(filters.country_id);
      if (checkCountry == 0) {
        throw (
          new Error("Incorrect parameter! The country id must be an integer!")
        );
      } else if (checkCountry == -1) {
        throw (
          new Error(
            "Incorrect parameter! The country id must be bigger than 0!"
          )
        );
      } else if (checkCountry == 1) {
        curFilter.push({
          name: "country_id",
          value: filters.country_id
        });
      }
    }

    if (filters.language != undefined) {
      checkLanguage = this.checkLanguage(filters.language);
      if (checkLanguage == 0) {
        throw (
          new Error("Incorrect parameter! The language must be a string!")
        );
      } else if (checkLanguage == -1) {
        throw (
          new Error(
            "Incorrect parameter! The language must be one of the following: [ar, fa, en, ru]!"
          )
        );
      } else if (checkLanguage == 1) {
        curFilter.push({
          name: "lang",
          value: filters.language
        });
      }
    }

    if (filters.competition_id != undefined) {
      checkCompetition = this.checkCouComPagTeaFed(filters.competition_id);
      if (checkCompetition == 0) {
        throw (
          new Error(
            "Incorrect parameter! The competition id must be an integer!"
          )
        );
      } else if (checkCompetition == -1) {
        throw (
          new Error(
            "Incorrect parameter! The competition id must be bigger than 0!"
          )
        );
      } else if (checkCompetition == 1) {
        curFilter.push({
          name: "competition_id",
          value: filters.competition_id
        });
      }
    }

    if (curFilter.length >= 1) {
      request(
        this.buildUrl("scores/live.json", curFilter),
        {
          json: true
        },
        (err, results, body) => {
          if (err) {
            throw err;
          }

          res.status(200).json(results.body.data.match);
        }
      );
    } else {
      throw (
        new Error(
          "No needed filters were provided!"
        )
      );
    }
  };

  // get live event    match_id => integer(match_id)
  this.getLiveMatchEvents = (req, res) => {
    const match_id = req.query.match_id
    
    if (match_id -= undefined) {
      throw (
        new Error(
          "Missing match id!"
        )
      );
    } else {
      request(
        this.buildUrl("scores/live.json", [
          {
            name: "id",
            value: match_id
          }
        ]),
        {
          json: true
        },
        (err, results, body) => {
          if (err) {
            throw err;
          }
          res.status(200).json(results.body.data.match);
        }
      );
    }
    

  };

  // get match statistics    match_id => integer(match_id)
  this.getMatchStats = (req, res) => {
    const match_id = req.query.match_id
    
    if (match_id -= undefined) {
      throw (
        new Error(
          "Missing match id!"
        )
      );
    } else {
      request(
        this.buildUrl("matches/stats.json", [
          {
            name: "match_id",
            value: match_id
          }
        ]),
        {
          json: true
        },
        (err, results, body) => {
          if (err) {
            throw err;
          }
          res.status(200).json(results.body.data);
        }
      );
    }


  };

  /* get teams head 2 head:
       team1_id => integer(team))
       team2_id => integer(team))
       language => string [ar, fa, en, ru] */
  this.getTeamsH2H = (req, res) => {
    const filters = req.query;
    let curFilter = [];

    if (filters.language != undefined) {
      checkLanguage = this.checkLanguage(filters.language);
      if (checkLanguage == 0) {
        throw (
          new Error("Incorrect parameter! The language must be a string!")
        );
      } else if (checkLanguage == -1) {
        throw (
          new Error(
            "Incorrect parameter! The language must be one of the following: [ar, fa, en, ru]!"
          )
        );
      } else if (checkLanguage == 1) {
        curFilter.push({
          name: "lang",
          value: filters.language
        });
      }
    }

    if (filters.team1_id != undefined || filters.team2_id != undefined) {
      checkTeam1 = this.checkCouComPagTeaFed(filters.team1_id);
      checkTeam2 = this.checkCouComPagTeaFed(filters.team2_id);
      if (checkTeam1 == 0 || checkTeam2 == 0) {
        throw (
          new Error("Incorrect parameter! The team id must be an integer!")
        );
      } else if (checkTeam1 == -1 || checkTeam2 == -1) {
        throw (
          new Error("Incorrect parameter! The team id be bigger than 0!")
        );
      } else if (checkTeam1 == 1 || checkTeam2 == 1) {
        curFilter.push(
          {
            name: "team1_id",
            value: filters.team1_id
          },
          {
            name: "team2_id",
            value: filters.team2_id
          }
        );
      }
    } else if (
      filters.team1_id == undefined ||
      filters.team2_id == undefined ||
      filters.team1_id === filters.team2_id
    ) {
      throw (new Error("Two unique team id's are required!"));
    }

    if (curFilter.length >= 2) {
      request(
        this.buildUrl("teams/head2head.json", curFilter),
        {
          json: true
        },
        (err, results, body) => {
          if (err) {
            throw err;
          }

          res.status(200).json(results.body.data);
        }
      );
    } else {
      throw (
        new Error(
          "No needed filters were provided!"
        )
      );
    }
  };

  return this;
}

module.exports = {
  LivescoreAPI
};
