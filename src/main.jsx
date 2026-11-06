import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";

import "./styles/global.css";
import "./styles/layout.css";

import {
  registerSW
} from "virtual:pwa-register";

// Mostra um aviso discreto no canto da tela em vez do window.confirm,
// para não interromper quem está no meio de um RDO.
function mostrarAvisoAtualizacao( aplicarAtualizacao ) {

  if (
    document.getElementById(
      "rdo-toast-atualizacao"
    )
  ) {
    return;
  }

  const toast = document.createElement("div");

  toast.id = "rdo-toast-atualizacao";
  toast.setAttribute(
    "role",
    "status"
  );
  toast.setAttribute(
    "aria-live",
    "polite"
  );
  toast.style.cssText =
    "position:fixed;right:16px;bottom:16px;z-index:2000;" +
    "max-width:320px;padding:14px 14px 12px;border-radius:12px;" +
    "background:#0f172a;color:#fff;box-shadow:0 10px 28px rgba(0,0,0,.28);" +
    "font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;" +
    "font-size:14px;line-height:1.35";

  const texto = document.createElement("div");
  texto.textContent =
    "Nova versão do Projeto RDO disponível.";
  texto.style.marginBottom = "10px";

  const acoes = document.createElement("div");
  acoes.style.display = "flex";
  acoes.style.gap = "8px";

  const botaoAtualizar = document.createElement("button");
  botaoAtualizar.type = "button";
  botaoAtualizar.textContent = "Atualizar agora";
  botaoAtualizar.style.cssText =
    "flex:1;padding:9px 10px;border:none;border-radius:8px;" +
    "background:#f59e0b;color:#1f2421;font-weight:700;cursor:pointer";

  const botaoDepois = document.createElement("button");
  botaoDepois.type = "button";
  botaoDepois.textContent = "Depois";
  botaoDepois.style.cssText =
    "flex:1;padding:9px 10px;border:1px solid rgba(255,255,255,.35);" +
    "border-radius:8px;background:transparent;color:#fff;cursor:pointer";

  botaoAtualizar.addEventListener(
    "click",
    async () => {
      toast.remove();
      await aplicarAtualizacao( true );
    }
  );

  botaoDepois.addEventListener(
    "click",
    () => {
      toast.remove();
    }
  );

  acoes.appendChild(botaoAtualizar);
  acoes.appendChild(botaoDepois);

  toast.appendChild(texto);
  toast.appendChild(acoes);

  document.body.appendChild(toast);

}

// Atalho para aplicar a nova versão só com confirmação do usuário.
// Isso evita que a troca de versão recarregue a página sozinha
// enquanto alguém está no meio de um RDO.
const atualizarSW = registerSW( {
  immediate: true,

  onNeedRefresh() {

    mostrarAvisoAtualizacao(
      atualizarSW
    );

  },

  onRegisteredSW( url ) {

    console.log(
      "Service Worker registrado:",
      url
    );

  },

  onRegisterError( erro ) {

    console.error(
      "Erro ao registrar o Service Worker:",
      erro
    );

  }
} );

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
