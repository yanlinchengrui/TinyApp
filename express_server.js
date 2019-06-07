const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

const methodOverride = require('method-override')

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieSession({ keys: ['pepepe'] }));

app.use(methodOverride('_method'))

/*          const and functions         */

const PORT = 8080; // default port 8080

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "user@example.com",
    password: bcrypt.hashSync("123", 10),
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("456", 10),
  }
};

const generateRandomString = () => Math.random().toString(36).substr(2, 6);

const getPasswordAndIdByEmail = (email) => {
  for(const key in users) {
    if(users[key].email === email)
      return {
        'password': users[key].password,
        'id': key,
      };
  }
  return false;
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
  return req.session.user_id
    && urlDatabase[req.params.shortURL]
    && req.session.user_id === urlDatabase[req.params.shortURL].userID;
}

/*          routes         */

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
  const user = users[req.session.user_id];
  let templateVars = {};
  if(user) {
      templateVars = {
        urls: urlsForUser(user.id),
        user: user,
      };
  }
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  if(users[req.session.user_id]) {
    const rand = generateRandomString();
    urlDatabase[rand] = {
      longURL: req.body.longURL,
      userID: req.session.user_id,
    };
    res.redirect(`/urls/${rand}`);
  }
  else {
    res.render('unauthorized');
  }
});

app.get('/urls/new', (req, res) => {
  const user = users[req.session.user_id];
  if(user) {
    res.render('urls_new', {user: user});
  }
  else {
    res.redirect('/login');
  }
});

app.get('/u/:shortURL', (req, res) => {
  const url = urlDatabase[req.params.shortURL];
  if(url) {
    res.redirect(url.longURL);
  }
  else {
    res.status(404).send('Nothing here...');
  }
});

app.get('/urls/:shortURL', (req, res) => {
  if(checkIfUrlExistsAndUserIdMatches(req)) {
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[req.session.user_id],
    };
    // check if the longURL exists, if not then redirect to /urls
    templateVars.longURL ? res.render('urls_show', templateVars) : res.redirect('/urls');
  }
  else {
    req.session.user_id ? res.render('unauthorized', {user: users[req.session.user_id]}) : res.render('unauthorized');
  }
});

// app.post('/urls/:shortURL', (req, res) => {
//   if(checkIfUrlExistsAndUserIdMatches(req)) {
//     const short = req.params.shortURL;
//     const long = req.body.longURL;
//     if(long) {
//       urlDatabase[short].longURL = long;
//     }
//     res.redirect('/urls');
//   }
//   else {
//     res.status(403).send('Dont do that! You are not allowed!\n');
//   }
// });

app.put('/urls/:shortURL', (req, res) => {
  if(checkIfUrlExistsAndUserIdMatches(req)) {
    const short = req.params.shortURL;
    const long = req.body.longURL;
    if(long) {
      urlDatabase[short].longURL = long;
    }
    res.redirect('/urls');
  }
  else {
    res.status(403).send('Don\'t do that! You are not allowed!\n');
  }
});

// app.post('/urls/:shortURL/delete', (req, res) => {
//   if(checkIfUrlExistsAndUserIdMatches(req)) {
//     delete urlDatabase[req.params.shortURL];
//     res.redirect('/urls');
//   }
//   else {
//     res.status(403).send('Dont do that! You are not allowed!\n');
//   }
// });

app.delete('/urls/:shortURL', (req, res) => {
  if(checkIfUrlExistsAndUserIdMatches(req)) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
  else {
    res.status(403).send('Don\'t do that! You are not allowed!\n');
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  // set session
  const email = req.body.email;
  const password = req.body.password;

  if(email && password && getPasswordAndIdByEmail(email)){
    const passwordAndId = getPasswordAndIdByEmail(email);
    if(bcrypt.compareSync(password, passwordAndId.password)){
      req.session.user_id = passwordAndId.id;
      res.redirect('/urls');
    }
    else{
      res.status(403).send('Invalid email or password...');
    }
  }
  else {
    res.status(403).send('Invalid email or password...');
  }
});

app.post('/logout', (req, res) => {
  // clear session
  req.session = null;
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if(email && password && !getPasswordAndIdByEmail(email)) {
    const id = generateRandomString();
    users[id] = {
      id: id,
      email: email,
      password: bcrypt.hashSync(password, 10),
    }
    req.session.user_id = id;
    res.redirect('/urls');
  }
  else {
    res.status(400).send('Email already exists...');
  }
});

// catchall route
app.get('*', (req, res) => res.redirect('/urls'));

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});