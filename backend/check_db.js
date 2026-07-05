import mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/projectforge');
  const Team = mongoose.connection.collection('teams');
  const teams = await Team.find({ careerAssets: { $exists: true } }).toArray();
  console.log(JSON.stringify(teams, null, 2));
  process.exit(0);
}
run();
