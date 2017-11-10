const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": {
    url: "http://www.lighthouselabs.ca",
    userID: "user"
  }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

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
  let templateVars = { user: req.cookies["user"] };
  // set user cookie
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
  Object.keys(users).forEach(function(user) {
    if (email === users[user].email){
      if (password === users[user].password){
        // set cookie to user
        res.cookie('user', users[user]);
        res.redirect("/urls");
      } else {
        res.status(403).send("password don't match!");
      }
    }
  }); 

  res.status(403).send("email don't exist, please register!");
});

// clears cookie and logout
app.post("/logout", (req,res) =>{
  res.clearCookie('user');
  res.redirect('/urls');
});

// renders a page for user registration
app.get("/register", (req,res) =>{
  let templateVars = { user: req.cookies["user"] };
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
  }

  Object.keys(users).forEach(function(user) {
    if (email === users[user].email){
    res.status(400).send("email already exists!");
    }
  })
  
  // generate random userID
  let newID = generateRandomString(6);
  users[newID] = {id: newID, email:email, password: password};
  // set cookie to newID
  res.cookie('user', users[newID]);
  // redirect to urls
  res.redirect("/urls");
});

// display urls as json object
app.get("/urls.json",(req,res) =>{
  res.json(urlDatabase);
});

// renders a page to list urls in a table, display userID if logged in
app.get("/urls", (req,res) =>{
  let user = req.cookies['user'];
  let urls = {}
  if (user !== undefined) {
    urls = urlsForUser(user.id)
  }
  let templateVars = { urls: urls, user: user };
  res.render("urls_index", templateVars)
})

// renders a page to create new url
app.get("/urls/new", (req, res) => {
  let user = req.cookies['user'];
  if (user === undefined) {
    res.redirect("/login");
    return;
  }
  let templateVars = { user: user };
  res.render("urls_new", templateVars);
});

// renders a page to edit url
app.get("/urls/:id", (req, res) => {
  let user = req.cookies['user'];
  let shortURL = req.params.id;
  if (user && urlDatabase[shortURL].userID !== user.id) {
    res.status(403).send("unauthorized");
    return;
  }
  let templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL].url, user: req.cookies["user"] };
  res.render("urls_show", templateVars);
});

// create new shortened url
app.post("/urls", (req, res) => {
  let user = req.cookies['user'];
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
  let user = req.cookies['user'];
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
  let user = req.cookies['user'];
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
