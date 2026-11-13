import { useState } from "react";

function SelecionarObraRDO({
  obras,
  navegar,
  setObraSelecionada,
  usuario,
}) {
  const [busca, setBusca] = useState("");

  const obrasFiltradas = obras.filter((obra) =>
    obra.nome_condominio
      ?.toLowerCase()
      .includes(busca.toLowerCase())
  );

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

  const dataHojeTexto = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  function abrirConsulta(obra) {
    setObraSelecionada(obra);
    navegar("consulta-rdo");
  }

  function abrirRelatorio(obra) {
    setObraSelecionada(obra);
    navegar("relatorio-rdo");
  }

  return (
    <div className="app-content">
      <div className="admin-resumo-topo">
        <div>
          <h2>
            👋 {obterSaudacao()}, {usuario?.nome}
          </h2>
          <small>Consulta de RDOs · {dataHojeTexto}</small>
        </div>
        <span className="admin-resumo-badge">
          {obras.length} obra(s) disponível(is)
        </span>
      </div>

      <div className="form-group">
        <input
          type="text"
          placeholder="Buscar condomínio..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="obras-grid">
        {obrasFiltradas.map((obra) => (
          <div key={obra.id} className="obra-card">
            <div className="obra-card-header">
              <h3>{obra.nome_condominio}</h3>
            </div>
            <p>👥 {obra.equipe?.nome || "Sem equipe"}</p>
            <p>👷 {obra.encarregado?.nome || "Sem encarregado"}</p>
            <p>
              📋 Última RDO:{" "}
              {(() => {
                const datas = (obrasFiltradas || [])
                  .filter((r) => String(r.id) === String(obra.id) && r.data)
                  .map((r) => r.data)
                  .sort();
                const ultima = datas[datas.length - 1];
                return ultima ? ultima.split("-").reverse().join("/") : "Nenhuma RDO";
              })()}
            </p>
            <div className="obra-card-actions">
              <button
                className="btn btn-primary"
                onClick={() => abrirConsulta(obra)}
              >
                📋 Consultar RDOs
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => abrirRelatorio(obra)}
              >
                📊 Relatório
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SelecionarObraRDO;
