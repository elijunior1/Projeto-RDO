import { getToken, onMessage } from "firebase/messaging";
import { obterMessaging } from "../firebase";
import { supabase } from "../supabase";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export async function ativarNotificacoes(usuario) {
  if (!usuario?.id) {
    throw new Error("Usuário não identificado.");
  }

  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    throw new Error("Este navegador não suporta notificações push.");
  }

  if (!VAPID_KEY) {
    throw new Error("Chave VAPID não configurada no .env.local.");
  }

  const permissao = await Notification.requestPermission();

  if (permissao !== "granted") {
    throw new Error("Permissão para notificações não concedida.");
  }

  const messaging = await obterMessaging();

  if (!messaging) {
    throw new Error("Firebase Messaging não é suportado neste navegador.");
  }

  // Service worker separado, para não substituir o service worker do PWA.
  const registro = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
    { scope: "/firebase-cloud-messaging-push-scope" },
  );

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registro,
  });

  if (!token) {
    throw new Error("Não foi possível obter o token do dispositivo.");
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: usuario.id,
      fcm_token: token,
      plataforma: "android",
      ativo: true,
      atualizado_em: new Date().toISOString(),
      ultimo_acesso_em: new Date().toISOString(),
    },
    { onConflict: "fcm_token" },
  );

  if (error) {
    throw error;
  }

  return { token, messaging };
}

export function ouvirNotificacoesEmPrimeiroPlano(messaging, aoReceber) {
  return onMessage(messaging, (payload) => {
    aoReceber?.(payload);
  });
}
