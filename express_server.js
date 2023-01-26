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

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

function generateRandomString() {

  var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var charLength = chars.length;
  var result = '';
  for ( var i = 0; i < 6; i++ ) {
     result += chars.charAt(Math.floor(Math.random() * charLength));
  }
  return result;

};

function getUserByEmail(userEmail) {

  for (const user in users) {
    if (userEmail === users[user]["email"]) {
      return users[user];
    }
  }
  return null;

};

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

  res.render("urls_index", templateVars);

});

app.post("/urls", (req, res) => {

  if (!Object.values(urlDatabase).includes(req.body["longURL"])) {
    urlDatabase[generateRandomString()] = req.body["longURL"];
  }
  res.redirect("/urls");

});

app.get("/urls/:id", (req, res) => {

  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["username"] };
  res.render("urls_show", templateVars);

});

app.post("/urls/:id", (req, res) => {

  urlDatabase[req.params.id] = req.body["longURL"];
  res.redirect("/urls");

});

app.get("/u/:id", (req, res) => {

  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);

});

app.post("/urls/:id/delete", (req, res) => {
  
  delete urlDatabase[req.params.id]
  res.redirect("/urls");

});

app.get("/register", (req, res) => {

  const templateVars = { username: req.cookies["username"] }
  res.render("registration", templateVars);

});

app.post("/register", (req, res) => {

  if(getUserByEmail(req.body.email) !== null) {
    res.status(400).send('Invalid email/password');
    return;
  } else {
    const newID = generateRandomString();
    res.cookie("username", newID);
    users[newID] = {
      id: newID,
      email: req.body["email"],
      password: req.body["password"]
    }
  } 
  res.redirect("/urls");
});

app.get("/login", (req, res) => {

  const templateVars = { username: req.cookies["username"] }
  res.render("login", templateVars);

});

app.post("/login", (req, res) => {

  // const email = getUserByEmail(req.body.email)[email];
  // const password = getUserByEmail(req.body.email)[password];
  console.log("Entered:", req.body.email, req.body.password)
  if(getUserByEmail(req.body.email) === null || getUserByEmail(req.body.email)['password'] !== req.body.password) {
    res.status(400).send('Invalid email/password');
    return;
  }
  
  res.cookie("username", req.body.username);
  res.redirect("/urls");

});

app.post("/logout", (req, res) => {

  res.clearCookie('username', req.body.username);
  res.redirect("/urls");

});


app.listen(PORT, () => {

  console.log(`Example app listening on port ${PORT}!`);

});


