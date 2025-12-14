const { Queue } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis(process.env.REDIS_URL);

const agentQueue = new Queue('agent-jobs', { connection });

module.exports = { agentQueue };
