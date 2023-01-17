const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoDBStore = require('connect-mongodb-session')(session);

const app = express();

const UserModel = require('./models/User');

app.set('views', './views'); // specify the views directory
app.set('view engine', 'ejs'); // register the template engine

const MONGO_URI = '';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('db connected'))
  .catch((err) => console.log('db not connected!! ', err));

const store = new MongoDBStore({
  uri: MONGO_URI,
  collection: 'mySessions',
});

const isAuth = (req, res, next) => {
  if (!req.session.isAuth) {
    return res.redirect('/login');
  }
  next();
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: 'some secret here',
    resave: false,
    saveUninitialized: false,
    store: store,
  }),
);

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res) => {
  res.render('Login', { error: req.query?.error });
});

app.get('/register', (req, res) => {
  res.render('Register');
});

app.get('/dash', isAuth, async (req, res) => {
  const user = await UserModel.findById(req.session.userId);
  res.render('Dashboard', { user });
});

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const user = new UserModel({ username, email, password });

  await user.save();

  res.redirect('/login');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await UserModel.findOne({ email });

  if (!user) {
    return res.redirect('/login?error=true');
  }
  const isMatch = password === user.password;
  if (!isMatch) {
    return res.redirect('/login?error=true');
  }
  req.session.isAuth = true;
  req.session.userId = user._id;
  res.redirect('/dash');
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect('/');
  });
});

app.listen(5000, () => console.log('server running on port 5000'));
