import express from "express";
import bodyParser from "body-parser";
import admin from "firebase-admin";

const app = express();
app.use(bodyParser.json());

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

// Device tokens & history (in-memory; replace with DB in production)
let deviceTokens = [];  // [{id, token, platform}]
let messageHistory = []; // [{title, body, sentTo, timestamp}]

// Register device
app.post("/register", (req, res) => {
  const { token, platform = "web" } = req.body;
  if (token && !deviceTokens.find(d => d.token === token)) {
    const device = { id: Date.now().toString(), token, platform };
    deviceTokens.push(device);
    console.log("✅ Registered:", device);
  }
  res.json({ success: true, devices: deviceTokens.length });
});

// Get all devices
app.get("/devices", (req, res) => {
  res.json(deviceTokens);
});

// Send notification
app.post("/send", async (req, res) => {
  const { title, body, targets } = req.body; // targets = array of device ids
  const selectedTokens = targets && targets.length > 0
    ? deviceTokens.filter(d => targets.includes(d.id)).map(d => d.token)
    : deviceTokens.map(d => d.token);

  if (selectedTokens.length === 0) {
    return res.status(400).send("No tokens to send");
  }

  const message = { notification: { title, body }, tokens: selectedTokens };

  try {
    const response = await admin.messaging().sendMulticast(message);

    // Save history
    messageHistory.unshift({
      title,
      body,
      sentTo: selectedTokens.length,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, response });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Get message history
app.get("/history", (req, res) => {
  res.json(messageHistory);
});

app.listen(3000, () => console.log("🚀 Backend running"));
