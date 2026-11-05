// Configuração central de produtividade por perfil.
// Usada pelo formulário de RDO e pelos relatórios (PDF/consulta/detalhe).

export const CAMPOS_PRODUCAO_ENCARREGADO = [
  { campo: "escavacao", atividade: "escavacao", label: "Escavação" },
  { campo: "concretagem", atividade: "concretagem", label: "Concretagem" },
  { campo: "acabamento", atividade: "acabamento", label: "Acabamento" },
  {
    campo: "instalacaoModulo",
    atividade: "instalacao_modulo",
    label: "Instalação de Módulo",
  },
  {
    campo: "instalacaoTerca",
    atividade: "instalacao_terca",
    label: "Instalação de Terça",
  },
  {
    campo: "instalacaoTelha",
    atividade: "instalacao_telha",
    label: "Instalação de Telha",
  },
];

export const CAMPOS_PRODUCAO_PINTURA = [
  { campo: "faixas", atividade: "faixas", label: "Faixas" },
  { campo: "copinhos", atividade: "copinhos", label: "Copinhos" },
  { campo: "modulos", atividade: "modulos", label: "Módulos" },
  { campo: "tercas", atividade: "tercas", label: "Terças" },
  { campo: "manutencao", atividade: "manutencao", label: "Manutenção" },
];

export const ATIVIDADES_LABEL = {
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
  manutencao: "Manutenção",
};

export function obterCamposProducao(perfil) {
  return perfil === "pintura"
    ? CAMPOS_PRODUCAO_PINTURA
    : CAMPOS_PRODUCAO_ENCARREGADO;
}

export function producaoInicial(perfil) {
  return Object.fromEntries(
    obterCamposProducao(perfil).map((campo) => [campo.campo, 0])
  );
}

export function nomeAtividade(atividade) {
  return ATIVIDADES_LABEL[atividade] || atividade;
}
