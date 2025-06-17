import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../utils/cloudinary.js';

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'profile_pictures',
        allowed_formats: ['jpg', 'png'],
    },
});


const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // Due to cloudinary's free plan limit the max is 10mb
    },
});
//Image compressor

export default upload;
