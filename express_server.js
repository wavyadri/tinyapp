// Server setup
const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

app.use(bodyParser.urlencoded({ extended: true })); // allow us to access req.body
// app.use(cookieParser());
app.use(
  cookieSession({
    name: 'session',
    keys: [
      /* secret keys */
    ],

    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);
app.set('view engine', 'ejs'); // tells Express app to use EJS as templating engine

// Databases
const urlDatabase = {
  sgq3y6: {
    longURL: 'https://www.tsn.ca',
    userID: 'aJ48lW',
  },
  i3BoGr: {
    longURL: 'https://www.google.ca',
    userID: 'aJ48lW',
  },
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

// add userDb back as a param!!!!!!
function urlsForUser(userId) {
  let userURL = {};
  for (const key in urlDatabase) {
    if (urlDatabase[key].userID === userId) {
      userURL[key] = { longURL: urlDatabase[key].longURL, userID: userId };
    }
  }
  return userURL;
}

// HTTP requests
app.get('/', (req, res) => {
  res.redirect('/register');
});

// json
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// main page
app.get('/urls', (req, res) => {
  const userId = req.cookies['user_id'];
  const user = users[userId];
  console.log(urlDatabase);
  console.log(users);

  if (!user) {
    res.status(401).send('Please login or register to access TinyApp.');
    return;
  }

  // get only urls matching userId
  let userURL = urlsForUser(userId);

  const templateVars = { urls: userURL, user };
  res.render('urls_index', templateVars);
});

// login page
app.get('/login', (req, res) => {
  const userId = req.cookies['user_id'];
  const user = users[userId];
  const templateVars = { user };

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
  if (bcrypt.compareSync(password, users[id].hashedPassword) === false) {
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
  const user = users[userId];
  const templateVars = { user };

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

  const hashedPassword = bcrypt.hashSync(password, 10);

  // after checks have passed, add new user to db
  users[id] = { id, email, hashedPassword };

  // set cookie
  res.cookie('user_id', id);
  res.redirect('/urls');
});

// make new link submit button
app.post('/urls', (req, res) => {
  const userId = req.cookies['user_id'];
  const user = users[userId];
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: userId,
  };

  if (!user) {
    res.status(401).send('Please login or register to access TinyApp.');
    return;
  }
  res.redirect('/urls/' + shortURL);
});

// delete button
app.post('/urls/:shortURL/delete', (req, res) => {
  const userId = req.cookies['user_id'];
  const user = users[userId];

  if (!user) {
    res
      .status(401)
      .send(
        "You can't delete this! Please login or register to access TinyApp."
      );
    return;
  }

  // if url id does not match their own
  let shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID !== userId) {
    res
      .status(401)
      .send(
        "That's not your link, you can't delete this! Please login or register to access TinyApp."
      );
    return;
  }

  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

// edit submit button
app.post('/urls/:shortURL', (req, res) => {
  const userId = req.cookies['user_id'];
  const user = users[userId];

  if (!user) {
    res
      .status(401)
      .send(
        "You can't edit this, that's not your link! Please login or register to access TinyApp."
      );
    return;
  }

  // get the new user input
  const longURL = req.body.longURL;
  // update obj at shortURL
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL].longURL = longURL;

  res.redirect('/urls');
});

// edit redirect from home button
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
  const user = users[userId];
  const templateVars = { user };

  if (!user) {
    res.redirect('/login');
    return;
  }
  res.render('urls_new', templateVars);
});

// edit link page
app.get('/urls/:shortURL', (req, res) => {
  const userId = req.cookies['user_id'];
  const user = users[userId];

  if (!user) {
    res
      .status(401)
      .send(
        "That's not your link! Please login or register to access TinyApp."
      );
    return;
  }
  // if url id does not match their own
  let shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID !== userId) {
    res
      .status(401)
      .send(
        "That's not your link! Please login or register to access TinyApp."
      );
    return;
  }

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user,
  };

  res.render('urls_show', templateVars);
});

// click on shortURL to be redirected to longURL
app.get('/u/:shortURL', (req, res) => {
  if (!Object.keys(urlDatabase).includes(req.params.shortURL)) {
    res.status(404).send('Not found! This URL does not exist on TinyApp!');
    return;
  }

  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
