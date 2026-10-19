import { initializeApp } from "firebase/app";
import {
  getMessaging,
  isSupported
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export async function obterMessaging() {
  if (typeof window === "undefined") {
    console.error("FCM: ambiente sem window.");
    return null;
  }

  const diagnostico = {
    httpsSeguro: window.isSecureContext,
    serviceWorker: "serviceWorker" in navigator,
    notification: "Notification" in window,
    pushManager: "PushManager" in window,
    indexedDB: "indexedDB" in window,
    fetch: "fetch" in window,
    firebaseApiKey: Boolean(firebaseConfig.apiKey),
    firebaseProjectId: Boolean(firebaseConfig.projectId),
    firebaseAppId: Boolean(firebaseConfig.appId),
  };

  console.table(diagnostico);

  try {
    const suportado = await isSupported();

    console.log("FCM: isSupported() =", suportado);

    if (!suportado) {
      console.error(
        "FCM: o Firebase identificou algum recurso incompatível."
      );
      return null;
    }

    return getMessaging(app);
  } catch (erro) {
    console.error("FCM: falha ao inicializar Messaging:", erro);
    return null;
  }
}

export default app;
