require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Category = require('../models/Category');

// Kept in sync with the frontend's src/data/categories.js
const categories = [
  { id: 'food', name: 'Food & Dining', icon: 'Utensils', count: 248, popular: true },
  { id: 'retail', name: 'Retail', icon: 'ShoppingBag', count: 185, popular: true },
  { id: 'medical', name: 'Medical & Healthcare', icon: 'Stethoscope', count: 142, popular: true },
  { id: 'homeservices', name: 'Home Services', icon: 'Wrench', count: 310, popular: true },
  { id: 'autocare', name: 'Auto Care', icon: 'Car', count: 96, popular: true },
  { id: 'beauty', name: 'Beauty & Spa', icon: 'Scissors', count: 164, popular: true },
  { id: 'fitness', name: 'Fitness & Gym', icon: 'Dumbbell', count: 78, popular: false },
  { id: 'electronics', name: 'Electronics', icon: 'Smartphone', count: 120, popular: false },
  { id: 'education', name: 'Education', icon: 'GraduationCap', count: 88, popular: false },
  { id: 'supermarket', name: 'Supermarket', icon: 'ShoppingCart', count: 105, popular: false },
];

const run = async () => {
  await connectDB();
  await Category.deleteMany({});
  await Category.insertMany(categories);
  console.log(`Seeded ${categories.length} categories.`);
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
