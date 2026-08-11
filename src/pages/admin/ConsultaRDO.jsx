import {
  useEffect,
  useState
} from "react";

import {
  supabase
} from "../../supabase.js";

import RdoPdfTemplate from "../../components/RdoPdfTemplate";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function ConsultaRDO( {
  obra,
  navegar,
  sair,
}) {

  const [
    rdos,
    setRdos
  ] = useState([]);

  const [
    carregando,
    setCarregando
  ] = useState(true);

  const [
    rdoSelecionada,
    setRdoSelecionada
  ] = useState(null);

  useEffect(() => {

    if (
      obra?.id
    ) {

      carregarRDOs();

    }

  },
    [obra]);

  async function carregarRDOs() {

    try {

      setCarregando(
        true
      );


      const {
        data,
        error
      } = await supabase

      .from(
        "rdos"
      )

      .select(`
        id,
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


      if (
        error
      ) {

        throw error;

      }


      console.log(
        "RDOs carregadas:",
        data
      );


      setRdos(
        data ||
        []
      );


    } catch (
      erro
    ) {

      console.error(
        "Erro ao carregar RDOs:",
        erro
      );


      alert(
        "Erro ao carregar as RDOs."
      );


    } finally {

      setCarregando(
        false
      );

    }

  }

  function formatarData(
    data
  ) {

    if (
      !data
    ) {

      return "Não informado";

    }


    const [
      ano,
      mes,
      dia
    ] =
    data.split(
      "-"
    );


    return `${dia}/${mes}/${ano}`;

  }

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
      "Instalação de Telha",

    };


    return atividades[
      atividade
    ] ||
    atividade;

  }

  function nomeMotivo(
    motivo
  ) {

    const motivos = {

      chuva:
      "Chuva",

      falta_equipamento:
      "Falta de equipamento",

      falta_material:
      "Falta de material",

      falta_mao_de_obra:
      "Falta de mão de obra",

      condicoes_climaticas:
      "Condições climáticas",

      interferencia_terceiros:
      "Interferência de terceiros",

      retrabalho:
      "Retrabalho",

      outros:
      "Outros",

    };


    return motivos[
      motivo
    ] ||
    motivo;

  }

  function obterTotalProducao(
    rdo
  ) {

    return (
      rdo.rdo_producao ||
      []
    ).reduce(
      (
        total,
        item
      ) =>
      total +
      Number(
        item.quantidade ||
        0
      ),
      0
    );

  }

  function obterTotalPresentes(
    rdo
  ) {

    return (
      rdo.rdo_efetivo ||
      []
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
      rdo.rdo_efetivo ||
      []
    ).filter(
      efetivo =>
      efetivo.presenca ===
      "ausente"
    ).length;

  }

  async function gerarPDF() {
    try {
      const elemento =
      document.getElementById("rdo-pdf");

      const canvas =
      await html2canvas(
        elemento,
        {
          scale: 2
        }
      );

      const imagem =
      canvas.toDataURL(
        "image/png"
      );

      const pdf =
      new jsPDF( {
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      pdf.addImage(
        imagem,
        "PNG",
        5,
        5,
        287,
        200
      );

      pdf.save(
        `RDO-${obra.nome_condominio}-${rdoSelecionada.data}.pdf`
      );

    } catch (erro) {
      console.error(erro);
      alert(
        "Erro ao gerar PDF"
      );
    }
  }

  return (
    <div className="app-layout">
      <main className="app-content">
        {carregando && (
          <div className="empty-state">
            <p>
              Carregando RDOs...
            </p>
          </div>
        )}
        <div className="page-header page-header-rdo">
          <div className="page-title">

            <button
              className="btn btn-ghost"
              onClick={() =>
              navegar("obras-encarregado")
              }
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

          <div className="obras-resumo">

            <div className="resumo-card">
              <span>Total RDOs</span>
              <strong>{rdos.length}</strong>
            </div>

            <div className="resumo-card">
              <span>Produção</span>
              <strong>
                {
                rdos.reduce(
                  (total, rdo) =>
                  total + obterTotalProducao(rdo),
                  0
                )
                }
              </strong>
            </div>

            <div className="resumo-card">
              <span>Presentes</span>
              <strong>
                {
                rdos.reduce(
                  (total, rdo) =>
                  total + obterTotalPresentes(rdo),
                  0
                )
                }
              </strong>
            </div>

            <div className="resumo-card">
              <span>Ausentes</span>
              <strong>
                {
                rdos.reduce(
                  (total, rdo) =>
                  total + obterTotalAusentes(rdo),
                  0
                )
                }
              </strong>
            </div>

          </div>

        </div>


        {
        !carregando && rdos.length === 0 ? (

          <div className="empty-state">

            <p>
              Nenhuma RDO encontrada para esta obra.
            </p>

          </div>

        ): (

          <div className="obras-grid">

            {
            rdos.map(
              rdo => (

                <div
                  className="obra-card"
                  key={rdo.id}
                  >

                  <div className="obra-card-header">

                    <h3>
                      📋 {formatarData(rdo.data)}
                    </h3>

                    <span className="badge badge-success">
                      RDO
                    </span>

                  </div>

                  <p>
                    🏭 Produção:
                    {" "}
                    {obterTotalProducao(rdo)}
                    {" "}
                    un.
                  </p>

                  <p>
                    👷 Efetivo:
                    {" "}
                    {rdo.rdo_efetivo?.length || 0}
                  </p>

                  <p>
                    ✅ Presentes:
                    {" "}
                    {obterTotalPresentes(rdo)}
                  </p>

                  <p>
                    ❌ Ausentes:
                    {" "}
                    {obterTotalAusentes(rdo)}
                  </p>

                  <div className="obra-card-actions">

                    <button
                      className="btn btn-primary"
                      onClick={() =>
                      setRdoSelecionada(rdo)
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


        {rdoSelecionada && (

          <div className="modal-overlay">

            <div className="modal-card">

              <div className="rdo-modal-header">

                <div>

                  <h2>
                    📋 RDO de {formatarData(rdoSelecionada.data)}
                  </h2>

                  <p>
                    {obra?.nome_condominio}
                  </p>

                </div>

                <div className="header-actions">

                  <button
                    className="btn btn-primary"
                    onClick={() => gerarPDF(rdoSelecionada)}
                    >
                    📄 PDF
                  </button>

                  <button
                    className="btn btn-danger"
                    onClick={() => setRdoSelecionada(null)}
                    >
                    ✕
                  </button>

                </div>

              </div>

              <div className="rdo-stats">

                <div className="rdo-stat-card">
                  <span>Produção</span>
                  <strong>{obterTotalProducao(rdoSelecionada)}</strong>
                </div>

                <div className="rdo-stat-card">
                  <span>Presentes</span>
                  <strong>{obterTotalPresentes(rdoSelecionada)}</strong>
                </div>

                <div className="rdo-stat-card">
                  <span>Ausentes</span>
                  <strong>{obterTotalAusentes(rdoSelecionada)}</strong>
                </div>

              </div>

              <section className="modal-section">

                <h3>🏗 Produção</h3>

                {rdoSelecionada.rdo_producao?.length === 0 ? (

                  <p>
                    Nenhuma produção registrada.
                  </p>

                ): (

                  <div className="lista-detalhes">

                    {rdoSelecionada.rdo_producao.map(
                      producao => (

                        <div
                          key={producao.id}
                          className="item-detalhe"
                          >

                          <span>
                            {nomeAtividade(
                              producao.atividade
                            )}
                          </span>

                          <strong>
                            {producao.quantidade}
                          </strong>

                        </div>

                      )
                    )}

                  </div>

                )}

              </section>

              <section className="modal-section">

                <hr />

              <h3>
                Materiais enviados
              </h3>

              {
              rdoSelecionada.rdo_materiais?.length === 0 ? (

                <p>
                  Nenhum material registrado.
                </p>

              ): (

                <table className="materiais-table">

                  <thead>
                    <tr>
                      <th>Material</th>
                      <th>Quantidade</th>
                      <th>Unidade</th>
                    </tr>
                  </thead>

                  <tbody>

                    {rdoSelecionada.rdo_materiais.map(material => (

                      <tr key={material.id}>

                        <td>
                          {material.descricao}
                        </td>

                        <td>
                          {material.quantidade}
                        </td>

                        <td>
                          {material.unidade}
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              )
              }

              <hr />

            <div className="rdo-section">

              <h3>
                👷 Efetivo
              </h3>

              {rdoSelecionada.rdo_efetivo?.length === 0 ? (

                <p>
                  Nenhum efetivo registrado.
                </p>

              ): (

                <div className="efetivo-lista-modal">

                  {rdoSelecionada.rdo_efetivo.map((efetivo) => (

                    <div
                      key={efetivo.id}
                      className="efetivo-row"
                      >

                      <div className="efetivo-nome">

                        <span>
                          {efetivo.presenca === "presente"
                          ? "🟢": "🔴"}
                        </span>

                        <span>
                          {
                          efetivo.rdo_colaboradores?.nome ||
                          "Colaborador"
                          }
                        </span>

                      </div>

                      <span
                        className={
                        efetivo.presenca === "presente"
                        ? "status-presente": "status-ausente"
                        }
                        >
                        {efetivo.presenca === "presente"
                        ? "Presente": "Ausente"}
                      </span>

                    </div>

                  ))}

                </div>

              )}

            </div>

          </section>

          <section className="modal-section">

            <h3>⚠️ Baixa produtividade</h3>

            {rdoSelecionada.rdo_motivos?.length === 0 ? (

              <p>
                Nenhuma ocorrência registrada.
              </p>

            ): (

              <div className="lista-detalhes">

                {rdoSelecionada.rdo_motivos.map(
                  motivo => (

                    <div
                      key={motivo.id}
                      className="item-detalhe"
                      >

                      <span>
                        {nomeMotivo(
                          motivo.motivo
                        )}
                      </span>

                    </div>

                  )
                )}

              </div>

            )}

          </section>

          {rdoSelecionada.observacoes && (

            <section className="modal-section">

              <h3>📝 Observações</h3>

              <div className="observacoes-box">

                {rdoSelecionada.observacoes}

              </div>

            </section>

          )}

        </div>

      </div>

    )}

    <div
      style={ {
        position: "absolute",
        left: "-9999px",
        top: 0
      }}
      >
      {rdoSelecionada && (
        <RdoPdfTemplate
          obra={obra}
          rdo={rdoSelecionada}
          />
      )}
    </div>

  </main>

</div>

);

}

export default ConsultaRDO;