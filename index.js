const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const postgres = require("./postgres");
const livescoreapi = require("./livescores/livescores");

const app = express();
const livescores = livescoreapi.LivescoreAPI();
const db = postgres.PostgresDB();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app
  .route("/users")
  .get(db.getUsers)
  .post(db.addUser);




app
  .route("/livescores/countries")
  .get(livescores.getAllCountries);

app
  .route("/livescores/federations")
  .get(livescores.getAllFederations);

app
  .route("/livescores/teams")
  .get(livescores.getAllTeams)
  .post(livescores.getTeamsWithFilters);

app
  .route("/livescores/fixtures")
  .get(livescores.getAllFixtures)
  .post(livescores.getFixtursWithFilters);

app
  .route("/livescores/competitions")
  .get(livescores.getAllCompetitions)
  .post(livescores.getCompetitionsWithFilters);

app
  .route("/livescores/standings")
  .post(livescores.getStandings);

app
  .route("/livescores/history")
  .get(livescores.getFullHistory)
  .post(livescores.getHistoryWithFilters);

app
  .route("/livescores/livescores")
  .get(livescores.getAllLiveScores)
  .post(livescores.getLiveScoresWithFilters);

app
  .route("/livescores/matchevents")
  .post(livescores.getLiveMatchEvents);

app
  .route("/livescores/matchstats")
  .post(livescores.getMatchStats);

app
  .route("/livescores/h2h")
  .post(livescores.getTeamsH2H);

// Start server
app.listen(port, () => {
  console.log(`Server listening on port`, port);
});
