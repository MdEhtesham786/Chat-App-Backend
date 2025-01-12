import mongoose from 'mongoose';
import bcrypt from "bcrypt";
import validator from 'validator';
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const chatSchema = new mongoose.Schema({
    chatOwnersID: {
        type: Array,
    },
    messageData: [
        {
            author: {
                type: String,
                required: true,
            },
            message: {
                type: String,
                required: true,
            },
            createdAt: {
                type: String,
                required: true,
            },
            readAt: {
                type: String,
                default: null,
            },
        }
    ]
},
    { timestamps: true });
// userSchema.pre('save', async function (next) {
//     if (!this.isModified('password')) {
//         next();
//     }
//     this.password = await bcrypt.hash(this.password, 10);
// });

//JWT TOKEN
// userSchema.methods.generateToken = function (expireTime) {
//     return jwt.sign({ id: this.id }, process.env.JWT_SECRET, {
//         expiresIn: expireTime
//     });
// };
//Compare password 
// userSchema.methods.comparePassword = async function (enteredPassword) {
//     return bcrypt.compare(enteredPassword, this.password);
// };
//Generating Password Reset Token
// userSchema.methods.getResetPasswordToken = function () {
//     const resetToken = crypto.randomBytes(20).toString('hex');
//     this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
//     this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
//     return resetToken;
// };
export default mongoose.model('chat', chatSchema);