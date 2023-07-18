const mongoose = require('mongoose');


  const unitsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    timing: { type: Date, default: Date.now}
  });
  

const Unit = mongoose.model('Unit', unitsSchema);

module.exports =  Unit ;
