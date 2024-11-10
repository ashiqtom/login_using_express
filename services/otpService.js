const nodemailer = require('nodemailer');

// Function to generate a random OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit OTP
};

// // Function to send OTP to user's email
// const sendOtpEmail = async (email, otp) => {
//   const transporter = nodemailer.createTransport({
//     service: 'gmail', // Or any other email service
//     auth: {
//       user: process.env.EMAIL_USER, // Your email address
//       pass: process.env.EMAIL_PASS, // Use environment variables or safer alternatives
//     },
//   });

//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: 'Your OTP Code',
//     text: `Your OTP code is: ${otp}`,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log('OTP sent successfully');
//   } catch (error) {
//     console.error('Error sending OTP email:', error);
//   }
// }

const removeExpiredOtps = async () => {
  try {
    // Delete OTPs where expiration time is less than the current time
    const result = await Otp.deleteMany({
      expiresAt: { $lt: new Date() }  // Delete OTPs where expiration time is in the past
    });
    console.log('Expired OTPs removed:', result.deletedCount);
  } catch (err) {
    console.error('Error removing expired OTPs:', err);
  }
};

// Periodically check for expired OTPs, e.g., every 10 minutes
setInterval(removeExpiredOtps, 10 * 60 * 1000); // Runs every 10 minutes


module.exports = { 
  generateOtp, 
  // sendOtpEmail 
  removeExpiredOtps
};
