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

// const urlDatabase = {
//   'b2xVn2': 'http://www.lighthouselabs.ca',
//   '9sm5xK': 'http://www.google.com',
// };

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  }
};

const generateRandomString = () => Math.random().toString(36).substr(2, 6);

const duplicatedEmail = (email) => {
  for(const key in users) {
    if(users[key].email === email) return true;
  }
  return false;
}

const getPasswordAndIDByEmail = (email) => {
  for(const key in users) {
    if(users[key].email === email)
      return {
        'password': users[key].password,
        'id': key,
      };
  }
  return {};
}

const urlsForUser = (id) => {
  let urlsResult = {};
  for(const key in urlDatabase) {
    if(urlDatabase[key].userID === id) {
      urlsResult[key] = urlDatabase[key].longURL;
    }
  }
  return urlsResult;
};

const checkIfUrlExistsAndUserIdMatches = (req) => {
  return req.cookies.user_id
    && urlDatabase[req.params.shortURL]
    && req.cookies.user_id === urlDatabase[req.params.shortURL].userID;
}

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
  const user = users[req.cookies['user_id']];
  let templateVars = {};
  if(user) {
      templateVars = {
        urls: urlsForUser(user.id),
        user: user,
      };
  }
  console.log(templateVars);
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  const user = users[req.cookies['user_id']];
  if(user) {
    res.render('urls_new', {user: user});
  }
  else {
    res.redirect('/login');
  }
});

app.get('/urls/:shortURL', (req, res) => {
  if(checkIfUrlExistsAndUserIdMatches(req)) {
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[req.cookies['user_id']],
    };
    // check if the longURL exists, if not then redirect to /urls
    templateVars.longURL ? res.render('urls_show', templateVars) : res.redirect('/urls');
  }
  else {
    req.cookies.user_id ? res.render('unauthorized', {user: users[req.cookies.user_id]}) : res.render('unauthorized');
  }
});

app.post('/urls', (req, res) => {
  if(users[req.cookies.user_id]) {
    const rand = generateRandomString();
    urlDatabase[rand] = {
      longURL: req.body.longURL,
      userID: req.cookies.user_id,
    };
    res.redirect(`/urls/${rand}`);
  }
  else {
    res.render('unauthorized');
  }
});

app.get('/u/:shortURL', (req, res) => {
  if(checkIfUrlExistsAndUserIdMatches(req)) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
  else {
    req.cookies.user_id ? res.render('unauthorized', {user: users[req.cookies.user_id]}) : res.render('unauthorized');
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  if(checkIfUrlExistsAndUserIdMatches(req)) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
  else {
    res.redirect('/login');
  }
});

app.post('/urls/:shortURL', (req, res) => {
  if(checkIfUrlExistsAndUserIdMatches(req)) {
    const short = req.params.shortURL;
    const long = req.body.longURL;
    if(long) {
      urlDatabase[short].longURL = long;
    }
    res.redirect(`/urls/${short}`);
  }
  else {
    res.redirect('/login');
  }
});

app.post('/login', (req, res) => {
  // set cookies
  const email = req.body.email;
  const password = req.body.password;

  if(!duplicatedEmail(email)) {
    res.sendStatus(403);
  }

  if(email && password && duplicatedEmail(email)){
    const passwordAndId = getPasswordAndIDByEmail(email);
    if(passwordAndId.password === password){
      res.cookie('user_id', passwordAndId.id);
      res.redirect('/urls');
    }
    else{
      res.sendStatus(403);
    }
  }
});

app.post('/logout', (req, res) => {
  // set cookies
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if(email && password && !duplicatedEmail(email)) {
    const id = generateRandomString();
    users[id] = {
      id: id,
      email: email,
      password: password,
    }
    res.cookie('user_id', id);
    console.log(users);
    res.redirect('/urls');
  }
  else {
    res.sendStatus(400);
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

// catchall route
app.get('*', (req, res) => res.redirect('/urls'));

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
