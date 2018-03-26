const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt')

app.use(cookieSession( {
  name: 'session',
  keys: ['anystring'],

  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.set('view engine', 'ejs');

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));


var urlDatabase = {
  // b2xVn2: {
  //   shortURL:'b2xVn2',
  //   longURL:'http://www.lighthouselabs.ca',
  //   uid:'bob'
  // },
  // '9sm5xk': {
  //   shortURL: '9sm5xk',
  //   longURL: 'http://www.google.com',
  //   uid: 'greg'
  // }
};

const users = {
  "userRandomID": {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'asdf'
  },
  'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  }
}

function checkUserEmail(email) {
  for (var key in users) {
    if (users[key].email === email) {
      return users[key];
    }
  }
}

function urlsForEach(user_id) {
  var newObject = {};
  for (var key in urlDatabase) {
    if (user_id === urlDatabase[key].uid) {
      newObject[key] = urlDatabase[key].longURL;
    }
  }
  return newObject;
}


function generateRandomString() {
  let randoStr = '';
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i++ ) {
    randoStr += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return randoStr;
}

app.get('/', function (request, response) {
  response.end('hello world');
});

app.get('/urls.json', (request, response) => {
  response.json(urlDatabase);
});

app.get('/hello', (request, response) => {
  response.end('<html><body>Hello <b>Wolrd</b></body</html>\n');
});

app.get('/urls', (request, response) => {
  let user_id = request.session.user_id;
  let user = users[user_id];
  let newDatabase = urlsForEach(user_id);

  const templateVars = {
    urls: newDatabase,
    user_id: user_id,
    user: user

  };
  response.render('urls_index', templateVars);
});

app.get('/login', (request, response) => {

  let user_id = request.session.user_id;
  let user = users[user_id];
  let templateVars = {
      user: user
      };
  response.render('login', templateVars);
});

app.get('/register', (request, response) => {
  let user_id = request.session.user_id;
  let user = users[user_id];
  let templateVars = {
      user: user
      };
  response.render('register', templateVars);
});

app.get('/urls/new', (request, response) => {
  console.log("we are in the new page");

  let user_id = request.session.user_id;
  console.log(user_id);
  let user = users[user_id];

  if (user) {
    const templateVars = {
      user: user
    };
    response.render('urls_new', templateVars);
   } else {
    response.redirect('/login');
   }

});

app.get('/urls/test',(request, response)=>{
  console.log(request.session.user_id);
});

app.get('/urls/:id', (request, response) => {

  let shortURL = request.params.id;
  let user_id = request.session.user_id;
  let user = users[user_id];
  let longURL = urlDatabase[shortURL].longURL;
  let templateVars = {
      shortURL: shortURL,
      longURL: longURL,
      user: user
  };

  response.render('urls_show', templateVars);
});

app.get('/u/:shortURL', (request, response) => {
  // cannot read property of undefined!
  let longURL = urlDatabase[request.params.shortURL].longURL;
  response.redirect(`${longURL}`); // redirects the browser!
  });

  app.get('/register', (request, response) => {
  response.render('register');
});

app.post('/register', (request, response) => {
  const { email, password } = request.body;
  for(let user_id in users) {
    const user = users[user_id];
    if (user.email === request.body.email) {
      return response.redirect(400, '/register');
    }
  }

  if(request.body.email && request.body.password) {
      let currentUserID = generateRandomString();

      users[currentUserID] = {
        id: currentUserID,
        email: request.body.email,
        password: bcrypt.hashSync(password, 10)
      };
      request.session.user_id = currentUserID;
      response.redirect('/urls');
  } else {
    response.redirect(400, '/register');
    response.send("You shall not pass... Please either enter a valid e-mail or password!");
  }

});

app.post('/urls/:id/delete', (request, response) => {
  let user_id = request.session.user_id;
  let user = users[user_id];
  if (user) {
    let templateVars = {
      user: user
    };
    delete urlDatabase[request.params.id];
    response.redirect('/urls');
    return;
  } else {
    response.render('urls_new', templateVars);
  }
});

app.post('/urls', (request, response) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    shortURL: shortURL,
    longURL: request.body.longURL,
    uid: request.session.user_id
  }
  response.redirect(`/urls/`);
  console.log(urlDatabase);
  console.log(users);
  // don't forget about this thing later maybe ${shortURL}`
});

app.post('/urls/:id/update', (request, response) => {
    urlDatabase[request.params.id].longURL = request.body.longURL;
    console.log(urlDatabase[request.params.id].longURL);
    response.redirect(`/urls/${request.params.id}`);
});

app.post('/login', (request, response,) => {
  // (users[currentUser].password === request.body.password)) this was the second half of my if statement below
  const { email, password } = request.body;
  var result = checkUserEmail(request.body.email);

  if (result) {
    if (bcrypt.compareSync(request.body.password, result.password)) {
      request.session.user_id = result.id;
      console.log(request.session.user_id);
      response.redirect('/urls');
    } else {
      response.status(400).send('Either e-mail or password not matching. Please <a href ="/login">login</a>')
    }

  } else {
    response.status(403).send('Looks like youre not in the system, please: <a href="/register">register</a> to continue.');
  }

});

app.post('/logout', (request, response) => {
  // response.clearCookie("user_id")
  request.session = null;
  response.redirect('/urls');

});

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
