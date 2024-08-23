import mongoose from 'mongoose';
import bcrypt from "bcrypt";
import validator from 'validator';
import jwt from "jsonwebtoken";

import dotenv from "dotenv";
dotenv.config();
const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        // required: [true, 'Please Enter Your Username'],
        maxLength: [30, 'Name cannot exceed 3o characters'],
        minLength: [2, 'Name should have more than 4 characters'],
        default: undefined
    },
    lastname: {
        type: String,
        // required: [true, 'Please Enter Your Username'],
        maxLength: [30, 'Name cannot exceed 3o characters'],
        minLength: [2, 'Name should have more than 4 characters'],
        default: undefined
    },

    email: {
        type: String,
        validate: [validator.isEmail, 'Please Enter Valid Email'],
        unique: true,
        required: true
    },
    // password: {
    //     type: String,
    //     // required: [true, 'Please Enter Your Password'],
    //     minLength: [6, 'Password should be greater than 5 characters'],
    //     select: false
    // },
    avatar: {
        public_Id: {
            type: String,
        },
        url: {
            type: String,
        }
    },
    roles: {
        type: Array,
        default: ['user']
    },
    otp: {
        type: String,
        default: null
    },
    notifications: {
        type: Object,
        default: {}
    },

});
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    this.password = await bcrypt.hash(this.password, 10);
});

//JWT TOKEN
userSchema.methods.generateToken = function (expireTime) {
    return jwt.sign({ id: this.id }, process.env.JWT_SECRET, {
        expiresIn: expireTime
    });
};
//Compare password 
userSchema.methods.comparePassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};
//Generating Password Reset Token
userSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    return resetToken;
};
export default mongoose.model('user', userSchema);