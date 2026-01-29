import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import userModel from "../models/userModel.js";
import chatModel from "../models/chatModel.js";
import { sendToken, sendCookie, } from '../utils/jwtToken.js';
import sendEmail from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import { onlineUsers } from "../server.js";
import { io } from '../server.js';
import sendPushNotification from "../utils/sendPushNotification.js";
const latestVersion = {
    version: "1.1.9", // Update this when you release a new APK
    apkUrl: "https://expo.dev/accounts/ehtesham-shaikh/projects/chateo/builds/5ec5089e-f3a8-4cc7-8e8b-3dcc3c8ce51b"
};
export const getVersion = catchAsyncErrors(async (req, res, next) => {
    console.log('Version Check Requested',latestVersion);
    return res.json(latestVersion);
});
export const searchUsers = catchAsyncErrors(async (req, res, next) => {
    const { searchUsers } = req.body;
     const keyword = (searchUsers || "").toLowerCase().replace(/\s+/g, "");
    const user = await userModel.find({ email: { $regex: keyword, $options: "i" } });
    res.json({
        success: true,
        searchUsers: user
    });
});
export const checkBackend = catchAsyncErrors(async (req, res, next) => {
    res.json({
        success: true,
        msg: 'Backend is running'
    });
});
export const sendRequest = catchAsyncErrors(async (req, res, next) => {
    const { userID, friendID } = req.body;
    if (!userID || !friendID) {
        return next(new ErrorHandler('User and Profile not found', 404));
    }
    const user = await userModel.findById(userID);
    const friend = await userModel.findById(friendID);
    if (!friend) {
        return next(new ErrorHandler('Profile not found', 404));
    }
    if (userID === friendID) {
        return res.json({
            success: false,
            msg: 'Cannot Add yourself'
        });
    }
    if (user.friendList.includes(friendID) || friend.friendList.includes(userID)) {
        return res.json({
            success: false,
            msg: 'User is already your Friend'
        });
    } else {
        if (!friend.pendingRequest.includes(userID)) {
            friend.pendingRequest.unshift(userID);
            await friend.save();
            const pendingRequestArr = await userModel.find({ _id: { $in: user.pendingRequest } });
            const message = {
                to: friend.expoPushToken, // Friend's Expo Push Token
                sound: "default",
                title: "Chateo",
                body: `${user.lastname ? user.firstname + ' ' + user.lastname : user.firstname} sent you a friend request!`,
                priority: "high",
                data: {
                    type: "friendRequest",
                    navigate: "AddFriend",
                    friendID: userID
                },
                // Add this for Android large icon (e.g., profile pic)
                android: {
                    image: user.avatar?.url // full HTTPS URL of the sender's profile picture
                }
            };
            await sendPushNotification(message).catch(err => console.log('badaerror', err));

            res.json({ success: true, friend, user, pendingRequest: pendingRequestArr });
        } else {
            res.json({ success: false, msg: "Request already sent" });
        }
    }

});
export const declineRequest = catchAsyncErrors(async (req, res, next) => {
    const { userID, pendingID } = req.body;
    if (!userID || !pendingID) {
        return next(new ErrorHandler('User and Profile not found', 404));
    }

    const user = await userModel.findById(userID);
    const updatedPendingRequest = user.pendingRequest.filter((id) => {
        return pendingID !== id;
    });
    user.pendingRequest = updatedPendingRequest;
    await user.save();
    res.json({
        success: true,
        pendingRequest: user.pendingRequest
    });
});
export const acceptRequest = catchAsyncErrors(async (req, res, next) => {
    const { userID, pendingID } = req.body;
    if (!userID || !pendingID) {
        return next(new ErrorHandler('User and Profile not found', 404));
    }
    const user = await userModel.findById(userID);
    const friend = await userModel.findById(pendingID);
    const isFriend = user.friendList.includes(pendingID);
    const updatedPendingRequest = user.pendingRequest.filter((id) => {
        return pendingID !== id;
    });
    user.pendingRequest = updatedPendingRequest;
    if (isFriend) {
        await user.save();
        const pendingRequestArr = await userModel.find({ _id: { $in: user.pendingRequest } });
        const friendListArr = await userModel.find({ _id: { $in: user.friendList } });//obj of pendingrequest ID users
        return res.json({
            success: false,
            msg: 'Already a friend',
            user,
            friendList: friendListArr,
            pendingRequest: pendingRequestArr
        });
    } else {
        user.friendList.unshift(pendingID);
        friend.friendList.unshift(userID);
        await user.save();
        await friend.save();
        const newChat = new chatModel({
            chatOwnersID: [userID, pendingID],
            messageData: [],
            latestMessage: undefined,
            unreadMessage: {
                [userID]: 0,
                [pendingID]: 0
            }
        });
        await newChat.save().catch((err) => console.log(err));
        const pendingRequestArr = await userModel.find({ _id: { $in: user.pendingRequest } });
        const friendListArr = await userModel.find({ _id: { $in: user.friendList } });//obj of pendingrequest ID users
        const message = {
            to: friend.expoPushToken, // Friend's Expo Push Token
            sound: "default",
            title: "Chateo",
            priority: "high",
            body: `${user.lastname ? user.firstname + ' ' + user.lastname : user.firstname} accepted your friend request!`,
            data: {
                type: "friendRequest",
                navigate: "Message",
                friendID: userID,// ID of the user who sent the request
            },
            android: {
                image: user.avatar?.url // full HTTPS URL of the sender's profile picture
            }
        };
        await sendPushNotification(message).catch(err => console.log('badaerror', err));
        return res.json({
            success: true,
            user,
            friendList: friendListArr,
            pendingRequest: pendingRequestArr
        });
    }

});
export const pendingRequest = catchAsyncErrors(async (req, res, next) => {
    const { userID } = req.body;
    const user = await userModel.findById(userID);
    const pendingRequestArr = await userModel.find({ _id: { $in: user.pendingRequest } });
    res.json({
        success: true,
        pendingRequest: pendingRequestArr

    });

});
export const friendList = catchAsyncErrors(async (req, res, next) => {
    const { userID } = req.body;
    const user = await userModel.findById(userID);
    const friendListArr = await userModel.find({ _id: { $in: user.friendList } });//obj of pendingrequest ID users

    res.json({
        success: true,
        friendList: friendListArr

    });

});
export const removeFriend = catchAsyncErrors(async (req, res, next) => {
    const { userID, friendID } = req.body;
    const user = await userModel.findById(userID);
    const friend = await userModel.findById(friendID);

    if (!user || !friend) {
        return res.json({
            success: false,
            msg: 'User and Friend not found'
        });
    }
    const userUpdatedFriendList = user.friendList.filter((id) => {
        return friendID !== id;
    });
    user.friendList = userUpdatedFriendList;
    const updatedPendingRequest = user.pendingRequest.filter((id) => {
        return friendID !== id;
    });
    user.pendingRequest = updatedPendingRequest;
    await user.save();
    const friendUpdatedFriendList = friend.friendList.filter((id) => {
        return userID !== id;
    });
    friend.friendList = friendUpdatedFriendList;
    await friend.save();
    await chatModel.findOneAndDelete({
        chatOwnersID: { $all: [userID, friendID] }, // Ensure both IDs exist
        $expr: { $eq: [{ $size: "$chatOwnersID" }, 2] }, // Ensure array size is exactly 2
    });
    const friendListArr = await userModel.find({ _id: { $in: user.friendList } });//obj of pendingrequest ID users 
    res.json({
        success: true,
        user, friend, friendListArr

    });

});