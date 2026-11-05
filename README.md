# Projeto RDO — RDO Gestão

Sistema de Relatório Diário de Obras (RDO) para gestão de condomínios em construção: obras, equipes, colaboradores, efetivo, produção diária e relatórios em PDF.

## Stack

- React 19 + Vite 8
- react-router-dom 7
- Supabase (auth + banco)
- Firebase Cloud Messaging (push)
- PWA com `vite-plugin-pwa`
- jsPDF + html2canvas (relatórios em PDF)
- xlsx (instalado, exportação Excel a implementar)

## Como rodar

```bash
npm install
cp .env.example .env   # no Windows: copy .env.example .env
# preencha o .env com suas chaves do Supabase e Firebase
npm run dev
```

## Variáveis de ambiente (`.env`)

Veja `.env.example`. O `.env` **não deve ser commitado** — já está no `.gitignore`.

A chave VAPID do Firebase (`VITE_FIREBASE_VAPID_KEY`) é lida em `src/notifications/push.js` (fonte única) e não deve ficar escrita no código.

## Funcionalidades

### Perfis
- **Admin** (`perfil = "admin"`): dashboard, cadastro de obras, colaboradores e equipes, consulta de RDOs, relatório consolidado em PDF e PDF individual da RDO.
- **Encarregado** (`perfil = "encarregado"`): lista as obras atribuídas, com status do dia (enviado/pendente) e formulário de RDO diária (produção, efetivo, materiais e motivos de baixa produtividade). O rascunho é salvo automaticamente no `localStorage`.

### Regras importantes
- **Um RDO por obra por dia** (verificado em `src/pages/encarregado/FormRDO.jsx`).
- Push notifications: o fluxo canônico é `src/notifications/push.js` → tabela `push_subscriptions` (upsert por `fcm_token`). Removidos os fluxos duplicados antigos.
- Status de obra: `em_andamento`, `paralisada`, `finalizada`.
- `usuarios.id` é o mesmo ID do auth do Supabase (usado em `src/App.jsx` e no login via `auth.signInWithPassword` + `aoEntrar`).
- **Não adicionar `firebase-admin` ao frontend**: é SDK de backend (Node). Se precisar enviar push do servidor, use uma função server-side separada.

## Estrutura

```
src/
  App.jsx                 — auth, carregamento global e rotas por perfil
  main.jsx                — bootstrap + registro do service worker PWA
  supabase.js / firebase.js — clientes
  notifications/push.js   — ativação de push (fonte única)
  components/             — AppLayout, PushNotificationsButton, RdoPdfTemplate
  pages/admin/            — HomeAdmin, GerenciarObras, GerenciarColaboradores,
                            SelecionarObraRDO, ConsultaRDO, DetalheRDO, RelatorioRDO,
                            ObrasEncarregado
  pages/encarregado/      — HomeEncarregado, FormRDO
public/                   — ícones e firebase-messaging-sw.js
vite.config.js            — config do Vite + PWA
```
