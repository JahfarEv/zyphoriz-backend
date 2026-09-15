require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Business = require('../models/Business');

const run = async () => {
  await connectDB();

  const business = await Business.findOneAndUpdate(
    { slug: 'abcd' },
    { status: 'active' },
    { new: true }
  );

  console.log('Updated business:', business);

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});