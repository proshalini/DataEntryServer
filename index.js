const { faker } = require('@faker-js/faker');
const mysql = require('mysql2');
const express = require("express");
const app = express();
const port = 8080;
const path = require("path");
const {v4:uuidv4}=require("uuid");


app.use(express.static(path.join(__dirname, "/public")));
const methodOverride = require("method-override");

app.use(methodOverride("_method"));
app.use(express.urlencoded({extended:true}));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'sigma_app',
  password: 'Database@456'
});

let getUser = () => {
  return [
    faker.string.uuid(),
    faker.internet.username(), // before version 9.1.0, use userName()
    faker.internet.email(),
    faker.internet.password(),
  ];
}

//connection ends when our app is rendered 
//home page route
app.listen(port, () => {
  console.log("app is listening on port 8080");
})
app.get("/", (req, res) => {
  let q = `SELECT COUNT(*) FROM users`;
  try {
    connection.query(q, (err, result) => {
      if (err) throw err;
      let count = result[0]["COUNT(*)"];
      res.render("home", { count });
    });
  }
  catch (err) {
    console.log(err)
    res.send("error in database");
  }
})



//get user route
app.get("/user", (req, res) => {
  let q = `SELECT * FROM users`;
  try {
    connection.query(q, (err, users) => {
      if (err) throw err;
      // console.log(result);
      res.render("showusers", { users });
    });
  }
  catch (err) {
    console.log(err)
    res.send("error in database");
  }

})

app.get("/user/:id/edit", (req, res) => {
  let { id } = req.params;
  let q = `SELECT * FROM users WHERE id='${id}'`;
  try {
    connection.query(q, (err, result) => {
      if (err) throw err;
      let user = result[0];
      res.render("edit", { user });
    });
  }
  catch (err) {
    console.log(err)
    res.send("error in database");
  }
})

//update database
app.patch("/user/:id", (req, res) => {
  let { id } = req.params;
  let { username:newusername, password:formpass } = req.body;
  let q = `SELECT * FROM users WHERE id='${id}'`;
  try {
    connection.query(q, (err, result) => {
      if (err) throw err;
      let user = result[0];
      if (user.password != formpass) {
        console.log("wrong password entered");
        res.send("wrong password");
      }
      else{
        //nested connectiion query
        let q2=`UPDATE users SET username='${newusername}' WHERE id='${id}'`;
        connection.query(q2,(err,result)=>{
          if(err) throw err;
          res.redirect("/user");
        })
         
      }
      
    });
  }
  catch (err) {
    console.log(err)
    res.send("error in database");
  }
})

//add new user
app.get("/user/new",(req,res)=>{
    res.render("new");
})

app.post("/user",(req,res)=>{
  let userid=uuidv4();
  let {username:newusername,email:newemail,password:newpass}=req.body;
  let q=`INSERT INTO users(id,username,email,password) VALUES ('${userid}','${newusername}','${newemail}','${newpass}')`;
  try{
    connection.query(q,(err,newuser)=>{
      if(err) throw err;
      console.log("new user created",newuser);
      res.redirect("/user");
    })
  }
  catch(err){
    console.log(err);
    res.send("error in database");
  }
})

//delete a user
app.get("/user/:id/remove",(req,res)=>{
  let {id}=req.params;
  res.render("remove",{id});
})

app.delete("/user/:id",(req,res)=>{
  let {id}=req.params;
  let{email:newemail,password:newpasword}=req.body;
   let q = `SELECT * FROM users WHERE id='${id}'`;
   try{
    connection.query(q,(err,result)=>{
      if(err) throw err;
      let user=result[0];
      if(user.email!=newemail || user.password!=newpasword){
        //wrong data entered cannot delete
        console.log("wrong email/password");
        res.send("Enter the correct username/password");
      }
      else{
        let q2=`DELETE FROM users WHERE id='${id}'`;
        connection.query(q2,(err,result)=>{
          if(err) throw err;
          console.log("user deleted successfully");
          res.redirect("/user");
        })
      }
    })
   }
   catch(err){
    console.log(err);
    res.send("error in database");
   }
})

