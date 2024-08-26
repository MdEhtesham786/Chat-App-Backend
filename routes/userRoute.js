import express from "express";
import { register, login, forgotPassword, verifyOtp, logout, recoveryEmail, createPassword, addProfile, home, isLoggedInUser } from '../controllers/userController.js';
const router = express.Router();
router.post('/auth/sign-up', register);
router.post('/auth/login', login);
router.post('/auth/forgot', forgotPassword);
router.post('/auth/verify-otp', verifyOtp);
router.post('/auth/add-profile', addProfile);
router.post('/home', home);
router.route('/auth/islogin').post(isLoggedInUser);

router.post('/auth/logout', logout);
router.post('/auth/create-password', createPassword);
router.post('/auth/reset-password/:id');
router.post('/auth/recovery-email', recoveryEmail);
export default router;
