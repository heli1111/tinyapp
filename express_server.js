const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  secret: generateRandomString(12),
  maxAge: 24 * 60 * 60 * 1000
}));

const urlDatabase = {};

const users = {}

// generateRandomString - generate random alphanumerical string
function generateRandomString(num) {
  let newID = "";
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < num; i++){
    newID += characters.charAt(Math.floor(Math.random()*characters.length));
  }
  return newID;
}

function urlsForUser(id) {
  let urls = {}
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      urls[shortURL] = urlDatabase[shortURL];
    }
  }
  return urls;
}

// set view engine
app.set("view engine", "ejs")

// index page
app.get("/", (req, res) => {
  res.end("Hello!");
});

// render login page and set cookie
app.get("/login", (req,res) =>{
  let templateVars = { user: req.session.user_id };
  res.render('login', templateVars);
});

// get userID to set cookie
app.post("/login", (req,res) =>{
  let email = req.body['email'];
  let password = req.body['password'];

  // error handling - verfiy inputs
  if (email === "" || password === ""){
    res.status(403).send("please enter email and password");
  }

  // error handling - verfiy password
  for (let user in users) {
    if (email === users[user].email) {
      if (bcrypt.compareSync(password, users[user].password)) {
        // set cookie to user
        req.session.user_id = users[user];
        res.redirect("/urls");
        return;
      }
      res.status(403).send("password don't match!");
      return;
    } 
  }
  res.status(403).send("email don't exist, please register!");
});

// clears cookie and logout
app.post("/logout", (req,res) =>{
  delete req.session['user_id']
  res.redirect('/urls');
});

// renders a page for user registration
app.get("/register", (req,res) =>{
  let templateVars = { user: req.session.user_id };
  // returns a page with registration form
  res.render("register", templateVars);
});

app.post("/register", (req,res) =>{
  // assign register information to variables
  let email = req.body['email'];
  let password = req.body['password'];
  
  // error handling
  if (email === "" || password === ""){
    res.status(400).send("please enter email and password");
    return;
  }

  for (let user in users) {
    if (email === users[user].email){
      res.status(400).send("email already exists!");
      return;
    }
  }
  
  // generate random userID
  let newID = generateRandomString(6);
  let hashedPassword = bcrypt.hashSync(password, 10);
  users[newID] = {
    id: newID, 
    email:email, 
    password: hashedPassword
  };
  // set cookie to newID
  req.session.user_id = users[newID];
  // redirect to urls
  res.redirect("/urls");
});

// display urls as json object -> for debugging purposes
app.get("/urls.json",(req,res) =>{
  res.json(urlDatabase);
});

// display users as json object -> for debugging purposes
app.get("/users.json", (req, res) => {
  res.json(users);
});

// renders a page to list urls in a table, display userID if logged in
app.get("/urls", (req,res) =>{
  let user = req.session.user_id;
  let urls = {}
  if (user !== undefined) {
    urls = urlsForUser(user.id)
  }
  let templateVars = { urls: urls, user: user };
  res.render("urls_index", templateVars)
})

// renders a page to create new url
app.get("/urls/new", (req, res) => {
  let user = req.session.user_id;
  if (user === undefined) {
    res.redirect("/login");
    return;
  }
  let templateVars = { user: user };
  res.render("urls_new", templateVars);
});

// renders a page to edit url
app.get("/urls/:id", (req, res) => {
  let user = req.session.user_id;
  let shortURL = req.params.id;
  if (urlDatabase[shortURL] === undefined) {
    res.status(404).send("not found");
    return;
  }
  if (user && urlDatabase[shortURL].userID !== user.id) {
    res.status(403).send("unauthorized");
    return;
  }
  let templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL].url, user: req.session.user_id };
  res.render("urls_show", templateVars);
});

// create new shortened url
app.post("/urls", (req, res) => {
  let user = req.session.user_id;
  if (user === undefined) {
    res.redirect("/login");
    return;
  }
  let newShortURL = generateRandomString(6);
  // add new key-value pair to the urlDatabase
  urlDatabase[newShortURL] = {
    url: req.body['longURL'],
    userID: user.id
  }
  res.redirect(`/urls`);
});

// redirect short url to long url
app.get("/u/:shortURL", (req,res) => {
  let longURL = urlDatabase[req.params.shortURL].url;
  res.redirect(longURL);
});

// update a URL resource
app.post("/urls/:id", (req,res) => {
  let user = req.session.user_id;
  let shortURL = req.params.id;
  if (urlDatabase[shortURL].userID !== user.id) {
    res.status(403).send("unauthorized");
    return;
  }
  // update the longURL 
  urlDatabase[shortURL].url = req.body['longURL'];
  // redirect to index with updated database
  res.redirect('/urls');
});

// to remove a URL resource from the database
app.post("/urls/:id/delete", (req,res) => {
  let user = req.session.user_id;
  let shortURL = req.params.id;
  if (urlDatabase[shortURL].userID !== user.id) {
    res.status(403).send("unauthorized");
    return;
  }
  // delete the url from urlDatabase
  delete urlDatabase[shortURL];
  // redirect to index with updated database
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`example app listening on port ${PORT}!`);
});
