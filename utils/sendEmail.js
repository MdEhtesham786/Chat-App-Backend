import nodeMailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
const sendEmail = async (otp) => {
    try {
        const transporter = nodeMailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASSWORD
            },
            connectionTimeout: 30000,
            greetingTimeout: 30000,
            socketTimeout: 30000
        });

        const mailotpions = {
            from: process.env.SMTP_MAIL,
            to: otp.email,
            subject: otp.subject,
            text: otp.message
        };
        const info = await transporter.sendMail(mailotpions);
        return { success: true, info };
    } catch (err) {
        // console.log(err);
        return { success: false, err };

    }

};

export default sendEmail;