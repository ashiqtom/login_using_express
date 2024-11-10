const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const otpSchema = new Schema({
    email: { 
        type: String, 
        unique: true, 
        lowercase: true 
    },
    phone: { 
        type: String, 
        unique: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    password:{
        type:String,
        required:true
    },
    otp: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now, 
        expires: '30m' 
    }, // expires in 5 minutes

});

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
