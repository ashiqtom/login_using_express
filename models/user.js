const mongoose = require('mongoose');
const bcrypt=require('bcrypt')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String, 
    required: false,
  },
  otp: { 
    type: String, 
    required: true 
  },
  expiration: { 
    type: Date, 
    required: true 
  }, 
  otpVerified:{
    type:Boolean,
    required:false,
    default: false
  }
});

// // Pre-save hook to hash password before saving to DB
// userSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) {
//     return next();
//   }
  
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // Method to compare passwords during login
// userSchema.methods.matchPassword = async function(password) {
//   return await bcrypt.compare(password, this.password);
// };

const User = mongoose.model('User', userSchema);
module.exports = User;
