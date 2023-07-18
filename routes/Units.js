const mongoose = require('mongoose');


  const saltsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    timing: { type: Date, default: Date.now}
  });
  

const Salt = mongoose.model('Salt', saltsSchema);

module.exports =  Salt ;
