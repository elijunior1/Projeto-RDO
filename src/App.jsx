import { Suspense, lazy, useEffect, useRef, useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { supabase } from "./supabase.js";

import AppLayout from "./components/AppLayout";

import { lerFila, processarFila } from "./services/filaOffline.js";

import Login from "./pages/Login";

// CSS de todas as telas carregado junto (evita FOUC: página sem
// estilo enquanto o chunk JS carrega). O JS continua em split —
// só o CSS (pequeno) vai para o bundle inicial.
import "./pages/admin/HomeAdmin.css";
import "./pages/admin/GerenciarObras.css";
import "./pages/admin/GerenciarColaboradores.css";
import "./pages/encarregado/HomeEncarregado.css";
import "./pages/encarregado/FormRDO.css";
import "./pages/admin/DetalhesRDO.css";
import "./pages/admin/ConsultaRDO.css";
import "./pages/admin/RelatorioRDO.css";
import "./pages/admin/ObrasEncarregado.css";
import "./pages/admin/SelecionarObraRDO.css";

// Páginas carregadas sob demanda (code-splitting) para o bundle
// inicial ficar leve — importante no celular. Login fica eager
// pois é a primeira tela.
const HomeAdmin = lazy(() => import("./pages/admin/HomeAdmin"));
const GerenciarObras = lazy(() => import("./pages/admin/GerenciarObras"));
const GerenciarColaboradores = lazy(
  () => import("./pages/admin/GerenciarColaboradores"),
);
const ObrasEncarregado = lazy(() => import("./pages/admin/ObrasEncarregado"));
const ConsultaRDO = lazy(() => import("./pages/admin/ConsultaRDO"));
const SelecionarObraRDO = lazy(() => import("./pages/admin/SelecionarObraRDO"));
const HomeEncarregado = lazy(
  () => import("./pages/encarregado/HomeEncarregado"),
);
const FormRDO = lazy(() => import("./pages/encarregado/FormRDO"));
const HomePintura = lazy(() => import("./pages/pintura/HomePintura"));
const FormRDOPintura = lazy(() => import("./pages/pintura/FormRDOPintura"));
const DetalheRDO = lazy(() => import("./pages/admin/DetalheRDO"));
const RelatorioRDO = lazy(() => import("./pages/admin/RelatorioRDO"));

/*
==================================================
LAYOUT DO SISTEMA
==================================================
*/

function LayoutSistema({ usuario, sair, children }) {
  const navigate = useNavigate();

  function navegar(tela) {
    const rotas = {
      home:
        usuario?.perfil === "admin"
          ? "/admin"
          : usuario?.perfil === "pintura"
            ? "/pintura"
            : "/encarregado",

      "home-admin": "/admin",

      "gerenciar-obras": "/admin/obras",

      "gerenciar-colaboradores": "/admin/colaboradores",

      "obras-encarregado": "/admin/encarregados",

      "consulta-rdo": "/admin/consulta-rdo",

      "relatorio-rdo": "/admin/relatorio-rdo",

      "selecionar-rdo": "/admin/selecionar-rdo",

      "form-rdo": "/encarregado/form-rdo",

      "form-rdo-pintura": "/pintura/form-rdo",
    };

    const rota = rotas[tela];

    if (rota) {
      navigate(rota);
    }
  }

  function voltar() {
    navigate(-1);
  }

  return (
    <AppLayout usuario={usuario} navegar={navegar} voltar={voltar} sair={sair}>
      {children}
    </AppLayout>
  );
}

/*
==================================================
APP PRINCIPAL
==================================================
*/

function Sistema() {
  const navigate = useNavigate();

  const location = useLocation();

  const [usuario, setUsuario] = useState(null);

  const [carregando, setCarregando] = useState(true);

  const [dadosCarregando, setDadosCarregando] = useState(false);

  // true só depois da PRIMEIRA carga completa de dados. É isso que
  // permite mostrar a tela cheia de "Carregando..." uma única vez e,
  // nas próximas vezes (troca de aba, refresh de token...), manter a
  // tela atual visível — só um indicador pequeno — em vez de trocar a
  // página inteira por um estado de carregamento.
  const [dadosJaCarregados, setDadosJaCarregados] = useState(false);

  // id do usuário já carregado nesta sessão. Serve para ignorar
  // eventos repetidos do Supabase (ex.: TOKEN_REFRESHED ao voltar de
  // outra aba), que antes disparavam um novo carregamento completo.
  const usuarioIdCarregadoRef = useRef(null);

  const rotaRestauradaRef = useRef(false);

  const [encarregadoSelecionado, setEncarregadoSelecionado] = useState(null);

  const [obraSelecionada, setObraSelecionada] = useState(null);

  const [obras, setObras] = useState([]);

  const [colaboradores, setColaboradores] = useState([]);

  const [equipes, setEquipes] = useState([]);

  const [rdos, setRdos] = useState([]);

  // Mensagem de bloqueio (usuário desativado) exibida em pop-up
  // sobre a tela de login, sem nunca abrir o sistema.
  const [mensagemBloqueio, setMensagemBloqueio] = useState("");

  /*
  ================================================
  RESTAURAR OBRA SELECIONADA
  ================================================
  */

  useEffect(() => {
    const obraSalva = localStorage.getItem("rdo_obra_selecionada");

    if (!obraSalva) {
      return;
    }

    try {
      setObraSelecionada(JSON.parse(obraSalva));
    } catch (erro) {
      console.error("Erro ao restaurar obra:", erro);

      localStorage.removeItem("rdo_obra_selecionada");
    }
  }, []);

  /*
  ================================================
  RESTAURAR ENCARREGADO
  ================================================
  */

  useEffect(() => {
    const encarregadoSalvo = localStorage.getItem(
      "rdo_encarregado_selecionado",
    );

    if (!encarregadoSalvo) {
      return;
    }

    try {
      setEncarregadoSelecionado(JSON.parse(encarregadoSalvo));
    } catch (erro) {
      console.error("Erro ao restaurar encarregado:", erro);

      localStorage.removeItem("rdo_encarregado_selecionado");
    }
  }, []);

  /*
  ================================================
  SALVAR OBRA SELECIONADA
  ================================================
  */

  useEffect(() => {
    if (obraSelecionada) {
      localStorage.setItem(
        "rdo_obra_selecionada",
        JSON.stringify(obraSelecionada),
      );
    }
  }, [obraSelecionada]);

  /*
  ================================================
  SALVAR ENCARREGADO SELECIONADO
  ================================================
  */

  useEffect(() => {
    if (encarregadoSelecionado) {
      localStorage.setItem(
        "rdo_encarregado_selecionado",
        JSON.stringify(encarregadoSelecionado),
      );
    }
  }, [encarregadoSelecionado]);

  /*
  ================================================
  SALVAR ÚLTIMA ROTA + SCROLL (para voltar onde parou)
  ================================================

  Quando o navegador mata a aba (muito comum no celular) ou a
  página recarrega, a rota atual é perdida e o app volta para a
  home. Guardamos a rota e o scroll no localStorage para restaurar
  na próxima abertura, sem depender só do bfcache.
  */

  useEffect(() => {
    if (!usuario || location.pathname === "/login") {
      return;
    }

    const rotaAtual = location.pathname + location.search + location.hash;

    try {
      localStorage.setItem(
        "rdo_ultima_rota",
        JSON.stringify({
          rota: rotaAtual,
          salvaEm: new Date().toISOString(),
        }),
      );

      localStorage.setItem(
        "rdo_scroll_pos",
        JSON.stringify({
          rota: rotaAtual,
          y: window.scrollY || 0,
        }),
      );
    } catch (erro) {
      // localStorage cheio ou indisponível: o app continua normal.
      console.error("Erro ao salvar última rota:", erro);
    }
  }, [usuario, location.pathname, location.search, location.hash]);

  useEffect(() => {
    let timer = null;

    function salvarScroll() {
      const rotaAtual = location.pathname + location.search + location.hash;

      try {
        localStorage.setItem(
          "rdo_scroll_pos",
          JSON.stringify({
            rota: rotaAtual,
            y: window.scrollY || 0,
          }),
        );
      } catch {
        // sem ação: é só cache de posição
      }
    }

    function aoRolar() {
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(salvarScroll, 150);
    }

    function aoOcultar() {
      if (document.visibilityState === "hidden") {
        salvarScroll();
      }
    }

    window.addEventListener("scroll", aoRolar, { passive: true });

    document.addEventListener("visibilitychange", aoOcultar);

    window.addEventListener("beforeunload", salvarScroll);

    window.addEventListener("pagehide", salvarScroll);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }

      window.removeEventListener("scroll", aoRolar);

      document.removeEventListener("visibilitychange", aoOcultar);

      window.removeEventListener("beforeunload", salvarScroll);

      window.removeEventListener("pagehide", salvarScroll);
    };
  }, [location.pathname, location.search, location.hash]);

  /*
  ================================================
  RESTAURAR ÚLTIMA ROTA NA ABERTURA
  ================================================

  Roda uma única vez, depois que o login e os dados carregaram.
  Só restaura se a rota salva pertencer ao perfil do usuário.
  */

  useEffect(() => {
    if (
      rotaRestauradaRef.current ||
      carregando ||
      dadosCarregando ||
      !usuario
    ) {
      return;
    }

    rotaRestauradaRef.current = true;

    // Se já está numa rota válida (não é "/" nem "/login"),
    // não mexe em nada: a aba comum já restaurou sozinha.
    if (location.pathname !== "/" && location.pathname !== "/login") {
      return;
    }

    const salva = localStorage.getItem("rdo_ultima_rota");

    if (!salva) {
      return;
    }

    try {
      const { rota } = JSON.parse(salva);

      if (!rota || rota === "/login") {
        return;
      }

      const prefixosPermitidos = {
        admin: "/admin",
        encarregado: "/encarregado",
        pintura: "/pintura",
      };

      const prefixo = prefixosPermitidos[usuario.perfil];

      if (prefixo && !rota.startsWith(prefixo)) {
        return;
      }

      // Só volta se a rota salva não for a home padrão.
      if (rota !== prefixo) {
        navigate(rota, {
          replace: true,
        });
      }
    } catch (erro) {
      console.error("Erro ao restaurar última rota:", erro);

      localStorage.removeItem("rdo_ultima_rota");
    }
  }, [usuario, carregando, dadosCarregando, location.pathname, navigate]);

  /*
  ================================================
  RESTAURAR SCROLL DA ROTA ATUAL
  ================================================
  */

  useEffect(() => {
    const salva = localStorage.getItem("rdo_scroll_pos");

    if (!salva) {
      return;
    }

    try {
      const { rota, y } = JSON.parse(salva);

      const rotaAtual = location.pathname + location.search + location.hash;

      if (rota === rotaAtual && typeof y === "number" && y > 0) {
        window.scrollTo(0, y);
      }
    } catch {
      // sem ação
    }
  }, [location.pathname, location.search, location.hash]);

  /*
  ================================================
  VERIFICAR SESSÃO
  ================================================
  */

  useEffect(() => {
    verificarSessao();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (evento, sessao) => {
        if (sessao?.user) {
          const mesmoUsuario = usuarioIdCarregadoRef.current === sessao.user.id;

          // Ao voltar de outra aba, o Supabase costuma disparar
          // TOKEN_REFRESHED / INITIAL_SESSION sem o usuário ter
          // trocado. Antes, isso chamava carregarDados de novo e
          // trocava a tela inteira por "Carregando...".
          // Se é o mesmo usuário já carregado nesta sessão,
          // só limpamos o indicador e mantemos a tela como está.
          if (
            mesmoUsuario &&
            (evento === "TOKEN_REFRESHED" || evento === "INITIAL_SESSION")
          ) {
            setCarregando(false);

            return;
          }

          await carregarUsuario(sessao.user);
        } else {
          usuarioIdCarregadoRef.current = null;

          setUsuario(null);

          setObras([]);

          setColaboradores([]);

          setEquipes([]);

          setRdos([]);

          setDadosJaCarregados(false);
        }

        setCarregando(false);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  /*
  ================================================
  VERIFICAR SESSÃO ATUAL
  ================================================
  */

  async function verificarSessao() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Erro ao verificar sessão:", error);

      setCarregando(false);

      return;
    }

    if (data.session?.user) {
      await carregarUsuario(data.session.user);
    }

    setCarregando(false);
  }

  /*
  ================================================
  CARREGAR USUÁRIO
  ================================================
  */

  async function carregarUsuario(usuarioAuth) {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", usuarioAuth.id)
      .single();

    if (error) {
      console.error("Erro ao carregar usuário:", error);

      setUsuario(null);

      return;
    }

    // Usuário desativado não entra (mesmo com sessão válida).
    // Mostra pop-up sobre o login, sem nunca abrir o sistema.
    if (data.ativo === false) {
      usuarioIdCarregadoRef.current = null;
      setUsuario(null);
      setObras([]);
      setColaboradores([]);
      setEquipes([]);
      setRdos([]);
      setMensagemBloqueio(
        "Seu usuário foi bloqueado/desativado. Consulte um administrador.",
      );
      await supabase.auth.signOut();
      return;
    }

    setMensagemBloqueio("");

    const usuarioCompleto = {
      ...data,

      auth_id: usuarioAuth.id,

      email: usuarioAuth.email,
    };

    setUsuario(usuarioCompleto);

    usuarioIdCarregadoRef.current = usuarioAuth.id;

    await carregarDados(usuarioCompleto);
  }

  /*
  ================================================
  CARREGAR DADOS
  ================================================
  */

  async function carregarDados(usuarioAtual = null) {
    try {
      setDadosCarregando(true);

      // Escopo por usuário: admin vê tudo; encarregado/pintura
      // só busca as obras e RDOs dele. Isso reduz tráfego e evita
      // que o frontend precise filtrar tudo depois.
      const ehAdmin = usuarioAtual?.perfil === "admin";

      const ehEscopoProprio = !ehAdmin && Boolean(usuarioAtual?.id);

      const idUsuarioAtual = usuarioAtual?.id || null;

      /*
      ============================================
      OBRAS
      ============================================
      */

      let consultaObras = supabase.from("rdo_obras").select(`
          *,
          encarregado:usuarios!rdo_obras_encarregado_id_fkey(
            id,
            nome,
            email
          ),
          equipe:rdo_equipes(
            id,
            nome
          )
        `);

      // Obras onde sou o 2º+ encarregado (vínculo múltiplo)
      let obraIdsVinculadas = [];
      if (ehEscopoProprio) {
        try {
          const { data: vinculos } = await supabase
            .from("rdo_obra_encarregados")
            .select("obra_id")
            .eq("encarregado_id", idUsuarioAtual);
          obraIdsVinculadas = (vinculos || []).map((v) => v.obra_id);
        } catch (ignorar) {
          obraIdsVinculadas = [];
        }
      }

      if (ehEscopoProprio) {
        if (obraIdsVinculadas.length > 0) {
          consultaObras = consultaObras.or(
            `encarregado_id.eq.${idUsuarioAtual},id.in.(${obraIdsVinculadas.join(",")})`,
          );
        } else {
          consultaObras = consultaObras.eq("encarregado_id", idUsuarioAtual);
        }
      }

      const { data: obrasData, error: obrasError } = await consultaObras.order(
        "created_at",
        {
          ascending: false,
        },
      );

      if (obrasError) {
        throw obrasError;
      }

      // Anexar encarregadosIds (vínculo múltiplo + legado)
      let vinculosEncObras = [];
      try {
        const idsObras = (obrasData || []).map((o) => o.id);
        if (idsObras.length > 0) {
          const { data } = await supabase
            .from("rdo_obra_encarregados")
            .select("obra_id, encarregado_id")
            .in("obra_id", idsObras);
          vinculosEncObras = data || [];
        }
      } catch (ignorar) {
        vinculosEncObras = [];
      }
      const obrasComEncarregados = (obrasData || []).map((obra) => ({
        ...obra,
        encarregadosIds: [
          ...new Set([
            ...vinculosEncObras
              .filter((v) => v.obra_id === obra.id)
              .map((v) => v.encarregado_id),
            ...(obra.encarregado_id ? [obra.encarregado_id] : []),
          ]),
        ],
      }));

      /*
      ============================================
      EQUIPES + MEMBROS + COLABORADORES + RDOs (paralelo)
      ============================================
      */

      let consultaRdos = supabase.from("rdos").select("*");
      if (ehEscopoProprio) {
        consultaRdos = consultaRdos.eq("encarregado_id", idUsuarioAtual);
      }

      const [
        { data: equipesData, error: equipesError },
        { data: membrosData, error: membrosError },
        { data: colaboradoresData, error: colaboradoresError },
        { data: rdosData, error: rdosError },
      ] = await Promise.all([
        supabase
          .from("rdo_equipes")
          .select("*")
          .order("nome", { ascending: true }),
        supabase
          .from("rdo_equipe_colaboradores")
          .select("equipe_id, colaborador_id"),
        supabase
          .from("rdo_colaboradores")
          .select("*")
          .eq("ativo", true)
          .order("nome", { ascending: true }),
        consultaRdos.order("data", { ascending: false }),
      ]);

      if (equipesError) {
        throw equipesError;
      }

      if (membrosError) {
        throw membrosError;
      }

      if (colaboradoresError) {
        throw colaboradoresError;
      }

      if (rdosError) {
        throw rdosError;
      }

      const equipesComColaboradores = (equipesData || []).map((equipe) => ({
        ...equipe,

        colaboradoresIds: (membrosData || [])
          .filter((membro) => membro.equipe_id === equipe.id)
          .map((membro) => membro.colaborador_id),
      }));

      /*
      ============================================
      ATUALIZAR ESTADOS
      ============================================
      */

      setObras(obrasComEncarregados || []);

      setEquipes(equipesComColaboradores);

      setColaboradores(colaboradoresData || []);

      setRdos(rdosData || []);

      console.log("Dados carregados:", {
        obras: obrasData?.length || 0,

        equipes: equipesData?.length || 0,

        colaboradores: colaboradoresData?.length || 0,

        rdos: rdosData?.length || 0,
      });
    } catch (erro) {
      console.error("Erro ao carregar dados do sistema:", erro);

      alert("Erro ao carregar os dados do sistema.");
    } finally {
      setDadosCarregando(false);

      setDadosJaCarregados(true);
    }
  }

  // Fila offline: envia RDOs salvas sem internet assim que voltar
  useEffect(() => {
    if (!usuario) return;
    async function sincronizar() {
      if (lerFila().length === 0) return;
      try {
        const enviadas = await processarFila(supabase);
        if (enviadas > 0) {
          await carregarDados(usuario);
        }
      } catch (erro) {
        console.error("Erro ao sincronizar fila offline:", erro);
      }
    }
    sincronizar();
    window.addEventListener("online", sincronizar);
    return () => window.removeEventListener("online", sincronizar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  /*
  ================================================
  NAVEGAÇÃO
  ================================================
  */

  function navegar(tela) {
    const rotas = {
      home:
        usuario?.perfil === "admin"
          ? "/admin"
          : usuario?.perfil === "pintura"
            ? "/pintura"
            : "/encarregado",

      "home-admin": "/admin",

      "gerenciar-obras": "/admin/obras",

      "gerenciar-colaboradores": "/admin/colaboradores",

      "obras-encarregado": "/admin/encarregados",

      "relatorio-rdo": "/admin/relatorio-rdo",

      "consulta-rdo": "/admin/consulta-rdo",

      "selecionar-rdo": "/admin/selecionar-rdo",

      "form-rdo": "/encarregado/form-rdo",

      "form-rdo-pintura": "/pintura/form-rdo",
    };

    const rota = rotas[tela];

    if (rota) {
      navigate(rota);
    }
  }

  /*
  ================================================
  SAIR
  ================================================
  */

  async function sair() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Erro ao sair:", error);

      return;
    }

    setUsuario(null);

    setObraSelecionada(null);

    setEncarregadoSelecionado(null);

    setObras([]);

    setColaboradores([]);

    setEquipes([]);

    setRdos([]);

    setDadosJaCarregados(false);

    usuarioIdCarregadoRef.current = null;

    rotaRestauradaRef.current = false;

    localStorage.removeItem("rdo_obra_selecionada");

    localStorage.removeItem("rdo_encarregado_selecionado");

    localStorage.removeItem("rdo_ultima_rota");

    localStorage.removeItem("rdo_scroll_pos");

    navigate("/login", {
      replace: true,
    });
  }

  /*
  ================================================
  CARREGANDO (primeira abertura)
  ================================================

  A tela cheia de "Carregando..." agora aparece SÓ na primeira
  carga. Depois disso, recarregar dados (refresh de token, voltar
  de outra aba etc.) NÃO troca a tela: o conteúdo atual fica
  visível e só um indicador discreto aparece no topo.
  */

  if (carregando || (dadosCarregando && !dadosJaCarregados)) {
    return (
      <main>
        <p>Carregando...</p>
      </main>
    );
  }

  /*
  ================================================
  LOGIN
  ================================================
  */

  if (!usuario) {
    return (
      <>
        {mensagemBloqueio && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Usuário bloqueado"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(15, 23, 42, 0.55)",
              padding: 20,
            }}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: 12,
                padding: 28,
                maxWidth: 420,
                width: "100%",
                textAlign: "center",
                boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ fontSize: 42, marginBottom: 10 }}>⛔</div>
              <h2 style={{ margin: "0 0 10px", color: "#1e293b" }}>
                Usuário bloqueado
              </h2>
              <p
                style={{
                  color: "#475569",
                  margin: "0 0 20px",
                  lineHeight: 1.5,
                }}
              >
                {mensagemBloqueio}
              </p>
              <button
                className="btn btn-primary"
                style={{ width: "100%" }}
                onClick={() => setMensagemBloqueio("")}
              >
                Entendi
              </button>
            </div>
          </div>
        )}

        <Routes>
          <Route path="/login" element={<Login aoEntrar={carregarUsuario} />} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </>
    );
  }

  /*
  ================================================
  ROTAS DO SISTEMA
  ================================================
  */

  return (
    <>
      {dadosCarregando && dadosJaCarregados && (
        <div
          role="status"
          aria-label="Atualizando dados"
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            zIndex: 1000,
            background: "#f59e0b",
            color: "#1f2421",
            fontSize: "12px",
            fontWeight: 600,
            padding: "6px 10px",
            borderBottomLeftRadius: "8px",
            borderBottom: "1px solid rgba(0,0,0,0.12)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          Atualizando...
        </div>
      )}

      <LayoutSistema usuario={usuario} sair={sair}>
        <Suspense
          fallback={
            <main>
              <p>Carregando...</p>
            </main>
          }
        >
          <Routes>
            {/* ======================================
            ADMIN
        ====================================== */}

            {usuario.perfil === "admin" && (
              <>
                <Route
                  path="/admin"
                  element={
                    <HomeAdmin
                      usuario={usuario}
                      navegar={navegar}
                      setEncarregadoSelecionado={setEncarregadoSelecionado}
                      sair={sair}
                    />
                  }
                />

                <Route
                  path="/admin/obras"
                  element={<GerenciarObras navegar={navegar} sair={sair} usuario={usuario} />}
                />

                <Route
                  path="/admin/colaboradores"
                  element={
                    <GerenciarColaboradores sair={sair} usuario={usuario} />
                  }
                />

                <Route
                  path="/admin/encarregados"
                  element={
                    <ObrasEncarregado
                      encarregado={encarregadoSelecionado}
                      obras={obras}
                      navegar={navegar}
                      setObraSelecionada={setObraSelecionada}
                      sair={sair}
                    />
                  }
                />

                <Route
                  path="/admin/consulta-rdo"
                  element={
                    <ConsultaRDO
                      obra={obraSelecionada}
                      rdos={rdos}
                      navegar={navegar}
                      voltar={() => navigate(-1)}
                      sair={sair}
                    />
                  }
                />

                <Route
                  path="/admin/relatorio-rdo"
                  element={
                    <RelatorioRDO
                      obraSelecionada={obraSelecionada}
                      navegar={navegar}
                      sair={sair}
                    />
                  }
                />

                <Route
                  path="/admin/rdo/:id"
                  element={
                    <DetalheRDO
                      obra={obraSelecionada}
                      navegar={navegar}
                      sair={sair}
                    />
                  }
                />

                <Route
                  path="/admin/selecionar-rdo"
                  element={
                    <SelecionarObraRDO
                      obras={obras}
                      navegar={navegar}
                      setObraSelecionada={setObraSelecionada}
                      usuario={usuario}
                    />
                  }
                />

                <Route path="*" element={<Navigate to="/admin" replace />} />
              </>
            )}

            {/* ======================================
            ENCARREGADO
        ====================================== */}

            {usuario.perfil === "encarregado" && (
              <>
                <Route
                  path="/encarregado"
                  element={
                    <HomeEncarregado
                      usuario={usuario}
                      obras={obras}
                      rdos={rdos}
                      navegar={navegar}
                      setObraSelecionada={setObraSelecionada}
                      sair={sair}
                    />
                  }
                />

                <Route
                  path="/encarregado/form-rdo"
                  element={
                    <FormRDO
                      usuario={usuario}
                      obra={obraSelecionada}
                      colaboradores={colaboradores}
                      equipes={equipes}
                      rdos={rdos}
                      setRdos={setRdos}
                      navegar={navegar}
                      voltar={() => navigate(-1)}
                      sair={sair}
                    />
                  }
                />

                <Route
                  path="*"
                  element={<Navigate to="/encarregado" replace />}
                />
              </>
            )}

            {/* ======================================
            ENCARREGADO DE PINTURA
        ====================================== */}

            {usuario.perfil === "pintura" && (
              <>
                <Route
                  path="/pintura"
                  element={
                    <HomePintura
                      usuario={usuario}
                      obras={obras}
                      rdos={rdos}
                      navegar={navegar}
                      setObraSelecionada={setObraSelecionada}
                      sair={sair}
                    />
                  }
                />

                <Route
                  path="/pintura/form-rdo"
                  element={
                    <FormRDOPintura
                      usuario={usuario}
                      obra={obraSelecionada}
                      colaboradores={colaboradores}
                      equipes={equipes}
                      rdos={rdos}
                      setRdos={setRdos}
                      navegar={navegar}
                      voltar={() => navigate(-1)}
                      sair={sair}
                    />
                  }
                />

                <Route path="*" element={<Navigate to="/pintura" replace />} />
              </>
            )}

            {usuario.perfil !== "admin" &&
              usuario.perfil !== "encarregado" &&
              usuario.perfil !== "pintura" && (
                <Route path="*" element={<Navigate to="/login" replace />} />
              )}
          </Routes>
        </Suspense>
      </LayoutSistema>
    </>
  );
}

/*
==================================================
ROTEADOR PRINCIPAL
==================================================
*/

function App() {
  return (
    <BrowserRouter>
      <Sistema />
    </BrowserRouter>
  );
}

export default App;
