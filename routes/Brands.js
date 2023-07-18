const mongoose = require('mongoose');


  const brandsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    timing: { type: Date, default: Date.now}
  });
  

const Brand = mongoose.model('Brand', brandsSchema);

module.exports =  Brand ;
