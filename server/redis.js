const redis = require('redis');
const bluebird = require('bluebird');

bluebird.promisifyAll(redis);

const redisClient = redis.createClient();

const LINK_EXPIRATION_SECONDS = 60 * 60 * 24 * 14; // 2 weeks

function linkKey(link) {
  return `link:${link}`;
}

async function saveLink(link, data) {
  return redisClient.setexAsync(linkKey(link), LINK_EXPIRATION_SECONDS, JSON.stringify(data));
}

async function getLink(link) {
  // Always refresh link TTL whenever it's read
  const [result, expire] = await Promise.all([
    redisClient.getAsync(linkKey(link)),
    redisClient.expireAsync(linkKey(link), LINK_EXPIRATION_SECONDS),
  ]);
  return result;
}

module.exports = {
  saveLink,
  getLink,
};
