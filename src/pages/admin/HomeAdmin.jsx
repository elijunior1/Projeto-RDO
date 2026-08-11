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
      "pausada"
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


    const {
      data: usuarios,
      error: erroUsuarios
    } = await supabase
    .from("usuarios")
    .select(
      "id, nome, email"
    )
    .eq(
      "perfil",
      "encarregado"
    )
    .eq(
      "ativo",
      true
    );


    if (
      !erroUsuarios
    ) {
      const lista =
      usuarios.map(
        encarregado => {
          const obrasDoEncarregado =
          obras.filter(
            obra =>
            obra.encarregado_id ===
            encarregado.id
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

  return (
    <main className="admin-container">
      <section className="dashboard-grid">
        <div className="card-dashboard">
          <span>
            Obras em andamento
          </span>
          <strong>
            {obrasEmAndamento}
          </strong>
        </div>
        <div className="card-dashboard">
          <span>
            Obras pausadas
          </span>
          <strong>
            {obrasPausadas}
          </strong>
        </div>
        <div className="card-dashboard">
          <span>
            RDOs enviadas hoje
          </span>
          <strong>
            {rdosHoje}
          </strong>
        </div>
        <div className="card-dashboard">
          <span>
            RDOs pendentes
          </span>
          <strong>
            0
          </strong>
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
  );
}


export default HomeAdmin;