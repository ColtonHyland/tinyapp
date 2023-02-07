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


//urlDatabase is an object containing unique url's and id's corresponding to a user
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

//users is a object containing a given users email, encrypted password, and unique user id's
const users = {
  userRandomID: {
    user_id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10),
  },
  user2RandomID: {
    user_id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10),
  },
};

//creates a string of 6 random charaters/numbers
function generateRandomString() {

  let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let charLength = chars.length;
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * charLength));
  }
  return result;

}

//returns an object containing every url associated with a user id
function urlsForUser(id) {

  const urls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      urls[shortURL] = urlDatabase[shortURL];
    }
  } 
  return urls;
}


//checks if a user is session is still active
function isLoggedIn(userID) {
  if(users[userID]) {
    return true;
  }
  return false;
}

//gets root directory. redirects to /urls
app.get("/", (req, res) => {
  
  res.redirect("urls");

});

//gets the main directory displaying users urls
app.get("/urls", (req, res) => {
  
  //set values needed for html rendering
  const userID = req.session["user_id"];
  const templateVars = {
    urls: urlsForUser(userID),
    user_id: userID,
    email: users[userID] ? users[userID]["email"] : "" 
  };

  //if user is not logged in, redirect to login
  if (templateVars["user_id"] === undefined) {
    res.status(400).send('Please <a href="/login">login!</a>');
    return;
  }
  res.render("urls_index", templateVars);

});

//gives the next page and updated database and redirects the the tinyurl page
app.post("/urls", (req, res) => {

  const userID = req.session["user_id"];
  //tells the user to register if they arent logged in
  if (!userID) {
    return res.status(400).send('Please first <a href="./register/">register</a> an account!');
  }
  //generate tinyurl and update database
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = { longURL, userID };

  res.redirect(`/urls/${shortURL}`);

});

//gets directory for creating new urls
app.get("/urls/new", (req, res) => {

  //checks if the session is still active
  const userID = req.session["user_id"]
  if (!isLoggedIn(userID)) {
    req.session = null;
    return res.redirect("/login");
  }
  //data used in the html rendered
  const templateVars = { 
    user_id: userID, 
    email: users[userID]["email"]
   }; 
  
  //redirects to login if the user id isn't present
  if (templateVars["user_id"] === undefined) {
    res.redirect("/login");
    return;
  }
  res.render("urls_new", templateVars);
  
});

//renders the tiny url page
app.get("/urls/:id", (req, res) => {

  //checks if the user is logged in
  const userID = req.session["user_id"]
  if (!isLoggedIn(userID)) {
    req.session = null;
    return res.redirect("/login");
  }

  //checks if the tinyurl exists in the database
  if (urlDatabase[req.params.id] === undefined) {
    return res.send('Short URL does not exist!');
  }

  //values to be used by the html page rendered
  const templateVars = { 
    id: req.params.id, longURL: urlDatabase[req.params.id].longURL, 
    user_id: req.session["user_id"],
    email: users[userID]["email"]
    };

  //prompts user to log in if they don't have an account
  if (templateVars["user_id"] === undefined) {
    res.status(400).send('Please first <a href="//register">register</a> an account!');
    return;
  }

  //checks if the url belongs to the session user
  if (urlDatabase[req.params.id]["userID"] !== req.session["user_id"]) {
    return res.send('Invalid URL!');
  }
  
  res.render("urls_show", templateVars);

});

//handles changes made on the urls/id page
app.post("/urls/:id", (req, res) => {

  const userID = req.session.user_id;
  //checks if the session id is in the user database
  if (userID === undefined) {
    res.status(400).send('Please first <a href="./register/">register</a> an account!');
    return;
  }

  //adds the longurl to the database if the userid matches the session id
  if (userID === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    return res.redirect("/urls");
  } else {
    return res.status(403).send('Invalid URL');
  }

});

//handles redirects user to the long url associated with the short url
app.get("/u/:id", (req, res) => {

  //checks if the url exists in the database
  if (!urlDatabase[req.params.id]) {
    res.status(404).send('Invalid URL!');
    return;
  }
  //redirect to the desired longurl
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);

});

//handles the delete post to remove a url from the databass
app.post("/urls/:id/delete", (req, res) => {
  
  const templateVars = { user_id: req.session["user_id"] };
  //checks if the user logged in exists
  if (templateVars["user_id"] === undefined) {
    return res.status(400).send('Please first <a href="./register/">register</a> an account!');
  }

  //removes url by id from the database and redirects user
  delete urlDatabase[req.params.id];
  res.redirect("/urls");

});

//registration page renderer
app.get("/register", (req, res) => {

  const templateVars = { user_id: req.session["user_id"] };
  //if the user is already logged in, redirect to the urls page
  if (templateVars["user_id"] !== undefined) {
    res.redirect("/urls");
    return;
  }
  res.render("registration", templateVars);

});

//accepts posts on the registration page
app.post("/register", (req, res) => {

  //doesnt accept empty email/password
  if (req.body.email.length < 1 || req.body["password"] < 1) {
    return res.status(400).send('Account name/password too short! Please <a href="./register/">try another!</a>');
  }
  //checks if the email is in use
  if (getUserByEmail(req.body.email, users) !== null) {
    return res.status(400).send('Account already exists! Please <a href="./register/">try another!</a>');
  } else {
    //generates a new user
    const newID = generateRandomString();
    const newPassword = bcrypt.hashSync(req.body["password"], 10);
    users[newID] = {
      user_id: newID,
      email: req.body["email"],
      password: newPassword
    };
  }
  //sets the session user to the one just created
  req.session["user_id"] = getUserByEmail(req.body.email, users)['user_id'];
  res.redirect("/urls");
});

//renders login page
app.get("/login", (req, res) => {

  const templateVars = { user_id: req.session["user_id"] };
  //checks if the user id exists, redirects
  if (templateVars["user_id"] !== undefined) {
    res.redirect("/urls");
    return;
  }
  res.render("login", templateVars);

});

//accepts post changes on the login page
app.post("/login", (req, res) => {

  //checks if the password matches the database password
  if (getUserByEmail(req.body.email, users) === null || !bcrypt.compareSync(req.body.password, getUserByEmail(req.body.email, users)['password'])) {
    res.status(403).send('Invalid email/password! Please <a href="./login/">login</a> or <a href="./register/">register</a> an account!');
    return;
  }
  
  //sets the session user to the one that just logged in
  req.session["user_id"] = getUserByEmail(req.body.email, users)['user_id'];
  res.redirect("/urls");

});

//ends the session for the user and redirects
app.post("/logout", (req, res) => {

  req.session = null;
  res.redirect("/login");

});

//reflects in the console the server is running/listening
app.listen(PORT, () => {

  console.log(`Tinyurl app listening on port ${PORT}!`);

});


