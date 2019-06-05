const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(cookieParser());

const PORT = 8080; // default port 8080

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com',
};

const generateRandomString = () => Math.random().toString(36).substr(2, 6);

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/urls', (req, res) => {
  // When sending variables to an EJS template, need to send them inside an object
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies['username'],
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  let templateVars = {
    username: req.cookies['username'],
  };
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies['username'],
  };
  // check if the longURL exists, if not then redirect to /urls
  templateVars.longURL ? res.render('urls_show', templateVars) : res.redirect('/urls');
});

app.post('/urls', (req, res) => {
  const rand = generateRandomString();
  urlDatabase[rand] = req.body.longURL;
  res.redirect(`/urls/${rand}`);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => {
  const short = req.params.shortURL;
  const long = req.body.longURL;
  if(long){
    urlDatabase[short] = long;
  }
  res.redirect(`/urls/${short}`);
});

app.post('/login', (req, res) => {
  // set cookies
  const name = req.body.username;
  res.cookie('username', name);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  // set cookies
  res.clearCookie('username');
  res.redirect('/urls');
});

// catchall route
app.get('*', (req, res) => res.redirect('/urls'));

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
