import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import userModel from "../models/userModel.js";
import { sendToken, sendCookie, } from '../utils/jwtToken.js';
import sendEmail from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";
export const login = catchAsyncErrors(async (req, res, next) => {
    const { email, password, remember } = req.body;
    if (email) {
        const user = await userModel.findOne({ email }).select('+password');
        // console.log(user);
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
    console.log(req.body);
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
    console.log('add');
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
            subject: 'Ecommerce Password Recovery',
            message
        });
        return res.json({
            success: true,
            hashedEmail,
            info,
            user
        });
    } else {
        const user = new userModel({ email, otp: verificationCode });
        const info = await sendEmail({
            email: email,
            subject: 'Ecommerce Password Recovery',
            message
        });
        return res.json({
            success: true,
            hashedEmail,
            info,
            user

        });
    }
    // await user.save({ validateBeforeSave: true });
    // const token = sendToken(user, process.env.JWT_EXPIRE);
    // console.log('Token', token);
    // sendCookie('verifyOtp', token, 120000, res);

});

export const verifyOtp = catchAsyncErrors(async (req, res, next) => {
    const { data, user } = req.body;
    let hasProfile = false;
    const otp = data.join('');
    // const token = req.cookies.verifyOtp;
    if (!otp) {
        console.log('Please provide OTP');
        // return res.json()
        return next(new ErrorHandler('Please provide OTP', 400));
    }
    let verificationCode = otp;
    // const user = await userModel.findOne({ email });
    // console.log(user);
    // if (!token) {
    // user.otp = undefined;
    // await user.save({ validateBeforeSave: true });
    // console.log('verification token expired');
    // return next(new ErrorHandler('verification token expired', 403));
    // }
    // const verify = jwt.verify(token, process.env.JWT_SECRET);
    // const user = await userModel.findById({ _id: verify.id });
    // if (!user) {
    // console.log('User not found');
    // return next(new ErrorHandler('User not found'));
    // }
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
        console.log('OTP Matched Successfully');
        return res.json({
            success: true,
            user: User,
            hasProfile
        });
    } else {
        user.otp = null;
        const newUser = new userModel({
            email: 'mdehteshamshaikh1@gmail.com',
            roles: user.roles,
            otp: null,
        });
        await newUser.save();
        console.log(user);

        console.log('OTP Matched Successfully');
        return res.json({
            success: true,
            user: newUser,
            hasProfile
        });
    }
    // await user.save({ validateBeforeSave: true });
    // const creatingToken = sendToken(user, process.env.JWT_EXPIRE);

    // sendCookie('createPassword', creatingToken, 1800000, res);


});
export const addProfile = catchAsyncErrors(async (req, res, next) => {
    const { user, data } = req.body;
    if (!data) {
        return next(new ErrorHandler('Please provide the required info', 400));
    }
    if (!user) {
        return next(new ErrorHandler('Something went wrong', 500));
    }
    const User = await userModel.findOneAndUpdate({ user: user.email }, { firstname: data.firstname, lastname: data.lastname }, { runValidators: true, new: true });
    if (!User) {
        return next(new ErrorHandler('User not found', 400));
    }
    // await User.save();
    res.json({
        success: true,
        user: User
    });
});

export const home = catchAsyncErrors(async (req, res, next) => {
    const { user } = req.body;
    const User = await userModel.findOne({ email: user.email });
    res.json({
        success: true,
        user: User
    });
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
    console.log('new password ', new_password);
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
export const logout = catchAsyncErrors(async (req, res, next) => {
    res.clearCookie('token');
    return res.redirect('/');
    // res.status(200).json({
    //     success: true,
    //     message: 'Logged Out'
    // });
});