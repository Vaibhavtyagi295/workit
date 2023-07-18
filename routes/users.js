const mongoose = require("mongoose");
const plm = require("passport-local-mongoose")
mongoose.set('strictQuery',true);
mongoose.connect("mongodb://localhost/Amul")
.then(function(){
  console.log("hello world")
});

const userSchema = new mongoose.Schema({
  username: String,
  phoneNumber: {
    type: String,
  },
  role: {
    type: String,
    enum: ["admin","user"],
    default: "user"
  }
});


userSchema.plugin(plm);

module.exports = mongoose.model("user",userSchema)