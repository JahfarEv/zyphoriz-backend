const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    id: {
      // short slug-like id used by the frontend, e.g. "food", "electronics"
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      // lucide-react icon name, kept as a string so the frontend can map it
      type: String,
      default: 'Store',
    },
    count: {
      type: Number,
      default: 0,
    },
    popular: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
