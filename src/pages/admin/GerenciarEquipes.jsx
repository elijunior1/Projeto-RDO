import {
  useState
} from "react";


function GerenciarEquipes( {
  equipes,
  setEquipes,
  colaboradores,
  navegar,
  sair,
}) {
  const [
    mostrarFormulario,
    setMostrarFormulario
  ] = useState(false);


  const [
    nomeEquipe,
    setNomeEquipe
  ] = useState("");


  const [
    colaboradoresSelecionados,
    setColaboradoresSelecionados
  ] = useState([]);


  function alternarColaborador(
    id
  ) {
    if (
      colaboradoresSelecionados.includes(
        id
      )
    ) {
      setColaboradoresSelecionados(
        colaboradoresSelecionados.filter(
          (
            colaboradorId
          ) =>
          colaboradorId !== id
        )
      );

      return;
    }


    setColaboradoresSelecionados([
      ...colaboradoresSelecionados,

      id,
    ]);
  }


  function criarEquipe(
    event
  ) {
    event.preventDefault();


    if (!nomeEquipe.trim()) {
      alert(
        "Digite o nome da equipe."
      );

      return;
    }


    if (
      colaboradoresSelecionados.length ===
      0
    ) {
      alert(
        "Selecione pelo menos um colaborador."
      );

      return;
    }


    const novaEquipe = {
      id: Date.now(),

      nome: nomeEquipe.trim(),

      colaboradoresIds:
      colaboradoresSelecionados,
    };


    setEquipes([
      ...equipes,

      novaEquipe,
    ]);


    setNomeEquipe("");

    setColaboradoresSelecionados([]);

    setMostrarFormulario(false);
  }


  function excluirEquipe(
    id
  ) {
    const confirmar =
    window.confirm(
      "Deseja realmente excluir esta equipe?"
    );


    if (!confirmar) {
      return;
    }


    setEquipes(
      equipes.filter(
        (
          equipe
        ) =>
        equipe.id !== id
      )
    );
  }


  function obterColaboradoresDaEquipe(
    equipe
  ) {
    return colaboradores.filter(
      (
        colaborador
      ) =>
      equipe.colaboradoresIds.includes(
        colaborador.id
      )
    );
  }


  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>
          Projeto RDO
        </h1>


        <button
          className="btn btn-danger"
          onClick={sair}
          >
          Sair
        </button>
      </header>


      <main className="app-content">
        <div className="page-header">
          <div>
            <button
              className="btn btn-ghost"
              onClick={() =>
              navegar("home")
              }
              >
              ← Voltar
            </button>


            <h1>
              Equipes
            </h1>


            <p>
              Organize os colaboradores em equipes de trabalho.
            </p>
          </div>


          <button
            className="btn btn-primary"
            onClick={() =>
            setMostrarFormulario(
              !mostrarFormulario
            )
            }
            >
            {mostrarFormulario
            ? "Fechar": "+ Nova Equipe"}
          </button>
        </div>


        {mostrarFormulario && (
          <form
            className="form-card"
            onSubmit={
            criarEquipe
            }
            >
            <h2>
              Nova Equipe
            </h2>


            <div className="form-group">
              <label>
                Nome da equipe
              </label>


              <input
              type="text"
              value={
              nomeEquipe
              }
              onChange={(
                event
              ) =>
              setNomeEquipe(
                event.target.value
              )
              }
              placeholder="Ex: Equipe Fundação 1"
              required
              />
          </div>


          <div className="form-group">
            <label>
              Colaboradores
            </label>


            {colaboradores.length ===
            0 ? (
              <p>
                Nenhum colaborador cadastrado.
              </p>
            ): (
              <div className="selection-list">
                {colaboradores.map(
                  (
                    colaborador
                  ) => (
                    <label
                      className="selection-item"
                      key={
                      colaborador.id
                      }
                      >
                      <input
                      type="checkbox"
                      checked={colaboradoresSelecionados.includes(
                        colaborador.id
                      )}
                      onChange={() =>
                      alternarColaborador(
                        colaborador.id
                      )
                      }
                      />


                    <span>
                      {
                      colaborador.nome
                      }
                    </span>
                  </label>
                )
              )}
            </div>
          )}
        </div>


        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setNomeEquipe("");

              setColaboradoresSelecionados(
                []
              );

              setMostrarFormulario(
                false
              );
            }}
            >
            Cancelar
          </button>


          <button
            type="submit"
            className="btn btn-primary"
            >
            Criar Equipe
          </button>
        </div>
      </form>
    )}


    <section className="section">
      <div className="section-header">
        <h2>
          Equipes cadastradas
        </h2>


        <span>
          {equipes.length} equipe(s)
        </span>
      </div>


      {equipes.length === 0 ? (
        <div className="empty-state">
          <p>
            Nenhuma equipe cadastrada.
          </p>
        </div>
      ): (
        <div className="cards-grid">
          {equipes.map(
            (
              equipe
            ) => {
              const membros =
              obterColaboradoresDaEquipe(
                equipe
              );


              return (
                <article
                  className="card"
                  key={
                  equipe.id
                  }
                  >
                  <h3>
                    {
                    equipe.nome
                    }
                  </h3>


                  <p>
                    {
                    membros.length
                    } colaborador(es)
                  </p>


                  <ul>
                    {membros.map(
                      (
                        membro
                      ) => (
                        <li
                          key={
                          membro.id
                          }
                          >
                          {
                          membro.nome
                          }
                        </li>
                      )
                    )}
                  </ul>


                  <button
                    className="btn btn-danger"
                    onClick={() =>
                    excluirEquipe(
                      equipe.id
                    )
                    }
                    >
                    Excluir equipe
                  </button>
                </article>
              );
            }
          )}
        </div>
      )}
    </section>
  </main>
</div>
);
}


export default GerenciarEquipes;