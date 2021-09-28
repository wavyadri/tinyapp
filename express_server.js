const express = require('express');
const app = express();
const PORT = 8080;

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true })); // allow us to access req.body

function generateRandomString() {
  let randomString = '';
  randomString = Math.random().toString(36).slice(6);
  return randomString;
}

app.set('view engine', 'ejs'); // tells Express app to use EJS as templating engine

const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com',
};

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
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
  // render urls/shortURL with new info
  // res.render('/urls/' + shortURL);
  res.redirect('/urls');
});

// edit button redirect from home
app.get('/urls', (req, res) => {
  const shortURL = req.body.shortURL;
  res.redirect('/urls' + shortURL);
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
  };

  res.render('urls_show', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  console.log(req.params);
  res.redirect(longURL);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
