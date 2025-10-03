const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
}
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const messaging = admin.messaging();
const devicesCollection = db.collection('devices');
const historyCollection = db.collection('notification_history');

// Register a new device token (UPDATED)
app.post('/register-device', async (req, res) => {
    const { token, deviceName, platform, userEmail, username, lastOpened } = req.body;

    if (!token) {
        return res.status(400).send({ error: 'Token is required' });
    }
    try {
        await devicesCollection.doc(token).set({
            token,
            deviceName: deviceName || 'Unknown Device',
            platform: platform || 'Unknown',
            userEmail: userEmail || 'Not Logged In',
            username: username || 'Guest',
            lastOpened: new Date(lastOpened || Date.now()),
            registeredAt: new Date()
        }, { merge: true });

        console.log(`Registered/Updated device: ${deviceName} (${platform}) for user ${username}`);
        res.status(200).send({ message: 'Device registered successfully' });
    } catch (error) {
        console.error('Error registering device:', error);
        res.status(500).send({ error: 'Failed to register device' });
    }
});

// Get all registered devices
app.get('/devices', async (req, res) => {
    try {
        const snapshot = await devicesCollection.orderBy('lastOpened', 'desc').get();
        const devices = snapshot.docs.map(doc => doc.data());
        res.status(200).json(devices);
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch devices' });
    }
});

// Send a notification
app.post('/send-notification', async (req, res) => {
    const { title, body, tokens } = req.body;

    if (!title || !body || !tokens || tokens.length === 0) {
        return res.status(400).send({ error: 'Title, body, and at least one token are required' });
    }

    const message = {
        notification: { title, body },
        tokens: tokens,
    };

    try {
        const response = await messaging.sendMulticast(message);
        console.log(`Notification sent. Success: ${response.successCount}, Failure: ${response.failureCount}`);

        await historyCollection.add({
            title,
            body,
            sentAt: new Date(),
            deviceCount: tokens.length,
            successCount: response.successCount,
            failureCount: response.failureCount
        });
        
        res.status(200).send({ message: `Notification sent. Success: ${response.successCount}, Failure: ${response.failureCount}`});
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).send({ error: 'Failed to send notification' });
    }
});

// Get notification history
app.get('/history', async (req, res) => {
    try {
        const snapshot = await historyCollection.orderBy('sentAt', 'desc').limit(50).get();
        const history = snapshot.docs.map(doc => doc.data());
        res.status(200).json(history);
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch history' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
