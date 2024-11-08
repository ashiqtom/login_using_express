const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Function to generate a random OTP
const generateOtp = () => {
  return crypto.randomBytes(3).toString('hex'); // Generates a 6-character OTP
}

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

module.exports = { 
  generateOtp, 
  // sendOtpEmail 
};
