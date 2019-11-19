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
  this.verify = callback => {
    request(
      this.buildUrl("users/pair.json"),
      {
        json: true
      },
      (err, res, body) => {
        if (err) {
          return callback(err);
        }
        callback(null, res.body.data.message);
      }
    );
  };

  //check api key and secret
  this.checkKeySecret = () => {
    request(
      checkers.buildUrl("users/pair.json"),
      {
        json: true
      },
      (err, res, body) => {
        if (err) {
          throw err;
        }
        return res.body.data.message;
      }
    );
  };

  //function to check if country/competition/page/team/federation is integer and > 0
  // 0 -> no integer, -1 -> <0, 1 -> correct
  this.checkCouComPagTeaFed = couComPagTeaFed => {
    if (!Number.isInteger(couComPagTeaFed)) {
      return 0;
    } else if (couComPagTeaFed <= 0) {
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
  this.getAllCountries = callback => {
    request(
      this.buildUrl("countries/list.json"),
      {
        json: true
      },
      (err, res, body) => {
        if (err) {
          return callback(err);
        }
        callback(null, res.body.data.country);
      }
    );
  };

  //get all federations
  this.getAllFederations = callback => {
    request(
      this.buildUrl("federations/list.json"),
      {
        json: true
      },
      (err, res, body) => {
        if (err) {
          return callback(err);
        }
        callback(null, res.body.data.federation);
      }
    );
  };

  //get all fixtures
  this.getAllFixtures = callback => {
    request(
      this.buildUrl("fixtures/matches.json"),
      {
        json: true
      },
      (err, res, body) => {
        if (err) {
          return callback(err);
        }
        callback(res.body.data.fixtures);
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
  this.getFixtursWithFilters = (filters, callback) => {
    let curFilter = [];

    if (filters.date != undefined) {
      checkDate = this.checkDate(filters.date);
      if (checkDate == 0 || checkDate == -1) {
        return callback(
          new Error(
            "Incorrect parameter! The date must be a string in this format: YYYY-MM-DD!"
          )
        );
      } else if (checkDate == 2) {
        return callback(
          new Error(
            "Incorrect parameter! The year must be in this format: YYYY"
          )
        );
      } else if (checkDate == 3) {
        return callback(
          new Error("Incorrect parameter! The month must be in this format: MM")
        );
      } else if (checkDate == 4) {
        return callback(
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
        return callback(
          new Error("Incorrect parameter! The language must be a string!")
        );
      } else if (checkLanguage == -1) {
        return callback(
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
        return callback(
          new Error("Incorrect parameter! The page must be an integer!")
        );
      } else if (checkPage == -1) {
        return callback(
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
        return callback(
          new Error(
            "Incorrect parameter! The competition id must be an integer!"
          )
        );
      } else if (checkCompetition == -1) {
        return callback(
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
      checkTeam = this.checkCouComPagTeaFed(filters.page);
      if (checkTeam == 0) {
        return callback(
          new Error("Incorrect parameter! The team id must be an integer!")
        );
      } else if (checkTeam == -1) {
        return callback(
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
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.fixtures);
        }
      );
    }
  };

  //get all competitions
  this.getAllCompetitions = callback => {
    request(
      this.buildUrl("competitions/list.json"),
      {
        json: true
      },
      (err, res, body) => {
        if (err) {
          return callback(err);
        }

        callback(null, res.body.data.competition);
      }
    );
  };

  /* get competitions with filters:
       country_id => integer(country_id)
       federation_id => integer(federation_id) */
  this.getCompetitionsWithFilters = (filters, callback) => {
    let curFilter = [];

    if (filters.country_id != undefined) {
      checkCountry = this.checkCouComPagTeaFed(filters.country_id);
      if (checkCountry == 0) {
        return callback(
          new Error("Incorrect parameter! The country id must be an integer!")
        );
      } else if (checkCountry == -1) {
        return callback(
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
        return callback(
          new Error(
            "Incorrect parameter! The federation id must be an integer!"
          )
        );
      } else if (checkFederation == -1) {
        return callback(
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
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.competition);
        }
      );
    }
  };

  //get all teams
  this.getAllTeams = callback => {
    request(
      this.buildUrl("teams/list.json"),
      {
        json: true
      },
      (err, res, body) => {
        if (err) {
          return callback(err);
        }
        callback(null, res.body.data.teams);
      }
    );
  };

  /* get teams with filters:
       country_id => integer(country_id)
       federation_id => integer(federation_id)
       language => string [ar, fa, en, ru]
       size => integer (itemsNo)
       page => integer(pageNo) */
  this.getTeamsWithFilters = (filters, callback) => {
    let curFilter = [];

    if (filters.country_id != undefined) {
      checkCountry = this.checkCouComPagTeaFed(filters.country_id);
      if (checkCountry == 0) {
        return callback(
          new Error("Incorrect parameter! The country id must be an integer!")
        );
      } else if (checkCountry == -1) {
        return callback(
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
        return callback(
          new Error(
            "Incorrect parameter! The federation id must be an integer!"
          )
        );
      } else if (checkFederation == -1) {
        return callback(
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
        return callback(
          new Error("Incorrect parameter! The language must be a string!")
        );
      } else if (checkLanguage == -1) {
        return callback(
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
    };

    if (filters.page != undefined) {
      checkPage = this.checkCouComPagTeaFed(filters.page);
      if (checkPage == 0) {
        return callback(
          new Error("Incorrect parameter! The page must be an integer!")
        );
      } else if (checkPage == -1) {
        return callback(
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
        return callback(
          new Error("Incorrect parameter! The size must be an integer!")
        );
      } else if (filters.size <= 0 || filters.size >= 101) {
        return callback(
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
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.teams);
        }
      );
    }
  };


  /* get fixtures with filters:
    competition_id => integer(competition_id)
    season_id => integer (season id)
    language => string [ar, fa, en, ru] */
    this.getStandings = (filters, callback) => {
        let curFilter = [];

        if (filters.competition_id != undefined) {
            checkCompetition = this.checkCouComPagTeaFed(filters.competition_id);
            if (checkCompetition == 0) {
                return callback(
                new Error(
                    "Incorrect parameter! The competition id must be an integer!"
                )
                );
            } else if (checkCompetition == -1) {
                return callback(
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
                return callback(
                new Error("Incorrect parameter! The seson_id must be an integer!")
                );
            } else if (filters.season_id <= 0 || filters.season_id >= 6) {
                return callback(
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
            return callback(
                new Error("Incorrect parameter! The language must be a string!")
            );
            } else if (checkLanguage == -1) {
            return callback(
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
            (err, res, body) => {
                if (err) {
                return callback(err);
                }

                callback(null, res.body.data.table);
            }
            );
        }
    };

  //get full history
  this.getFullHistory = callback => {
    request(
      this.buildUrl("scores/history.json"),
      {
        json: true
      },
      (err, res, body) => {
        if (err) {
          return callback(err);
        }

        callback(null, res.body.data.match);
      }
    );
  };

    /* get history with filters:
       from date => string (yyyy-mm-dd)
       to date => string (yyyy-mm-dd)
       competition_id => integer(competition_id)
       team => integer(team))
       page => integer(pageNo)
       language => string [ar, fa, en, ru] */
  this.getHistoryWithFilters = (filters, callback) => {
    request(
      this.buildUrl("scores/history.json"),
      {
        json: true
      },
      (err, res, body) => {
        if (err) {
          return callback(err);
        }

        callback(null, res.body.data.match);
      }
    );
  };






    //get livescores
    this.getAllLiveScores = callback => {
        request(
          this.buildUrl("scores/live.json"),
          {
            json: true
          },
          (err, res, body) => {
            if (err) {
              return callback(err);
            }
    
            callback(null, res.body.data.match);
          }
        );
      };









  //get fixtures from a certain date      PARAMETER => string (yyyy-mm-dd)
  this.getFixturesFromDate = (date, callback) => {
    check = this.checkDate(date);
    if (check == 0 || check == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The date must be a string in this format: YYYY-MM-DD!"
        )
      );
    } else if (check == 2) {
      return callback(
        new Error("Incorrect parameter! The year must be in this format: YYYY")
      );
    } else if (check == 3) {
      return callback(
        new Error("Incorrect parameter! The month must be in this format: MM")
      );
    } else if (check == 4) {
      return callback(
        new Error("Incorrect parameter! The day must be in this format: DD")
      );
    }
    request(
      this.buildUrl("fixtures/matches.json", [
        {
          name: "date",
          value: date
        }
      ]),
      {
        json: true
      },
      (err, res, body) => {
        if (err) {
          return callback(err);
        }
        callback(null, res.body.data.fixtures);
      }
    );
  };

  //get fixtures from a certain competition    PARAMETER => integer(competition_id)
  this.getFixturesFromCompetition = (competition_id, callback) => {
    check = this.checkCouComPagTeaFed(competition_id);
    if (check == 0) {
      return callback(
        new Error("Incorrect parameter! The competition id must be an integer!")
      );
    } else if (check == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The competition id must be bigger than 0!"
        )
      );
    } else {
      request(
        this.buildUrl("fixtures/matches.json", [
          {
            name: "competition_id",
            value: competition_id
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.fixtures);
        }
      );
    }
  };

  //get fixtures in a certain language    PARAMETER => string     [ar, fa, en, ru]
  this.getFixturesInLanguage = (language, callback) => {
    check = this.checkLanguage(language);
    if (check == 0) {
      return callback(
        new Error("Incorrect parameter! The language must be a string!")
      );
    } else if (check == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The language must be one of the following: [ar, fa, en, ru]!"
        )
      );
    } else {
      request(
        this.buildUrl("fixtures/matches.json", [
          {
            name: "lang",
            value: language
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.fixtures);
        }
      );
    }
  };

  //get fixtures from a certain page      PARAMETER => integer
  this.getFixturesFromPage = (page, callback) => {
    check = this.checkCouComPagTeaFed(page);
    if (check == 0) {
      return callback(
        new Error("Incorrect parameter! The page must be an integer!")
      );
    } else if (check == -1) {
      return callback(
        new Error("Incorrect parameter! The page must be bigger than 0!")
      );
    } else {
      request(
        this.buildUrl("fixtures/matches.json", [
          {
            name: "page",
            value: page
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.fixtures);
        }
      );
    }
  };

  //get fixtures from a date, in a certain language from a certain competition
  this.getFixturesDateLanguageCompetition = (
    date,
    language,
    competition_id,
    callback
  ) => {
    checkLanguage = this.checkLanguage(language);
    checkCompetition = this.checkCouComPagTeaFed(competition_id);
    checkDate = this.checkDate(date);
    if (checkLanguage == 0) {
      return callback(
        new Error("Incorrect parameter! The language must be a string!")
      );
    } else if (checkLanguage == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The language must be one of the following: [ar, fa, en, ru]!"
        )
      );
    }
    if (checkCompetition == 0) {
      return callback(
        new Error("Incorrect parameter! The competition id must be an integer!")
      );
    } else if (checkCompetition == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The competition id must be bigger than 0!"
        )
      );
    }
    if (checkDate == 0 || checkDate == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The date must be a string in this format: YYYY-MM-DD!"
        )
      );
    } else if (checkDate == 2) {
      return callback(
        new Error("Incorrect parameter! The year must be in this format: YYYY")
      );
    } else if (checkDate == 3) {
      return callback(
        new Error("Incorrect parameter! The month must be in this format: MM")
      );
    } else if (checkDate == 4) {
      return callback(
        new Error("Incorrect parameter! The day must be in this format: DD")
      );
    }
    if (checkDate == 1 && checkLanguage == 1 && checkCompetition == 1) {
      request(
        this.buildUrl("fixtures/matches.json", [
          {
            name: "date",
            value: date
          },
          {
            name: "competition_id",
            value: competition_id
          },
          {
            name: "lang",
            value: language
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.fixtures);
        }
      );
    }
  };

  // get fixtures from a date in a certain language
  this.getFixturesDateLanguage = (date, language, callback) => {
    checkLanguage = this.checkLanguage(language);
    checkDate = this.checkDate(date);
    if (checkLanguage == 0) {
      return callback(
        new Error("Incorrect parameter! The language must be a string!")
      );
    } else if (checkLanguage == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The language must be one of the following: [ar, fa, en, ru]!"
        )
      );
    }
    if (checkDate == 0 || checkDate == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The date must be a string in this format: YYYY-MM-DD!"
        )
      );
    } else if (checkDate == 2) {
      return callback(
        new Error("Incorrect parameter! The year must be in this format: YYYY")
      );
    } else if (checkDate == 3) {
      return callback(
        new Error("Incorrect parameter! The month must be in this format: MM")
      );
    } else if (checkDate == 4) {
      return callback(
        new Error("Incorrect parameter! The day must be in this format: DD")
      );
    }
    if (checkDate == 1 && checkLanguage == 1) {
      request(
        this.buildUrl("fixtures/matches.json", [
          {
            name: "date",
            value: date
          },
          {
            name: "lang",
            value: language
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.fixtures);
        }
      );
    }
  };

  // get fixtures from a date from a certain competition
  this.getFixturesDateCompetition = (date, competition_id, callback) => {
    checkCompetition = this.checkCouComPagTeaFed(competition_id);
    checkDate = this.checkDate(date);
    if (checkCompetition == 0) {
      return callback(
        new Error("Incorrect parameter! The competition id must be an integer!")
      );
    } else if (checkCompetition == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The competition id must be bigger than 0!"
        )
      );
    }
    if (checkDate == 0 || checkDate == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The date must be a string in this format: YYYY-MM-DD!"
        )
      );
    } else if (checkDate == 2) {
      return callback(
        new Error("Incorrect parameter! The year must be in this format: YYYY")
      );
    } else if (checkDate == 3) {
      return callback(
        new Error("Incorrect parameter! The month must be in this format: MM")
      );
    } else if (checkDate == 4) {
      return callback(
        new Error("Incorrect parameter! The day must be in this format: DD")
      );
    }
    if (checkDate == 1 && checkCompetition == 1) {
      request(
        this.buildUrl("fixtures/matches.json", [
          {
            name: "date",
            value: date
          },
          {
            name: "competition_id",
            value: competition_id
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.fixtures);
        }
      );
    }
  };

  // get fixtures from a certain competition in a certain language
  this.getFixturesCompetitionLanguage = (
    competition_id,
    language,
    callback
  ) => {
    checkLanguage = this.checkLanguage(language);
    checkCompetition = this.checkCouComPagTeaFed(competition_id);
    if (checkLanguage == 0) {
      return callback(
        new Error("Incorrect parameter! The language must be a string!")
      );
    } else if (checkLanguage == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The language must be one of the following: [ar, fa, en, ru]!"
        )
      );
    }
    if (checkCompetition == 0) {
      return callback(
        new Error("Incorrect parameter! The competition id must be an integer!")
      );
    } else if (checkCompetition == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The competition id must be bigger than 0!"
        )
      );
    }
    if (checkLanguage == 1 && checkCompetition == 1) {
      request(
        this.buildUrl("fixtures/matches.json", [
          {
            name: "competition_id",
            value: competition_id
          },
          {
            name: "lang",
            value: language
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }
          callback(null, res.body.data.fixtures);
        }
      );
    }
  };

  //get history from this date onwards   PARAMETER => string (yyyy-mm-dd)
  this.getHistoryFromDate = (date, callback) => {
    request(
      this.buildUrl("scores/history.json", [
        {
          name: "from",
          value: date
        }
      ]),
      {
        json: true
      },
      (err, res, body) => {
        if (err) {
          return callback(err);
        }

        callback(null, res.body.data.match);
      }
    );
  };

  //get history until this date included    PARAMETER => string (yyyy-mm-dd)
  this.getHistoryToDate = (date, callback) => {
    request(
      this.buildUrl("scores/history.json", [
        {
          name: "to",
          value: date
        }
      ]),
      {
        json: true
      },
      (err, res, body) => {
        if (err) {
          return callback(err);
        }

        callback(null, res.body.data.match);
      }
    );
  };

  //get history for a certain competition    PARAMETER => integer(competition_id)
  this.getHistoryByCompetition = (competition_id, callback) => {
    check = this.checkCouComPagTeaFed(competition_id);
    if (check == 0) {
      return callback(
        new Error("Incorrect parameter! The competition id must be an integer!")
      );
    } else if (check == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The competition id must be bigger than 0!"
        )
      );
    } else {
      request(
        this.buildUrl("scores/history.json", [
          {
            name: "competition_id",
            value: competition_id
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.match);
        }
      );
    }
  };

  //get matches from a cerain page if there are multiple     PARAMETER => integer(pageNo)
  this.getHistoryFromPage = (page, callback) => {
    check = this.checkCouComPagTeaFed(page);
    if (check == 0) {
      return callback(
        new Error("Incorrect parameter! The page must be an integer!")
      );
    } else if (check == -1) {
      return callback(
        new Error("Incorrect parameter! The page must be bigger than 0!")
      );
    } else {
      request(
        this.buildUrl("scores/history.json", [
          {
            name: "page",
            value: page
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.match);
        }
      );
    }
  };

  //get history in a certain language    PARAMETER => string   [ar, fa, en, ru]
  this.getHistoryInLanguage = (language, callback) => {
    check = this.checkLanguage(language);
    if (check == 0) {
      return callback(
        new Error("Incorrect parameter! The language must be a string!")
      );
    } else if (check == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The language must be one of the following: [ar, fa, en, ru]!"
        )
      );
    } else {
      request(
        this.buildUrl("scores/history.json", [
          {
            name: "lang",
            value: language
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.match);
        }
      );
    }
  };

  // get history between 2 dates from a certain competition in a certain language
  this.getHistoryBetweendDatesCountryLanguage = (
    fromDate,
    toDate,
    competition_id,
    language,
    callback
  ) => {
    checkFromDate = this.checkDate(fromDate);
    checkToDate = this.checkDate(toDate);
    checkCompetition = this.checkCouComPagTeaFed(competition_id);
    checkLanguage = this.checkLanguage(language);
    if (
      checkFromDate == 0 ||
      checkFromDate == -1 ||
      checkToDate == 0 ||
      checkToDate == -1
    ) {
      return callback(
        new Error(
          "Incorrect parameter! The date must be a string in this format: YYYY-MM-DD!"
        )
      );
    } else if (checkFromDate == 2 || checkToDate == 2) {
      return callback(
        new Error("Incorrect parameter! The year must be in this format: YYYY")
      );
    } else if (checkFromDate == 3 || checkToDate == 3) {
      return callback(
        new Error("Incorrect parameter! The month must be in this format: MM")
      );
    } else if (checkFromDate == 4 || checkToDate == 4) {
      return callback(
        new Error("Incorrect parameter! The day must be in this format: DD")
      );
    }
    if (checkLanguage == 0) {
      return callback(
        new Error("Incorrect parameter! The language must be a string!")
      );
    } else if (checkLanguage == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The language must be one of the following: [ar, fa, en, ru]!"
        )
      );
    }
    if (checkCompetition == 0) {
      return callback(
        new Error("Incorrect parameter! The competition id must be an integer!")
      );
    } else if (checkCompetition == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The competition id must be bigger than 0!"
        )
      );
    }
    if (
      checkLanguage == 1 &&
      checkCompetition == 1 &&
      checkFromDate == 1 &&
      checkToDate == 1
    ) {
      request(
        this.buildUrl("scores/history.json", [
          {
            name: "from",
            value: fromDate
          },
          {
            name: "to",
            value: toDate
          },
          {
            name: "competition_id",
            value: competition_id
          },
          {
            name: "lang",
            value: language
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.match);
        }
      );
    }
  };

  // get history between 2 dates from a certain competition
  this.getHistoryBetweenDatesCompetition = (
    fromDate,
    toDate,
    competition_id,
    callback
  ) => {
    checkFromDate = this.checkDate(fromDate);
    checkToDate = this.checkDate(toDate);
    checkCompetition = this.checkCouComPagTeaFed(competition_id);
    if (
      checkFromDate == 0 ||
      checkFromDate == -1 ||
      checkToDate == 0 ||
      checkToDate == -1
    ) {
      return callback(
        new Error(
          "Incorrect parameter! The date must be a string in this format: YYYY-MM-DD!"
        )
      );
    } else if (checkFromDate == 2 || checkToDate == 2) {
      return callback(
        new Error("Incorrect parameter! The year must be in this format: YYYY")
      );
    } else if (checkFromDate == 3 || checkToDate == 3) {
      return callback(
        new Error("Incorrect parameter! The month must be in this format: MM")
      );
    } else if (checkFromDate == 4 || checkToDate == 4) {
      return callback(
        new Error("Incorrect parameter! The day must be in this format: DD")
      );
    }
    if (checkCompetition == 0) {
      return callback(
        new Error("Incorrect parameter! The competition id must be an integer!")
      );
    } else if (checkCompetition == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The competition id must be bigger than 0!"
        )
      );
    }
    if (checkCompetition == 1 && checkFromDate == 1 && checkToDate == 1) {
      request(
        this.buildUrl("scores/history.json", [
          {
            name: "from",
            value: fromDate
          },
          {
            name: "to",
            value: toDate
          },
          {
            name: "competition_id",
            value: competition_id
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.match);
        }
      );
    }
  };

  // get history between 2 dates in a certain language
  this.getHistoryBetweenDatesLanguage = (
    fromDate,
    toDate,
    language,
    callback
  ) => {
    checkFromDate = this.checkDate(fromDate);
    checkToDate = this.checkDate(toDate);
    checkLanguage = this.checkLanguage(language);
    if (
      checkFromDate == 0 ||
      checkFromDate == -1 ||
      checkToDate == 0 ||
      checkToDate == -1
    ) {
      return {
        success: false,
        message:
          "Incorrect parameter! The date must be a string in this format: YYYY-MM-DD!"
      };
    } else if (checkFromDate == 2 || checkToDate == 2) {
      return callback(
        new Error("Incorrect parameter! The year must be in this format: YYYY")
      );
    } else if (checkFromDate == 3 || checkToDate == 3) {
      return callback(
        new Error("Incorrect parameter! The month must be in this format: MM")
      );
    } else if (checkFromDate == 4 || checkToDate == 4) {
      return callback(
        new Error("Incorrect parameter! The day must be in this format: DD")
      );
    }
    if (checkLanguage == 0) {
      return callback(
        new Error("Incorrect parameter! The language must be a string!")
      );
    } else if (checkLanguage == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The language must be one of the following: [ar, fa, en, ru]!"
        )
      );
    }
    if (checkLanguage == 1 && checkFromDate == 1 && checkToDate == 1) {
      request(
        this.buildUrl("scores/history.json", [
          {
            name: "from",
            value: fromDate
          },
          {
            name: "to",
            value: toDate
          },
          {
            name: "lang",
            value: language
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.match);
        }
      );
    }
  };

  //get history starting from a date from a certain competition in a certain language
  this.getHistoryFromDateCompetitionLanguage = (
    fromDate,
    competition_id,
    language,
    callback
  ) => {
    checkFromDate = this.checkDate(fromDate);
    checkCompetition = this.checkCouComPagTeaFed(competition_id);
    checkLanguage = this.checkLanguage(language);
    if (checkFromDate == 0 || checkFromDate == -1) {
      return {
        success: false,
        message:
          "Incorrect parameter! The date must be a string in this format: YYYY-MM-DD!"
      };
    } else if (checkFromDate == 2) {
      return callback(
        new Error("Incorrect parameter! The year must be in this format: YYYY")
      );
    } else if (checkFromDate == 3) {
      return callback(
        new Error("Incorrect parameter! The month must be in this format: MM")
      );
    } else if (checkFromDate == 4) {
      return callback(
        new Error("Incorrect parameter! The day must be in this format: DD")
      );
    }
    if (checkLanguage == 0) {
      return callback(
        new Error("Incorrect parameter! The language must be a string!")
      );
    } else if (checkLanguage == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The language must be one of the following: [ar, fa, en, ru]!"
        )
      );
    }
    if (checkCompetition == 0) {
      return callback(
        new Error("Incorrect parameter! The competition id must be an integer!")
      );
    } else if (checkCompetition == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The competition id must be bigger than 0!"
        )
      );
    }
    if (checkLanguage == 1 && checkCompetition == 1 && checkFromDate == 1) {
      request(
        this.buildUrl("scores/history.json", [
          {
            name: "from",
            value: fromDate
          },
          {
            name: "competition_id",
            value: lecompetition_idague
          },
          {
            name: "lang",
            value: language
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.match);
        }
      );
    }
  };

  // get history until a date from a certain competition in a certain language
  this.getHistoryToDateCompetitionLanguage = (
    toDate,
    competition_id,
    language,
    callback
  ) => {
    checkToDate = this.checkDate(toDate);
    checkCompetition = this.checkCouComPagTeaFed(competition_id);
    checkLanguage = this.checkLanguage(language);
    if (checkToDate == 0 || checkToDate == -1) {
      return {
        success: false,
        message:
          "Incorrect parameter! The date must be a string in this format: YYYY-MM-DD!"
      };
    } else if (checkToDate == 2) {
      return callback(
        new Error("Incorrect parameter! The year must be in this format: YYYY")
      );
    } else if (checkToDate == 3) {
      return callback(
        new Error("Incorrect parameter! The month must be in this format: MM")
      );
    } else if (checkToDate == 4) {
      return callback(
        new Error("Incorrect parameter! The day must be in this format: DD")
      );
    }
    if (checkLanguage == 0) {
      return callback(
        new Error("Incorrect parameter! The language must be a string!")
      );
    } else if (checkLanguage == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The language must be one of the following: [ar, fa, en, ru]!"
        )
      );
    }
    if (checkCompetition == 0) {
      return callback(
        new Error("Incorrect parameter! The competition id must be an integer!")
      );
    } else if (checkCompetition == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The competition id must be bigger than 0!"
        )
      );
    }
    if (checkLanguage == 1 && checkCompetition == 1 && checkToDate == 1) {
      request(
        this.buildUrl("scores/history.json", [
          {
            name: "to",
            value: toDate
          },
          {
            name: "competition_id",
            value: competition_id
          },
          {
            name: "lang",
            value: language
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.match);
        }
      );
    }
  };

  //get history between 2 dates
  this.getHistoryBetweenDates = (fromDate, toDate, callback) => {
    checkFromDate = this.checkDate(fromDate);
    checkToDate = this.checkDate(toDate);
    if (
      checkFromDate == 0 ||
      checkFromDate == -1 ||
      checkToDate == 0 ||
      checkToDate == -1
    ) {
      return {
        success: false,
        message:
          "Incorrect parameter! The date must be a string in this format: YYYY-MM-DD!"
      };
    } else if (checkFromDate == 2 || checkToDate == 2) {
      return callback(
        new Error("Incorrect parameter! The year must be in this format: YYYY")
      );
    } else if (checkFromDate == 3 || checkToDate == 3) {
      return callback(
        new Error("Incorrect parameter! The month must be in this format: MM")
      );
    } else if (checkFromDate == 4 || checkToDate == 4) {
      return callback(
        new Error("Incorrect parameter! The day must be in this format: DD")
      );
    } else if (checkFromDate == 1 && checkToDate == 1) {
      request(
        this.buildUrl("scores/history.json", [
          {
            name: "from",
            value: fromDate
          },
          {
            name: "to",
            value: toDate
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.match);
        }
      );
    }
  };

  // get history starting from a date from a certain competition
  this.getHistoryFromDateCompetition = (fromDate, competition_id, callback) => {
    checkFromDate = this.checkDate(fromDate);
    checkCompetition = this.checkCouComPagTeaFed(competition_id);
    if (checkFromDate == 0 || checkFromDate == -1) {
      return {
        success: false,
        message:
          "Incorrect parameter! The date must be a string in this format: YYYY-MM-DD!"
      };
    } else if (checkFromDate == 2) {
      return callback(
        new Error("Incorrect parameter! The year must be in this format: YYYY")
      );
    } else if (checkFromDate == 3) {
      return callback(
        new Error("Incorrect parameter! The month must be in this format: MM")
      );
    } else if (checkFromDate == 4) {
      return callback(
        new Error("Incorrect parameter! The day must be in this format: DD")
      );
    }
    if (checkCompetition == 0) {
      return callback(
        new Error("Incorrect parameter! The competition id must be an integer!")
      );
    } else if (checkCompetition == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The competition id must be bigger than 0!"
        )
      );
    }
    if (checkCompetition == 1 && checkFromDate == 1) {
      request(
        this.buildUrl("scores/history.json", [
          {
            name: "from",
            value: fromDate
          },
          {
            name: "competition_id",
            value: competition_id
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.match);
        }
      );
    }
  };

  //get history starting from a date in a certain language
  this.getHistoryFromDateLanguage = (fromDate, language, callback) => {
    checkFromDate = this.checkDate(fromDate);
    checkLanguage = this.checkLanguage(language);
    if (checkFromDate == 0 || checkFromDate == -1) {
      return {
        success: false,
        message:
          "Incorrect parameter! The date must be a string in this format: YYYY-MM-DD!"
      };
    } else if (checkFromDate == 2) {
      return callback(
        new Error("Incorrect parameter! The year must be in this format: YYYY")
      );
    } else if (checkFromDate == 3) {
      return callback(
        new Error("Incorrect parameter! The month must be in this format: MM")
      );
    } else if (checkFromDate == 4) {
      return callback(
        new Error("Incorrect parameter! The day must be in this format: DD")
      );
    }
    if (checkLanguage == 0) {
      return callback(
        new Error("Incorrect parameter! The language must be a string!")
      );
    } else if (checkLanguage == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The language must be one of the following: [ar, fa, en, ru]!"
        )
      );
    }
    if (checkLanguage == 1 && checkFromDate == 1) {
      request(
        this.buildUrl("scores/history.json", [
          {
            name: "from",
            value: fromDate
          },
          {
            name: "lang",
            value: language
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.match);
        }
      );
    }
  };

  //get history until a date from a certain competition
  this.getHistoryToDateCompetition = (toDate, competition_id, callback) => {
    checkToDate = this.checkDate(toDate);
    checkCompetition = this.checkCouComPagTeaFed(competition_id);
    if (checkToDate == 0 || checkToDate == -1) {
      return {
        success: false,
        message:
          "Incorrect parameter! The date must be a string in this format: YYYY-MM-DD!"
      };
    } else if (checkToDate == 2) {
      return callback(
        new Error("Incorrect parameter! The year must be in this format: YYYY")
      );
    } else if (checkToDate == 3) {
      return callback(
        new Error("Incorrect parameter! The month must be in this format: MM")
      );
    } else if (checkToDate == 4) {
      return callback(
        new Error("Incorrect parameter! The day must be in this format: DD")
      );
    }
    if (checkCompetition == 0) {
      return callback(
        new Error("Incorrect parameter! The competition id must be an integer!")
      );
    } else if (checkCompetition == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The competition id must be bigger than 0!"
        )
      );
    }
    if (checkCompetition == 1 && checkToDate == 1) {
      request(
        this.buildUrl("scores/history.json", [
          {
            name: "to",
            value: toDate
          },
          {
            name: "competition_id",
            value: competition_id
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.match);
        }
      );
    }
  };

  // get history until a date in a certain language
  this.getHistoryToDateLanguage = (toDate, language, callback) => {
    checkToDate = this.checkDate(toDate);
    checkLanguage = this.checkLanguage(language);
    if (checkToDate == 0 || checkToDate == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The date must be a string in this format: YYYY-MM-DD!"
        )
      );
    } else if (checkToDate == 2) {
      return callback(
        new Error("Incorrect parameter! The year must be in this format: YYYY")
      );
    } else if (checkToDate == 3) {
      return callback(
        new Error("Incorrect parameter! The month must be in this format: MM")
      );
    } else if (checkToDate == 4) {
      return callback(
        new Error("Incorrect parameter! The day must be in this format: DD")
      );
    }
    if (checkLanguage == 0) {
      return callback(
        new Error("Incorrect parameter! The language must be a string!")
      );
    } else if (checkLanguage == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The language must be one of the following: [ar, fa, en, ru]!"
        )
      );
    }
    if (checkLanguage == 1 && checkToDate == 1) {
      request(
        this.buildUrl("scores/history.json", [
          {
            name: "to",
            value: toDate
          },
          {
            name: "lang",
            value: language
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.match);
        }
      );
    }
  };

  // get history from a competition in a certain language
  this.getHistoryCompetitionLanguage = (competition_id, language, callback) => {
    checkCompetition = this.checkCouComPagTeaFed(competition_id);
    checkLanguage = this.checkLanguage(language);
    if (checkLanguage == 0) {
      return callback(
        new Error("Incorrect parameter! The language must be a string!")
      );
    } else if (checkLanguage == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The language must be one of the following: [ar, fa, en, ru]!"
        )
      );
    }
    if (checkCompetition == 0) {
      return callback(
        new Error("Incorrect parameter! The competition id must be an integer!")
      );
    } else if (checkCompetition == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The competition id must be bigger than 0!"
        )
      );
    }
    if (checkLanguage == 1 && checkCompetition == 1) {
      request(
        this.buildUrl("scores/history.json", [
          {
            name: "competition_id",
            value: competition_id
          },
          {
            name: "lang",
            value: language
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.match);
        }
      );
    }
  };

  //get competitions from a certain country     PARAMETER => integer(countryId)
  this.getCompetitionsFromCountry = (country_id, callback) => {
    check = this.checkCouComPagTeaFed(country_id);
    if (check == 0) {
      return callback(
        new Error("Incorrect parameter! The country id must be an integer!")
      );
    } else if (check == -1) {
      return callback(
        new Error("Incorrect parameter! The country id must be bigger than 0!")
      );
    } else if (check == 1) {
      request(
        this.buildUrl("competitions/list.json", [
          {
            name: "country_id",
            value: country_id
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.competition);
        }
      );
    }
  };

  //get competitions from a certain federation     PARAMETER => integer(federationId)
  this.getCompetitionsFromFederation = (federation_id, callback) => {
    check = this.checkCouComPagTeaFed(federation_id);
    if (check == 0) {
      return callback(
        new Error("Incorrect parameter! The federation id must be an integer!")
      );
    } else if (check == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The federation id must be bigger than 0!"
        )
      );
    } else if (check == 1) {
      request(
        this.buildUrl("competitions/list.json", [
          {
            name: "federation_id",
            value: federation_id
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.competition);
        }
      );
    }
  };

  //get livescores from a certain country  PARAMETER => integer(countryId)
  this.getLiveScoresByCountry = (country_id, callback) => {
    check = this.checkCouComPagTeaFed(country_id);
    if (check == 0) {
      return callback(
        new Error("Incorrect parameter! The country id must be an integer!")
      );
    } else if (check == -1) {
      return callback(
        new Error("Incorrect parameter! The country id must be bigger than 0!")
      );
    } else {
      request(
        this.buildUrl("scores/live.json", [
          {
            name: "country_id",
            value: country_id
          }
        ]),
        { json: true },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.match);
        }
      );
    }
  };

  //get livescores from a certain competition   PARAMETER => integer(competitionId)
  this.getLiveScoresByCompetition = (competition_id, callback) => {
    check = this.checkCouComPagTeaFed(competition_id);
    if (check == 0) {
      return callback(
        new Error("Incorrect parameter! The competition id must be an integer!")
      );
    } else if (check == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The competition id must be bigger than 0!"
        )
      );
    } else {
      request(
        this.buildUrl("scores/live.json", [
          {
            name: "competition_id",
            value: competition_id
          }
        ]),
        { json: true },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.match);
        }
      );
    }
  };

  //get livescores in a certain language   PARAMETER => string     [ar, fa, en, ru]
  this.getLiveScoresInLanguage = (language, callback) => {
    check = this.checkLanguage(language);
    if (check == 0) {
      return callback(
        new Error("Incorrect parameter! The language must be a string!")
      );
    } else if (check == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The language must be one of the following: [ar, fa, en, ru]!"
        )
      );
    } else {
      request(
        this.buildUrl("scores/live.json", [
          {
            name: "lang",
            value: language
          }
        ]),
        { json: true },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }
          callback(null, res.body.data.match);
        }
      );
    }
  };

  //get livescores from a certain country, from a certain competition in a certain language
  this.getLiveScoresCountryCompetitionLanguage = (
    country_id,
    competition_id,
    language,
    callback
  ) => {
    checkCountry = this.checkCouComPagTeaFed(country_id);
    checkCompetition = this.checkCouComPagTeaFed(competition_id);
    checkLanguage = this.checkLanguage(language);
    if (checkLanguage == 0) {
      return callback(
        new Error("Incorrect parameter! The language must be a string!")
      );
    } else if (checkLanguage == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The language must be one of the following: [ar, fa, en, ru]!"
        )
      );
    }
    if (checkCompetition == 0) {
      return callback(
        new Error("Incorrect parameter! The competition id must be an integer!")
      );
    } else if (checkCompetition == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The competition id must be bigger than 0!"
        )
      );
    }
    if (checkCountry == 0) {
      return callback(
        new Error("Incorrect parameter! The country id must be an integer!")
      );
    } else if (checkCompetition == -1) {
      return callback(
        new Error("Incorrect parameter! The country id must be bigger than 0!")
      );
    }
    if (checkCountry == 1 && checkCompetition == 1 && checkLanguage == 1) {
      request(
        this.buildUrl("scores/live.json", [
          {
            name: "country_id",
            value: country_id
          },
          {
            name: "competition_id",
            value: competition_id
          },
          {
            name: "lang",
            value: language
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.match);
        }
      );
    }
  };

  // get livescores from a certain country in a certain language
  this.getLiveScoresCountryLanguage = (country_id, language, callback) => {
    checkCountry = this.checkCouComPagTeaFed(country_id);
    checkLanguage = this.checkLanguage(language);
    if (checkLanguage == 0) {
      return callback(
        new Error("Incorrect parameter! The language must be a string!")
      );
    } else if (checkLanguage == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The language must be one of the following: [ar, fa, en, ru]!"
        )
      );
    }
    if (checkCountry == 0) {
      return callback(
        new Error("Incorrect parameter! The country id must be an integer!")
      );
    } else if (checkCountry == -1) {
      return callback(
        new Error("Incorrect parameter! The country id must be bigger than 0!")
      );
    }
    if (checkCountry == 1 && checkLanguage == 1) {
      request(
        this.buildUrl("scores/live.json", [
          {
            name: "country_id",
            value: country_id
          },
          {
            name: "lang",
            value: language
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.match);
        }
      );
    }
  };

  // get livescores from a certain competition in a certain country
  this.getLiveScoresCountryCompetiton = (
    country_id,
    competition_id,
    callback
  ) => {
    checkCountry = this.checkCouComPagTeaFed(country_id);
    checkCompetition = this.checkCouComPagTeaFed(competition_id);
    if (checkCountry == 0) {
      return callback(
        new Error("Incorrect parameter! The country id must be an integer!")
      );
    } else if (checkCompetition == -1) {
      return callback(
        new Error("Incorrect parameter! The country id must be bigger than 0!")
      );
    }
    if (checkCompetition == 0) {
      return callback(
        new Error("Incorrect parameter! The competition id must be an integer!")
      );
    } else if (checkCompetition == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The competition id must be bigger than 0!"
        )
      );
    }
    if (checkCountry == 1 && checkCompetition == 1) {
      request(
        this.buildUrl("scores/live.json", [
          {
            name: "country_id",
            value: country_id
          },
          {
            name: "competition_id",
            value: competition_id
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.match);
        }
      );
    }
  };

  // get livescores from a certain competition in a certain language
  this.getLiveScoresCompetitionLanguage = (
    competition_id,
    language,
    callback
  ) => {
    checkCompetition = this.checkCouComPagTeaFed(competition_id);
    checkLanguage = this.checkLanguage(language);
    if (checkLanguage == 0) {
      return callback(
        new Error("Incorrect parameter! The language must be a string!")
      );
    } else if (checkLanguage == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The language must be one of the following: [ar, fa, en, ru]!"
        )
      );
    }
    if (checkCompetition == 0) {
      return callback(
        new Error("Incorrect parameter! The competition id must be an integer!")
      );
    } else if (checkCompetition == -1) {
      return callback(
        new Error(
          "Incorrect parameter! The competition id must be bigger than 0!"
        )
      );
    }
    if (checkCompetition == 1 && checkLanguage == 1) {
      request(
        this.buildUrl("scores/live.json", [
          {
            name: "competition_id",
            value: competition_id
          },
          {
            name: "lang",
            value: language
          }
        ]),
        {
          json: true
        },
        (err, res, body) => {
          if (err) {
            return callback(err);
          }

          callback(null, res.body.data.match);
        }
      );
    }
  };

  return this;
}

module.exports = {
  LivescoreAPI
};
