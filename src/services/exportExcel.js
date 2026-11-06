// Geração de Excel dos RDOs — compartilha o formato entre
// ConsultaRDO (lista da obra) e RelatorioRDO (período selecionado).
// O `xlsx` é carregado sob demanda com import dinâmico para não
// inflar o bundle inicial do app.

const ATIVIDADES = [
  { chave: "escavacao", nome: "Escavação" },
  { chave: "concretagem", nome: "Concretagem" },
  { chave: "acabamento", nome: "Acabamento" },
  { chave: "instalacao_modulo", nome: "Instalação de Módulo" },
  { chave: "instalacao_terca", nome: "Instalação de Terça" },
  { chave: "instalacao_telha", nome: "Instalação de Telha" },
  { chave: "faixas", nome: "Faixas" },
  { chave: "copinhos", nome: "Copinhos" },
  { chave: "modulos", nome: "Módulos" },
  { chave: "tercas", nome: "Terças" },
  { chave: "manutencao", nome: "Manutenção" }
];

export function formatarDataExcel(data) {
  if (!data) return "-";
  const [ano, mes, dia] = String(data).split("-");
  return `${dia}/${mes}/${ano}`;
}

function numeroOuZero(valor) {
  return Number(valor || 0);
}

function obterQuantidadeAtividade(rdo, atividade) {
  return (rdo?.rdo_producao || [])
    .filter((p) => p.atividade === atividade)
    .reduce((total, p) => total + numeroOuZero(p.quantidade), 0);
}

function obterTotalProducao(rdo) {
  return (rdo?.rdo_producao || []).reduce(
    (total, item) => total + numeroOuZero(item.quantidade),
    0
  );
}

function obterPresentes(rdo) {
  return (rdo?.rdo_efetivo || []).filter((i) => i.presenca === "presente").length;
}

function obterAusentes(rdo) {
  return (rdo?.rdo_efetivo || []).filter((i) => i.presenca === "ausente").length;
}

function obterNomesPorPresenca(rdo, presenca) {
  return (rdo?.rdo_efetivo || [])
    .filter((i) => i.presenca === presenca)
    .map((i) => i.rdo_colaboradores?.nome || "Colaborador não informado")
    .filter(Boolean);
}

function obterMotivos(rdo) {
  return (rdo?.rdo_motivos || [])
    .map((i) => i.motivo)
    .filter(Boolean)
    .join(", ");
}

function limparNomeArquivo(nome) {
  return String(nome || "obra")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "_");
}

function textoOuTraco(valor) {
  if (valor === null || valor === undefined || valor === "") return "-";
  return String(valor);
}

function ajustarLarguras(XLSX, worksheet, larguras) {
  worksheet["!cols"] = larguras.map((w) => ({ wch: w }));
}

function criarAba(XLSX, wb, nome, linhas, larguras, cabecalho) {
  const ws = XLSX.utils.aoa_to_sheet(linhas);
  ajustarLarguras(XLSX, ws, larguras);
  if (cabecalho) ws["!freeze"] = "A2";
  XLSX.utils.book_append_sheet(wb, ws, nome);
}

export async function exportarRDOsExcel({ rdos, obra, dataInicio, dataFim }) {
  const lista = rdos || [];

  if (!lista.length) {
    throw new Error("Não existem RDOs para exportar.");
  }

  // Carrega o xlsx só na hora de exportar (code-splitting).
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  const nomeObra =
    obra?.nome_condominio || obra?.nome || "Obra não informada";
  const endereco = obra?.endereco || "Endereço não informado";

  // ---------- Aba 1: Resumo ----------
  const totalProducao = lista.reduce((t, rdo) => t + obterTotalProducao(rdo), 0);
  const totalPresentes = lista.reduce((t, rdo) => t + obterPresentes(rdo), 0);
  const totalAusentes = lista.reduce((t, rdo) => t + obterAusentes(rdo), 0);

  const resumo = [
    ["Obra", nomeObra],
    ["Endereço", endereco],
    ["Período", dataInicio || dataFim ? `${formatarDataExcel(dataInicio)} a ${formatarDataExcel(dataFim)}` : "Todos"],
    ["Total de RDOs", lista.length],
    ["Produção total (un.)", totalProducao],
    ["Presentes", totalPresentes],
    ["Ausentes", totalAusentes],
    ["Gerado em", new Date().toLocaleString("pt-BR")]
  ];
  criarAba(XLSX, wb, "Resumo", resumo, [22, 48], false);

  // ---------- Aba 2: Produção diária ----------
  const cabecalhoProducao = [
    "Data",
    "Código",
    ...ATIVIDADES.map((a) => a.nome),
    "Total",
    "Presentes",
    "Ausentes"
  ];
  const linhasProducao = [
    cabecalhoProducao,
    ...lista.map((rdo) => [
      formatarDataExcel(rdo.data),
      textoOuTraco(rdo.codigo),
      ...ATIVIDADES.map((a) => obterQuantidadeAtividade(rdo, a.chave)),
      obterTotalProducao(rdo),
      obterPresentes(rdo),
      obterAusentes(rdo)
    ])
  ];
  criarAba(XLSX, wb, "Produção diária", linhasProducao, [12, 14, ...ATIVIDADES.map(() => 14), 10, 10, 10], true);

  // ---------- Aba 3: Produção consolidada ----------
  const linhasConsolidada = [
    ["Atividade", "Quantidade (un.)"],
    ...ATIVIDADES.map((a) => [
      a.nome,
      lista.reduce((t, rdo) => t + obterQuantidadeAtividade(rdo, a.chave), 0)
    ])
  ];
  criarAba(XLSX, wb, "Produção consolidada", linhasConsolidada, [32, 18], true);

  // ---------- Aba 4: Ocorrências ----------
  const ocorrencias = lista
    .map((rdo) => {
      const motivos = obterMotivos(rdo);
      const obs = rdo.observacoes || "";
      if (!motivos && !obs) return null;
      return [formatarDataExcel(rdo.data), textoOuTraco(rdo.codigo), motivos || "-", obs || "-"];
    })
    .filter(Boolean);
  criarAba(
    XLSX,
    wb,
    "Ocorrências",
    [["Data", "Código", "Motivos", "Observações"], ...(ocorrencias.length ? ocorrencias : [["-", "-", "Nenhuma ocorrência registrada.", "-"]])],
    [12, 14, 48, 70],
    true
  );

  // ---------- Aba 5: Efetivo ----------
  const linhasEfetivo = [
    ["Data", "Código", "Presentes", "Ausentes", "Qtd. Presentes", "Qtd. Ausentes"],
    ...lista.map((rdo) => {
      const presentes = obterNomesPorPresenca(rdo, "presente");
      const ausentes = obterNomesPorPresenca(rdo, "ausente");
      return [
        formatarDataExcel(rdo.data),
        textoOuTraco(rdo.codigo),
        presentes.length ? presentes.join(", ") : "-",
        ausentes.length ? ausentes.join(", ") : "-",
        presentes.length,
        ausentes.length
      ];
    })
  ];
  criarAba(XLSX, wb, "Efetivo", linhasEfetivo, [12, 14, 60, 60, 14, 14], true);

  // ---------- Aba 6: Materiais ----------
  const linhasMateriais = [["Data", "Código", "Material", "Quantidade", "Unidade"]];
  lista.forEach((rdo) => {
    (rdo.rdo_materiais || []).forEach((m) => {
      linhasMateriais.push([
        formatarDataExcel(rdo.data),
        textoOuTraco(rdo.codigo),
        textoOuTraco(m.descricao),
        numeroOuZero(m.quantidade),
        textoOuTraco(m.unidade)
      ]);
    });
  });
  if (linhasMateriais.length === 1) linhasMateriais.push(["-", "-", "Nenhum material registrado.", "-", "-"]);
  criarAba(XLSX, wb, "Materiais", linhasMateriais, [12, 14, 60, 14, 12], true);

  const sufixoPeriodo = dataInicio && dataFim ? `_${dataInicio}_${dataFim}` : "";
  const nomeArquivo = `RDO_${limparNomeArquivo(nomeObra)}${sufixoPeriodo}.xlsx`;
  XLSX.writeFile(wb, nomeArquivo);
  return nomeArquivo;
}
