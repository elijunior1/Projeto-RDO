import {
  useMemo,
  useState
} from "react";

import { lerFila } from "../../services/filaOffline.js";

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

  const dataHoje = (() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  })();

  const minhasObras = useMemo(
    () =>
    obras.filter(
      obra =>
      (String(obra.encarregado_id) === String(usuario.id) ||
        (obra.encarregadosIds || []).map(String).includes(String(usuario.id))) &&
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
        String(rdo.encarregado_id) === String(usuario.id) &&
        rdo.data === dataHoje
      );

      const bTemRdo =
      rdos.some(
        rdo =>
        String(rdo.obra_id) === String(b.id) &&
        String(rdo.encarregado_id) === String(usuario.id) &&
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
      String(rdo.encarregado_id) === String(usuario.id) &&
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
      String(rdo.encarregado_id) === String(usuario.id) &&
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
      <div className="encarregado-banner compacto">

        <div>
          <h2>
            👋 {obterSaudacao()}, {usuario.nome}
          </h2>
          <p>
            {rdosPendentes} RDO(s) pendente(s) · {rdosEnviadasHoje}/{minhasObras.length} enviada(s) hoje
          </p>
        </div>

        <div className="encarregado-banner-icon">
          🏗️
        </div>

      </div>

      {lerFila().length > 0 && (
        <div className="alerta-offline">
          ⏳ {lerFila().length} RDO(s) salva(s) neste aparelho aguardando internet para envio.
        </div>
      )}

      <div className="progresso-dia compacto">

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

      <div className="busca-obras">

        <span className="busca-icone">
          🔍
        </span>

        <input
        type="text"
        placeholder="Buscar obra..."
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

      <div className="obra-lista">

        {obrasFiltradas.map(
          obra => {

            const rdoEnviadaHoje =
            obraTemRDOHoje(
              obra.id
            );

            return (

              <article
                className="obra-linha"
                key={obra.id}
                >

                <div className="obra-linha-info">

                  <h3>{obra.nome_condominio}</h3>

                  <small>
                    📍 {obra.endereco || ""}
                    {obra.equipe ? ` · 👷 ${obra.equipe.nome}` : ""}
                  </small>

                </div>

                <div className="obra-linha-acao">

                  <span
                    className={
                    rdoEnviadaHoje
                    ? "status-enviado": "status-pendente"
                    }
                    >
                    {rdoEnviadaHoje
                    ? "🟢 Enviado": "🔴 Pendente"}
                  </span>

                  {rdoEnviadaHoje ? (

                    <button
                      className="btn btn-secondary btn-rdo"
                      disabled
                      >
                      ✓ Enviada
                    </button>

                  ): (

                    <button
                      className="btn btn-primary btn-rdo"
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

  </>
);

}

export default HomeEncarregado;
