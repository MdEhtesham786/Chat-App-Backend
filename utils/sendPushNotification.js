// import axios from "axios";

const sendPushNotification = async (message) => {
    try {
        if (!message) {
            console.log('message not found');
            return response.json({ success: false, msg: 'Message not found' });
        }
        // const response = await axios.post('https://exp.host/--/api/v2/push/send', message,);
        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

    } catch (error) {
        console.error('Error sending push notification:', error);
    }
};
export default sendPushNotification;