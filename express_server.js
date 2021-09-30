// Setup
const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const {
  getUserByEmail,
  generateRandomString,
  getUrlsForUser,
} = require('./helpers');

app.use(bodyParser.urlencoded({ extended: true })); // allow us to access req.body
app.use(
  cookieSession({
    name: 'session',
    keys: ['sample'],
  })
);
app.set('view engine', 'ejs');

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

// hashed passwords for users database
const hashedPassword1 = bcrypt.hashSync('purple-monkey-dinosaur', salt);
const hashedPassword2 = bcrypt.hashSync('dishwasher-funk', salt);

const users = {
  userRandomID: {
    id: 'userRandomID',
    email: 'user@example.com',
    password: hashedPassword1,
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: hashedPassword2,
  },
};

// HTTP requests
app.get('/', (req, res) => {
  // res.redirect('/login');

  /// UPDATED VERSION /////
  const userId = req.session.user_id;
  const user = users[userId];

  // check if user is logged in
  if (!user) {
    return res.redirect('/login');
  }
  res.redirect('/urls');
});

// json
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// main page
app.get('/urls', (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  // check if user is logged in
  if (!user) {
    return res
      .status(401)
      .send(
        'Please <a href="/login">login</a> or <a href="/register">register</a> to access TinyApp.'
      );
  }

  // get only URLs matching userId
  const userURL = getUrlsForUser(userId, urlDatabase);

  const templateVars = { urls: userURL, user };
  res.render('urls_index', templateVars);
});

// login page
app.get('/login', (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const templateVars = { user };

  res.render('urls_login', templateVars);
});

// login button - set session
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);

  // check if a user exists with this email
  if (!user) {
    return res
      .status(401)
      .send(
        `A user with the email ${email} cannot be found. Please try to <a href="/login">login</a> again or <a href="/register">register</a> to access TinyApp.`
      );
  }

  // check if a user exists with this password
  if (bcrypt.compareSync(password, user.password) === false) {
    return res
      .status(401)
      .send(
        'Incorrect user email and password combination. Please try to <a href="/login">login</a> again or <a href="/register">register</a> to access TinyApp.'
      );
  }

  // set session
  req.session.user_id = user.id;
  res.redirect('/urls');
});

// register page
app.get('/register', (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const templateVars = { user };

  res.render('urls_register', templateVars);
});

// register button - set session
app.post('/register', (req, res) => {
  const id = generateRandomString();
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, salt);

  // check if email and password are empty
  if (email === '' || password === '') {
    return res
      .status(400)
      .send(
        'Invalid email and/or password. Please try to <a href="/login">login</a> again.'
      );
  }

  // check if email already exists in database
  if (getUserByEmail(email, users)) {
    return res
      .status(400)
      .send(
        `A user with ${email} has already registered. Please try to <a href="/login">login</a> again or <a href="/register">register</a> to access TinyApp.`
      );
  }

  // if checks have passed, create new user to db
  users[id] = { id, email, password: hashedPassword };

  req.session.user_id = id;
  res.redirect('/urls');
});

// make new link submit button
app.post('/urls', (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: userId,
  };

  if (!user) {
    return res
      .status(401)
      .send(
        'Please <a href="/login">login</a> or <a href="/register">register</a> to access TinyApp.'
      );
  }
  res.redirect('/urls/' + shortURL);
});

// delete button
app.post('/urls/:shortURL/delete', (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  if (!user) {
    return res
      .status(401)
      .send(
        "You can't delete this! Please <a href='/login'>login</a> or <a href='/register'>register</a> to access TinyApp."
      );
  }

  // if url owner id does not match current user id
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID !== userId) {
    return res
      .status(401)
      .send(
        "That's not your link, you can't delete this! Please <a href='/login'>login</a> or <a href='/register'>register</a> to access TinyApp."
      );
  }

  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

// edit submit button
app.post('/urls/:shortURL', (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  if (!user) {
    return res
      .status(401)
      .send(
        "You can't edit this, that's not your link! Please <a href='/login'>login</a> or <a href='/register'>register</a> to access TinyApp."
      );
  }

  // get the new user input
  const longURL = req.body.longURL;

  // update shortURL in database
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL].longURL = longURL;

  res.redirect('/urls');
});

// edit redirect from home button
app.get('/urls', (req, res) => {
  const shortURL = req.body.shortURL;
  res.redirect('/urls' + shortURL);
});

// make a new link page
app.get('/urls/new', (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const templateVars = { user };

  if (!user) {
    return res.redirect('/login');
  }

  res.render('urls_new', templateVars);
});

// edit link page
app.get('/urls/:shortURL', (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  if (!user) {
    return res
      .status(401)
      .send(
        "That's not your link! Please <a href='/login'>login</a> or <a href='/register'>register</a> to access TinyApp."
      );
  }

  // if url id does not match their own
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID !== userId) {
    return res
      .status(401)
      .send(
        "That's not your link! Please <a href='/login'>login</a> or <a href='/register'>register</a> to access TinyApp."
      );
  }

  const templateVars = {
    shortURL,
    longURL: urlDatabase[shortURL].longURL,
    user,
  };

  res.render('urls_show', templateVars);
});

// click on shortURL to be redirected to longURL
app.get('/u/:shortURL', (req, res) => {
  if (!Object.keys(urlDatabase).includes(req.params.shortURL)) {
    return res.status(404).send('Not found! This URL is not valid on TinyApp!');
  }

  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// logout button - clear cookie
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

// test
app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
