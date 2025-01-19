import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import userModel from "../models/userModel.js";
import chatModel from "../models/chatModel.js";
import { sendToken, sendCookie, } from '../utils/jwtToken.js';
import sendEmail from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";

export const getChat = catchAsyncErrors(async (req, res, next) => {
    const { userID } = req.params;
    console.log(userID);
    // console.log(userID);
    const { friendID } = req.body;
    console.log(friendID, 'friend id');
    const chat = await chatModel.findOne({
        chatOwnersID: { $all: [userID, friendID] }, // Ensure both IDs exist
        $expr: { $eq: [{ $size: "$chatOwnersID" }, 2] }, // Ensure array size is exactly 2
    });
    // {
    //     "messageData": { $slice: -30 }, // Fetch only the latest 30 messages
    // });
    if (!chat) {
        return res.json({ success: false, chat: {} });
    }
    const friend = await userModel.findById(friendID);
    const chatObj = {
        ...chat.toObject(),
        friendName: friend.lastname ? friend.firstname + ' ' + friend.lastname : friend.firstname,
    };
    // chatObj.messageData = chatObj.messageData.length > 10 ? chatObj.messageData.reverse() : chatObj.messageData;
    chatObj.messageData = chatObj.messageData.reverse();
    return res.json({
        success: true,
        chatObj,
    });
});
export const getLatestMessage = catchAsyncErrors(async (req, res, next) => {
    const { userID } = req.params;
    // console.log(userID);
    const { friendID } = req.body;
    const chat = await chatModel.findOne({
        chatOwnersID: { $all: [userID, friendID] }, // Ensure both IDs exist
        $expr: { $eq: [{ $size: "$chatOwnersID" }, 2] }, // Ensure array size is exactly 2
    });
    // {
    //     "messageData": { $slice: -30 }, // Fetch only the latest 30 messages
    // });
    res.json({
        success: true,
        latestMessage: chat.latestMessage
    });
});
export const sendMessage = catchAsyncErrors(async (req, res, next) => {
    const { chatID, senderID, message } = req.body;
    if (!chatID || !senderID || !message) {
        return res.json({
            success: false,
            msg: 'Please provide all details'
        });
    }
    const chat = await chatModel.findById(chatID);
    if (!chat) {
        return res.json({
            success: false,
            msg: 'Chat not found'
        });
    }
    if (!chat.chatOwnersID.includes(senderID)) {
        return res.json({
            success: false,
            msg: 'You are not the chat owner'
        });
    }
    chat.messageData.push({
        author: senderID, message, createdAt: new Date().toISOString(), readAt: null
    });

    chat.latestMessage = {
        author: senderID, message, createdAt: new Date().toISOString(), readAt: null
    };
    await chat.save();
    res.json({
        success: true,
        friendID: senderID

    });
});