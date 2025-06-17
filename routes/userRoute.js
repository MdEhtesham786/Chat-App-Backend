import express from "express";
import { register, login, forgotPassword, verifyOtp, logout, recoveryEmail, createPassword, addProfile, home, isLoggedInUser, updateProfile, uploadProfilePic } from '../controllers/userController.js';
import { isAuthenticatedUser } from "../middleware/auth.js";
import upload from '../middleware/imageUpload.js';
const router = express.Router();
router.post('/sign-up', register);
router.post('/login', login);
router.post('/forgot', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/add-profile', addProfile);
router.post('/update-profile', updateProfile);
router.post('/home', home);
router.route('/islogin').post(isLoggedInUser);
// router.post('/upload-profile-pic', upload.single('profilePic'), uploadProfilePic);
router.post(
    '/upload-profile-pic',
    (req, res, next) => {
        upload.single('profilePic')(req, res, function (err) {
            if (err) {
                console.error('🔴 Multer Error:', err.message);
                return res.status(400).json({ success: false, error: err.message });
            }
            console.log('🟢 File processed by Multer');
            next();
        });
    },
    uploadProfilePic
);


router.post('/logout', logout);
router.post('/create-password', createPassword);
router.post('/reset-password/:id');
router.post('/recovery-email', recoveryEmail);
export default router;
