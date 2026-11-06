import {
  useEffect,
  useState
} from "react";

import {
  supabase
} from "../../supabase.js";

import "./HomeAdmin.css";

function HomeAdmin( {
  usuario,
  navegar,
  setEncarregadoSelecionado,
  sair,
}) {
  const [
    carregando,
    setCarregando
  ] = useState(true);


  const [
    obrasEmAndamento,
    setObrasEmAndamento
  ] = useState(0);


  const [
    obrasPausadas,
    setObrasPausadas
  ] = useState(0);


  const [
    rdosHoje,
    setRdosHoje
  ] = useState(0);


  const [
    encarregados,
    setEncarregados
  ] = useState([]);


  useEffect(() => {
    carregarDashboard();
  }, []);


  async function carregarDashboard() {
    setCarregando(true);


    const {
      data: obras,
      error: erroObras
    } = await supabase
    .from("rdo_obras")
    .select(
      "id, nome_condominio, status, encarregado_id"
    );


    if (erroObras) {
      console.error(
        "Erro ao carregar obras:",
        erroObras
      );

      setCarregando(false);

      return;
    }


    const emAndamento =
    obras.filter(
      obra =>
      obra.status ===
      "em_andamento"
    );


    const pausadas =
    obras.filter(
      obra =>
      obra.status ===
      "paralisada"
    );


    setObrasEmAndamento(
      emAndamento.length
    );


    setObrasPausadas(
      pausadas.length
    );


    const hoje =
    new Date()
    .toISOString()
    .split("T")[0];


    const {
      data: rdos,
      error: erroRdos
    } = await supabase
    .from("rdos")
    .select("id")
    .eq(
      "data",
      hoje
    );


    if (
      !erroRdos
    ) {
      setRdosHoje(
        rdos.length
      );
    }


    let vinculosEncarregados = [];
    try {
      const { data: vinculosData } = await supabase
        .from("rdo_obra_encarregados")
        .select("obra_id, encarregado_id");
      vinculosEncarregados = vinculosData || [];
    } catch (ignorar) {
      vinculosEncarregados = [];
    }

    const {
      data: usuarios,
      error: erroUsuarios
    } = await supabase
    .from("usuarios")
    .select(
      "id, nome, email, perfil, ativo"
    )
    .order(
      "nome",
      {
        ascending: true
      }
    );


    if (
      !erroUsuarios
    ) {
      // O usuário de pintura TAMBÉM é encarregado: ele entra no
      // contador do dashboard e na lista abaixo. Filtramos no JS
      // (e não só no banco) para não perder quem tem perfil com
      // maiúscula/espço ou ativo nulo (cadastrado sem flag).
      const candidatos = (usuarios || []).filter(
        (usuarioItem) => {
          const perfilNormalizado = String(
            usuarioItem.perfil || ""
          )
            .toLowerCase()
            .trim();

          // Aceita variações comuns: "pintura", "pintor",
          // "encarregado_pintura", "encarregado-pintura", etc.
          const ehEncarregado = [
            "encarregado",
            "pintura"
          ].includes(
            perfilNormalizado
          ) ||
            perfilNormalizado.includes("pintura") ||
            perfilNormalizado.includes("pintor") ||
            perfilNormalizado.includes("encarregado");

          // Só exclui quem foi explicitamente desativado.
          // ativo = null conta como ativo.
          const estaAtivo =
            usuarioItem.ativo !== false;

          return (
            ehEncarregado &&
            estaAtivo
          );
        }
      );
      const lista =
      candidatos.map(
        encarregado => {
          const obrasDoEncarregado =
          obras.filter(
            obra =>
            obra.encarregado_id ===
            encarregado.id ||
            vinculosEncarregados.some(
              v => v.obra_id === obra.id && v.encarregado_id === encarregado.id
            )
          );


          return {
            ...encarregado,

            obrasAtribuidas:
            obrasDoEncarregado.length,

            obras:
            obrasDoEncarregado,
          };
        }
      );


      setEncarregados(
        lista
      );
    } else {
      console.error(
        "Erro ao carregar encarregados:",
        erroUsuarios
      );
    }


    setCarregando(false);
  }


  function abrirObrasDoEncarregado(
    encarregado
  ) {
    setEncarregadoSelecionado(
      encarregado
    );

    navegar(
      "obras-encarregado"
    );
  }

  function obterSaudacao() {

    const hora = new Date().getHours();

    if (hora < 12) {
      return "Bom dia";
    }

    if (hora < 18) {
      return "Boa tarde";
    }

    return "Boa noite";

  }

  return (
    <>
      <div className="admin-banner">

        <div className="admin-banner-content">

          <div>

            <h2>
              👋 {obterSaudacao()}, {usuario.nome}
            </h2>

            <p>
              Bem-vindo ao painel administrativo do RDO Gestão.
            </p>

            <small>
              Acompanhe obras, colaboradores e relatórios em tempo real.
            </small>

          </div>

          <div className="admin-banner-icon">
            📊
          </div>

        </div>

      </div>
      <main className="admin-container">
        <section className="dashboard-grid">

          <div className="dashboard-card">
            <div className="dashboard-icon">
              🏗
            </div>

            <span className="dashboard-label">
              Obras em andamento
            </span>

            <div className="dashboard-number">
              {obrasEmAndamento}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-icon">
              ⏸️
            </div>

            <span className="dashboard-label">
              Obras pausadas
            </span>

            <div className="dashboard-number">
              {obrasPausadas}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-icon">
              📋
            </div>

            <span className="dashboard-label">
              RDOs hoje
            </span>

            <div className="dashboard-number">
              {rdosHoje}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-icon">
              👷
            </div>

            <span className="dashboard-label">
              Encarregados
            </span>

            <div className="dashboard-number">
              {encarregados.length}
            </div>
          </div>

        </section>
        <section className="acoes">
          <h2>
            Ações rápidas
          </h2>
          <div className="acoes-grid">
            <button
              onClick={() =>
              navegar(
                "gerenciar-obras"
              )
              }
              >
              🏗
              <span>
                Gerenciar Obras
              </span>
            </button>

            <button
              onClick={() =>
              navegar(
                "gerenciar-colaboradores"
              )
              }
              >
              👷
              <span>
                Colaboradores
              </span>
            </button>

            <button
              onClick={() =>
              navegar(
                "selecionar-rdo"
              )
              }
              >
              📋
              <span>
                Consultar RDO
              </span>
            </button>
          </div>
        </section>
        <section className="encarregados">
          <h2>
            Encarregados
          </h2>
          <div className="encarregados-grid">
            {
            encarregados.map(
              encarregado => (
                <article
                  className="card-encarregado"
                  key={
                  encarregado.id
                  }
                  >
                  <h3>
                    {encarregado.nome}
                  </h3>
                  <p>
                    {
                      String(
                        encarregado.perfil || ""
                      )
                        .toLowerCase()
                        .trim() === "pintura"
                        ? "🎨 Pintura"
                        : "🏗 Encarregado"
                    }
                  </p>
                  <p>
                    Obras:
                    {
                    encarregado.obrasAtribuidas
                    }
                  </p>
                  <button
                    onClick={() =>
                    abrirObrasDoEncarregado(
                      encarregado
                    )
                    }
                    >
                    Ver obras
                  </button>
                </article>
              )
            )
            }
          </div>
        </section>
      </main>
    </>
  );
}


export default HomeAdmin;