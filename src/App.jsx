import {
  useEffect,
  useState
} from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate
} from "react-router-dom";

import {
  supabase
} from "./supabase.js";

import AppLayout from "./components/AppLayout";

import Login from "./pages/Login";

import HomeAdmin from "./pages/admin/HomeAdmin";
import GerenciarObras from "./pages/admin/GerenciarObras";
import GerenciarColaboradores from "./pages/admin/GerenciarColaboradores";
import ObrasEncarregado from "./pages/admin/ObrasEncarregado";
import ConsultaRDO from "./pages/admin/ConsultaRDO";
import SelecionarObraRDO from "./pages/admin/SelecionarObraRDO";

import HomeEncarregado from "./pages/encarregado/HomeEncarregado";
import FormRDO from "./pages/encarregado/FormRDO";
import DetalheRDO from "./pages/admin/DetalheRDO";


/*
==================================================
LAYOUT DO SISTEMA
==================================================
*/

function LayoutSistema({
  usuario,
  sair,
  children
}) {

  const navigate = useNavigate();

  function navegar(tela) {

    const rotas = {

      home:
        usuario?.perfil === "admin"
          ? "/admin"
          : "/encarregado",

      "home-admin":
        "/admin",

      "gerenciar-obras":
        "/admin/obras",

      "gerenciar-colaboradores":
        "/admin/colaboradores",

      "obras-encarregado":
        "/admin/encarregados",

      "consulta-rdo":
        "/admin/consulta-rdo",

      "selecionar-rdo":
        "/admin/selecionar-rdo",

      "form-rdo":
        "/encarregado/form-rdo"

    };

    const rota = rotas[ tela ];

    if (rota) {
      navigate(rota);
    }

  }

  function voltar() {
    navigate(-1);
  }

  return (
    <AppLayout
      usuario={usuario}
      navegar={navegar}
      voltar={voltar}
      sair={sair}
    >
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


  const [
    usuario,
    setUsuario
  ] = useState(null);


  const [
    carregando,
    setCarregando
  ] = useState(true);


  const [
    dadosCarregando,
    setDadosCarregando
  ] = useState(false);


  const [
    encarregadoSelecionado,
    setEncarregadoSelecionado
  ] = useState(null);


  const [
    obraSelecionada,
    setObraSelecionada
  ] = useState(null);


  const [
    obras,
    setObras
  ] = useState([]);


  const [
    colaboradores,
    setColaboradores
  ] = useState([]);


  const [
    equipes,
    setEquipes
  ] = useState([]);


  const [
    rdos,
    setRdos
  ] = useState([]);


  /*
  ================================================
  RESTAURAR OBRA SELECIONADA
  ================================================
  */

  useEffect(() => {

    const obraSalva =
      localStorage.getItem(
        "rdo_obra_selecionada"
      );


    if (!obraSalva) {
      return;
    }


    try {

      setObraSelecionada(
        JSON.parse(
          obraSalva
        )
      );

    } catch (erro) {

      console.error(
        "Erro ao restaurar obra:",
        erro
      );

      localStorage.removeItem(
        "rdo_obra_selecionada"
      );

    }

  }, []);


  /*
  ================================================
  RESTAURAR ENCARREGADO
  ================================================
  */

  useEffect(() => {

    const encarregadoSalvo =
      localStorage.getItem(
        "rdo_encarregado_selecionado"
      );


    if (!encarregadoSalvo) {
      return;
    }


    try {

      setEncarregadoSelecionado(
        JSON.parse(
          encarregadoSalvo
        )
      );

    } catch (erro) {

      console.error(
        "Erro ao restaurar encarregado:",
        erro
      );

      localStorage.removeItem(
        "rdo_encarregado_selecionado"
      );

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
        JSON.stringify(
          obraSelecionada
        )
      );

    }

  }, [
    obraSelecionada
  ]);


  /*
  ================================================
  SALVAR ENCARREGADO SELECIONADO
  ================================================
  */

  useEffect(() => {

    if (encarregadoSelecionado) {

      localStorage.setItem(
        "rdo_encarregado_selecionado",
        JSON.stringify(
          encarregadoSelecionado
        )
      );

    }

  }, [
    encarregadoSelecionado
  ]);


  /*
  ================================================
  VERIFICAR SESSÃO
  ================================================
  */

  useEffect(() => {

    verificarSessao();


    const {
      data: listener
    } =
      supabase.auth.onAuthStateChange(
        async (
          evento,
          sessao
        ) => {

          if (sessao?.user) {

            await carregarUsuario(
              sessao.user
            );

          } else {

            setUsuario(null);

            setObras([]);

            setColaboradores([]);

            setEquipes([]);

            setRdos([]);

          }


          setCarregando(
            false
          );

        }
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

    const {
      data,
      error
    } =
      await supabase.auth.getSession();


    if (error) {

      console.error(
        "Erro ao verificar sessão:",
        error
      );

      setCarregando(
        false
      );

      return;

    }


    if (data.session?.user) {

      await carregarUsuario(
        data.session.user
      );

    }


    setCarregando(
      false
    );

  }


  /*
  ================================================
  CARREGAR USUÁRIO
  ================================================
  */

  async function carregarUsuario(
    usuarioAuth
  ) {

    const {
      data,
      error
    } =
      await supabase
        .from(
          "usuarios"
        )
        .select("*")
        .eq(
          "id",
          usuarioAuth.id
        )
        .single();


    if (error) {

      console.error(
        "Erro ao carregar usuário:",
        error
      );

      setUsuario(null);

      return;

    }


    const usuarioCompleto = {

      ...data,

      auth_id:
        usuarioAuth.id,

      email:
        usuarioAuth.email

    };


    setUsuario(
      usuarioCompleto
    );


    await carregarDados();

  }


  /*
  ================================================
  CARREGAR DADOS
  ================================================
  */

  async function carregarDados() {

    try {

      setDadosCarregando(
        true
      );


      /*
      ============================================
      OBRAS
      ============================================
      */

      const {
        data: obrasData,
        error: obrasError
      } =
        await supabase
          .from(
            "rdo_obras"
          )
          .select(`
            *,
            encarregado:usuarios(
              id,
              nome,
              email
            ),
            equipe:rdo_equipes(
              id,
              nome
            )
          `)
          .order(
            "created_at",
            {
              ascending: false
            }
          );


      if (obrasError) {

        throw obrasError;

      }


      /*
      ============================================
      EQUIPES
      ============================================
      */

      const {
        data: equipesData,
        error: equipesError
      } =
        await supabase
          .from(
            "rdo_equipes"
          )
          .select("*")
          .order(
            "nome",
            {
              ascending: true
            }
          );


      if (equipesError) {

        throw equipesError;

      }


      /*
      ============================================
      MEMBROS DAS EQUIPES
      ============================================
      */

      const {
        data: membrosData,
        error: membrosError
      } =
        await supabase
          .from(
            "rdo_equipe_colaboradores"
          )
          .select(
            "equipe_id, colaborador_id"
          );


      if (membrosError) {

        throw membrosError;

      }


      const equipesComColaboradores =
        (
          equipesData ||
          []
        ).map(
          equipe => ({

            ...equipe,

            colaboradoresIds:
              (
                membrosData ||
                []
              )
                .filter(
                  membro =>
                    membro.equipe_id ===
                    equipe.id
                )
                .map(
                  membro =>
                    membro.colaborador_id
                )

          })
        );


      /*
      ============================================
      COLABORADORES
      ============================================
      */

      const {
        data: colaboradoresData,
        error: colaboradoresError
      } =
        await supabase
          .from(
            "rdo_colaboradores"
          )
          .select("*")
          .eq(
            "ativo",
            true
          )
          .order(
            "nome",
            {
              ascending: true
            }
          );


      if (colaboradoresError) {

        throw colaboradoresError;

      }


      /*
      ============================================
      RDOs
      ============================================
      */

      const {
        data: rdosData,
        error: rdosError
      } =
        await supabase
          .from(
            "rdos"
          )
          .select("*")
          .order(
            "data",
            {
              ascending: false
            }
          );


      if (rdosError) {

        throw rdosError;

      }


      /*
      ============================================
      ATUALIZAR ESTADOS
      ============================================
      */

      setObras(
        obrasData || []
      );


      setEquipes(
        equipesComColaboradores
      );


      setColaboradores(
        colaboradoresData || []
      );


      setRdos(
        rdosData || []
      );


      console.log(
        "Dados carregados:",
        {
          obras:
            obrasData?.length || 0,

          equipes:
            equipesData?.length || 0,

          colaboradores:
            colaboradoresData?.length || 0,

          rdos:
            rdosData?.length || 0
        }
      );


    } catch (erro) {

      console.error(
        "Erro ao carregar dados do sistema:",
        erro
      );


      alert(
        "Erro ao carregar os dados do sistema."
      );


    } finally {

      setDadosCarregando(
        false
      );

    }

  }


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
          : "/encarregado",

      "home-admin":
        "/admin",

      "gerenciar-obras":
        "/admin/obras",

      "gerenciar-colaboradores":
        "/admin/colaboradores",

      "obras-encarregado":
        "/admin/encarregados",

      "consulta-rdo":
        "/admin/consulta-rdo",

      "selecionar-rdo":
        "/admin/selecionar-rdo",

      "form-rdo":
        "/encarregado/form-rdo"

    };


    const rota = rotas[ tela ];


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

    const {
      error
    } =
      await supabase.auth.signOut();


    if (error) {

      console.error(
        "Erro ao sair:",
        error
      );

      return;

    }


    setUsuario(null);

    setObraSelecionada(null);

    setEncarregadoSelecionado(null);

    setObras([]);

    setColaboradores([]);

    setEquipes([]);

    setRdos([]);

    localStorage.removeItem(
      "rdo_obra_selecionada"
    );

    localStorage.removeItem(
      "rdo_encarregado_selecionado"
    );


    navigate(
      "/login",
      {
        replace: true
      }
    );

  }


  /*
  ================================================
  CARREGANDO
  ================================================
  */

  if (
    carregando ||
    dadosCarregando
  ) {

    return (

      <main>

        <p>
          Carregando...
        </p>

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

      <Routes>

        <Route
          path="/login"
          element={
            <Login
              aoEntrar={
                carregarUsuario
              }
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>

    );

  }


  /*
  ================================================
  ROTAS DO SISTEMA
  ================================================
  */

  return (

    <LayoutSistema
      usuario={usuario}
      sair={sair}
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
                  setEncarregadoSelecionado={
                    setEncarregadoSelecionado
                  }
                  sair={sair}
                />

              }
            />


            <Route
              path="/admin/obras"
              element={

                <GerenciarObras
                  navegar={navegar}
                  sair={sair}
                />

              }
            />


            <Route
              path="/admin/colaboradores"
              element={

                <GerenciarColaboradores
                  navegar={navegar}
                  sair={sair}
                />

              }
            />


            <Route
              path="/admin/encarregados"
              element={

                <ObrasEncarregado
                  encarregado={
                    encarregadoSelecionado
                  }
                  obras={obras}
                  navegar={navegar}
                  setObraSelecionada={
                    setObraSelecionada
                  }
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
                  setObraSelecionada={
                    setObraSelecionada
                  }
                />

              }
            />


            <Route
              path="*"
              element={
                <Navigate
                  to="/admin"
                  replace
                />
              }
            />

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
                  setObraSelecionada={
                    setObraSelecionada
                  }
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
              element={
                <Navigate
                  to="/encarregado"
                  replace
                />
              }
            />

          </>

        )}

      </Routes>

    </LayoutSistema>

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