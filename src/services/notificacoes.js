import {
  getToken
} from "firebase/messaging";
import {
  messaging
} from "../firebase";
import {
  supabase
} from "../supabase";

const VAPID_KEY = "BBnNkQN4noJl0sap1sqs6QTnAHDCc1FBGE3EJRUdcFLvJ-KrPEhAS3TRq3k8UtSMLmO-LSsIgSrkqcY8fq1C0UQ";

export async function registrarDispositivo(usuarioId) {
  try {
    const permissao = await Notification.requestPermission();

    if (permissao !== "granted") {
      console.log("Permissão negada.");
      return;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    });

    if (!token) {
      console.log("Não foi possível gerar o token.");
      return;
    }

    console.log("Token:", token);

    const {
      error
    } = await supabase
    .from("usuarios")
    .update({
      push_token: token,
    })
    .eq("id", usuarioId);

    if (error) throw error;

    console.log("Token salvo com sucesso.");

  } catch (erro) {
    console.error(erro);
  }
}