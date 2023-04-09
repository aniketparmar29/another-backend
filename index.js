const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config({path:"./config.env"})

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });
  

const pool = mysql.createPool({
    connectionLimit: 100,
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
});

pool.getConnection(function (err, connection) {
  if (err) throw err;

  connection.query("SELECT * FROM codforms", function (error, results, fields) {
    connection.release();

    if (error) throw error;

    console.log("Connection to MySQL established");
  });
});

app.get("/forms", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error while getting a connection from the pool", err);
      return res.status(500).send("Internal Server Error");
    }
    connection.query("SELECT * FROM codforms", (err, rows) => {
      connection.release();
      if (err) {
        console.error("Error while executing query", err);
        return res.status(500).send("Internal Server Error");
      }
      res.send(rows);
    });
  });
});

app.get('/forms/:id', (req, res) => {
  const id = req.params.id;
  pool.query('SELECT * FROM codforms WHERE id = ?', id, (error, results, fields) => {
    if (error) throw error;
    res.send(results[0]);
  });
});


app.delete('/forms/:id', (req, res) => {
  const id = req.params.id;

  // Delete the coupon from the database
  pool.query('DELETE FROM codforms WHERE id = ?', id, (error, results, fields) => {
    if (error) throw error;
    res.send('Coupon deleted successfully.');
  });
});

app.post("/forms", (req, res) => {
    const {
      name,
      address,
      village,
      taluka,
      district,
      pincode,
      mobile,
      invoice_date,
      aggarbati,
      weight
    } = req.body;
  
    if (!name || !address || !village || !taluka || !district || !pincode || !mobile || !invoice_date || !aggarbati || !weight) {
      res.status(400).send('Missing required fields');
      return;
    }
  
    pool.query(
      'INSERT INTO `codforms`(`name`, `address`, `village`, `taluka`, `district`, `pincode`, `mobile`, `invoice_date`, `aggarbati`, `weight`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, address, village, taluka, district, pincode, mobile, invoice_date, aggarbati, weight],
      (err, result) => {
        if (err) {
          console.error('Error creating COD form:', err);
          res.sendStatus(500);
          return;
        }
        console.log('COD form created:', result);
        res.sendStatus(201);
      }
    );
  });
  

const server = app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

server.on("error", (err) => {
  console.error("Server error", err);
  server.close(() => {
    process.exit(1);
  });
});

process.on("uncaughtException", (err) => {
  console.error("Unhandled exception", err);
  server.close(() => {
    process.exit(1);
  });
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection", err);
  server.close(() => {
    process.exit(1);
  });
});
