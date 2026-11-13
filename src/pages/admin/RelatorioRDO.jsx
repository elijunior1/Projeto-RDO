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

import {
  exportarRDOsExcel
} from "../../services/exportExcel.js";

import logoAcodez from "../../assets/logo-acodez.png";

function RelatorioRDO({
  obraSelecionada,
  navegar
}) {

  const navigate = useNavigate();

  const [rdos, setRdos] = useState([]);

  const [carregando, setCarregando] = useState(false);

  const [dataInicio, setDataInicio] = useState("");

  const [dataFim, setDataFim] = useState("");

  async function carregarRDOs() {
    if (!obraSelecionada?.id) return;
    if (!dataInicio || !dataFim) {
      alert("Selecione a data inicial e a data final.");
      return;
    }
    if (dataInicio > dataFim) {
      alert("A data inicial não pode ser maior que a data final.");
      return;
    }

    try {
      setCarregando(true);

      const { data, error } = await supabase
        .from("rdos")
        .select(`
          id,
          codigo,
          obra_id,
          encarregado_id,
          data,
          observacoes,
          created_at,
          rdo_producao ( id, atividade, quantidade ),
          rdo_efetivo ( id, colaborador_id, presenca, rdo_colaboradores ( id, nome, tipo ) ),
          rdo_motivos ( id, motivo ),
          rdo_materiais ( id, descricao, quantidade, unidade )
        `)
        .eq("obra_id", obraSelecionada.id)
        .gte("data", dataInicio)
        .lte("data", dataFim)
        .order("data", { ascending: true });

      if (error) throw error;

      setRdos(data || []);
    } catch (erro) {
      console.error("Erro ao carregar RDOs:", erro);
      alert("Erro ao carregar os RDOs do período.");
    } finally {
      setCarregando(false);
    }
  }

  function formatarData(data) {
    if (!data) return "-";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function nomeAtividade(atividade) {
    const atividades = {
      escavacao: "Escavação",
      concretagem: "Concretagem",
      acabamento: "Acabamento",
      instalacao_modulo: "Instalação de Módulo",
      instalacao_terca: "Instalação de Terça",
      instalacao_telha: "Instalação de Telha",
      faixas: "Faixas",
      copinhos: "Copinhos",
      modulos: "Módulos",
      tercas: "Terças",
      manutencao: "Manutenção"
    };
    return atividades[atividade] || atividade;
  }

  function obterTotalProducao(rdo) {
    return (rdo.rdo_producao || []).reduce((total, item) => total + Number(item.quantidade || 0), 0);
  }

  function obterPresentes(rdo) {
    return (rdo.rdo_efetivo || []).filter(item => item.presenca === "presente").length;
  }

  function obterAusentes(rdo) {
    return (rdo.rdo_efetivo || []).filter(item => item.presenca === "ausente").length;
  }

  function obterMotivos(rdo) {
    return (rdo.rdo_motivos || []).map(item => item.motivo).filter(Boolean).join(", ");
  }

  function obterQuantidadeAtividade(rdo, atividade) {
    return (rdo.rdo_producao || []).filter(p => p.atividade === atividade).reduce((total, p) => total + Number(p.quantidade || 0), 0);
  }

  function obterProducaoPorAtividade(rdo) {
    const atividades = ["escavacao", "concretagem", "acabamento", "instalacao_modulo", "instalacao_terca", "instalacao_telha", "faixas", "copinhos", "modulos", "tercas", "manutencao"];
    const producao = {};
    atividades.forEach(atividade => {
      const qtd = obterQuantidadeAtividade(rdo, atividade);
      if (qtd > 0) {
        producao[atividade] = qtd;
      }
    });
    return producao;
  }

  function limparNomeArquivo(nome) {
    return String(nome || "obra")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "_");
  }

  const [exportandoExcel, setExportandoExcel] = useState(false);

  async function gerarExcel() {
    if (!obraSelecionada) {
      alert("Nenhuma obra selecionada.");
      return;
    }
    if (!rdos.length) {
      alert("Não existem RDOs no período selecionado.");
      return;
    }
    try {
      setExportandoExcel(true);
      await exportarRDOsExcel({ rdos, obra: obraSelecionada, dataInicio, dataFim });
    } catch (erro) {
      console.error("Erro ao exportar Excel:", erro);
      alert(erro.message || "Erro ao exportar Excel.");
    } finally {
      setExportandoExcel(false);
    }
  }

  async function gerarPDF() {
    if (!obraSelecionada) {
      alert("Nenhuma obra selecionada.");
      return;
    }
    if (!rdos.length) {
      alert("Não existem RDOs no período selecionado.");
      return;
    }

    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    const AZUL = [65, 102, 232];
    const AMARELO = [247, 215, 72];
    const CINZA = [90, 90, 90];
    const BRANCO = [255, 255, 255];

    const nomeObra = obraSelecionada.nome_condominio || obraSelecionada.nome || "Obra não informada";
    const endereco = obraSelecionada.endereco || obraSelecionada.endereco_completo || "Endereço não informado";

    function textoSeguro(valor) {
      if (valor === null || valor === undefined || valor === "") return "-";
      return String(valor);
    }

    function formatarNumero(valor) {
      const numero = Number(valor || 0);
      return Number.isInteger(numero) ? String(numero) : numero.toFixed(2);
    }

    function obterColaboradores(rdo, presenca) {
      return (rdo.rdo_efetivo || []).filter(item => item.presenca === presenca).map(item => item.rdo_colaboradores?.nome || "Colaborador não informado");
    }

    function obterMateriais(rdo) {
      return rdo.rdo_materiais || [];
    }

    function desenharCabecalho(numeroPagina) {
      const largura = doc.internal.pageSize.getWidth();

      try {
        doc.addImage(logoAcodez, "PNG", 14, 8, 28, 20);
      } catch (erro) {
        console.warn("Não foi possível adicionar a logo:", erro);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Aço 10 RDO", 48, 15);

      doc.setFontSize(11);
      doc.text("RELATÓRIO CONSOLIDADO DE OBRA", 48, 22);

      doc.setDrawColor(...AZUL);
      doc.setLineWidth(1);
      doc.line(14, 28, largura - 14, 28);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Página ${numeroPagina}`, largura - 14, 15, { align: "right" });
    }

    function desenharRodape() {
      const pagina = doc.internal.getNumberOfPages();
      const largura = doc.internal.pageSize.getWidth();
      const altura = doc.internal.pageSize.getHeight();

      doc.setDrawColor(...AZUL);
      doc.setLineWidth(0.5);
      doc.line(14, altura - 13, largura - 14, altura - 13);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...CINZA);

      doc.text(`Relatório gerado pelo Projeto RDO - ${new Date().toLocaleDateString("pt-BR")}`, 14, altura - 7);
      doc.text(`Página ${pagina}`, largura - 14, altura - 7, { align: "right" });

      doc.setTextColor(0, 0, 0);
    }

    // Página 1 - Resumo
    desenharCabecalho(1);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(nomeObra, 14, 38);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Endereço: ${endereco}`, 14, 45);
    doc.text(`Período: ${formatarData(dataInicio)} até ${formatarData(dataFim)}`, 14, 51);

    const totalRDOs = rdos.length;
    const totalProducao = rdos.reduce((acc, rdo) => acc + obterTotalProducao(rdo), 0);
    const totalPresentes = rdos.reduce((acc, rdo) => acc + obterPresentes(rdo), 0);
    const totalAusentes = rdos.reduce((acc, rdo) => acc + obterAusentes(rdo), 0);

    const cards = [
      { titulo: "TOTAL DE RDOs", valor: totalRDOs },
      { titulo: "PRODUÇÃO TOTAL", valor: totalProducao },
      { titulo: "PRESENÇAS", valor: totalPresentes },
      { titulo: "AUSÊNCIAS", valor: totalAusentes }
    ];

    const larguraCard = 63;
    const alturaCard = 23;
    const espacamento = 4;

    cards.forEach((card, index) => {
      const x = 14 + index * (larguraCard + espacamento);

      doc.setDrawColor(...AZUL);
      doc.setLineWidth(0.7);
      doc.rect(x, 58, larguraCard, alturaCard);

      doc.setFillColor(...AMARELO);
      doc.rect(x, 58, larguraCard, 7, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(card.titulo, x + larguraCard / 2, 63, { align: "center" });

      doc.setFontSize(15);
      doc.text(formatarNumero(card.valor), x + larguraCard / 2, 76, { align: "center" });
    });

    // Página 2 - Produção Diária
    doc.addPage();
    desenharCabecalho(doc.internal.getNumberOfPages());

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("PRODUÇÃO DIÁRIA", 14, 36);

    const linhasProducao = rdos.map(rdo => [
      formatarData(rdo.data),
      textoSeguro(rdo.codigo),
      formatarNumero(obterQuantidadeAtividade(rdo, "escavacao")),
      formatarNumero(obterQuantidadeAtividade(rdo, "concretagem")),
      formatarNumero(obterQuantidadeAtividade(rdo, "acabamento")),
      formatarNumero(obterQuantidadeAtividade(rdo, "instalacao_modulo")),
      formatarNumero(obterQuantidadeAtividade(rdo, "instalacao_terca")),
      formatarNumero(obterQuantidadeAtividade(rdo, "instalacao_telha")),
      formatarNumero(obterQuantidadeAtividade(rdo, "faixas")),
      formatarNumero(obterQuantidadeAtividade(rdo, "copinhos")),
      formatarNumero(obterQuantidadeAtividade(rdo, "modulos")),
      formatarNumero(obterQuantidadeAtividade(rdo, "tercas")),
      formatarNumero(obterQuantidadeAtividade(rdo, "manutencao")),
      formatarNumero(obterTotalProducao(rdo)),
      obterPresentes(rdo),
      obterAusentes(rdo)
    ]);

    autoTable(doc, {
      startY: 41,
      head: [["Data", "Código", "Escavação", "Concretagem", "Acabamento", "Módulo", "Terça", "Telha", "Faixas", "Copinhos", "Módulos", "Terças", "Manutenção", "Total", "Presentes", "Ausentes"]],
      body: linhasProducao,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 2.5, valign: "middle", halign: "center" },
      headStyles: { fillColor: AZUL, textColor: BRANCO, fontSize: 7, fontStyle: "bold", halign: "center" },
      columnStyles: {
        0: { cellWidth: 19 }, 1: { cellWidth: 19 }, 2: { cellWidth: 20 }, 3: { cellWidth: 22 },
        4: { cellWidth: 21 }, 5: { cellWidth: 18 }, 6: { cellWidth: 18 }, 7: { cellWidth: 15 },
        8: { cellWidth: 15 }, 9: { cellWidth: 15 }, 10: { cellWidth: 15 }, 11: { cellWidth: 15 },
        12: { cellWidth: 15 }, 13: { cellWidth: 16 }, 14: { cellWidth: 16 }, 15: { cellWidth: 16 }
      },
      margin: { left: 14 }
    });

    // Página 3 - Ocorrências
    doc.addPage();
    desenharCabecalho(doc.internal.getNumberOfPages());

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("OCORRÊNCIAS E OBSERVAÇÕES", 14, 36);

    let ocorrencias = [];
    rdos.forEach(rdo => {
      const motivos = obterMotivos(rdo);
      const observacao = rdo.observacoes || "";
      if (motivos || observacao) {
        ocorrencias.push([formatarData(rdo.data), textoSeguro(rdo.codigo), motivos || "-", observacao || "-"]);
      }
    });

    if (ocorrencias.length === 0) {
      ocorrencias = [["-", "-", "Nenhuma ocorrência registrada.", "-"]];
    }

    autoTable(doc, {
      startY: 41,
      head: [["Data", "Código", "Motivos / Ocorrências", "Observações"]],
      body: ocorrencias,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3, valign: "top" },
      headStyles: { fillColor: AZUL, textColor: BRANCO, fontSize: 8, fontStyle: "bold", halign: "center" },
      columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 25 }, 2: { cellWidth: 65 }, 3: { cellWidth: 145 } },
      margin: { left: 14 }
    });

    // Página 4 - Efetivo
    doc.addPage();
    desenharCabecalho(doc.internal.getNumberOfPages());

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("EFETIVO DA OBRA", 14, 36);

    const linhasEfetivo = rdos.map(rdo => {
      const presentes = obterColaboradores(rdo, "presente");
      const ausentes = obterColaboradores(rdo, "ausente");
      return [
        formatarData(rdo.data),
        textoSeguro(rdo.codigo),
        presentes.length ? presentes.join(", ") : "-",
        ausentes.length ? ausentes.join(", ") : "-",
        presentes.length,
        ausentes.length
      ];
    });

    autoTable(doc, {
      startY: 41,
      head: [["Data", "Código", "Presentes", "Ausentes", "Qtd. Pres.", "Qtd. Aus."]],
      body: linhasEfetivo,
      theme: "grid",
      styles: { fontSize: 7.5, cellPadding: 3, valign: "top" },
      headStyles: { fillColor: AZUL, textColor: BRANCO, fontSize: 7.5, fontStyle: "bold", halign: "center" },
      columnStyles: {
        0: { cellWidth: 25 }, 1: { cellWidth: 25 }, 2: { cellWidth: 85 }, 3: { cellWidth: 85 },
        4: { cellWidth: 25, halign: "center" }, 5: { cellWidth: 25, halign: "center" }
      },
      margin: { left: 14 }
    });

    // Página 5 - Materiais (se houver)
    const possuiMateriais = rdos.some(rdo => obterMateriais(rdo).length > 0);
    if (possuiMateriais) {
      doc.addPage();
      desenharCabecalho(doc.internal.getNumberOfPages());

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("MATERIAIS REGISTRADOS", 14, 36);

      const linhasMateriais = [];
      rdos.forEach(rdo => {
        obterMateriais(rdo).forEach(material => {
          linhasMateriais.push([
            formatarData(rdo.data),
            textoSeguro(rdo.codigo),
            textoSeguro(material.descricao),
            formatarNumero(material.quantidade),
            textoSeguro(material.unidade)
          ]);
        });
      });

      autoTable(doc, {
        startY: 41,
        head: [["Data", "Código", "Material", "Quantidade", "Unidade"]],
        body: linhasMateriais,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 3, valign: "middle" },
        headStyles: { fillColor: AZUL, textColor: BRANCO, fontSize: 8, fontStyle: "bold", halign: "center" },
        columnStyles: {
          0: { cellWidth: 30 }, 1: { cellWidth: 30 }, 2: { cellWidth: 120 },
          3: { cellWidth: 30, halign: "center" }, 4: { cellWidth: 30, halign: "center" }
        },
        margin: { left: 14 }
      });
    }

    const totalPaginas = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPaginas; i++) {
      doc.setPage(i);
      desenharRodape();
    }

    const nomeArquivo = `Relatorio_RDO_${limparNomeArquivo(nomeObra)}_${dataInicio}_${dataFim}.pdf`;
    doc.save(nomeArquivo);
  }

  function voltar() {
    navigate("/admin/selecionar-rdo");
  }

  return (
    <main className="app-content">
      <div className="page-header page-header-rdo">
        <div className="gerenciar-card">
          <div className="page-title">
            <h1>Relatório de RDO</h1>
            <p>{obraSelecionada?.nome_condominio || "Obra não selecionada"}</p>
          </div>

          <button className="btn btn-ghost btn-voltar" onClick={voltar}>
            ← Voltar
          </button>
        </div>
      </div>

      <div className="filtro-periodo">
        <div className="page-title">
          <h2>📅 Período do relatório</h2>
          <p>Selecione o período que deseja consultar.</p>
        </div>

        <div className="filtro-datas">
          <div className="form-group">
            <label>Data inicial</label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Data final</label>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary btn-consultar" onClick={carregarRDOs} disabled={carregando}>
            {carregando ? "Consultando..." : "🔎 Consultar período"}
          </button>
        </div>
      </div>

      {!carregando && dataInicio && dataFim && rdos.length === 0 && (
        <div className="empty-state">
          <p>Nenhuma RDO encontrada neste período.</p>
        </div>
      )}

      {!carregando && rdos.length > 0 && (
        <>
          <div className="obras-resumo-section">
            <div className="obras-resumo">
              <div className="resumo-card">
                <div className="resumo-icon">📋</div>
                <span>Total de RDOs</span>
                <strong>{rdos.length}</strong>
              </div>
              <div className="resumo-card">
                <div className="resumo-icon">🏭</div>
                <span>Produção total</span>
                <strong>{rdos.reduce((acc, rdo) => acc + obterTotalProducao(rdo), 0)}</strong>
              </div>
              <div className="resumo-card">
                <div className="resumo-icon">✅</div>
                <span>Presentes</span>
                <strong>{rdos.reduce((acc, rdo) => acc + obterPresentes(rdo), 0)}</strong>
              </div>
              <div className="resumo-card">
                <div className="resumo-icon">❌</div>
                <span>Ausentes</span>
                <strong>{rdos.reduce((acc, rdo) => acc + obterAusentes(rdo), 0)}</strong>
              </div>
            </div>
          </div>

          <div className="form-card">
            <div className="form-card-header">
              <h2>📄 Gerar relatório</h2>
              <p>Escolha o formato do relatório.</p>
            </div>

            <div className="relatorio-formatos">
              <button className="relatorio-formato" onClick={gerarPDF}>
                <span className="relatorio-formato-icon">📄</span>
                <strong>Gerar PDF</strong>
                <small>Relatório pronto para imprimir ou compartilhar.</small>
              </button>
              <button className="relatorio-formato" onClick={gerarExcel} disabled={exportandoExcel}>
                <span className="relatorio-formato-icon">📊</span>
                <strong>{exportandoExcel ? "Exportando..." : "Gerar Excel"}</strong>
                <small>Planilha para análise dos dados da obra.</small>
              </button>
            </div>
          </div>

          <div className="obras-grid">
            {rdos.map(rdo => {
              const producao = obterProducaoPorAtividade(rdo);

              return (
                <div className="obra-card" key={rdo.id}>
                  <div className="obra-card-header">
                    <h3>📋 {rdo.codigo || "RDO sem código"}</h3>
                    <span>{formatarData(rdo.data)}</span>
                  </div>
                  <div>
                    <strong>📈 Produção</strong>
                    {Object.keys(producao).length === 0 ? (
                      <p>Nenhuma produção registrada.</p>
                    ) : (
                      Object.entries(producao).map(([atividade, quantidade]) => (
                        <p key={atividade}>{atividade}: <strong>{quantidade}</strong> un.</p>
                      ))
                    )}
                  </div>
                  <p>👷 Presentes: {obterPresentes(rdo)}</p>
                  <p>❌ Ausentes: {obterAusentes(rdo)}</p>
                  <div>
                    <strong>⚠️ Motivos</strong>
                    <p>{obterMotivos(rdo) || "Nenhum motivo registrado."}</p>
                  </div>
                  <div>
                    <strong>📝 Observações</strong>
                    <p>{rdo.observacoes || "Nenhuma observação."}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}

export default RelatorioRDO;
