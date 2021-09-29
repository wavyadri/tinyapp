// Server setup
const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({ extended: true })); // allow us to access req.body
app.use(cookieParser());
app.set('view engine', 'ejs'); // tells Express app to use EJS as templating engine

// Databases
const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com',
};

const users = {
  userRandomID: {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur',
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk',
  },
};

// Helper functions
function generateRandomString() {
  let randomString = '';
  randomString = Math.random().toString(36).slice(6);
  return randomString;
}

function getUserId(email, userDb) {
  for (const key in userDb) {
    if (userDb[key].email === email) return key;
  }
  return null;
}

// function findUserById(userId, userDb) {
//   for (const user in userDb) {
//     if (user === userId) return userDb[user];
//   }
//   return false;
// }

function validRegistration(email, password) {
  if (email === '' || password === '') return false;
  return true;
}

function userIsFound(email, userDb) {
  for (const key in userDb) {
    if (userDb[key].email === email) return true;
  }
  return false;
}

// HTTP requests

app.get('/', (req, res) => {
  res.redirect('/register');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// main page
app.get('/urls', (req, res) => {
  const userId = req.cookies['user_id'];
  const templateVars = { urls: urlDatabase, users: users[userId] };
  console.log(templateVars);
  res.render('urls_index', templateVars);
});

// login page
app.get('/login', (req, res) => {
  const userId = req.cookies['user_id'];
  const templateVars = { users: users[userId] };

  res.render('urls_login', templateVars);
});

// login button - set cookie
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = getUserId(email, users);

  // check if a user exists with this email
  if (!userIsFound(email, users)) {
    res
      .status(403)
      .send(
        `A user with the email ${email} cannot be found. Please try again or register.`
      );
    return;
  }

  // check if a user with this password exists
  if (users[id].password !== password) {
    res
      .status(403)
      .send('Incorrect user email and password combination. Please try again.');
    return;
  }

  res.cookie('user_id', id);
  res.redirect('/urls');
});

// register page
app.get('/register', (req, res) => {
  const userId = req.cookies['user_id'];
  const templateVars = { users: users[userId] };

  res.render('urls_register', templateVars);
});

// register button - set cookie
app.post('/register', (req, res) => {
  // TODO: refactor into create user helper
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  // check if email and password are empty
  if (!validRegistration(email, password)) {
    res.status(400).send('Invalid email and/or password. Please try again.');
    return;
  }

  // check if email already exists in Db
  if (userIsFound(email, users)) {
    res
      .status(400)
      .send(`A user with ${email} has already registered. Please try again.`);
    return;
  }

  // after checks have passed, add new user to db
  users[id] = { id, email, password };

  // set cookie
  res.cookie('user_id', id);
  res.redirect('/urls');
});

// submit button
app.post('/urls', (req, res) => {
  console.log('req.body:', req.body); // Log the POST request body to the console
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL; // save new url to urlDatabase
  res.redirect('/urls/' + shortURL); // redirection to /urls/:shortURL
});

// delete button
app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

// edit button
app.post('/urls/:shortURL', (req, res) => {
  // get the new user input
  const longURL = req.body.longURL;

  // update obj at shortURL
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = longURL;

  res.redirect('/urls');
});

// edit button redirect from home
app.get('/urls', (req, res) => {
  const shortURL = req.body.shortURL;
  res.redirect('/urls' + shortURL);
});

// logout button - clear cookie
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

// make a new link page
app.get('/urls/new', (req, res) => {
  const userId = req.cookies['user_id'];

  const templateVars = {
    users: users[userId],
  };
  res.render('urls_new', templateVars);
});

// individual edit link page
app.get('/urls/:shortURL', (req, res) => {
  const userId = req.cookies['user_id'];

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    users: users[userId],
  };

  res.render('urls_show', templateVars);
});

// click on shortURL to be redirected to longURL
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
