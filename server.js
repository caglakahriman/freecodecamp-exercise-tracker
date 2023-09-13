let mongoose = require("mongoose");
const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
require('dotenv').config()

mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    log: [{
      description: { type: String, required: true },
      duration: { type: Number, required: true },
      date: { type: Date, required: true }
    }]
  }
);

let User = mongoose.model("User", userSchema);

app.use(cors())
app.use('/', bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
  User.create({username: req.body.username}, (err, user) =>
    {
      if (err) return console.log(err);
      res.json({username: user.username, _id: user._id});
    })
});

app.post('/api/users/:_id/exercises', (req, res) =>
{
  User.findById(req.params._id, (err, found) =>
  {
    if (req.body.date == '')
      req.body.date = new Date();
    if (err) return console.log(err);
    found.log.push(
      {
        description: req.body.description,
        duration: req.body.duration,
        date: req.body.date
      });
    found.save();
    res.json({_id: found._id, username: found.username, date: req.body.date.toDateString(), duration: parseInt(req.body.duration), description: req.body.description});
  });
});

app.get('/api/users/:_id/logs', (req, res) =>
{
  User.findById(req.params._id, (err, user) =>
  {
    if (err) return console.log(err);
    if (user.log.length > 0)
    {
      if (req.query.from != undefined && req.query.to != undefined && req.query.limit != undefined)
      {
        let from = new Date(req.query.from);
        let to = new Date(req.query.to);
        let limit = parseInt(req.query.limit);
        let log = user.log.filter((item) => item.date >= from && item.date <= to).slice(0, limit);
        res.json({_id: user._id, username: user.username, count: log.length, log: log});
      }
      else
        res.json({_id: user._id, username: user.username, count: user.log.length, log: user.log});
    }
    else
      res.json({_id: user._id, username: user.username, count: 0, log: []});
  });
});

app.get('/api/users', (req, res) => {
  User.find({}, '_id, username', (err,found) =>
    {
      if (err) return console.log(err);
      res.json(found);
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
