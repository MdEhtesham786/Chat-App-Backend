import catchAsyncErrors from '../middleware/catchAsyncErrors.js';
import ErrorHandler from '../utils/errorHandler.js';
import jwt from "jsonwebtoken";
import userModel from '../models/userModel.js';
import { sendToken } from '../utils/jwtToken.js';
export const isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
    const { token } = req.body;
    // if (!token) {
    //     return next(new ErrorHandler('Please login to access this resource', 401));
    // }
    if (token) {
        try {
            const decodedData = jwt.verify(token, process.env.JWT_SECRET);
            const user = await userModel.findById({ _id: decodedData.id });
            req.user = user;
            req.token = token;
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                console.log('Jwt Expired (Token cleared)');
                res.clearCookie('token');
            }
        }
    }
    // sendToken(user, process.env.JWT_EXPIRE);
    next();

});
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        // console.log(req.user);
        if (!req.user) {
            return next(new ErrorHandler('Token expired, Please login again'));
        }
        const userRoles = req.user?.roles;
        let authorize = false;
        userRoles.forEach((role) => {
            if (roles.includes(role)) {
                authorize = true;
            }
        });
        if (!authorize) {
            if (userRoles.includes('seller')) {
                return next(new ErrorHandler(`Role: Users and Sellers are not allowed to access this resource`), 403);
            } else if (userRoles.includes('user')) {
                return next(new ErrorHandler(`Role: Users are not allowed to access this resource`), 403);
            } else {
                return;
            }
        }
        next();
    };
};
