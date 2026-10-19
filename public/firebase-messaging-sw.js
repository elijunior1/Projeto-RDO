importScripts(
  "https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js",
);

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
  const titulo = payload.data?.title || "Projeto-RDO";

  const opcoes = {
    body: payload.data?.body || "Você tem uma atualização no Projeto-RDO.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: {
      url: payload.data?.url || "/",
    },
  };

  return self.registration.showNotification(titulo, opcoes);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((janelas) => {
        for (const janela of janelas) {
          if ("focus" in janela) {
            janela.navigate(url);
            return janela.focus();
          }
        }

        return clients.openWindow(url);
      }),
  );
});
