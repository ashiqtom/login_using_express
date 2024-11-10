const User = require('../models/user')
const Otp = require('../models/otp')
const bcrypt=require('bcryptjs')
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { generateOtp, sendOtpEmail } = require('../services/otpService'); // Import the helper functions


// Helper functions for validation
const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/; // Example for a 10-digit phone number
  return phoneRegex.test(phone);
};

exports.signup=async(req,res)=>{
    try{
      const { name, email, password, phone } = req.body;
      
      if (!email && !phone) {
        return res.status(400).send('Email or phone number are required');
      }
      if (!name || !password) {
        return res.status(400).send('name and passwoed are required');
      }


      // Validate email if provided
      if (email && !isValidEmail(email)) {
        return res.status(400).send('Invalid email format');
      }

      // Validate phone if provided
      if (phone && !isValidPhone(phone)) {
        return res.status(400).send('Invalid phone number format');
      }
      

      // Check if the user already exists by either email or phone
      const user = await User.findOne({ $or: [{ email }, { phone }] });

      if (user) {
        return res.status(400).json({ err: 'Email or phone number already exists' });
      }
      const otpRecord=await Otp.findOne({ $or: [{ email }, { phone }] });

      if(otpRecord){
        return res.status(400).json({err: "Email or phone number already used ,varify the email or phone or try after 5m"})
      }
        // Generate OTP
        const otp = generateOtp();
        console.log('otp',otp)


        const saltRounds = parseInt(process.env.saltRounds);
        const hashedPassword = await bcrypt.hash(password, saltRounds); // blowfish 

        const newUser = new Otp({ 
            name, 
            email : email || null, 
            phone:phone || null,
            password: hashedPassword ,
            otp
        });
        await newUser.save();
        
        // await sendOtpEmail(email, otp);


        const userRecord =await Otp.findOne({email});
        

        res.status(201).json({ message: 'Successfully created new user and OTP sent to your email'});
    } catch(err){
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}


// Endpoint to verify OTP
exports.verifyOtp= async (req, res) => {
  try{
    const { email, otp,phone } = req.body;

    if (!otp || (!email && !phone)) {
      return res.status(400).send('Email or phone number and OTP are required');
    }

    
    // Validate email if provided
    if (email && !isValidEmail(email)) {
      return res.status(400).send('Invalid email format');
    }

    // Validate phone if provided
    if (phone && !isValidPhone(phone)) {
      return res.status(400).send('Invalid phone number format');
    }

    let query = [{ otp: otp }];
    if (email) query.email = email;
    if (phone) query.phone = phone;

    const otpRecord = await Otp.findOne({ $or: query });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
  
    // Check if OTP has expired manually (even though Mongoose will automatically remove it)
    const otpExpirationTime = otpRecord.createdAt.getTime() + 5 * 60 * 1000; // Created at + 5 minutes
    const currentTime = new Date().getTime();


    if (currentTime > otpExpirationTime) {
      return res.status(400).json({ message: 'OTP has expired' });
    }
    
    const newUser = new User({ 
      name:otpRecord.name, 
      email:otpRecord.email || null, 
      phone:otpRecord.phone || null,
      password: otpRecord.password ,
    });
    await newUser.save();
    
    await Otp.deleteOne({ _id: otpRecord._id });
    
    res.status(200).json({ message: 'OTP verified successfully and accont created' });
  } catch (err){
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
  

// Resend OTP Endpoint
exports.resendOtp = async (req, res) => {
  try {
    const { email, phone } = req.body;

    // Check if email or phone number is provided
    if (!email && !phone) {
      return res.status(400).json({ message: 'Email or phone number is required' });
    }


    // Validate email if provided
    if (email && !isValidEmail(email)) {
      return res.status(400).send('Invalid email format');
    }

    // Validate phone if provided
    if (phone && !isValidPhone(phone)) {
      return res.status(400).send('Invalid phone number format');
    }


    let query = [];
    if (email) query.email = email;
    if (phone) query.phone = phone;

    const otpRecord = await Otp.findOne({ $or: query });

    if (!otpRecord) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOtp();
    console.log('otp',otp)

    // Update OTP record in the database
    otpRecord.otp = otp;
    otpRecord.createdAt = new Date();
    await otpRecord.save();

    // Optionally send the OTP to the user's email again (or via SMS if required)
    // await sendOtpEmail(userRecord.email, newOtp);

    return res.status(200).json({ message: 'OTP resent successfully to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
exports.login= async (req, res) => {
  const { email, password,phone } = req.body;

  try {


    // Validate email if provided
    if (email && !isValidEmail(email)) {
      return res.status(400).send('Invalid email format');
    }

    // Validate phone if provided
    if (phone && !isValidPhone(phone)) {
      return res.status(400).send('Invalid phone number format');
    }

    let query = [];
    if (email) query.email = email;
    if (phone) query.phone = phone;

    const user = await User.findOne({ $or: query });

    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    //   // Compare the password
    //   const isMatch = await user.matchPassword(password);
    //   if (!isMatch) {
    //     return res.status(400).json({ message: 'Invalid email or password' });
    //   }


    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
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
    res.status(201).json({accessToken, refreshToken});

  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
  }
};


exports.refreshToken= async (req, res) => {
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



  