const { pool } = require("./database/config");

function PostgresDB() {

  this.getUsers = (request, response) => {
    pool.query("SELECT * FROM users", (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).json(results.rows);
    });
  };

  this.addUser = (request, response) => {
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

  return this;
}

module.exports = {
  PostgresDB
};
