import express from "express";
import { searchUsers, sendRequest, pendingRequest, friendList, declineRequest, acceptRequest, removeFriend, getVersion, checkBackend } from "../controllers/control.js";
const router = express.Router();
// router.post('/:userID', getChat);
router.post('/searchUsers', searchUsers);
router.post('/sendRequest', sendRequest);
router.post('/pendingRequest', pendingRequest);
router.post('/friendList', friendList);
router.post('/declineRequest', declineRequest);
router.post('/acceptRequest', acceptRequest);
router.post('/removeFriend', removeFriend);
router.post('/checkBackend', checkBackend);

router.get('/version', getVersion);
export default router;