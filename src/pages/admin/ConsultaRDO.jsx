import {
  useEffect,
  useState
} from "react";

import {
  supabase
} from "../../supabase.js";

import {
  useNavigate
} from "react-router-dom";


function ConsultaRDO({
  obra
}) {

  const navigate =
    useNavigate();

  const [
    rdos,
    setRdos
  ] = useState([]);

  const [
    carregando,
    setCarregando
  ] = useState(true);


  /*
  ================================================
  CARREGAR RDOs
  ================================================
  */

  useEffect(() => {

    if (!obra?.id) {

      setCarregando(false);

      return;

    }

    carregarRDOs();

  }, [ obra ]);


  async function carregarRDOs() {

    try {

      setCarregando(true);


      const {
        data,
        error
      } =
        await supabase
          .from("rdos")
          .select(`
            id,
            codigo,
            obra_id,
            encarregado_id,
            data,
            observacoes,
            created_at,

            rdo_producao (
              id,
              atividade,
              quantidade
            ),

            rdo_efetivo (
              id,
              colaborador_id,
              presenca,

              rdo_colaboradores (
                id,
                nome,
                tipo
              )
            ),

            rdo_motivos (
              id,
              motivo
            ),

            rdo_materiais (
              id,
              descricao,
              quantidade,
              unidade
            )
          `)
          .eq(
            "obra_id",
            obra.id
          )
          .order(
            "data",
            {
              ascending: false
            }
          );


      if (error) {

        throw error;

      }


      console.log(
        "RDOs carregadas:",
        data
      );


      setRdos(
        data || []
      );


    } catch (erro) {

      console.error(
        "Erro ao carregar RDOs:",
        erro
      );

      alert(
        "Erro ao carregar as RDOs."
      );


    } finally {

      setCarregando(false);

    }

  }


  /*
  ================================================
  FORMATAR DATA
  ================================================
  */

  function formatarData(
    data
  ) {

    if (!data) {

      return "Não informado";

    }


    const [
      ano,
      mes,
      dia
    ] =
      data.split("-");


    return `${dia}/${mes}/${ano}`;

  }


  /*
  ================================================
  ATIVIDADE
  ================================================
  */

  function nomeAtividade(
    atividade
  ) {

    const atividades = {

      escavacao:
        "Escavação",

      concretagem:
        "Concretagem",

      acabamento:
        "Acabamento",

      instalacao_modulo:
        "Instalação de Módulo",

      instalacao_terca:
        "Instalação de Terça",

      instalacao_telha:
        "Instalação de Telha"

    };


    return (
      atividades[ atividade ] ||
      atividade
    );

  }


  /*
  ================================================
  TOTAIS
  ================================================
  */

  function obterTotalProducao(
    rdo
  ) {

    return (
      rdo.rdo_producao || []
    ).reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.quantidade || 0
        ),
      0
    );

  }


  function obterTotalPresentes(
    rdo
  ) {

    return (
      rdo.rdo_efetivo || []
    ).filter(
      efetivo =>
        efetivo.presenca ===
        "presente"
    ).length;

  }


  function obterTotalAusentes(
    rdo
  ) {

    return (
      rdo.rdo_efetivo || []
    ).filter(
      efetivo =>
        efetivo.presenca ===
        "ausente"
    ).length;

  }


  /*
  ================================================
  ABRIR RDO
  ================================================
  */

  function abrirRDO(
    rdo
  ) {

    navigate(
      `/admin/rdo/${rdo.id}`
    );

  }


  /*
  ================================================
  VOLTAR
  ================================================
  */

  function voltar() {

    navigate(
      "/admin/selecionar-rdo"
    );

  }


  /*
  ================================================
  RENDER
  ================================================
  */

  return (

    <main className="app-content">

      {/* ========================================
          CABEÇALHO
      ======================================== */}

      <div className="page-header page-header-rdo">

        <div className="page-title">

          <button
            className="btn btn-ghost"
            onClick={voltar}
          >
            ← Voltar
          </button>


          <h1>
            Consulta RDO
          </h1>


          <p>
            {
              obra?.nome_condominio ||
              "Obra não selecionada"
            }
          </p>

        </div>


        {/* ======================================
            RESUMO
        ====================================== */}

        <div className="obras-resumo">

          <div className="resumo-card">

            <span>
              Total RDOs
            </span>

            <strong>
              {rdos.length}
            </strong>

          </div>


          <div className="resumo-card">

            <span>
              Produção
            </span>

            <strong>

              {
                rdos.reduce(
                  (
                    total,
                    rdo
                  ) =>
                    total +
                    obterTotalProducao(
                      rdo
                    ),
                  0
                )
              }

            </strong>

          </div>


          <div className="resumo-card">

            <span>
              Presentes
            </span>

            <strong>

              {
                rdos.reduce(
                  (
                    total,
                    rdo
                  ) =>
                    total +
                    obterTotalPresentes(
                      rdo
                    ),
                  0
                )
              }

            </strong>

          </div>


          <div className="resumo-card">

            <span>
              Ausentes
            </span>

            <strong>

              {
                rdos.reduce(
                  (
                    total,
                    rdo
                  ) =>
                    total +
                    obterTotalAusentes(
                      rdo
                    ),
                  0
                )
              }

            </strong>

          </div>

        </div>

      </div>


      {/* ========================================
          CARREGANDO
      ======================================== */}

      {carregando && (

        <div className="empty-state">

          <p>
            Carregando RDOs...
          </p>

        </div>

      )}


      {/* ========================================
          NENHUMA RDO
      ======================================== */}

      {!carregando &&
        rdos.length === 0 && (

          <div className="empty-state">

            <p>
              Nenhuma RDO encontrada
              para esta obra.
            </p>

          </div>

        )}


      {/* ========================================
          LISTA DE RDOs
      ======================================== */}

      {!carregando &&
        rdos.length > 0 && (

          <div className="obras-grid">

            {rdos.map(
              rdo => (

                <div
                  className="obra-card"
                  key={rdo.id}
                >

                  <div
                    className="obra-card-header"
                  >

                    <h3>
                      📋 {rdo.codigo || "RDO sem código"}
                    </h3>

                    <span className="rdo-card-data">
                      {formatarData(rdo.data)}
                    </span>


                    <span
                      className="badge badge-success"
                    >
                      RDO
                    </span>

                  </div>


                  <p>
                    🏭 Produção:{" "}
                    {obterTotalProducao(
                      rdo
                    )}{" "}
                    un.
                  </p>


                  <p>
                    👷 Efetivo:{" "}
                    {rdo.rdo_efetivo?.length || 0}
                  </p>


                  <p>
                    ✅ Presentes:{" "}
                    {obterTotalPresentes(
                      rdo
                    )}
                  </p>


                  <p>
                    ❌ Ausentes:{" "}
                    {obterTotalAusentes(
                      rdo
                    )}
                  </p>


                  <div
                    className="obra-card-actions"
                  >

                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        abrirRDO(rdo)
                      }
                    >
                      Ver detalhes
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

    </main>

  );

}


export default ConsultaRDO;