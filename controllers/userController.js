import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import userModel from "../models/userModel.js";
import { sendToken, sendCookie, } from '../utils/jwtToken.js';
import sendEmail from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import cloudinary from "../utils/cloudinary.js";
import fs from 'fs';


export const login = catchAsyncErrors(async (req, res, next) => {

    const { email, password, remember } = req.body;
    if (email) {
        const user = await userModel.findOne({ email }).select('+password');
        if (!user) {
            return next(new ErrorHandler('Invalid Email or Password'), 401);
        }
        const isMatched = await user.comparePassword(password);
        if (!isMatched) {
            return next(new ErrorHandler('Invalid Password', 401));
        }
        if (remember === 'on') {
            const loggedInUser = sendToken(user, process.env.JWT_EXPIRE_MAX);
            sendCookie('token', loggedInUser, 31536000000, res);
        } else {
            const loggedInUser = sendToken(user, process.env.JWT_EXPIRE);
            sendCookie('token', loggedInUser, 7200000, res);
        }
        res.clearCookie('signUp');
        res.clearCookie('addRecoveryEmail');
        res.redirect('/');
    } else {
        if (!email || !password) {
            return next(new ErrorHandler('Please Enter Email and Password', 400));
        }
    }
});
export const register = catchAsyncErrors(async (req, res, next) => {
    const { username, email, password, confirm_password } = req.body;
    if (email) {
        const Users = await userModel.findOne({ email });
        if (!Users) {
            if (password === confirm_password) {
                const user = new userModel(req.body);
                await user.save();
                const token = user.generateToken(10 * 60 * 1000);
                const credentials = jwt.sign({ email, password }, process.env.JWT_SECRET);
                sendCookie('signUp', credentials, 10 * 60 * 1000, res);
                sendCookie('addRecoveryEmail', token, 10 * 60 * 1000, res);
                res.status(200).render('form', { formType: 'recoveryEmail', message: '', layout: 'layouts/formlayout' });
            } else {
                return next(new ErrorHandler("Passowrd and Confirm password doesn't match"));
            }
        } else {
            console.log('Email already in use');
            return res.status(201).json({
                success: false,
                user: 'Email already in use'
            });
        }
    } else {
        if (!email || !password || !confirm_password || !username) {
            return next(new ErrorHandler('Please enter required inputs', 401));
        }
    }
});
export const recoveryEmail = catchAsyncErrors(async (req, res, next) => {
    const { recovery_email } = req.body;
    const token = req.cookies.addRecoveryEmail;
    if (!token) {
        return next(new ErrorHandler('Cookie Expired', 401));
    }
    const verify = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findOne({ _id: verify.id });
    user.recoveryEmail = recovery_email;
    await user.save({ validateBeforeSave: false });
    res.clearCookie('addRecoveryEmail');
    return res.status(200).redirect('/api/v1/auth/login');
});
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return next(new ErrorHandler('Please provide an Email', 400));
    }
    let verificationCode = Math.round((1000 + Math.random() * 9000));
    let otpArr = verificationCode.toString().split('');
    while (otpArr[0] === otpArr[1] && otpArr[2] === otpArr[3] && otpArr[0] === otpArr[3]) {
        verificationCode = Math.round((1000 + Math.random() * 9000));
        otpArr = verificationCode.toString().split('');
    }
    
    // const resetPasswordUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
    const message = `Please use the verification code below on verify page.\n\n ${verificationCode} \n\n if you have not requested then please ignore.`;
    let email_name = email.split('@');
    let arr = [];
    email_name[0].split('').forEach((char, i) => {
        if (i > 2) {
            arr.push('*');
        } else {
            arr.push(char);
        }
    });
    arr.push('@');
    arr.push(email_name[1]);
    let hashedEmail = arr.join('');
    const user = await userModel.findOne({ email });
    if (user) {
        user.otp = verificationCode;
        await user.save({ validateBeforeSave: true });
        
        console.log('already a user', user.email);
        const info = await sendEmail({
            email: email,
            subject: 'Chateo Authentication',
            message
        });
        return res.json({
            success: true,
            hashedEmail,
            info,
            user
        });
    } else {
        const user = new userModel({ email, otp: verificationCode, });
        await user.save();
        const info = await sendEmail({
            email: email,
            subject: 'Chateo Authentication',
            message
        });
        return res.json({
            success: true,
            hashedEmail,
            info,
            user

        });
    }
});

export const verifyOtp = catchAsyncErrors(async (req, res, next) => {
    const { data, userID } = req.body;
    if (!data || !userID) {
        return next(new ErrorHandler('Please provide necessary data', 404));
    }
    const user = await userModel.findById(userID);
    let hasProfile = false;
    const otp = data.join('');
    // const token = req.cookies.verifyOtp;
    if (!otp) {
        console.log('Please provide OTP');
        // return res.json()
        return next(new ErrorHandler('Please provide OTP', 400));
    }
    let verificationCode = otp;
    const OTP = user.otp;
    if (!OTP) {
        user.otp = null;
        // await user.save({ validateBeforeSave: true });
        console.log('OTP expired');
        return next(new ErrorHandler('OTP Expired', 403));
        res.redirect('/api/v1/auth/forgot');
    }
    if (OTP !== verificationCode) {
        console.log('Wrong OTP', OTP, verificationCode);
        return next(new ErrorHandler('Wrong OTP'));
        res.redirect('/api/v1/auth/forgot');
    }
    // res.clearCookie("verifyOtp");
    const User = await userModel.findOne({ email: user.email });
    if (User) {
        if (User.firstname) {
            hasProfile = true;
        }
        User.otp = null;
        await User.save({ validateBeforeSave: true });
        const token = User.generateToken(10 * 60 * 1000);
        if (!token) {
            return next(new ErrorHandler('Token not created, please try again', 400));
        }
        console.log('OTP Matched Successfully');
        return res.json({
            success: true,
            user: User,
            hasProfile,
            token
        });
    } else {
        user.otp = null;
        const newUser = new userModel({
            email: user.email,
            roles: user.roles,
            otp: null,
        });
        await newUser.save();
        const token = newUser.generateToken(10 * 60 * 1000);
        if (!token) {
            return next(new ErrorHandler('Token not created, please try again', 400));
        }
        console.log('OTP Matched Successfully');
        return res.json({
            success: true,
            user: newUser,
            hasProfile,
            token

        });
    }
    // await user.save({ validateBeforeSave: true });
    // const creatingToken = sendToken(user, process.env.JWT_EXPIRE);

    // sendCookie('createPassword', creatingToken, 1800000, res);


});
export const addProfile = catchAsyncErrors(async (req, res, next) => {
    const { token, data } = req.body;
    if (!data) {
        return next(new ErrorHandler('Please provide the required info', 400));
    }
    if (!token) {
        return next(new ErrorHandler('Token not found', 500));
    }
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById({ _id: decodedData.id });
    const User = await userModel.findOneAndUpdate({ email: user.email }, { firstname: data.firstname, lastname: data.lastname }, { runValidators: true, new: true });
    await User.save();
    return res.json({
        success: true,
        user
    });
});
export const updateProfile = catchAsyncErrors(async (req, res, next) => {
    const { token, data } = req.body;
    if (!data) {
        return next(new ErrorHandler('Please provide the required info', 400));
    }
    if (!token) {
        return next(new ErrorHandler('Token not found', 500));
    }
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById({ _id: decodedData.id });
    const User = await userModel.findOneAndUpdate({ email: user.email }, { firstname: data.firstname, lastname: data.lastname }, { runValidators: true, new: true });
    await User.save();
    return res.json({
        success: true,
        user: User
    });
});
export const uploadProfilePic = catchAsyncErrors(async (req, res, next) => {
    const { token } = req.body;
    if (!token) next(new ErrorHandler('Token not found', 500));
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById({ _id: decodedData.id });
    if (!user) next(new ErrorHandler('User not found', 404));
    if (!req.file || !req.file.path) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    if (user.avatar?.public_Id) {
        await cloudinary.uploader.destroy(`profile_pictures/${user.avatar.public_Id}`).then(res => console.log('previous image removed from cloudinary', res));
    }
    const result = await cloudinary.uploader.upload(req.file.path, {
        // folder: 'profile_pictures', // optional
        resource_type: 'image',
    });
    if (!result) next(new ErrorHandler('Image upload failed', 500));

    user.avatar = { url: result?.secure_url, public_Id: result?.original_filename };
    await user.save();
    res.json({
        success: true,
        message: 'Profile picture uploaded successfully',
        imageUrl: result.secure_url,
        user
    });

    // res.status(200).json({
    //     success: true,
    //     user: user._id
    //     //   imageUrl: .profilePic,
    // });


});
export const home = catchAsyncErrors(async (req, res, next) => {
    const { token } = req.body;
    // const User = await userModel.findOne({ email: user.email });
    res.json({
        success: true,
        user: User
    });
});
export const isLoggedInUser = catchAsyncErrors(async (req, res, next) => {
    const { token } = req.body;
    let hasProfile = false;
    if (token) {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById({ _id: decodedData.id });
        if (!user) {
            return res.json({
                success: false,
                message: 'User not found'
            });
        }
        if (user.firstname) {
            hasProfile = true;
        }
        return res.json({
            success: true,
            user,
            hasProfile
        });
    } else {
        return res.json({
            success: false,
            message: 'User must be logged in to get access to this page',
        });
    }
});
export const createPassword = catchAsyncErrors(async (req, res, next) => {
    const creatingToken = req.cookies.createPassword;
    if (!creatingToken) {
        return next(new ErrorHandler('creating time expired', 403));
    }
    const verify = jwt.verify(creatingToken, process.env.JWT_SECRET);
    if (!verify) {
        return next(new ErrorHandler('jwt token not verified'));
    }
    const user = await userModel.findById({ _id: verify.id });
    const { new_password, confirm_password } = req.body;
    if (!new_password || !confirm_password) {
        return next(new ErrorHandler('Please fill the input', 400));
    }
    if (new_password === confirm_password) {
        user.password = new_password;
        await user.save({ validateBeforeSave: true });
        res.clearCookie('createPassword');
        return res.status(200).redirect('/api/v1/auth/login');
    } else {
        return next(new ErrorHandler("New password and Confirm password doesn't match", 403));
    }
});

export const logout = catchAsyncErrors(async (req, res) => {
    const { token } = req.body;
    if (token) {
        res.json({
            success: true,
            // result,
            message: 'Token successfully removed'
        });
        console.log('Token successfully removed');
    } else {
        res.json({
            success: false,
            message: 'Token not found'
        });
    }
});