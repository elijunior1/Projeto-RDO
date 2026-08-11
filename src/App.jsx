import {
  useEffect,
  useState
} from "react";

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

import HomeEncarregado from "./pages/encarregado/HomeEncarregado";

import FormRDO from "./pages/encarregado/FormRDO";

import SelecionarObraRDO from "./pages/admin/SelecionarObraRDO";

function App() {

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
    telaAtual,
    setTelaAtual
  ] = useState("home");

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

VERIFICAR SESSÃO

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

        if (
          sessao?.user
        ) {

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

VERIFICAR SESSÃO ATUAL

*/

  async function verificarSessao() {

    const {
      data,
      error
    } =
    await supabase.auth.getSession();


    if (
      error
    ) {

      console.error(
        "Erro ao verificar sessão:",
        error
      );


      setCarregando(
        false
      );


      return;

    }


    if (
      data.session?.user
    ) {

      await carregarUsuario(
        data.session.user
      );

    }


    setCarregando(
      false
    );

  }

  /*

CARREGAR USUÁRIO

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


    if (
      error
    ) {

      console.error(
        "Erro ao carregar usuário:",
        error
      );


      setUsuario(
        null
      );


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


    setTelaAtual(
      "home"
    );

  }

  /*

CARREGAR TODOS OS DADOS DO SISTEMA

*/

  async function carregarDados() {

    try {

      setDadosCarregando(
        true
      );


      /*
  ==============================
  OBRAS
  ==============================
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


      if (
        obrasError
      ) {

        throw obrasError;

      }



      /*
  ==============================
  EQUIPES
  ==============================
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


      if (
        equipesError
      ) {

        throw equipesError;

      }



      /*
  ==============================
  MEMBROS DAS EQUIPES
  ==============================
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


      if (
        membrosError
      ) {

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
  ==============================
  COLABORADORES
  ==============================
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


      if (
        colaboradoresError
      ) {

        throw colaboradoresError;

      }



      /*
  ==============================
  RDOs
  ==============================
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
      if (
        rdosError
      ) {
        throw rdosError;
      }

      /*
  ATUALIZAR ESTADOS
*/

      setObras(
        obrasData ||
        []
      );
      setEquipes(
        equipesComColaboradores
      );
      setColaboradores(
        colaboradoresData ||
        []
      );
      setRdos(
        rdosData ||
        []
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
    } catch (
      erro
    ) {
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
SAIR
*/

  async function sair() {
    const {
      error
    } =
    await supabase.auth.signOut();
    if (
      error
    ) {
      console.error(
        "Erro ao sair:",
        error
      );
      return;
    }
    setUsuario(
      null
    );
    setTelaAtual(
      "home"
    );
    setObraSelecionada(
      null
    );
    setEncarregadoSelecionado(
      null
    );
    setObras([]);
    setColaboradores([]);
    setEquipes([]);
    setRdos([]);
  }

  /*
NAVEGAÇÃO
*/

  function navegar(
    tela
  ) {
    setTelaAtual(
      tela
    );
  }

  /*
CARREGANDO
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
LOGIN
*/

  if (!usuario) {
    return (
      <Login
        aoEntrar={
        carregarUsuario
        }
        />
    );
  }

  return (
    <AppLayout
      usuario={usuario}
      navegar={navegar}
      sair={sair}
      >
      {renderizarTela()}
    </AppLayout>
  );

  function renderizarTela() {
    if (
      usuario.perfil === "admin"
    ) {
      if (telaAtual === "home") {
        return (
          <HomeAdmin
            usuario={usuario}
            navegar={navegar}
            setEncarregadoSelecionado={
            setEncarregadoSelecionado
            }
            sair={sair}
            />
        );
      }

      if (telaAtual === "gerenciar-obras") {
        return (
          <GerenciarObras
            navegar={navegar}
            sair={sair}
            />
        );
      }

      if (telaAtual === "gerenciar-colaboradores") {
        return (
          <GerenciarColaboradores
            navegar={navegar}
            sair={sair}
            />
        );
      }

      if (telaAtual === "obras-encarregado") {
        return (
          <ObrasEncarregado
            encarregado={encarregadoSelecionado}
            obras={obras}
            navegar={navegar}
            setObraSelecionada={
            setObraSelecionada
            }
            sair={sair}
            />
        );
      }

      if (telaAtual === "consulta-rdo") {
        return (
          <ConsultaRDO
            obra={obraSelecionada}
            rdos={rdos}
            navegar={navegar}
            sair={sair}
            />
        );
      }
      if (telaAtual === "selecionar-rdo") {
        return (
          <SelecionarObraRDO
            obras={obras}
            navegar={navegar}
            setObraSelecionada={setObraSelecionada}
            />
        );
      }
    }

    if (
      usuario.perfil === "encarregado"
    ) {

      if (
        telaAtual === "home"
      ) {
        return (
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
        );
      }

      if (
        telaAtual === "form-rdo"
      ) {
        return (
          <FormRDO
            usuario={usuario}
            obra={obraSelecionada}
            colaboradores={colaboradores}
            equipes={equipes}
            rdos={rdos}
            setRdos={setRdos}
            navegar={navegar}
            sair={sair}
            />
        );
      }
    }
    return null;
  }
}

export default App;