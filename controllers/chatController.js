import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import userModel from "../models/userModel.js";
import chatModel from "../models/chatModel.js";
import { sendToken, sendCookie, } from '../utils/jwtToken.js';
import sendEmail from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import sendPushNotification from "../utils/sendPushNotification.js";
export const getChat = catchAsyncErrors(async (req, res, next) => {
    const { userID } = req.params;
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
    const { friendID } = req.body;
    const chat = await chatModel.findOne({
        chatOwnersID: { $all: [userID, friendID] }, // Ensure both IDs exist
        $expr: { $eq: [{ $size: "$chatOwnersID" }, 2] }, // Ensure array size is exactly 2
    });
    return res.json({
        success: true,
        latestMessage: chat.latestMessage || null,
        unreadMessage: chat.unreadMessage,
    });
});
export const readMessage = catchAsyncErrors(async (req, res, next) => {
    const { userID } = req.params;
    const { friendID } = req.body;
    const chat = await chatModel.findOne({
        chatOwnersID: { $all: [userID, friendID] }, // Ensure both IDs exist
        $expr: { $eq: [{ $size: "$chatOwnersID" }, 2] }, // Ensure array size is exactly 2
    });
    chat.unreadMessage[userID] = 0;
    chat.markModified('unreadMessage');
    await chat.save();
    return res.json({
        success: true,
        // latestMessage: chat.latestMessage,
        unreadMessage: chat.unreadMessage,
    });
});
export const sendMessage = catchAsyncErrors(async (req, res, next) => {
    const { chatID, senderID, message } = req.body;
    const user = await userModel.findById(senderID);
    if (!user) {
        return res.json({
            success: false,
            msg: 'Sender not found'
        });
    }

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
    const receiverID = chat.chatOwnersID.find((id) => id !== senderID);
    const friend = await userModel.findById(receiverID);
    if (!friend) {
        return res.json({
            success: false,
            msg: 'Receiver not found'
        });
    }
    chat.messageData.push({
        author: senderID, message, createdAt: new Date().toISOString(), readAt: null
    });

    chat.latestMessage = {
        author: senderID, message, createdAt: new Date().toISOString(), readAt: null
    };

    chat.unreadMessage[receiverID] += 1;
    chat.markModified('unreadMessage');
    // chat.unreadMessage[receiverID] = (chat.unreadMessage[receiverID] || 0) + 1;
    await chat.save();
    const notificationMessage = {
        to: friend.expoPushToken, // Replace with actual user ID,
        "sound": "default",
        "title": `Chateo Notification from ${user.lastname ? user.firstname + ' ' + user.lastname : user.firstname}`,
        "body": `${message}`,
        "data": {
            type: "sendMessage",
            navigate: "AddFriend",
            userID: senderID,
            friendID: receiverID
        }
    };
    res.json({
        success: true,
        friendID: senderID,
        notificationMessage

    });
});