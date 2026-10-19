
import { useState } from "react";
import {
  ativarNotificacoes,
  ouvirNotificacoesEmPrimeiroPlano
} from "../notifications/push";

export default function PushNotificationsButton({ usuario }) {
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [ativo, setAtivo] = useState(false);

  async function ativar() {
    try {
      setCarregando(true);
      setMensagem("");

      const { messaging } = await ativarNotificacoes(usuario);

      ouvirNotificacoesEmPrimeiroPlano(messaging, (payload) => {
        const titulo =
          payload.data?.title || "Projeto-RDO";

        const corpo =
          payload.data?.body || "Você tem uma nova atualização.";

        if (Notification.permission === "granted") {
          new Notification(titulo, {
            body: corpo,
            icon: "/icon-192.png"
          });
        }
      });

      setAtivo(true);
      setMensagem("Notificações ativadas neste celular.");
    } catch (erro) {
      console.error("Erro ao ativar notificações:", erro);
      setMensagem(erro.message || "Não foi possível ativar as notificações.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{ padding: "12px 0" }}>
      <button
        type="button"
        onClick={ativar}
        disabled={carregando || ativo}
      >
        {carregando
          ? "Ativando..."
          : ativo
            ? "Notificações ativadas"
            : "Ativar notificações neste celular"}
      </button>

      {mensagem && (
        <p role="status" style={{ fontSize: "14px" }}>
          {mensagem}
        </p>
      )}
    </div>
  );
}
