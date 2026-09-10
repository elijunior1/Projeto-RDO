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

import { jsPDF } from "jspdf";

import autoTable from "jspdf-autotable";

import logoAcodez from "../../assets/logo-acodez.png";

function RelatorioRDO({
  obraSelecionada
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
  ] = useState(false);


  const [
    dataInicio,
    setDataInicio
  ] = useState("");


  const [
    dataFim,
    setDataFim
  ] = useState("");


  /*
  ================================================
  CARREGAR RDOs
  ================================================
  */

  async function carregarRDOs() {

    if (!obraSelecionada?.id) {

      return;

    }


    if (!dataInicio || !dataFim) {

      alert(
        "Selecione a data inicial e a data final."
      );

      return;

    }


    if (dataInicio > dataFim) {

      alert(
        "A data inicial não pode ser maior que a data final."
      );

      return;

    }


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
            obraSelecionada.id
          )
          .gte(
            "data",
            dataInicio
          )
          .lte(
            "data",
            dataFim
          )
          .order(
            "data",
            {
              ascending: true
            }
          );


      if (error) {

        throw error;

      }


      console.log(
        "RDOs do relatório:",
        data
      );


      setRdos(
        data || []
      );


    } catch (erro) {

      console.error(
        "Erro ao carregar RDOs para relatório:",
        erro
      );


      alert(
        "Erro ao carregar os RDOs do período."
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

      return "-";

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
  NOME DA ATIVIDADE
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
  TOTAL PRODUÇÃO
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


  /*
  ================================================
  PRESENTES
  ================================================
  */

  function obterPresentes(
    rdo
  ) {

    return (
      rdo.rdo_efetivo || []
    ).filter(
      item =>
        item.presenca ===
        "presente"
    ).length;

  }


  /*
  ================================================
  AUSENTES
  ================================================
  */

  function obterAusentes(
    rdo
  ) {

    return (
      rdo.rdo_efetivo || []
    ).filter(
      item =>
        item.presenca ===
        "ausente"
    ).length;

  }


  /*
  ================================================
  TOTAL PRODUÇÃO POR ATIVIDADE
  ================================================
  */

  function obterProducaoPorAtividade(
    rdo
  ) {

    const producao = {};


    (
      rdo.rdo_producao || []
    ).forEach(
      item => {

        const atividade =
          nomeAtividade(
            item.atividade
          );


        if (!producao[ atividade ]) {

          producao[ atividade ] = 0;

        }


        producao[ atividade ] +=
          Number(
            item.quantidade || 0
          );

      }
    );


    return producao;

  }


  /*
  ================================================
  MOTIVOS
  ================================================
  */

  function obterMotivos(
    rdo
  ) {

    return (
      rdo.rdo_motivos || []
    )
      .map(
        item => item.motivo
      )
      .filter(Boolean)
      .join(", ");

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

  function obterQuantidadeAtividade(rdo, atividade) {
    return (rdo.rdo_producao || [])
      .filter(
        producao =>
          producao.atividade === atividade
      )
      .reduce(
        (total, producao) =>
          total +
          Number(producao.quantidade || 0),
        0
      );
  }

  function limparNomeArquivo(nome) {
    return String(nome || "obra")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "_");
  }

  function gerarPDF() {

    if (!obraSelecionada) {
      alert("Nenhuma obra selecionada.");
      return;
    }

    if (!rdos.length) {
      alert("Não existem RDOs no período selecionado.");
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    /*
    ==================================================
    CORES DO MODELO RDO
    ==================================================
    */

    const AZUL = [ 65, 102, 232 ];
    const AMARELO = [ 247, 215, 72 ];

    const CINZA = [ 90, 90, 90 ];
    const BRANCO = [ 255, 255, 255 ];

    /*
    ==================================================
    INFORMAÇÕES DA OBRA
    ==================================================
    */

    const nomeObra =
      obraSelecionada.nome_condominio ||
      obraSelecionada.nome ||
      "Obra não informada";

    const endereco =
      obraSelecionada.endereco ||
      obraSelecionada.endereco_completo ||
      "Endereço não informado";

    /*
    ==================================================
    FUNÇÕES AUXILIARES
    ==================================================
    */

    function textoSeguro(valor) {

      if (
        valor === null ||
        valor === undefined ||
        valor === ""
      ) {
        return "-";
      }

      return String(valor);

    }


    function formatarNumero(valor) {

      const numero =
        Number(valor || 0);

      return Number.isInteger(numero)
        ? String(numero)
        : numero.toFixed(2);

    }


    function obterColaboradores(
      rdo,
      presenca
    ) {

      return (
        rdo.rdo_efetivo || []
      )
        .filter(
          item =>
            item.presenca ===
            presenca
        )
        .map(
          item =>
            item.rdo_colaboradores?.nome ||
            "Colaborador não informado"
        );

    }


    function obterMateriais(rdo) {

      return rdo.rdo_materiais || [];

    }


    function limparNomeArquivo(nome) {

      return String(
        nome || "obra"
      )
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .replace(
          /[^a-zA-Z0-9]/g,
          "_"
        );

    }


    /*
    ==================================================
    CABEÇALHO
    ==================================================
    */

    function desenharCabecalho(
      numeroPagina
    ) {

      const largura =
        doc.internal.pageSize.getWidth();

      /*
      LOGO
      */

      try {

        doc.addImage(
          logoAcodez,
          "PNG",
          14,
          8,
          28,
          20
        );

      } catch (erro) {

        console.warn(
          "Não foi possível adicionar a logo:",
          erro
        );

      }


      /*
      TÍTULO
      */

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(16);

      doc.text(
        "Aço 10 RDO",
        48,
        15
      );


      doc.setFontSize(11);

      doc.text(
        "RELATÓRIO CONSOLIDADO DE OBRA",
        48,
        22
      );


      /*
      LINHA AZUL
      */

      doc.setDrawColor(
        ...AZUL
      );

      doc.setLineWidth(
        1
      );

      doc.line(
        14,
        28,
        largura - 14,
        28
      );


      /*
      PÁGINA
      */

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(8);

      doc.text(
        `Página ${numeroPagina}`,
        largura - 14,
        15,
        {
          align: "right"
        }
      );

    }


    /*
    ==================================================
    RODAPÉ
    ==================================================
    */

    function desenharRodape() {

      const pagina =
        doc.internal.getNumberOfPages();

      const largura =
        doc.internal.pageSize.getWidth();

      const altura =
        doc.internal.pageSize.getHeight();


      doc.setDrawColor(
        ...AZUL
      );

      doc.setLineWidth(
        0.5
      );

      doc.line(
        14,
        altura - 13,
        largura - 14,
        altura - 13
      );


      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(7);

      doc.setTextColor(
        ...CINZA
      );


      doc.text(
        `Relatório gerado pelo Projeto RDO - ${new Date().toLocaleDateString("pt-BR")}`,
        14,
        altura - 7
      );


      doc.text(
        `Página ${pagina}`,
        largura - 14,
        altura - 7,
        {
          align: "right"
        }
      );


      doc.setTextColor(
        0,
        0,
        0
      );

    }


    /*
    ==================================================
    PÁGINA 1
    RESUMO
    ==================================================
    */

    desenharCabecalho(1);


    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(14);

    doc.text(
      nomeObra,
      14,
      38
    );


    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(9);

    doc.text(
      `Endereço: ${endereco}`,
      14,
      45
    );


    doc.text(
      `Período: ${formatarData(dataInicio)} até ${formatarData(dataFim)}`,
      14,
      51
    );


    /*
    ==================================================
    RESUMO
    ==================================================
    */

    const totalRDOs =
      rdos.length;


    const totalProducao =
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
      );


    const totalPresentes =
      rdos.reduce(
        (
          total,
          rdo
        ) =>
          total +
          obterPresentes(
            rdo
          ),
        0
      );


    const totalAusentes =
      rdos.reduce(
        (
          total,
          rdo
        ) =>
          total +
          obterAusentes(
            rdo
          ),
        0
      );


    const cards = [

      {
        titulo: "TOTAL DE RDOs",
        valor: totalRDOs
      },

      {
        titulo: "PRODUÇÃO TOTAL",
        valor: totalProducao
      },

      {
        titulo: "PRESENÇAS",
        valor: totalPresentes
      },

      {
        titulo: "AUSÊNCIAS",
        valor: totalAusentes
      }

    ];


    const larguraCard = 63;
    const alturaCard = 23;
    const espacamento = 4;


    cards.forEach(
      (
        card,
        index
      ) => {

        const x =
          14 +
          index *
          (
            larguraCard +
            espacamento
          );


        /*
        BORDA AZUL
        */

        doc.setDrawColor(
          ...AZUL
        );

        doc.setLineWidth(
          0.7
        );

        doc.rect(
          x,
          58,
          larguraCard,
          alturaCard
        );


        /*
        CABEÇALHO AMARELO
        */

        doc.setFillColor(
          ...AMARELO
        );

        doc.rect(
          x,
          58,
          larguraCard,
          7,
          "F"
        );


        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(7);

        doc.text(
          card.titulo,
          x + larguraCard / 2,
          63,
          {
            align: "center"
          }
        );


        /*
        VALOR
        */

        doc.setFontSize(15);

        doc.text(
          formatarNumero(
            card.valor
          ),
          x + larguraCard / 2,
          76,
          {
            align: "center"
          }
        );

      }
    );


    /*
    ==================================================
    PRODUÇÃO CONSOLIDADA
    ==================================================
    */

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(11);

    doc.text(
      "PRODUÇÃO CONSOLIDADA",
      14,
      92
    );


    const atividades = [

      {
        chave: "escavacao",
        nome: "Escavação"
      },

      {
        chave: "concretagem",
        nome: "Concretagem"
      },

      {
        chave: "acabamento",
        nome: "Acabamento"
      },

      {
        chave: "instalacao_modulo",
        nome: "Instalação de Módulo"
      },

      {
        chave: "instalacao_terca",
        nome: "Instalação de Terça"
      },

      {
        chave: "instalacao_telha",
        nome: "Instalação de Telha"
      }

    ];


    const producaoConsolidada =
      atividades.map(
        atividade => {

          const quantidade =
            rdos.reduce(
              (
                total,
                rdo
              ) =>
                total +
                obterQuantidadeAtividade(
                  rdo,
                  atividade.chave
                ),
              0
            );


          return [
            atividade.nome,
            `${formatarNumero(
              quantidade
            )} un.`
          ];

        }
      );


    autoTable(
      doc,
      {

        startY: 97,

        head: [
          [
            "Atividade",
            "Quantidade"
          ]
        ],

        body:
          producaoConsolidada,

        theme: "grid",

        styles: {

          fontSize: 8,

          cellPadding: 3,

          valign: "middle"

        },

        headStyles: {

          fillColor: AZUL,

          textColor: BRANCO,

          fontStyle: "bold",

          halign: "center"

        },

        alternateRowStyles: {

          fillColor: [
            250,
            250,
            250
          ]

        },

        columnStyles: {

          0: {
            cellWidth: 70
          },

          1: {
            cellWidth: 40,
            halign: "center"
          }

        },

        margin: {
          left: 14
        }

      }
    );


    /*
    ==================================================
    PÁGINA 2
    PRODUÇÃO DIÁRIA
    ==================================================
    */

    doc.addPage();


    desenharCabecalho(
      doc.internal.getNumberOfPages()
    );


    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(12);

    doc.text(
      "PRODUÇÃO DIÁRIA",
      14,
      36
    );


    const linhasProducao =
      rdos.map(
        rdo => [

          formatarData(
            rdo.data
          ),

          textoSeguro(
            rdo.codigo
          ),

          formatarNumero(
            obterQuantidadeAtividade(
              rdo,
              "escavacao"
            )
          ),

          formatarNumero(
            obterQuantidadeAtividade(
              rdo,
              "concretagem"
            )
          ),

          formatarNumero(
            obterQuantidadeAtividade(
              rdo,
              "acabamento"
            )
          ),

          formatarNumero(
            obterQuantidadeAtividade(
              rdo,
              "instalacao_modulo"
            )
          ),

          formatarNumero(
            obterQuantidadeAtividade(
              rdo,
              "instalacao_terca"
            )
          ),

          formatarNumero(
            obterQuantidadeAtividade(
              rdo,
              "instalacao_telha"
            )
          ),

          formatarNumero(
            obterTotalProducao(
              rdo
            )
          ),

          obterPresentes(
            rdo
          ),

          obterAusentes(
            rdo
          )

        ]
      );


    autoTable(
      doc,
      {

        startY: 41,

        head: [
          [

            "Data",
            "Código",
            "Escavação",
            "Concretagem",
            "Acabamento",
            "Módulo",
            "Terça",
            "Telha",
            "Total",
            "Presentes",
            "Ausentes"

          ]
        ],

        body:
          linhasProducao,

        theme: "grid",

        styles: {

          fontSize: 7,

          cellPadding: 2.5,

          valign: "middle",

          halign: "center"

        },

        headStyles: {

          fillColor: AZUL,

          textColor: BRANCO,

          fontSize: 7,

          fontStyle: "bold",

          halign: "center"

        },

        columnStyles: {

          0: {
            cellWidth: 19
          },

          1: {
            cellWidth: 19
          },

          2: {
            cellWidth: 20
          },

          3: {
            cellWidth: 22
          },

          4: {
            cellWidth: 21
          },

          5: {
            cellWidth: 18
          },

          6: {
            cellWidth: 18
          },

          7: {
            cellWidth: 18
          },

          8: {
            cellWidth: 18
          },

          9: {
            cellWidth: 18
          },

          10: {
            cellWidth: 18
          }

        }

      }
    );


    /*
    ==================================================
    OCORRÊNCIAS
    ==================================================
    */

    doc.addPage();


    desenharCabecalho(
      doc.internal.getNumberOfPages()
    );


    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(12);

    doc.text(
      "OCORRÊNCIAS E OBSERVAÇÕES",
      14,
      36
    );


    let ocorrencias = [];


    rdos.forEach(
      rdo => {

        const motivos =
          obterMotivos(
            rdo
          );

        const observacao =
          rdo.observacoes ||
          "";


        if (
          motivos ||
          observacao
        ) {

          ocorrencias.push(
            [

              formatarData(
                rdo.data
              ),

              textoSeguro(
                rdo.codigo
              ),

              motivos ||
              "-",

              observacao ||
              "-"

            ]
          );

        }

      }
    );


    if (
      ocorrencias.length ===
      0
    ) {

      ocorrencias = [
        [
          "-",
          "-",
          "Nenhuma ocorrência registrada.",
          "-"
        ]
      ];

    }


    autoTable(
      doc,
      {

        startY: 41,

        head: [
          [
            "Data",
            "Código",
            "Motivos / Ocorrências",
            "Observações"
          ]
        ],

        body:
          ocorrencias,

        theme: "grid",

        styles: {

          fontSize: 8,

          cellPadding: 3,

          valign: "top"

        },

        headStyles: {

          fillColor: AZUL,

          textColor: BRANCO,

          fontSize: 8,

          fontStyle: "bold",

          halign: "center"

        },

        columnStyles: {

          0: {
            cellWidth: 25
          },

          1: {
            cellWidth: 25
          },

          2: {
            cellWidth: 65
          },

          3: {
            cellWidth: 145
          }

        }

      }
    );


    /*
    ==================================================
    EFETIVO
    ==================================================
    */

    doc.addPage();


    desenharCabecalho(
      doc.internal.getNumberOfPages()
    );


    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(12);

    doc.text(
      "EFETIVO DA OBRA",
      14,
      36
    );


    const linhasEfetivo =
      rdos.map(
        rdo => {

          const presentes =
            obterColaboradores(
              rdo,
              "presente"
            );

          const ausentes =
            obterColaboradores(
              rdo,
              "ausente"
            );


          return [

            formatarData(
              rdo.data
            ),

            textoSeguro(
              rdo.codigo
            ),

            presentes.length
              ? presentes.join(", ")
              : "-",

            ausentes.length
              ? ausentes.join(", ")
              : "-",

            presentes.length,

            ausentes.length

          ];

        }
      );


    autoTable(
      doc,
      {

        startY: 41,

        head: [
          [
            "Data",
            "Código",
            "Presentes",
            "Ausentes",
            "Qtd. Pres.",
            "Qtd. Aus."
          ]
        ],

        body:
          linhasEfetivo,

        theme: "grid",

        styles: {

          fontSize: 7.5,

          cellPadding: 3,

          valign: "top"

        },

        headStyles: {

          fillColor: AZUL,

          textColor: BRANCO,

          fontSize: 7.5,

          fontStyle: "bold",

          halign: "center"

        },

        columnStyles: {

          0: {
            cellWidth: 25
          },

          1: {
            cellWidth: 25
          },

          2: {
            cellWidth: 85
          },

          3: {
            cellWidth: 85
          },

          4: {
            cellWidth: 25,
            halign: "center"
          },

          5: {
            cellWidth: 25,
            halign: "center"
          }

        }

      }
    );


    /*
    ==================================================
    MATERIAIS
    ==================================================
    */

    const possuiMateriais =
      rdos.some(
        rdo =>
          obterMateriais(
            rdo
          ).length > 0
      );


    if (
      possuiMateriais
    ) {

      doc.addPage();


      desenharCabecalho(
        doc.internal.getNumberOfPages()
      );


      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(12);

      doc.text(
        "MATERIAIS REGISTRADOS",
        14,
        36
      );


      const linhasMateriais =
        [];


      rdos.forEach(
        rdo => {

          obterMateriais(
            rdo
          ).forEach(
            material => {

              linhasMateriais.push(
                [

                  formatarData(
                    rdo.data
                  ),

                  textoSeguro(
                    rdo.codigo
                  ),

                  textoSeguro(
                    material.descricao
                  ),

                  formatarNumero(
                    material.quantidade
                  ),

                  textoSeguro(
                    material.unidade
                  )

                ]
              );

            }
          );

        }
      );


      autoTable(
        doc,
        {

          startY: 41,

          head: [
            [
              "Data",
              "Código",
              "Material",
              "Quantidade",
              "Unidade"
            ]
          ],

          body:
            linhasMateriais,

          theme: "grid",

          styles: {

            fontSize: 8,

            cellPadding: 3,

            valign: "middle"

          },

          headStyles: {

            fillColor: AZUL,

            textColor: BRANCO,

            fontSize: 8,

            fontStyle: "bold",

            halign: "center"

          },

          columnStyles: {

            0: {
              cellWidth: 30
            },

            1: {
              cellWidth: 30
            },

            2: {
              cellWidth: 120
            },

            3: {
              cellWidth: 30,
              halign: "center"
            },

            4: {
              cellWidth: 30,
              halign: "center"
            }

          }

        }
      );

    }


    /*
    ==================================================
    CABEÇALHOS AMARELOS NAS TABELAS
    ==================================================
    */

    /*
    O AUTO TABLE USA AZUL NO CABEÇALHO.
    A COR AMARELA SERÁ USADA NOS ELEMENTOS
    DE DESTAQUE DO RELATÓRIO.
    */


    /*
    ==================================================
    RODAPÉS
    ==================================================
    */

    const totalPaginas =
      doc.internal.getNumberOfPages();


    for (
      let i = 1;
      i <= totalPaginas;
      i++
    ) {

      doc.setPage(i);

      desenharRodape();

    }


    /*
    ==================================================
    SALVAR PDF
    ==================================================
    */

    const nomeArquivo =
      `Relatorio_RDO_${limparNomeArquivo(
        nomeObra
      )}_${dataInicio}_${dataFim}.pdf`;


    doc.save(
      nomeArquivo
    );

  }
  /*
  ================================================
  RENDER
  ================================================
  */

  return (

    <main className="app-content">


      {/* ======================================
          CABEÇALHO
      ====================================== */}

      <div className="page-header">

        <div>

          <button
            className="btn btn-ghost"
            onClick={voltar}
          >
            ← Voltar
          </button>


          <h1>
            Relatório de RDO
          </h1>


          <p>
            {
              obraSelecionada?.nome_condominio ||
              "Obra não selecionada"
            }
          </p>

        </div>

      </div>


      {/* ======================================
          OBRA
      ====================================== */}

      {obraSelecionada && (

        <div className="dashboard-card">

          <div>

            <h3>
              🏢 {obraSelecionada.nome_condominio}
            </h3>

            <p>
              📍 {obraSelecionada.endereco}
            </p>

          </div>

        </div>

      )}


      {/* ======================================
          PERÍODO
      ====================================== */}

      <div className="form-card">

        <div className="form-card-header">

          <h2>
            📅 Período do relatório
          </h2>

          <p>
            Selecione o período que deseja
            consultar.
          </p>

        </div>


        <div className="form-grid">


          <div className="form-group">

            <label>
              Data inicial
            </label>

            <input
              type="date"
              value={dataInicio}
              onChange={(e) =>
                setDataInicio(
                  e.target.value
                )
              }
            />

          </div>


          <div className="form-group">

            <label>
              Data final
            </label>

            <input
              type="date"
              value={dataFim}
              onChange={(e) =>
                setDataFim(
                  e.target.value
                )
              }
            />

          </div>


        </div>


        <div className="form-actions">

          <button
            className="btn btn-primary"
            onClick={carregarRDOs}
            disabled={carregando}
          >

            {carregando
              ? "Consultando..."
              : "🔎 Consultar período"
            }

          </button>

        </div>

      </div>


      {/* ======================================
          RESULTADO
      ====================================== */}

      {!carregando &&
        dataInicio &&
        dataFim &&
        rdos.length === 0 && (

          <div className="empty-state">

            <p>
              Nenhuma RDO encontrada neste
              período.
            </p>

          </div>

        )}


      {!carregando &&
        rdos.length > 0 && (

          <>

            {/* ==============================
                RESUMO
            ============================== */}

            <div className="obras-resumo">


              <div className="resumo-card">

                <span>
                  Total de RDOs
                </span>

                <strong>
                  {rdos.length}
                </strong>

              </div>


              <div className="resumo-card">

                <span>
                  Produção total
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
                        obterPresentes(
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
                        obterAusentes(
                          rdo
                        ),
                      0
                    )
                  }

                </strong>

              </div>


            </div>

            {/* ==============================
    FORMATOS
================================ */}

            <div className="form-card">

              <div className="form-card-header">

                <h2>
                  📄 Gerar relatório
                </h2>

                <p>
                  Escolha o formato do relatório.
                </p>

              </div>


              <div className="relatorio-formatos">


                <button
                  className="relatorio-formato"
                  onClick={gerarPDF}
                >
                  <span className="relatorio-formato-icon">
                    📄
                  </span>

                  <strong>
                    Gerar PDF
                  </strong>

                  <small>
                    Relatório pronto para
                    imprimir ou compartilhar.
                  </small>

                </button>


                <button
                  className="relatorio-formato"
                  onClick={() =>
                    alert(
                      "Excel será implementado na próxima etapa."
                    )
                  }
                >

                  <span className="relatorio-formato-icon">
                    📊
                  </span>

                  <strong>
                    Gerar Excel
                  </strong>

                  <small>
                    Planilha para análise dos
                    dados da obra.
                  </small>

                </button>


              </div>

            </div>


            {/* ==============================
                RDOs
            ============================== */}

            <div className="obras-grid">


              {rdos.map(
                rdo => {


                  const producao =
                    obterProducaoPorAtividade(
                      rdo
                    );


                  return (

                    <div
                      className="obra-card"
                      key={rdo.id}
                    >


                      <div
                        className="obra-card-header"
                      >

                        <h3>
                          📋{" "}
                          {rdo.codigo ||
                            "RDO sem código"}
                        </h3>

                        <span>
                          {formatarData(
                            rdo.data
                          )}
                        </span>

                      </div>




                      {/* PRODUÇÃO */}

                      <div>

                        <strong>
                          📈 Produção
                        </strong>


                        {Object.keys(
                          producao
                        ).length === 0 ? (

                          <p>
                            Nenhuma produção
                            registrada.
                          </p>

                        ) : (

                          Object.entries(
                            producao
                          ).map(
                            ([
                              atividade,
                              quantidade
                            ]) => (

                              <p
                                key={
                                  atividade
                                }
                              >
                                {atividade}:{" "}
                                <strong>
                                  {quantidade}
                                </strong>{" "}
                                un.
                              </p>

                            )
                          )

                        )}

                      </div>


                      {/* EFETIVO */}

                      <p>
                        👷 Presentes:{" "}
                        {obterPresentes(
                          rdo
                        )}
                      </p>


                      <p>
                        ❌ Ausentes:{" "}
                        {obterAusentes(
                          rdo
                        )}
                      </p>


                      {/* MOTIVOS */}

                      <div>

                        <strong>
                          ⚠️ Motivos
                        </strong>

                        <p>
                          {
                            obterMotivos(
                              rdo
                            ) ||
                            "Nenhum motivo registrado."
                          }
                        </p>

                      </div>


                      {/* OBSERVAÇÕES */}

                      <div>

                        <strong>
                          📝 Observações
                        </strong>

                        <p>
                          {
                            rdo.observacoes ||
                            "Nenhuma observação."
                          }
                        </p>

                      </div>


                    </div>

                  );

                }
              )}

            </div>
          </>

        )}

    </main>

  );

}


export default RelatorioRDO;