const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080; // default port 8080

app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var charLength = chars.length;
  var result = '';
  for ( var i = 0; i < 6; i++ ) {
     result += chars.charAt(Math.floor(Math.random() * charLength));
  }
  return result;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: "Hello World!" };
  res.render("hello_world", templateVars);
});

app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
 });
 
 app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
 });

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

app.get("/urls", (req, res) => {
  
  const templateVars = { 
    urls: urlDatabase, 
    username: req.cookies["username"]
  };
  // console.log(templateVars)
  // console.log(req.cookies)
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["username"]};
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.post("/login", (req, res) => {
  const username = res.cookie('username', req.body.username);
  //res.cookie('username', res.body);
  
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  //const username = res.cookie('username', req.body.username);
  //res.cookie('username', res.body);
  res.clearCookie('username', req.body.username);
  
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {

  delete urlDatabase[req.params.id]

  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  // Log the POST request body to the console

  if (!Object.values(urlDatabase).includes(req.body["longURL"])) {
    urlDatabase[generateRandomString()] = req.body["longURL"];
  }
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  // console.log(req.params)
  // console.log(req.body)
  urlDatabase[req.params.id] = req.body["longURL"];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


