import {
  useEffect,
  useState
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import {
  supabase
} from "../../supabase.js";

import RdoPdfTemplate from "../../components/RdoPdfTemplate";

import jsPDF from "jspdf";

import html2canvas from "html2canvas";

import "./DetalhesRDO.css";


function DetalhesRDO() {

  const {
    id
  } = useParams();

  const navigate =
    useNavigate();


  const [
    rdo,
    setRdo
  ] = useState(null);


  const [
    obra,
    setObra
  ] = useState(null);


  const [
    carregando,
    setCarregando
  ] = useState(true);


  /*
  ================================================
  CARREGAR RDO
  ================================================
  */

  useEffect(() => {

    if (!id) {

      return;

    }

    carregarRDO();

  }, [ id ]);


  async function carregarRDO() {

    try {

      setCarregando(true);


      /*
      ==============================
      RDO
      ==============================
      */

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
            "id",
            id
          )
          .single();


      if (error) {

        throw error;

      }


      setRdo(data);


      /*
      ==============================
      OBRA
      ==============================
      */

      if (data?.obra_id) {

        const {
          data: obraData,
          error: obraError
        } =
          await supabase
            .from("rdo_obras")
            .select(`
      *,
      equipe:rdo_equipes!rdo_obras_equipe_id_fkey (
        id,
        nome
      ),
      encarregado:usuarios!rdo_obras_encarregado_id_fkey (
        id,
        nome
      )
    `)
            .eq(
              "id",
              data.obra_id
            )
            .single();


        if (obraError) {

          throw obraError;

        }


        setObra(
          obraData
        );

      }


    } catch (erro) {

      console.error(
        "Erro ao carregar RDO:",
        erro
      );

      alert(
        "Não foi possível carregar esta RDO."
      );

      navigate(
        "/admin/selecionar-rdo"
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
  MOTIVO
  ================================================
  */

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
        "Outros"

    };


    return (
      motivos[ motivo ] ||
      motivo
    );

  }


  /*
  ================================================
  TOTAIS
  ================================================
  */

  function totalProducao() {

    return (
      rdo?.rdo_producao || []
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


  function totalPresentes() {

    return (
      rdo?.rdo_efetivo || []
    ).filter(
      item =>
        item.presenca ===
        "presente"
    ).length;

  }


  function totalAusentes() {

    return (
      rdo?.rdo_efetivo || []
    ).filter(
      item =>
        item.presenca ===
        "ausente"
    ).length;

  }


  /*
================================================
GERAR PDF
================================================
*/

  async function gerarPDF() {

    try {

      const elemento =
        document.getElementById(
          "rdo-pdf"
        );


      if (!elemento) {

        alert(
          "Não foi possível encontrar o modelo da RDO."
        );

        return;

      }


      const canvas =
        await html2canvas(
          elemento,
          {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff"
          }
        );


      const imagem =
        canvas.toDataURL(
          "image/png"
        );


      const pdf =
        new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4"
        });


      const larguraPagina =
        297;

      const alturaPagina =
        210;

      const margem =
        5;


      const largura =
        larguraPagina -
        margem * 2;


      const altura =
        (
          canvas.height /
          canvas.width
        ) *
        largura;


      pdf.addImage(
        imagem,
        "PNG",
        margem,
        margem,
        largura,
        Math.min(
          altura,
          alturaPagina - margem * 2
        )
      );


      const nomeObra =
        obra?.nome_condominio ||
        "obra";


      const nomeArquivo =
        `${rdo.codigo || "RDO"}-${nomeObra}-${rdo.data}.pdf`;

      pdf.save(
        nomeArquivo
      );


    } catch (erro) {

      console.error(
        "Erro ao gerar PDF:",
        erro
      );


      alert(
        "Erro ao gerar PDF."
      );

    }

  }


  /*
  ================================================
  CARREGANDO
  ================================================
  */

  if (carregando) {

    return (

      <main className="app-content">

        <div className="empty-state">

          <p>
            Carregando RDO...
          </p>

        </div>

      </main>

    );

  }


  /*
  ================================================
  RENDER
  ================================================
  */

  if (!rdo) {

    return null;

  }


  return (

    <main className="detalhes-rdo-page">

      {/* ==================================================
        CABEÇALHO
    ================================================== */}

      <div className="detalhes-rdo-header">

        <div className="detalhes-rdo-titulo">

          <button
            className="btn btn-ghost"
            onClick={() => navigate(-1)}
          >
            ← Voltar
          </button>

          <div>

            <span className="detalhes-rdo-label">
              RELATÓRIO DIÁRIO DE OBRA
            </span>

            <h1>
              RDO de {formatarData(rdo.data)}
            </h1>

            <p>
              🏗 {obra?.nome_condominio || "Obra não identificada"}
            </p>

          </div>

        </div>


        <div className="detalhes-rdo-acoes">

          <button
            className="btn btn-primary"
            onClick={gerarPDF}
          >
            📄 Gerar PDF
          </button>

        </div>

      </div>


      {/* ==================================================
        IDENTIFICAÇÃO
    ================================================== */}

      <section className="rdo-info-grid">

        <div className="rdo-info-card">

          <span>
            📅 Data
          </span>

          <strong>
            {formatarData(rdo.data)}
          </strong>

        </div>


        <div className="rdo-info-card">

          <span>
            🏗 Obra
          </span>

          <strong>
            {obra?.nome_condominio || "Não informado"}
          </strong>

        </div>


        <div className="rdo-info-card">

          <span>
            📋 Código da RDO
          </span>

          <strong className="codigo-rdo">
            {rdo.codigo || "Sem código"}
          </strong>
        </div>

      </section>


      {/* ==================================================
        RESUMO DO DIA
    ================================================== */}

      <section className="rdo-resumo-section">

        <div className="section-heading">

          <div>

            <span>
              RESUMO
            </span>

            <h2>
              Desempenho do dia
            </h2>

          </div>

        </div>


        <div className="rdo-stats">

          <div className="rdo-stat-card">

            <span>
              🏭 Produção
            </span>

            <strong>
              {totalProducao()}
            </strong>

            <small>
              unidades
            </small>

          </div>


          <div className="rdo-stat-card">

            <span>
              🟢 Presentes
            </span>

            <strong>
              {totalPresentes()}
            </strong>

            <small>
              colaboradores
            </small>

          </div>


          <div className="rdo-stat-card">

            <span>
              🔴 Ausentes
            </span>

            <strong>
              {totalAusentes()}
            </strong>

            <small>
              colaboradores
            </small>

          </div>


          <div className="rdo-stat-card">

            <span>
              👷 Efetivo
            </span>

            <strong>
              {rdo.rdo_efetivo?.length || 0}
            </strong>

            <small>
              total
            </small>

          </div>

        </div>

      </section>


      {/* ==================================================
        PRODUÇÃO E MATERIAIS
    ================================================== */}

      <div className="rdo-duas-colunas">


        {/* PRODUÇÃO */}

        <section className="rdo-detalhe-card">

          <div className="detalhe-card-header">

            <div>

              <span>
                PRODUÇÃO
              </span>

              <h2>
                🏗 Atividades realizadas
              </h2>

            </div>

            <strong>
              {totalProducao()} un.
            </strong>

          </div>


          {rdo.rdo_producao?.length === 0 ? (

            <div className="rdo-vazio">

              Nenhuma produção registrada.

            </div>

          ) : (

            <div className="lista-rdo">

              {rdo.rdo_producao.map(
                producao => (

                  <div
                    key={producao.id}
                    className="linha-rdo"
                  >

                    <div>

                      <span className="linha-rdo-icone">
                        🏗
                      </span>

                      <span>
                        {nomeAtividade(
                          producao.atividade
                        )}
                      </span>

                    </div>

                    <strong>
                      {producao.quantidade} un.
                    </strong>

                  </div>

                )
              )}

            </div>

          )}

        </section>


        {/* MATERIAIS */}

        <section className="rdo-detalhe-card">

          <div className="detalhe-card-header">

            <div>

              <span>
                MATERIAIS
              </span>

              <h2>
                📦 Materiais enviados
              </h2>

            </div>

          </div>


          {rdo.rdo_materiais?.length === 0 ? (

            <div className="rdo-vazio">

              Nenhum material registrado.

            </div>

          ) : (

            <div className="lista-rdo">

              {rdo.rdo_materiais.map(
                material => (

                  <div
                    key={material.id}
                    className="linha-rdo"
                  >

                    <div>

                      <span className="linha-rdo-icone">
                        📦
                      </span>

                      <span>
                        {material.descricao}
                      </span>

                    </div>

                    <strong>
                      {material.quantidade}{" "}
                      {material.unidade}
                    </strong>

                  </div>

                )
              )}

            </div>

          )}

        </section>

      </div>


      {/* ==================================================
        EFETIVO
    ================================================== */}

      <section className="rdo-detalhe-card">

        <div className="detalhe-card-header">

          <div>

            <span>
              EFETIVO
            </span>

            <h2>
              👷 Controle de presença
            </h2>

          </div>

          <strong>
            {totalPresentes()} /{" "}
            {rdo.rdo_efetivo?.length || 0}
          </strong>

        </div>


        {rdo.rdo_efetivo?.length === 0 ? (

          <div className="rdo-vazio">

            Nenhum efetivo registrado.

          </div>

        ) : (

          <div className="efetivo-grid">

            {rdo.rdo_efetivo.map(
              efetivo => (

                <div
                  key={efetivo.id}
                  className={
                    efetivo.presenca === "presente"
                      ? "efetivo-card presente"
                      : "efetivo-card ausente"
                  }
                >

                  <div className="efetivo-card-nome">

                    <span className="efetivo-status">

                      {efetivo.presenca === "presente"
                        ? "🟢"
                        : "🔴"}

                    </span>

                    <strong>

                      {
                        efetivo
                          .rdo_colaboradores
                          ?.nome ||
                        "Colaborador"
                      }

                    </strong>

                  </div>


                  <span
                    className={
                      efetivo.presenca === "presente"
                        ? "status-presente"
                        : "status-ausente"
                    }
                  >

                    {efetivo.presenca === "presente"
                      ? "Presente"
                      : "Ausente"}

                  </span>

                </div>

              )
            )}

          </div>

        )}

      </section>


      {/* ==================================================
        OCORRÊNCIAS E OBSERVAÇÕES
    ================================================== */}

      <div className="rdo-duas-colunas">


        {/* BAIXA PRODUTIVIDADE */}

        <section className="rdo-detalhe-card">

          <div className="detalhe-card-header">

            <div>

              <span>
                OCORRÊNCIAS
              </span>

              <h2>
                ⚠️ Baixa produtividade
              </h2>

            </div>

          </div>


          {rdo.rdo_motivos?.length === 0 ? (

            <div className="rdo-vazio sucesso">

              ✓ Nenhuma ocorrência registrada.

            </div>

          ) : (

            <div className="lista-rdo">

              {rdo.rdo_motivos.map(
                motivo => (

                  <div
                    key={motivo.id}
                    className="linha-rdo"
                  >

                    <span>
                      ⚠️{" "}
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


        {/* OBSERVAÇÕES */}

        <section className="rdo-detalhe-card">

          <div className="detalhe-card-header">

            <div>

              <span>
                OBSERVAÇÕES
              </span>

              <h2>
                📝 Informações adicionais
              </h2>

            </div>

          </div>


          {rdo.observacoes ? (

            <div className="rdo-observacoes">

              {rdo.observacoes}

            </div>

          ) : (

            <div className="rdo-vazio">

              Nenhuma observação registrada.

            </div>

          )}

        </section>

      </div>


      {/* ==================================================
        TEMPLATE PDF
    ================================================== */}

      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0
        }}
      >

        <div id="rdo-pdf">

          <RdoPdfTemplate
            obra={obra}
            rdo={rdo}
          />

        </div>

      </div>

    </main>
  );
}


export default DetalhesRDO;