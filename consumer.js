const Agenda = require('agenda');
const { MongoClient } = require('mongodb');

async function run() {
  const db = await MongoClient.connect('mongodb://localhost:27017/loginapp');
  const agenda = new Agenda().mongo(db, 'jobs');

  // Define a "job", an arbitrary function that agenda can execute
  agenda.define('hello', () => {
    console.log('Hello, World!');
    process.exit(0);
  });

  // Wait for agenda to connect. Should never fail since connection failures
  // should happen in the `await MongoClient.connect()` call.
  await new Promise(resolve => agenda.once('ready', resolve()));

  // `start()` is how you tell agenda to start processing jobs. If you just
  // want to produce (AKA schedule) jobs then don't call `start()`
  agenda.start();
}

run().catch(error => {
  console.error(error);
  process.exit(-1);
});
