import {
  useMemo,
  useState
} from "react";

import "./HomeEncarregado.css";

function HomeEncarregado( {
  usuario,
  obras,
  rdos,
  navegar,
  setObraSelecionada,
}) {

  const [buscaObra,
    setBuscaObra] = useState("");

  const dataHoje = new Date()
  .toISOString()
  .split("T")[0];

  const minhasObras = useMemo(
    () =>
    obras.filter(
      obra =>
      String(obra.encarregado_id) === String(usuario.id) &&
      obra.status === "em_andamento"
    ),
    [obras, usuario.id]
  );
  const obrasFiltradas = useMemo(
    () =>
    minhasObras
    .filter(
      obra =>
      obra.nome_condominio
      ?.toLowerCase()
      .includes(
        buscaObra.toLowerCase()
      )
    )
    .sort((a, b) => {

      const aTemRdo =
      rdos.some(
        rdo =>
        String(rdo.obra_id) === String(a.id) &&
        rdo.data === dataHoje
      );

      const bTemRdo =
      rdos.some(
        rdo =>
        String(rdo.obra_id) === String(b.id) &&
        rdo.data === dataHoje
      );

      return aTemRdo - bTemRdo;

    }),
    [
      minhasObras,
      buscaObra,
      rdos,
      dataHoje
    ]
  );

  const rdosDeHoje = rdos.filter(rdo => {

    const obraPertenceAoEncarregado =
    minhasObras.some(
      obra =>
      String(obra.id) ===
      String(rdo.obra_id)
    );

    return (
      obraPertenceAoEncarregado &&
      rdo.data === dataHoje
    );
  });

  const rdosEnviadasHoje =
  rdosDeHoje.length;

  const rdosPendentes =
  Math.max(
    minhasObras.length -
    rdosEnviadasHoje,
    0
  );

  const percentualConclusao =
  minhasObras.length === 0
  ? 0: Math.round(
    (rdosEnviadasHoje * 100) /
    minhasObras.length
  );

  function obraTemRDOHoje(
    obraId
  ) {

    return rdos.some(
      rdo =>
      String(rdo.obra_id) ===
      String(obraId) &&
      rdo.data === dataHoje
    );

  }

  function abrirFormulario(
    obra
  ) {

    setObraSelecionada(
      obra
    );

    navegar(
      "form-rdo"
    );

  }

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
    ] = data.split("-");

    return `${dia}/${mes}/${ano}`;

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
      <div className="page-header">

        <div>

          <h1>
            Minhas Obras
          </h1>

          <p>
            Acompanhe suas obras e envie os RDOs diariamente.
          </p>

        </div>

      </div>

      <div className="encarregado-banner">

        <div className="encarregado-banner-content">

          <div>

            <h2>
              👋 {obterSaudacao()}, {usuario.nome}
            </h2>

            <p>
              {rdosPendentes} RDO(s) aguardando preenchimento.
            </p>

            <small>
              {rdosEnviadasHoje} de {minhasObras.length} obra(s) concluída(s) hoje.
            </small>

          </div>

          <div className="encarregado-banner-icon">
            🏗️
          </div>

        </div>

      </div>

      <div className="progresso-dia">

        <div className="progresso-header">

          <span>Conclusão do dia</span>

          <strong>
            {percentualConclusao}%
          </strong>

        </div>

        <div className="progresso-barra">

          <div
            className="progresso-preenchido"
            style={ {
              width: `${percentualConclusao}%`
            }}
            />

        </div>

      </div>

      <section className="dashboard-grid">

        <div className="dashboard-card">

          <div className="dashboard-icon">
            🏗
          </div>

          <div>

            <h3>Obras</h3>

            <div className="dashboard-number">
              {minhasObras.length}
            </div>

          </div>

        </div>

        <div className="dashboard-card">

          <div className="dashboard-icon">
            📋
          </div>

          <div>

            <h3>Enviadas</h3>

            <div className="dashboard-number">
              {rdosEnviadasHoje}
            </div>

          </div>

        </div>

        <div className="dashboard-card">

          <div className="dashboard-icon">
            ⚠️
          </div>

          <div>

            <h3>Pendentes</h3>

            <div className="dashboard-number">
              {rdosPendentes}
            </div>

          </div>

        </div>

        <div className="dashboard-card">

          <div className="dashboard-icon">
            📈
          </div>

          <div>

            <h3>Conclusão</h3>

            <div className="dashboard-number">
              {percentualConclusao}%
            </div>

          </div>

        </div>

      </section>

      <section className="section">

        <div className="section-header">

          <h2>
            Obras em andamento
          </h2>

          <span>
            {obrasFiltradas.length} obra(s)
          </span>

        </div>

        <div className="busca-obras">

          <span className="busca-icone">
            🔍
          </span>

          <input
          type="text"
          placeholder="Buscar obra pelo nome..."
          value={buscaObra}
          onChange={(event) =>
          setBuscaObra(
            event.target.value
          )
          }
          />

      </div>

      {obrasFiltradas.length === 0 ? (

        <div className="empty-state">

          <p>
            Nenhuma obra encontrada.
          </p>

        </div>

      ): (

        <div className="cards-grid">

          {obrasFiltradas.map(
            obra => {

              const rdoEnviadaHoje =
              obraTemRDOHoje(
                obra.id
              );

              return (

                <article
                  className="card obra-card"
                  key={obra.id}
                  >

                  <div className="obra-card-header">

                    <div>

                      <h3>{obra.nome_condominio}</h3>

                    </div>

                    <span
                      className={
                      rdoEnviadaHoje
                      ? "status-enviado": "status-pendente"
                      }
                      >
                      {rdoEnviadaHoje
                      ? "🟢 Enviado": "🔴 Pendente"}
                    </span>

                  </div>

                  <div className="obra-info">

                    <p>
                      📍 {obra.endereco}
                    </p>

                    <p>
                      📅 {formatarData(
                        obra.data_inicio
                      )}
                      {" até "}
                      {formatarData(
                        obra.data_finalizacao
                      )}
                    </p>

                    {obra.equipe && (
                      <p>
                        👷 {obra.equipe.nome}
                      </p>
                    )}

                  </div>

                  <div className="card-actions">

                    {rdoEnviadaHoje ? (

                      <button
                        className="btn btn-secondary"
                        disabled
                        >
                        ✓ RDO enviada hoje
                      </button>

                    ): (

                      <button
                        className="btn btn-primary"
                        onClick={() =>
                        abrirFormulario(obra)
                        }
                        >
                        Preencher RDO
                      </button>
                    )}
                  </div>
                </article>
              );

            }
          )}

        </div>

      )}

    </section>

  </>
);

}

export default HomeEncarregado;