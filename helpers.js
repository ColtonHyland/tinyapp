function getUserByEmail(email, database) {

  const testUsers = {
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
  };
  
  for (const user in database) {
    if (email === database[user]["email"]) {
      return database[user];
    }
  }
  return null;

};

module.exports = { getUserByEmail };