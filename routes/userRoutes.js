const express = require("express");
const router =express.Router();
const userController =require('../controller/user.js');
const userAuthentication=require('../middleware/auth.js')

router.post('/signup',userController.signup)
router.post('/verify-otp',userController.verifyOtp)
router.post('/resend-otp',userController.resendOtp)
router.post('/login',userController.login)
router.post('/refresh-token',userController.refreshToken)

router.get('/profile', userAuthentication.authenticate ,userController.profile);// route with auth

router.post('/logout',userController.logout)
module.exports =router;