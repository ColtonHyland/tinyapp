const express = require("express");
const cookieSession = require('cookie-session');
const getUserByEmail = require('./helpers.js');
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 60000
}));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "QCh6yV",
  },
};

const users = {
  userRandomID: {
    user_id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    user_id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

function generateRandomString() {

  let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let charLength = chars.length;
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * charLength));
  }
  return result;

}

function urlsForUser(id) {

  const urls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      urls[shortURL] = urlDatabase[shortURL];
    }
  }
  return urls;
}

app.get("/urls/new", (req, res) => {

  const templateVars = { user_id: req.session["user_id"] };
  if (templateVars["user_id"] === undefined) {
    res.redirect("/login");
    return;
  }
  res.render("urls_new", templateVars);
  
});

app.get("/urls", (req, res) => {
  
  const userID = req.session["user_id"];
  const templateVars = {
    urls: urlsForUser(userID),
    user_id: userID
  };
  if (templateVars["user_id"] === undefined) {
    res.status(400).send('Please sign in!');
    return;
  }
  res.render("urls_index", templateVars);

});

app.post("/urls", (req, res) => {

  const userID = req.session["user_id"];
  
  if (!userID) {
    return res.status(400).send('Please first make an account!');
  }
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = { longURL, userID };

  res.redirect("/urls");

});

app.get("/urls/:id", (req, res) => {

  //refactor
  if (urlDatabase[req.params.id] === undefined) {
    return res.send('Short URL does not exist!');
  }
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user_id: req.session["user_id"] };
  if (templateVars["user_id"] === undefined) {
    res.status(400).send('Please first make an account!');
    return;
  }
  if (urlDatabase[req.params.id]["userID"] !== req.session["user_id"]) {
    return res.send('Invalid URL!');
  }
  
  res.render("urls_show", templateVars);

});

app.post("/urls/:id", (req, res) => {

  const userID = req.session.user_id;
  if (userID === undefined) {
    res.status(400).send('Please first make an account!');
    return;
  }
  if (userID === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    return res.redirect("/urls");
  } else {
    return res.status(403).send('Invalid URL');
  }

});

app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.status(404).send('Invalid URL!');
    return;
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);

});

app.post("/urls/:id/delete", (req, res) => {
  
  const templateVars = { user_id: req.session["user_id"] };
  if (templateVars["user_id"] === undefined) {
    return res.status(400).send('Please first make an account!');
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");

});

app.get("/register", (req, res) => {

  const templateVars = { user_id: req.session["user_id"] };
  if (templateVars["user_id"] !== undefined) {
    res.redirect("/urls");
    return;
  }
  res.render("registration", templateVars);

});

app.post("/register", (req, res) => {

  if (getUserByEmail(req.body.email, users) !== null) {
    return res.status(400).send('Account already exists!');
  } else {
    const newID = generateRandomString();
    const newPassword = bcrypt.hashSync(req.body["password"], 10);
    users[newID] = {
      user_id: newID,
      email: req.body["email"],
      password: newPassword
    };
  }
  req.session["user_id"] = getUserByEmail(req.body.email, users)['user_id'];
  res.redirect("/urls");
});

app.get("/login", (req, res) => {

  const templateVars = { user_id: req.session["user_id"] };
  if (templateVars["user_id"] !== undefined) {
    res.redirect("/urls");
    return;
  }
  res.render("login", templateVars);

});

app.post("/login", (req, res) => {

  if (getUserByEmail(req.body.email, users) === null || !bcrypt.compareSync(req.body.password, getUserByEmail(req.body.email, users)['password'])) {
    res.status(403).send('Invalid email/password');
    return;
  }
  
  req.session["user_id"] = getUserByEmail(req.body.email, users)['user_id'];
  res.redirect("/urls");

});

app.post("/logout", (req, res) => {

  req.session = null;
  res.redirect("/login");

});


app.listen(PORT, () => {

  console.log(`Tinyurl app listening on port ${PORT}!`);

});


