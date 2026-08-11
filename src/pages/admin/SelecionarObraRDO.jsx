import {
  useState
} from "react";

function SelecionarObraRDO( {
  obras,
  navegar,
  setObraSelecionada,
}) {

  const [busca,
    setBusca] = useState("");

  const obrasFiltradas = obras.filter((obra) =>
    obra.nome_condominio
    ?.toLowerCase()
    .includes(busca.toLowerCase())
  );

  function abrirConsulta(obra) {
    setObraSelecionada(obra);
    navegar("consulta-rdo");
  }

  return (
    <div className="app-content">

      <div className="page-header">
        <div>
          <button
            className="btn btn-ghost"
            onClick={() => navegar("home")}
            >
            ← Voltar
          </button>

          <h1>Consulta de RDOs</h1>

          <p>
            Selecione uma obra para consultar os relatórios.
          </p>
        </div>
      </div>

      <div className="form-group">
        <input
        type="text"
        placeholder="Buscar condomínio..."
        value={busca}
        onChange={(e) =>
        setBusca(e.target.value)
        }
        />
    </div>

    <div className="obras-grid">

      {obrasFiltradas.map((obra) => (

        <div
          key={obra.id}
          className="obra-card"
          >

          <div className="obra-card-header">

            <h3>
              {obra.nome_condominio}
            </h3>

          </div>

          <p>
            📍 {obra.endereco}
          </p>

          <p>
            📅 Início: {obra.data_inicio?.split("-").reverse().join("/")}
          </p>

          <div className="obra-card-actions">

            <button
              className="btn btn-primary"
              onClick={() =>
              abrirConsulta(obra)
              }
              >
              Consultar RDOs
            </button>

          </div>

        </div>

      ))}

    </div>

  </div>
);
}

export default SelecionarObraRDO;