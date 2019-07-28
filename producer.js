const Agenda = require('agenda');
const { MongoClient } = require('mongodb');

async function run() {
  const db = await MongoClient.connect('mongodb://localhost:27017/loginapp');
  const agenda = new Agenda().mongo(db, 'jobs');

  // Wait for agenda to connect. Should never fail since connection failures
  // should happen in the `await MongoClient.connect()` call.
  await new Promise(resolve => agenda.once('ready', resolve()));

  // Schedule a job for 1 second from now and persist it to mongodb.
  // Jobs are uniquely defined by their name, in this case "hello"
  agenda.schedule(new Date(Date.now() + 1000), 'print', {
    message: 'Hello!'
  });
}

run().catch(error => {
  console.error(error);
  process.exit(-1);
});
