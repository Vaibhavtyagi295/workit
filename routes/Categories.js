const mongoose = require('mongoose');


  const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    timing: { type: Date, default: Date.now}
  });
  

const Category = mongoose.model('Category', categorySchema);

module.exports = { Category };
