const express = require('express');
const app = express();

const mongoose = require('mongoose');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session')
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
require('dotenv').config();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayouts);

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 60 * 1000 
  }
}));

// View Engine
app.set('view engine', 'ejs');
app.set('layout','layout')

//Database Connection
mongoose.connect(process.env.MONGODB_URI)

app.use('/admin',(req, res, next) =>{  
  res.locals.layout ='admin/layout';
  next();
})

app.use('/admin', require('./routes/admin'));

app.use('/', require('./routes/frontend'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
