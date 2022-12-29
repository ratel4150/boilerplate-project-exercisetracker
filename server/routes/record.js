const express = require("express");
const { ObjectId } = require("mongodb");

// recordRoutes is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /listings.
const recordRoutes = express.Router();

// This will help us connect to the database
const dbo = require("../db/conn");

// This section will help you get a list of all the records.

recordRoutes.route("/api/users/:id/logs?").get(function (req, res) {
  const from = new Date(req.query.from);
  const to = new Date(req.query.to);
  const limit = Number(req.query.limit);
  const id = req.params.id;
  let equalCaracters=req.url.split('').map((caracter)=>{
    return caracter
  }).filter((caracter)=>{
    return caracter==="="
  })


  
 
  const dbConnect = dbo.getDb();

  dbConnect
    .collection("User")
    .aggregate([
      { $match: { _id: ObjectId(id) } },
      {
        $lookup: {
          from: "Excercise",
          localField: "_id",
          foreignField: "user_id",
          as: "log",
        },
      },
    ])
    .toArray(function (err, result) {
      if (err) {
        res.status(400).send("Error fetching listings!");
      } else {
        if (equalCaracters.length===3) {
          let arrayResult = [];
          arrayResult.length = 0;
          const entries = Object.entries(result[0].log);
          let dataFiltered = entries
            .map((data) => {
              
              return data;
            })
            .filter((data) => {
              const conditionYear =
                from.getFullYear() <= data[1].date.getFullYear() &&
                data[1].date.getFullYear() <= to.getFullYear();
              const conditionMonth =
                from.getMonth() <= data[1].date.getMonth() &&
                data[1].date.getMonth() <= to.getMonth();
              const conditionDay =
                from.getDate() <= data[1].date.getDate() &&
                data[1].date.getDate() <= to.getDate();

              return conditionYear && conditionMonth && conditionDay;
            });
          console.log(entries[1]);

          for (let index = 0; index < limit; index++) {
            const element = dataFiltered[index];
            console.log(element[1]);
            delete element[1]._id;
            delete element[1].user_id;
            arrayResult.push(element[1]);
          }

          res.json({
            _id: result[0]._id,
            username: result[0].username,
            from: from,
            to: to,
            count: limit,
            log: arrayResult,
          });
       
          
        }else if(equalCaracters.length===2){
          let arrayResult = [];
          arrayResult.length = 0;
          const entries = Object.entries(result[0].log);
          let dataFiltered = entries
            .map((data) => {
              return data;
            })
            .filter((data) => {
              const conditionYear =
                from.getFullYear() <= data[1].date.getFullYear() &&
                data[1].date.getFullYear() <= to.getFullYear();
              const conditionMonth =
                from.getMonth() <= data[1].date.getMonth() &&
                data[1].date.getMonth() <= to.getMonth();
              const conditionDay =
                from.getDate() <= data[1].date.getDate() &&
                data[1].date.getDate() <= to.getDate();

              return conditionYear && conditionMonth && conditionDay;
            });
          console.log(entries[1]);

          for (let index = 0; index < dataFiltered.length; index++) {
            const element = dataFiltered[index];
            console.log(element[1]);
            delete element[1]._id;
            delete element[1].user_id;
            element[1].date.toDateString()
            arrayResult.push(element[1]);
          }

          res.json({
            _id: result[0]._id,
            username: result[0].username,
            from: from.toDateString(),
            to: to.toDateString(),
            count: arrayResult.length,
            log: arrayResult,
          });
       

        }else if(equalCaracters.length===1) {
          res.json({"www":"ww"})
        }
      }
    });
});

recordRoutes.route("/api/users/:id/exercise").post(function (req, res) {
  const dbConnect = dbo.getDb();

  const matchDocument = {
    user_id: ObjectId(req.params.id),
    description: req.body.description,
    duration: Number(req.body.duration),
    date: new Date(req.body.date),
  };

  dbConnect.collection("Excercise").insertOne(matchDocument, (err, result1) => {
    let variable = ObjectId(req.params.id).toString();

    dbConnect
      .collection("User")
      .aggregate([
        {
          $lookup: {
            from: "Excercise",
            localField: "_id",
            foreignField: "user_id",
            as: "UserExcersice",
          },
        },
      ])
      .toArray(function (err, result) {
        if (err) {
          res.status(400).send("Error fetching listings!");
        } else {
          const entries = Object.entries(result);

          let dataFiltered = entries
            .map((data) => {
              return data[1];
            })
            .filter((data) => {
              return data._id.toString() === variable;
            });

          const entries1 = Object.entries(dataFiltered[0].UserExcersice);

          console.log(dataFiltered._id);

          res.json({
            _id: dataFiltered[0]._id,
            username: dataFiltered[0].username,
            date: entries1[entries1.length - 1][1].date.toDateString(),
            duration: entries1[entries1.length - 1][1].duration,
            description: entries1[entries1.length - 1][1].description,
          });
        }
      });

    /*  res.status(204).send();  */
  });
});

// This section will help you create a new record.
recordRoutes.route("/api/users").post(function (req, res) {
  const dbConnect = dbo.getDb();

  const matchDocument = {
    username: req.body.username,
  };

  dbConnect.collection("User").insertOne(matchDocument, (err, result, u) => {
    let variable = result.insertedId;
    console.log(variable.toString());

    dbConnect
      .collection("User")
      .find({ _id: ObjectId(variable.toString()) })
      .limit(50)
      .toArray(function (err, result) {
        if (err) {
          res.status(400).send("Error fetching listings!");
        } else {
          let alias = result[0].username;
          res.json({ username: alias, _id: variable.toString() });
        }
      });
    /* res.status(204).send(); */
  });
});

// This section will help you update a record by id.
recordRoutes.route("/listings/updateLike").post(function (req, res) {
  const dbConnect = dbo.getDb();
  const listingQuery = { _id: req.body.id };
  const updates = {
    $inc: {
      likes: 1,
    },
  };

  dbConnect
    .collection("tracker")
    .updateOne(listingQuery, updates, function (err, _result) {
      if (err) {
        res
          .status(400)
          .send(`Error updating likes on listing with id ${listingQuery.id}!`);
      } else {
        console.log("1 document updated");
      }
    });
});

// This section will help you delete a record.
recordRoutes.route("/listings/delete/:id").delete((req, res) => {
  const dbConnect = dbo.getDb();
  const listingQuery = { listing_id: req.body.id };

  dbConnect
    .collection("tracker")
    .deleteOne(listingQuery, function (err, _result) {
      if (err) {
        res
          .status(400)
          .send(`Error deleting listing with id ${listingQuery.listing_id}!`);
      } else {
        console.log("1 document deleted");
      }
    });
});

module.exports = recordRoutes;
