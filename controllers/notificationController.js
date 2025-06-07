
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import sendPushNotification from "../utils/sendPushNotification.js";
export const getExpoPushToken = catchAsyncErrors(async (req, res, next) => {
    const { userID } = req.body;
    if (!userID) {
        return res.json({ message: "User ID is required." });
    }
    const user = await userModel.findById(userID);
    const savedExpoPushToken = user.expoPushToken;
    return res.json({ success: true, message: "Saved Expo Push Token fetched successfully", savedExpoPushToken });
});
export const sendNotification = catchAsyncErrors(async (req, res, next) => {
    const { userId, title, body } = req.body;
    const user = await userModel.findById(userId); // Modify this based on your database structure

    if (!user || !user.expoPushToken || !title || !body) {
        return res.json({ success: false, message: 'User does not have a valid Expo push token' });
    }

    await sendPushNotification(user.expoPushToken, title, body);
    return res.json({ success: true, message: 'Notification sent' });

});

export const saveExpoPushToken = catchAsyncErrors(async (req, res, next) => {
    const { token, expoToken } = req.body;
    console.log(token, expoToken);
    const decodedData = await jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decodedData.id); // Modify this based on your database structure

    if (!user || !expoToken) {
        return res.json({ success: false, message: 'User does not have a valid Expo push token' });
    }

    user.expoPushToken = expoToken;
    await user.save();
    return res.json({ success: true, message: 'Expo Push token has been saved successfully' });

});