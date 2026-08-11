import {
  initializeApp
} from "firebase/app";
import {
  getMessaging
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyA4JXg36W7sU4no3vDBWlFuadujlAz8Whs",
  authDomain: "projeto-rdo-135ce.firebaseapp.com",
  projectId: "projeto-rdo-135ce",
  storageBucket: "projeto-rdo-135ce.firebasestorage.app",
  messagingSenderId: "590939713887",
  appId: "1:590939713887:web:89a8a28723046c428846ea",
};

const app = initializeApp(firebaseConfig);

export const messaging = getMessaging(app);