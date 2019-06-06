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

const users = {
  "userRandomID": {
    id: "userRandomID",
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
    user: users[req.cookies['user_id']],
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  let templateVars = {
    user: users[req.cookies['user_id']],
  };
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies['user_id']],
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
  if(long) {
    urlDatabase[short] = long;
  }
  res.redirect(`/urls/${short}`);
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
