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
  obra,
  navegar
}) {

  const navigate = useNavigate();

  const [rdos, setRdos] = useState([]);

  const [carregando, setCarregando] = useState(true);

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
        .eq("obra_id", obra.id)
        .order("data", { ascending: false });

      if (error) throw error;

      setRdos(data || []);
    } catch (erro) {
      console.error("Erro ao carregar RDOs:", erro);
      alert("Erro ao carregar as RDOs.");
    } finally {
      setCarregando(false);
    }
  }

  /*
  ================================================
  FORMATAR DATA
  ================================================
  */

  function formatarData(data) {
    if (!data) return "Não informado";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  /*
  ================================================
  ATIVIDADE
  ================================================
  */

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
    return atividades[ atividade ] || atividade;
  }

  /*
  ================================================
  TOTAIS
  ================================================
  */

  function obterTotalProducao(rdo) {
    return (rdo.rdo_producao || []).reduce((total, item) => total + Number(item.quantidade || 0), 0);
  }

  function obterTotalPresentes(rdo) {
    return (rdo.rdo_efetivo || []).filter(efetivo => efetivo.presenca === "presente").length;
  }

  function obterTotalAusentes(rdo) {
    return (rdo.rdo_efetivo || []).filter(efetivo => efetivo.presenca === "ausente").length;
  }

  const totalProducao = rdos.reduce((acc, rdo) => acc + obterTotalProducao(rdo), 0);
  const totalPresentes = rdos.reduce((acc, rdo) => acc + obterTotalPresentes(rdo), 0);
  const totalAusentes = rdos.reduce((acc, rdo) => acc + obterTotalAusentes(rdo), 0);

  /*
  ================================================
  DESVIOS DE RDO
  ================================================
  */

  function ehDiaUtil(data) {
    const diaSemana = data.getDay();
    return diaSemana >= 1 && diaSemana <= 5;
  }

  function contarDiasUteis(dataInicio, dataFim) {
    let count = 0;
    const atual = new Date(dataInicio);
    while (atual <= dataFim) {
      if (ehDiaUtil(atual)) count++;
      atual.setDate(atual.getDate() + 1);
    }
    return count;
  }

  function calcularDesviosRDO() {
    if (!obra?.data_inicio) return 0;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const diasUteis = contarDiasUteis(obra.data_inicio, hoje);
    const rdosEnviadas = rdos.length;
    const desvios = diasUteis - rdosEnviadas;
    return desvios > 0 ? desvios : 0;
  }

  const desviosRDO = calcularDesviosRDO();

  /*
  ================================================
  ABRIR RDO
  ================================================
  */

  function abrirRDO(rdo) {
    navigate(`/admin/rdo/${rdo.id}`);
  }

  /*
  ================================================
  VOLTAR
  ================================================
  */

  function voltar() {
    navegar("selecionar-rdo");
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
        <div className="gerenciar-card">
          <div className="page-title">
            <h1>Consulta RDO</h1>
            <p>{ obra?.nome_condominio || "Obra não selecionada" }</p>
          </div>

          <button
            className="btn btn-ghost btn-voltar"
            onClick={voltar}
          >
            ← Voltar
          </button>
        </div>
      </div>

      {/* RESUMO (padrão Obras com ícones - linha única) */}
      <div className="obras-resumo-section">
        <div className="obras-resumo">
          <div className="resumo-card resumo-card-total">
            <div className="resumo-icon">📋</div>
            <span>Total RDOs</span>
            <strong>{rdos.length}</strong>
          </div>

          <div className="resumo-card resumo-card-producao">
            <div className="resumo-icon">🏭</div>
            <span>Produção</span>
            <strong>{totalProducao}</strong>
          </div>

          <div className="resumo-card resumo-card-presentes">
            <div className="resumo-icon">✅</div>
            <span>Presentes</span>
            <strong>{totalPresentes}</strong>
          </div>

          <div className="resumo-card resumo-card-ausentes">
            <div className="resumo-icon">❌</div>
            <span>Ausentes</span>
            <strong>{totalAusentes}</strong>
          </div>

          <div className="resumo-card resumo-card-desvios">
            <div className="resumo-icon">⚠️</div>
            <span>Desvios RDO</span>
            <strong>{desviosRDO}</strong>
          </div>
        </div>
      </div>

      {/* ========================================
          CARREGANDO
      ======================================== */}

      {carregando && (
        <div className="empty-state"><p>Carregando RDOs...</p></div>
      )}

      {/* ========================================
          NENHUMA RDO
      ======================================== */}

      {!carregando && rdos.length === 0 && (
        <div className="empty-state"><p>Nenhuma RDO encontrada para esta obra.</p></div>
      )}

      {/* ========================================
          LISTA DE RDOs
      ======================================== */}

      {!carregando && rdos.length > 0 && (
        <div className="obras-grid">
          {rdos.map(rdo => (
            <div className="obra-card" key={rdo.id}>
              <div className="obra-card-header">
                <h3>📋 {rdo.codigo || "RDO sem código"}</h3>
                <span className="rdo-card-data">{formatarData(rdo.data)}</span>
                <span className="badge badge-success">RDO</span>
              </div>
              <p>🏭 Produção: {obterTotalProducao(rdo)} un.</p>
              <p>👷 Efetivo: {rdo.rdo_efetivo?.length || 0}</p>
              <p>✅ Presentes: {obterTotalPresentes(rdo)}</p>
              <p>❌ Ausentes: {obterTotalAusentes(rdo)}</p>
              <div className="obra-card-actions">
                <button className="btn btn-primary" onClick={() => abrirRDO(rdo)}>
                  Ver detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </main>
  );
}

export default ConsultaRDO;
