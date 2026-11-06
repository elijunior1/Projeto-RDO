import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";

import "./styles/global.css";
import "./styles/layout.css";

import {
  registerSW
} from "virtual:pwa-register";

// Atalho para aplicar a nova versão só com confirmação do usuário.
// Isso evita que a troca de versão recarregue a página sozinha
// enquanto alguém está no meio de um RDO.
const atualizarSW = registerSW( {
  immediate: true,

  onNeedRefresh() {

    if (
      window.confirm(
        "Nova versão do Projeto RDO disponível. " +
        "Deseja atualizar agora?"
      )
    ) {

      atualizarSW( true );

    }

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
