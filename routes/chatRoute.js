import express from "express";
import { getChat, sendMessage } from "../controllers/chatController.js";
const router = express.Router();
router.post('/getChat/:userID', getChat);
router.post('/send-message', sendMessage);
export default router;