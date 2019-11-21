const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { pool } = require("./config");
const livescoreapi = require("./livescores");

const app = express();
const livescores = livescoreapi.LivescoreAPI();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const getUsers = (request, response) => {
  pool.query("SELECT * FROM users", (error, results) => {
    if (error) {
      throw error;
    }
    response.status(200).json(results.rows);
  });
};

const addUser = (request, response) => {
  const { name, email, password } = request.body;

  pool.query(
    "INSERT INTO users (name, email, password) VALUES ($1, $2, $3)",
    [name, email, password],
    error => {
      if (error) {
        throw error;
      }
      response.status(201).json({ status: "success", message: "User added." });
    }
  );
};

app
  .route("/users")
  // GET endpoint
  .get(getUsers)
  // POST endpoint
  .post(addUser);

// Start server
app.listen(port, () => {
  console.log(`Server listening on port`, port);
});

// verify LiveScores-api connection
livescores.verify((err, data) => {
  if (err) {
    console.log("LiveScores:", err);
  } else {
    console.log("LiveScores:", data);
  }
});


// const filters = {
//   'competition_id': 177,
//   'season_id': 4
// };
// livescores.getStandings(filters, (err, data) => {
//   if (err) {
//     console.log("Fixtures:", err);
//   } else {
//     console.log("Fixtures:", data);
//   }
// });
