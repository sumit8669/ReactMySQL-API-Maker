import express from "express";
import mysql from "mysql";


const app = express();

const db = mysql.createConnection({
    host : "localhost",
    user : "rootuser",
    password : "rootpassword",
    database : "test"
})

app.use(express.json())

app.get("/", (req, res) =>{
    res.json("hello this is backend")
})

app.get("/api/v1/longest-duration-movies", (req,res) =>{
    const q = "SELECT  tconst , primaryTitle,runtimeMinutes,genres FROM test.movies order by runtimeMinutes desc limit 10"
    db.query(q,(err,data) => {
        if(err) return res.json(err)
        return res.json(data)
    })
})

app.get("/api/v1/top-rated-movies", (req,res) =>{
    const q = "SELECT m.tconst , m.primaryTitle, m.genres , r.averageRating FROM movies m inner join ratings r on m.tconst = r.tconst where r.averageRating > 6.0 order by averageRating desc;"
    db.query(q,(err,data) => {
        if(err) return res.json(err)
        return res.json(data)
    })
})

app.get("/api/v1/genre-movies-with-subtotals", (req,res) =>{
    const q = "SELECT m.genres, m.primaryTitle, r.numVotes, t.subtotal_sum FROM movies m JOIN ratings r ON m.tconst = r.tconst JOIN (SELECT genres, SUM(numVotes) as subtotal_sum FROM movies JOIN ratings ON movies.tconst = ratings.tconst GROUP BY genres   ) t ON m.genres = t.genres ORDER BY m.genres"
    db.query(q,(err,data) => {
        if(err) return res.json(err)
        return res.json(data)
    })
})

app.post("/api/v1/new-movie", (req, res) => {
    const { tconst, titleType, primaryTitle, runtimeMinutes, genres, averageRating, numVotes } = req.body;

  
    db.beginTransaction((err) => {
      if (err) {
        console.error("Error starting transaction:", err);
        res.status(500).json({ error: "An error occurred while starting a transaction." });
        return;
      }
  
      const movieQuery = "INSERT INTO movies (`tconst`, `titleType`, `primaryTitle`, `runtimeMinutes`, `genres`) VALUES (?, ?, ?, ?, ?);";
      const movieValues = [tconst, titleType, primaryTitle, runtimeMinutes, genres];
  
      db.query(movieQuery, movieValues, (error, movieResult) => {
        if (error) {
          console.error("Error inserting new movie:", error);
          db.rollback(() => {
            res.status(500).json({ error: "An error occurred while inserting a new movie." });
          });
          return;
        }
  
        const movieId = movieResult.insertId;
  
        const ratingsQuery = "INSERT INTO ratings (`movie_id`, `tconst`, `averageRating`, `numVotes`) VALUES (?, ?, ?, ?);";
        const ratingsValues = [movieId, tconst, averageRating, numVotes];
  
        db.query(ratingsQuery, ratingsValues, (err, ratingsResult) => {
          if (err) {
            console.error("Error inserting new rating:", err);
            db.rollback(() => {
              res.status(500).json({ error: "An error occurred while inserting a new rating." });
            });
            return;
          }
  
          db.commit((commitErr) => {
            if (commitErr) {
              console.error("Error committing transaction:", commitErr);
              db.rollback(() => {
                res.status(500).json({ error: "An error occurred while committing the transaction." });
              });
              return;
            }
  
            res.status(200).json({ message: "New movie added successfully." });
          });
        });
      });
    });
  });
  
  app.post("/api/v1/update-runtime-minutes", (req, res) => {
    
    const updateQuery = `
      UPDATE movies
      SET runtimeMinutes = 
        CASE 
          WHEN genres = 'Documentary' THEN runtimeMinutes + 15
          WHEN genres = 'Animation' THEN runtimeMinutes + 30
          ELSE runtimeMinutes + 45
        END;
    `;
  
    db.query(updateQuery, (error, result) => {
      if (error) {
        console.error("Error updating runtime minutes:", error);
        res.status(500).json({ error: "An error occurred while updating runtime minutes." });
      } else {
        res.status(200).json({ message: "Runtime minutes updated successfully." });
      }
    });
  });
  

app.listen(8800 , ()=>{
    console.log("Connect to Server");
})


