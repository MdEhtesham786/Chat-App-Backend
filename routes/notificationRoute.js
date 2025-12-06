import express from "express";
import { getExpoPushToken, sendNotification, saveExpoPushToken } from "../controllers/notificationController.js";
const router = express.Router();
router.post('/getExpoPushToken', getExpoPushToken);
router.post('/sendNotification', sendNotification);
router.post('/saveExpoPushToken', saveExpoPushToken);

export default router;
