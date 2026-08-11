importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyA4JXg36W7sU4no3vDBWlFuadujlAz8Whs",
  authDomain: "projeto-rdo-135ce.firebaseapp.com",
  projectId: "projeto-rdo-135ce",
  storageBucket: "projeto-rdo-135ce.firebasestorage.app",
  messagingSenderId: "590939713887",
  appId: "1:590939713887:web:89a8a28723046c428846ea",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/icon-192.png",
  });
});