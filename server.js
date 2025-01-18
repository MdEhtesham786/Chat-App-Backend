// import { createRequire } from 'module';
// const require = createRequire(import.meta.url);
import dotenv from "dotenv";
dotenv.config();
//Handling Uncaught Execption
process.on('uncaughtException', err => {
    console.log(`Error: ${err.message}`);
    console.log('Shutting down the server due to Uncaught Exception');
    process.exit(1);
});
import express from "express";
import cors from "cors";
import { createServer } from "http";
const app = express();
const server = createServer(app);
import { Server } from "socket.io";
export const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
    }
});
import userModel from "./models/userModel.js";
const hostname = '127.0.0.1';
const port = process.env.PORT || 5001;
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
// const multer = require('multer');
// const upload = multer();

// Store the latest APK version and download URL

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // '*' allows any origin, replace with your specific domain for security.
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

//IMPORTS
import errorMiddleware from "./middleware/error.js";
import catchAsyncErrors from "./middleware/catchAsyncErrors.js";
import connectDB from "./db/connect.js";
// app.set('views', 'views');
// app.set('view engine', 'ejs');
// app.set('layout', './layouts/layout.ejs');
// app.use('/static', express.static('static'));
// app.use('/api/v1/static', express.static('static'));
// app.use('/api/v1/seller/static', express.static('static'));
// app.use('/api/static', express.static('static'));
// app.use('/');
app.use(express.urlencoded({ extended: true }));

app.use(express.json());
app.use(cookieParser());
// app.use(expressEjsLayouts);
mongoose.set('strictQuery', true);
mongoose.set('strictPopulate', false);
//Routes
import userRoute from "./routes/userRoute.js";
import chatRoute from "./routes/chatRoute.js";
import route from "./routes/route.js";
// const productRoute = require('./routes/productRoute.js');
// const orderRoute = require('./routes/orderRoutes.js');
import { isAuthenticatedUser } from './middleware/auth.js';
import jwt from "jsonwebtoken";
import ErrorHandler from "./utils/errorHandler.js";
// const productModel = require('./models/productModel.js');

// app.use('/api/v1', productRoute);
app.use('/api/v1/auth', userRoute);
app.use('/api/v1/chat', chatRoute);
app.use('/api/v1/', route);
// app.use('/api/v1', orderRoute);
app.use(errorMiddleware);
app.post('/api/v1/makeSeller/', catchAsyncErrors(async (req, res, next) => {
    // const verify = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    // const user = await userModel.findById('64308970b059d9f207856e83');

    // user.roles.push('seller');
    // await user.save();
    // await admin.save();
    res.json({
        success: true,
        user
    });
}));
app.get('/', isAuthenticatedUser, catchAsyncErrors(async (req, res) => {

    if (req.token) {
        // const verify = jwt.verify(credentials, process.env.JWT_SECRET);
        // return res.render('home', { userId: '', token: req.token, freshDeals, electronicProducts, fashionProducts });
        return res.json({
            success: true
        });
    } else {
        // return res.render('home', { userId: '', token: '', freshDeals, electronicProducts, fashionProducts });
        return res.json({
            success: true
        });
    }
}));
app.get('/users', catchAsyncErrors(async (req, res, next) => {
    // const allUsers = await userModel.findOne('63f37f25dd9dfbeca2e1395b');
    res.json({ nhbits: 1, allUsers });
}));
app.post('/api/v1/', async (req, res) => {
    // const verify = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    // const allProduct = await productModel.find({ productOwnerId: verify.id });
    // allProduct[0].images[0].url;
    // allProduct.forEach((product) => {
    //     let newDate = '';
    //     console.log(product.numOfReviews);
    // console.log(String(product.createdAt).split('GMT')[0].split(' '));

    // });
    const users = await userModel.find();
    res.status(200).json({
        nhBits: users.length,
        users
    });

});
app.get('/deleteUser/:id', catchAsyncErrors(async (req, res, next) => {
    if (req.params.id) {
        const User = await userModel.findByIdAndDelete({ _id: req.params.id });
        console.log('Deleted');
        res.json({ message: 'This user is deleted', User });
    } else {
        res.send('send userId of the user you want to delete in params');
    }
}));
app.get('/custopmer-support', catchAsyncErrors(async (req, res, next) => {
    res.json({
        success: true,
        msg: 'Customer Support',
        tollFree: 8104589563
    });
}));

export const onlineUsers = {}; // To store online users
const start = async () => {
    try {

        io.on("connection", (socket) => {
            console.log(`A new user connected with socket ID: ${socket.id}`);
            socket.on("login", (userId) => {
                console.log(userId);
                if (userId) { // Validate the userId (e.g., check if logged in)
                    onlineUsers[userId] = socket.id; // Add userId to onlineUsers

                    console.log(`User ${userId} is now online with socket ID ${socket.id}`);
                    console.log(onlineUsers);
                } else {
                    console.log("Invalid login attempt");
                    socket.disconnect(); // Optionally disconnect invalid users
                }
            });
            socket.on('friendRequest', (friendID, callback) => {
                console.log(friendID);
                if (onlineUsers[friendID]) {
                    console.log('Friend is online');
                    socket.to(onlineUsers[friendID]).emit('updatePendingRequest', true);
                    callback({ success: true, msg: 'Live request sent!' });
                } else {
                    console.log('Friend is offline');
                    callback({ success: false, msg: 'Traditional Request Sent!' });
                }
            });
            socket.on('sendMessage', (friendID, callback) => {
                console.log(friendID);
                if (onlineUsers[friendID]) {
                    console.log('Friend is online');
                    // socket.to(onlineUsers[friendID]).emit('updatePendingRequest', true);
                    socket.to(onlineUsers[friendID]).emit('updateReceiveMessage', true);
                    callback({ success: true, msg: 'Live message sent!' });
                } else {
                    console.log('Friend is offline');
                    callback({ success: false, msg: 'Traditional Message Sent!' });
                }
            });
            socket.on("disconnect", () => {
                for (const [userId, socketId] of Object.entries(onlineUsers)) {
                    if (socketId === socket.id) {
                        delete onlineUsers[userId]; // Remove user from onlineUsers
                        console.log(`User ${userId} with socket ID ${socket.id} has disconnected`);
                        console.log('Online Users after disconnecting ', onlineUsers);

                        break;
                    }
                }
            }, 10000);
        });
        connectDB(process.env.MONGO_URI);
        const app = server.listen(port, () => {
            console.log(`This server is running on port http://${hostname}:${port}`);
        });
        process.on("unhandledRejection", err => {
            console.log(`Error: ${err.message}`);
            console.log('Shutting down the server due to Unhandled Promise Rejection');
            app.close(() => {
                process.exit(1);
            });
        });
    } catch (err) {
        console.log(err);
    }
};
start();
