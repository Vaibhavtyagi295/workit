const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    unit: { type: Schema.Types.ObjectId, ref: 'Unit',},
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true }
  });
  
  
  module.exports = mongoose.model('Product', productSchema);