import express from "express";
import { register, login, forgotPassword, verifyOtp, logout, recoveryEmail, createPassword, addProfile, home, isLoggedInUser, updateProfile } from '../controllers/userController.js';
const router = express.Router();
router.post('/sign-up', register);
router.post('/login', login);
router.post('/forgot', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/add-profile', addProfile);
router.post('/update-profile', updateProfile);
router.post('/home', home);
router.route('/islogin').post(isLoggedInUser);

router.post('/logout', logout);
router.post('/create-password', createPassword);
router.post('/reset-password/:id');
router.post('/recovery-email', recoveryEmail);
export default router;
