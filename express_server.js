var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


var urlDatabase = {
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


app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json",(req,res) =>{
  res.json(urlDatabase);
});

app.get("/urls", (req,res) =>{
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars)
})

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

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

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`example app listening on port ${PORT}!`);
});



//https://expressjs.com/en/guide/routing.html