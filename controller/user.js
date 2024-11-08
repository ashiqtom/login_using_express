const User = require('../models/user')
const bcrypt=require('bcrypt')
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { generateOtp, sendOtpEmail } = require('../services/otpService'); // Import the helper functions

exports.signup=async(req,res)=>{
    try{
        const { name, email, password } = req.body;
        const user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ err: 'Email already exists' });
        }

        // Generate OTP
        const otp = generateOtp();
        console.log('otp',otp)
        const expiration = new Date();
        expiration.setMinutes(expiration.getMinutes() + 5); // OTP expires in 5 minutes
      
        const saltRounds = parseInt(process.env.saltRounds);
        const hashedPassword = await bcrypt.hash(password, saltRounds); // blowfish 

        const newUser = new User({ 
            name, 
            email, 
            password: hashedPassword ,
            otp,
            expiration,
        });
        await newUser.save();
        
        // await sendOtpEmail(email, otp);

        res.status(201).json({ message: 'Successfully created new user and OTP sent to your email'});
    } catch(err){
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}


// Endpoint to verify OTP
exports.verifyOtp= async (req, res) => {
  try{
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).send('Email and OTP are required');
    }
  
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send('User not found');
    }
  
    // Find OTP record
    const otpRecord = user.otp
    if (!otpRecord) {
      return res.status(404).send('OTP not found');
    }
  
    // Check OTP expiration
    if (user.expiration < new Date()) {
      return res.status(400).send('OTP has expired');
    }
    // Verify OTP
    if (otpRecord === otp) {

      user.otpVerified = true; // Set otpVerified to true
      await user.save(); // Save the updated user

      return res.status(200).send('OTP verified successfully');
    } else {
      return res.status(400).send('Invalid OTP');
    }
  } catch (err){
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
  


// Login user
exports.login= async (req, res) => {
    const { email, password } = req.body;
  
    try {
        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        if(user.otpVerified==false){
          return res.status(400).json({Message:"otp is not varified"})
        }
  
    //   // Compare the password
    //   const isMatch = await user.matchPassword(password);
    //   if (!isMatch) {
    //     return res.status(400).json({ message: 'Invalid email or password' });
    //   }

   
        // Compare the password
        const isMatch =  await bcrypt.compare(password, user.password);
        if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
        }


        // Generate access token (JWT)
        const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Generate refresh token (using a random string or some encryption)
        const refreshToken = crypto.randomBytes(40).toString('hex');

        // Store the refresh token securely in the database or cache
        user.refreshToken = refreshToken;  // Assuming there's a `refreshToken` field in your User model
        await user.save();

        // Respond with both tokens
        res.json({
        accessToken,
        refreshToken,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
  };


exports.refresh= async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
    }

    try {
        // Find the user with the given refresh token
        const user = await User.findOne({ refreshToken });
        if (!user) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        // If the refresh token is valid, generate a new access token
        const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Respond with the new access token
        res.json({
            accessToken,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
  
exports.logout = async (req, res) => {
    const { refreshToken } = req.body;
  
    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
    }
  
    try {
        // Find the user and clear the refresh token
        const user = await User.findOne({ refreshToken });
        if (!user) {
            return res.status(400).json({ message: 'Invalid refresh token' });
        }
    
        // Clear the refresh token
        user.refreshToken = null;
        await user.save();
    
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
};
  

exports.profile=async(req, res) => {
    res.json({ message: 'This is a protected route', userId: req.user });
};



  