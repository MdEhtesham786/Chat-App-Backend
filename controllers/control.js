import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import userModel from "../models/userModel.js";
import chatModel from "../models/chatModel.js";
import { sendToken, sendCookie, } from '../utils/jwtToken.js';
import sendEmail from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import { onlineUsers } from "../server.js";
import { io } from '../server.js';
export const searchUsers = catchAsyncErrors(async (req, res, next) => {
    const { searchUsers } = req.body;
    const user = await userModel.find({ email: { $regex: searchUsers, $options: "i" } });
    res.json({
        success: true,
        searchUsers: user
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
    if (user.friendList.includes(friendID) || friend.friendList.includes(userID)) {
        return res.json({
            success: false,
            msg: 'User is already your Friend'
        });
    } else {
        if (!friend.pendingRequest.includes(userID)) {
            friend.pendingRequest.push(userID);
            await friend.save();
            const pendingRequestArr = await userModel.find({ _id: { $in: user.pendingRequest } });
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
    console.log(updatedPendingRequest);
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

        user.friendList.push(pendingID);
        friend.friendList.push(userID);
        await user.save();
        await friend.save();
        const pendingRequestArr = await userModel.find({ _id: { $in: user.pendingRequest } });
        const friendListArr = await userModel.find({ _id: { $in: user.friendList } });//obj of pendingrequest ID users
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
        return next(ErrorHandler('User or Profile not found'));
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

    const friendListArr = await userModel.find({ _id: { $in: user.friendList } });//obj of pendingrequest ID users 
    res.json({
        success: true,
        user, friend, friendListArr

    });

});