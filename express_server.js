const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({ extended: true })); // allow us to access req.body
app.use(cookieParser());
app.set('view engine', 'ejs'); // tells Express app to use EJS as templating engine

function generateRandomString() {
  let randomString = '';
  randomString = Math.random().toString(36).slice(6);
  return randomString;
}

function findUserById(userId, userDb) {
  for (let user in userDb) {
    if (user === userId) return userDb[user];
  }
  return false;
}

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

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// main page
app.get('/urls', (req, res) => {
  const userId = req.cookies['user_id'];
  const user = findUserById(userId, users);
  const templateVars = { urls: urlDatabase, users: user };
  res.render('urls_index', templateVars);
});

// register
app.get('/register', (req, res) => {
  const userId = req.cookies['user_id'];
  const user = findUserById(userId, users);
  const templateVars = { users: user };

  res.render('register', templateVars);
});

// sign up / register button
app.post('/register', (req, res) => {
  // TODO: refactor into create user helper
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
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

// login button - set cookie
app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

// logout button - clear cookie
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

// make a new link page
app.get('/urls/new', (req, res) => {
  const userId = req.cookies['user_id'];
  const user = findUserById(userId, users);

  const templateVars = {
    users: user,
  };
  res.render('urls_new', templateVars);
});

// individual edit link page
app.get('/urls/:shortURL', (req, res) => {
  const userId = req.cookies['user_id'];
  const user = findUserById(userId, users);

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    users: user,
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
