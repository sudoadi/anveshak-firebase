import express from "express";
import bodyParser from "body-parser";
import admin from "firebase-admin";

const app = express();
app.use(bodyParser.json());

// Initialize Firebase Admin with env variable
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

let deviceTokens = [];

// Register token endpoint
app.post("/register", (req, res) => {
  const { token } = req.body;
  if (token && !deviceTokens.includes(token)) {
    deviceTokens.push(token);
  }
  res.json({ success: true, tokens: deviceTokens.length });
});

// Send notification endpoint
app.post("/send", async (req, res) => {
  const { title, body } = req.body;

  const message = {
    notification: { title, body },
    tokens: deviceTokens,
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    res.json(response);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/", (req, res) => {
  res.send("🔥 Anveshak Firebase Backend is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
