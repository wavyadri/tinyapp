const getUserByEmail = (email, database) => {
  for (const key in database) {
    if (database[key].email === email) {
      return database[key];
    }
  }
  return undefined;
};

const generateRandomString = () => {
  let randomString = '';
  randomString = Math.random().toString(36).slice(6);
  return randomString;
};

const urlsForUser = (userId, database) => {
  let userURL = {};
  for (const key in database) {
    if (database[key].userID === userId) {
      userURL[key] = { longURL: database[key].longURL, userID: userId };
    }
  }
  return userURL;
};

module.exports = { getUserByEmail, generateRandomString, urlsForUser };
