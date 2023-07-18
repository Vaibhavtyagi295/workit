const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
});

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP; 