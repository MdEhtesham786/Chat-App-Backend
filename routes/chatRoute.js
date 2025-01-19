import express from "express";
import { getChat, getLatestMessage, sendMessage } from "../controllers/chatController.js";
const router = express.Router();
router.post('/getChat/:userID', getChat);
router.post('/getLatestMessage/:userID', getLatestMessage);
router.post('/send-message', sendMessage);
export default router;