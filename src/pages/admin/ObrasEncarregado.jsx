import {
  useEffect,
  useState
} from "react";

import {
  supabase
} from "../../supabase.js";

function ObrasEncarregado( {
  encarregado,
  navegar,
  setObraSelecionada,
  sair,
}) {

  const [
    obras,
    setObras
  ] = useState([]);

  const [
    carregando,
    setCarregando
  ] = useState(true);

  /*

CARREGAR OBRAS DO ENCARREGADO

*/

  useEffect(() => {

    if (
      encarregado?.id
    ) {

      carregarObras();

    }

  },
    [
      encarregado
    ]);

  async function carregarObras() {

    try {

      setCarregando(
        true
      );


      const {
        data,
        error
      } = await supabase
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
      .eq(
        "encarregado_id",
        encarregado.id
      )
      .order(
        "nome_condominio",
        {
          ascending: true
        }
      );


      if (
        error
      ) {

        throw error;

      }


      setObras(
        data ||
        []
      );


    } catch (
      erro
    ) {

      console.error(
        "Erro ao carregar obras do encarregado:",
        erro
      );


      alert(
        "Erro ao carregar as obras."
      );


    } finally {

      setCarregando(
        false
      );

    }

  }

  /*

ABRIR CONSULTA DE RDO

*/

  function abrirRDO(
    obra
  ) {

    setObraSelecionada(
      obra
    );


    navegar(
      "consulta-rdo"
    );

  }
  /*
TELA
*/

  return (

    <div className="app-layout">
      <main className="app-content">
        <div className="page-header encarregado-header">
          <div>
            <div className="page-title">

              <button
                className="btn btn-ghost"
                onClick={() => navegar("home")}
                >
                ← Voltar
              </button>

              <h1>
                Obras de {encarregado?.nome}
              </h1>

              <p>
                Obras atribuídas a este encarregado.
              </p>

            </div>

          </div>
          <div className="obras-resumo">
            <div className="resumo-card">
              <span>Total</span>
              <strong>{obras.length}</strong>
            </div>

            <div className="resumo-card">
              <span>Em andamento</span>
              <strong>
                {
                obras.filter(
                  obra => obra.status === "em_andamento"
                ).length
                }
              </strong>
            </div>

            <div className="resumo-card">
              <span>Paralisadas</span>
              <strong>
                {
                obras.filter(
                  obra => obra.status === "paralisada"
                ).length
                }
              </strong>
            </div>

          </div>
        </div>

        <section className="section">

          <div className="section-header">

            <h2>
              Obras atribuídas
            </h2>


            <span>
              {
              obras.length
              } obra(s)
            </span>

          </div>


          {
          obras.length ===
          0
          ? (

            <div className="empty-state">

              <p>
                Nenhuma obra atribuída a este encarregado.
              </p>


              <p>
                Verifique se o encarregado foi corretamente associado à obra.
              </p>

            </div>

          ): (

            <div className="obras-grid">

              {obras.map((obra) => (

                <div
                  className="obra-card"
                  key={obra.id}
                  >

                  <div className="obra-card-header">

                    <h3>
                      🏗 {obra.nome_condominio}
                    </h3>

                    <span
                      className={
                      obra.status === "em_andamento"
                      ? "badge badge-success": obra.status === "paralisada"
                      ? "badge badge-warning": "badge badge-secondary"
                      }
                      >
                      {
                      obra.status === "em_andamento"
                      ? "Em andamento": obra.status === "paralisada"
                      ? "Paralisada": "Finalizada"
                      }
                    </span>

                  </div>

                  <p>
                    📍 {obra.endereco}
                  </p>

                  <p>
                    👥 {obra.equipe?.nome || "Sem equipe"}
                  </p>

                  <div className="obra-card-actions">

                    <button
                      className="btn btn-primary"
                      onClick={() => abrirRDO(obra)}
                      >
                      📋 Ver RDOs
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

      </main>

    </div>

  );

}



export default ObrasEncarregado;