
import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export async function obterMessaging() {
  if (typeof window === "undefined") return null;

  try {
    const suportado = await isSupported();

    if (!suportado) {
      console.error("FCM: navegador incompatível com Firebase Messaging.");
      return null;
    }

    return getMessaging(app);
  } catch (erro) {
    console.error("FCM: erro ao inicializar:", erro);
    throw erro;
  }
}

export default app;
