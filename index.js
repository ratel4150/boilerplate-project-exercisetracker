// Loads the configuration from config.env to process.env
require('dotenv').config({ path: '.env' });

const express = require('express');
const cors = require('cors');
// get MongoDB driver connection
const dbo = require('./server/db/conn');

const PORT = 5000;
const app = express();
app.use(express.urlencoded({extended:false}))
app.use(express.json());
app.use(cors());






app.use(require('./server/routes/record'));


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Global error handling
app.use(function (err, _req, res) {
  console.error(err.stack);
   _req.status(500).send('Something broke!'); 
}); 

// perform a database connection when the server starts
dbo.connectToServer(function (err) {
  if (err) {
    console.error(err);
    process.exit();
  }

  // start the Express server
  app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
  });
});
