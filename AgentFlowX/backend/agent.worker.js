require("dotenv").config();
const { Worker } = require("bullmq");
const Redis = require("ioredis");
const { runAgent } = require("./agent");

const connection = new Redis(process.env.REDIS_URL);

new Worker(
  "agent-jobs",
  async (job) => {
    const { userId, command } = job.data;

    console.log("🧠 Processing agent job:", job.id);

    return await runAgent(userId, command);
  },
  { connection }
);

console.log("🚀 Agent worker started");
