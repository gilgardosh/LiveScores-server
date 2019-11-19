CREATE TABLE users (
  ID SERIAL PRIMARY KEY,
  name VARCHAR(30) NOT NULL,
  email VARCHAR(30) NOT NULL,
  password VARCHAR(30) NOT NULL
);

INSERT INTO users (name, email, password) VALUES  ('user1', 'user1@mail.com', 'password');