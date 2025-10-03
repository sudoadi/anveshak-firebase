import express from "express";
import bodyParser from "body-parser";
import admin from "firebase-admin";

const app = express();
app.use(bodyParser.json());

// Firebase Admin initialization
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// In-memory token store (replace with DB for production)
let deviceTokens = [];

// ✅ Register token endpoint
app.post("/register", (req, res) => {
  const { token } = req.body;

  if (token && !deviceTokens.includes(token)) {
    deviceTokens.push(token);
    console.log("✅ New device registered. Token:", token);
    console.log("📋 Total tokens stored:", deviceTokens.length);
  }

  res.json({ success: true, totalTokens: deviceTokens.length });
});

// ✅ Send notification to all registered tokens
app.post("/send", async (req, res) => {
  const { title, body } = req.body;

  if (deviceTokens.length === 0) {
    return res.status(400).send("⚠️ No tokens registered");
  }

  const message = {
    notification: { title, body },
    tokens: deviceTokens,
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log("📩 Notification sent:", response);
    res.json(response);
  } catch (err) {
    console.error("❌ Error sending notification:", err);
    res.status(500).send(err.message);
  }
});

// ✅ Utility endpoint: list all tokens (for debugging only!)
app.get("/tokens", (req, res) => {
  res.json({ total: deviceTokens.length, tokens: deviceTokens });
});

app.get("/", (req, res) => {
  res.send("🔥 Anveshak Firebase Backend is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
