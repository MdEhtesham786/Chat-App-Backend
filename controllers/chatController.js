import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import userModel from "../models/userModel.js";
import chatModel from "../models/chatModel.js";
import { sendToken, sendCookie, } from '../utils/jwtToken.js';
import sendEmail from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";

export const getChat = catchAsyncErrors(async (req, res, next) => {
    const { userID } = req.params;
    const { friendID } = req.body;
    const chat = await chatModel.findOne({ $all: [userID, friendID] });
    // console.log(chat);
    if (!chat) {
        return next(new ErrorHandler('No Chat found', 400));
    }
    const friend = await userModel.findById(friendID);
    return res.json({
        success: true,
        chat,
        friendName: friend.lastname ? friend.firstname + ' ' + friend.lastname : friend.firstname
    });
});