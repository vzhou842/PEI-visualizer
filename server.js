const express = require('express');
const path = require('path');

const app = express();

const BUILD_DIR = path.join(__dirname, 'build');

app.use(express.static(BUILD_DIR, { maxAge: '1y' }));

app.get('/', (req, res, next) => {
  res.sendFile(path.join(BUILD_DIR, 'index.html'));
});

var server = app.listen(3000 || process.env.PORT);
