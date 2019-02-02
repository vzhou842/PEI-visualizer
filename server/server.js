const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const shortid = require('shortid');

const redis = require('./redis');

const app = express();

const BUILD_DIR = path.join(__dirname, '../build');

app.use(express.static(BUILD_DIR, { maxAge: '1y' }));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(BUILD_DIR, 'index.html'));
});

app.get('/link/:id', (req, res) => {
  res.sendFile(path.join(BUILD_DIR, 'index.html'));
});

app.get('/link/:id/data', (req, res, next) => {
  const { id } = req.params;
  redis.getLink(id).then(data => {
    if (data) {
      res.status(200).send(data);
    } else {
      res.status(404).end();
    }
  }).catch(next);
});

app.post('/link/new', (req, res, next) => {
  const { data } = req.body;
  if (!data) {
    return res.status(400).end();
  }
  // TODO: enforce max / min data size
  const url = shortid();
  redis.saveLink(url, data).then(() => {
    res.status(200).send(`/link/${url}`);
  }).catch(next);
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).end();
});

app.listen(3000 || process.env.PORT);
