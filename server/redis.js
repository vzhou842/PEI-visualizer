const redis = require('redis');
const bluebird = require('bluebird');

bluebird.promisifyAll(redis);

const redisClient = redis.createClient();

function linkKey(link) {
  return `link:${link}`;
}

async function saveLink(link, data, expireSeconds) {
  return redisClient.setexAsync(linkKey(link), expireSeconds, JSON.stringify(data));
}

async function getLink(link) {
  return redisClient.getAsync(linkKey(link));
}

module.exports = {
  saveLink,
  getLink,
};
