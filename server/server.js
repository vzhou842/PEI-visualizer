const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const shortid = require('shortid');

const app = express();

const BUILD_DIR = path.join(__dirname, '../build');

app.use(express.static(BUILD_DIR, { maxAge: '1y' }));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(BUILD_DIR, 'index.html'));
});

app.get('/link/:id', (req, res) => {
  const { id } = req.params;
  // TODO: get csv from link id
  if (true) {
    // Link not found
    res.sendFile(path.join(BUILD_DIR, 'link404.html'));
  } else {

  }
});

app.post('/link/new', (req, res) => {
  const { csv } = req.body;
  if (!csv) {
    return res.status(400).end();
  }
  // TODO: enforce max / min csv size
  // TODO: save csv with link
  const url = shortid();
  res.status(200).send(`/link/${url}`);
});

app.listen(3000 || process.env.PORT);
