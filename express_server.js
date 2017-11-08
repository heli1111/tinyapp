const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// generateRandomString - generate random alphanumerical string
function generateRandomString(num) {
  let newID = "";
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < num; i++){
    newID += characters.charAt(Math.floor(Math.random()*characters.length));
  }
  return newID;
}

//set view engine
app.set("view engine", "ejs")

// index page
app.get("/", (req, res) => {
  res.end("Hello!");
});

// display urls as json object
app.get("/urls.json",(req,res) =>{
  res.json(urlDatabase);
});

// renders a page to list urls in a table
app.get("/urls", (req,res) =>{
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars)
})

// renders a page to create new url
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// redners a page to show single short url and its long url
app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, urls: urlDatabase };
  res.render("urls_show", templateVars);
});

// create new shortened url
app.post("/urls", (req, res) => {
  let newID = generateRandomString(6);
  // add new key-value pair to the urlDatabase
  urlDatabase[newID] = req.body['longURL'];
  res.redirect(`/urls/${newID}`);
});

// redirect short url to long url
app.get("/u/:shortURL", (req,res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


// add a route to remove a URL resource
app.post("/urls/:id/delete", (req,res) => {
  // delete the url from urlDatabase
  delete urlDatabase[req.params.id];
  // redirect to index
  res.redirect('/urls');
});





app.listen(PORT, () => {
  console.log(`example app listening on port ${PORT}!`);
});
