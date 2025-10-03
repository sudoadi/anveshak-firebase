// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

// IMPORTANT: Replace this with your project's Firebase config object
// You can find this in your Firebase project settings under "Web apps"
const firebaseConfig = {
  apiKey: "AIzaSyDaBgWQvAyhzViUrlljlNa0HQ-C7dcG364",
  authDomain: "anveshak-omt.firebaseapp.com",
  projectId: "anveshak-omt",
  storageBucket: "anveshak-omt.firebasestorage.app",
  messagingSenderId: "196448375676",
  appId: "1:196448375676:web:6e50d4c2e43ca6e3060af9"
};

// Initialize the Firebase app in the service worker
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message: ', payload);

  // Customize the notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png' // Optional: path to an icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});