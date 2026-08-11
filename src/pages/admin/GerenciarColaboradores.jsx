import {
  useEffect,
  useState
} from "react";

import {
  supabase
} from "../../supabase.js";

function GerenciarColaboradores( {
  navegar,
  sair,
}) {

  const [
    abaAtual,
    setAbaAtual
  ] = useState(
    "colaboradores"
  );

  const [
    colaboradores,
    setColaboradores
  ] = useState([]);

  const [
    equipes,
    setEquipes
  ] = useState([]);

  const [
    carregando,
    setCarregando
  ] = useState(true);

  const [
    mostrarFormularioColaborador,
    setMostrarFormularioColaborador
  ] = useState(false);

  const [
    mostrarFormularioEquipe,
    setMostrarFormularioEquipe
  ] = useState(false);

  const [
    nome,
    setNome
  ] = useState("");

  const [
    tipo,
    setTipo
  ] = useState("fixo");

  const [
    nomeEquipe,
    setNomeEquipe
  ] = useState("");

  const [
    colaboradoresSelecionados,
    setColaboradoresSelecionados
  ] = useState([]);

  const [
    equipeEditando,
    setEquipeEditando
  ] = useState(null);

  const [
    salvandoEquipe,
    setSalvandoEquipe
  ] = useState(false);

  const [
    buscaColaborador,
    setBuscaColaborador
  ] = useState("");

  const [
    buscaEquipe,
    setBuscaEquipe
  ] = useState("");

  /*

CARREGAR DADOS DO SUPABASE

*/

  useEffect(() => {

    carregarDados();

  }, []);

  async function carregarDados() {

    try {

      setCarregando(true);


      const {
        data: colaboradoresData,
        error: colaboradoresError
      } = await supabase
      .from(
        "rdo_colaboradores"
      )
      .select("*")
      .eq(
        "ativo",
        true
      )
      .order(
        "nome",
        {
          ascending: true
        }
      );


      if (
        colaboradoresError
      ) {

        throw colaboradoresError;

      }


      const {
        data: equipesData,
        error: equipesError
      } = await supabase
      .from(
        "rdo_equipes"
      )
      .select("*")
      .order(
        "nome",
        {
          ascending: true
        }
      );


      if (
        equipesError
      ) {

        throw equipesError;

      }


      const {
        data: membrosData,
        error: membrosError
      } = await supabase
      .from(
        "rdo_equipe_colaboradores"
      )
      .select(
        "equipe_id, colaborador_id"
      );


      if (
        membrosError
      ) {

        throw membrosError;

      }


      const equipesComColaboradores =
      equipesData.map(
        (
          equipe
        ) => {

          const colaboradoresIds =
          membrosData
          .filter(
            (
              membro
            ) =>
            membro.equipe_id ===
            equipe.id
          )
          .map(
            (
              membro
            ) =>
            membro.colaborador_id
          );


          return {

            ...equipe,

            colaboradoresIds

          };

        }
      );


      setColaboradores(
        colaboradoresData ||
        []
      );


      setEquipes(
        equipesComColaboradores
      );


    } catch (
      erro
    ) {

      console.error(
        "Erro ao carregar dados:",
        erro
      );


      alert(
        "Erro ao carregar colaboradores e equipes."
      );


    } finally {

      setCarregando(
        false
      );

    }

  }

  /*

CADASTRAR COLABORADOR

*/

  async function cadastrarColaborador(
    event
  ) {

    event.preventDefault();


    if (
      !nome.trim()
    ) {

      alert(
        "Digite o nome do colaborador."
      );


      return;

    }


    try {

      const {
        data,
        error
      } = await supabase
      .from(
        "rdo_colaboradores"
      )
      .insert([{

        nome:
        nome.trim(),

        tipo,

        ativo:
        true

      }])
      .select()
      .single();


      if (
        error
      ) {

        throw error;

      }


      setColaboradores(
        [
          ...colaboradores,

          data

        ].sort(
          (
            a,
            b
          ) =>
          a.nome.localeCompare(
            b.nome
          )
        )
      );


      setNome("");


      setTipo(
        "fixo"
      );


      setMostrarFormularioColaborador(
        false
      );


      alert(
        "Colaborador cadastrado com sucesso!"
      );


    } catch (
      erro
    ) {

      console.error(
        "Erro ao cadastrar colaborador:",
        erro
      );


      alert(
        "Erro ao cadastrar colaborador."
      );

    }

  }

  /*

EXCLUIR COLABORADOR

*/

  async function excluirColaborador(
    id
  ) {

    const confirmar =
    window.confirm(
      "Deseja realmente excluir este colaborador?"
    );


    if (
      !confirmar
    ) {

      return;

    }


    const pertenceAEquipe =
    equipes.some(
      (
        equipe
      ) =>
      equipe.colaboradoresIds.includes(
        id
      )
    );


    if (
      pertenceAEquipe
    ) {

      alert(
        "Este colaborador pertence a uma equipe. Remova-o da equipe antes de excluir."
      );


      return;

    }


    try {

      const {
        error
      } = await supabase
      .from(
        "rdo_colaboradores"
      )
      .update({

        ativo:
        false

      })
      .eq(
        "id",
        id
      );


      if (
        error
      ) {

        throw error;

      }


      setColaboradores(
        colaboradores.filter(
          (
            colaborador
          ) =>
          colaborador.id !==
          id
        )
      );


      alert(
        "Colaborador excluído com sucesso!"
      );


    } catch (
      erro
    ) {

      console.error(
        "Erro ao excluir colaborador:",
        erro
      );


      alert(
        "Erro ao excluir colaborador."
      );

    }

  }

  /*

VERIFICAR SE COLABORADOR JÁ PERTENCE A OUTRA EQUIPE

*/

  function colaboradorJaPertenceAEquipe(
    colaboradorId
  ) {

    return equipes.some(
      (
        equipe
      ) => {

        if (
          equipeEditando &&
          equipe.id ===
          equipeEditando.id
        ) {

          return false;

        }


        return equipe.colaboradoresIds.includes(
          colaboradorId
        );

      }
    );

  }

  /*

SELECIONAR OU REMOVER COLABORADOR

*/

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
          colaboradorId !==
          id
        )
      );


      return;

    }


    if (
      colaboradorJaPertenceAEquipe(
        id
      )
    ) {

      alert(
        "Este colaborador já pertence a outra equipe."
      );


      return;

    }


    setColaboradoresSelecionados(
      [
        ...colaboradoresSelecionados,

        id

      ]
    );

  }

  /*

INICIAR EDIÇÃO DA EQUIPE

*/

  function editarEquipe(
    equipe
  ) {

    setEquipeEditando(
      equipe
    );


    setNomeEquipe(
      equipe.nome
    );


    setColaboradoresSelecionados(
      [
        ...equipe.colaboradoresIds
      ]
    );


    setMostrarFormularioEquipe(
      true
    );


    setAbaAtual(
      "equipes"
    );

  }

  /*

CRIAR OU EDITAR EQUIPE

*/

  async function criarEquipe(
    event
  ) {

    event.preventDefault();


    if (
      !nomeEquipe.trim()
    ) {

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


    /*
==================================================
EDITAR EQUIPE EXISTENTE
==================================================
*/

    if (
      equipeEditando
    ) {

      try {

        setSalvandoEquipe(
          true
        );


        /*
    ==============================
    1. ATUALIZAR NOME
    ==============================
    */

        const {
          error: equipeError
        } = await supabase
        .from(
          "rdo_equipes"
        )
        .update({

          nome:
          nomeEquipe.trim()

        })
        .eq(
          "id",
          equipeEditando.id
        );


        if (
          equipeError
        ) {

          throw equipeError;

        }


        /*
    ==============================
    2. REMOVER VÍNCULOS ANTIGOS
    ==============================
    */

        const {
          error: excluirVinculosError
        } = await supabase
        .from(
          "rdo_equipe_colaboradores"
        )
        .delete()
        .eq(
          "equipe_id",
          equipeEditando.id
        );


        if (
          excluirVinculosError
        ) {

          throw excluirVinculosError;

        }


        /*
    ==============================
    3. INSERIR NOVOS VÍNCULOS
    ==============================
    */

        const novosVinculos =
        colaboradoresSelecionados.map(
          (
            colaboradorId
          ) => ({

              equipe_id:
              equipeEditando.id,

              colaborador_id:
              colaboradorId

            })
        );


        const {
          error: novosVinculosError
        } = await supabase
        .from(
          "rdo_equipe_colaboradores"
        )
        .insert(
          novosVinculos
        );


        if (
          novosVinculosError
        ) {

          throw novosVinculosError;

        }


        /*
    ==============================
    4. RECARREGAR DADOS
    ==============================
    */

        setEquipes(
          equipes.map(equipe =>
            equipe.id === equipeEditando.id
            ? {
              ...equipe,
              nome: nomeEquipe.trim(),
              colaboradoresIds: colaboradoresSelecionados
            }: equipe
          )
        );


        setNomeEquipe(
          ""
        );


        setColaboradoresSelecionados(
          []
        );


        setEquipeEditando(
          null
        );


        setMostrarFormularioEquipe(
          false
        );


        alert(
          "Equipe atualizada com sucesso!"
        );


      } catch (
        erro
      ) {

        console.error(
          "Erro ao atualizar equipe:",
          erro
        );


        alert(
          "Erro ao atualizar equipe."
        );


      } finally {

        setSalvandoEquipe(
          false
        );

      }


      return;

    }


    /*
==================================================
CRIAR NOVA EQUIPE
==================================================
*/

    try {

      const {
        data: novaEquipe,
        error: equipeError
      } = await supabase
      .from(
        "rdo_equipes"
      )
      .insert([{

        nome:
        nomeEquipe.trim()

      }])
      .select()
      .single();


      if (
        equipeError
      ) {

        throw equipeError;

      }


      const vinculos =
      colaboradoresSelecionados.map(
        (
          colaboradorId
        ) => ({

            equipe_id:
            novaEquipe.id,

            colaborador_id:
            colaboradorId

          })
      );


      const {
        error: vinculosError
      } = await supabase
      .from(
        "rdo_equipe_colaboradores"
      )
      .insert(
        vinculos
      );


      if (
        vinculosError
      ) {

        await supabase
        .from(
          "rdo_equipes"
        )
        .delete()
        .eq(
          "id",
          novaEquipe.id
        );


        throw vinculosError;

      }


      const equipeCompleta = {

        ...novaEquipe,

        colaboradoresIds:
        colaboradoresSelecionados

      };


      setEquipes(
        [
          ...equipes,

          equipeCompleta

        ].sort(
          (
            a,
            b
          ) =>
          a.nome.localeCompare(
            b.nome
          )
        )
      );


      setNomeEquipe(
        ""
      );


      setColaboradoresSelecionados(
        []
      );


      setMostrarFormularioEquipe(
        false
      );


      alert(
        "Equipe criada com sucesso!"
      );


    } catch (
      erro
    ) {

      console.error(
        "Erro ao criar equipe:",
        erro
      );


      alert(
        "Erro ao criar equipe."
      );

    }

  }

  /*

EXCLUIR EQUIPE

*/

  async function excluirEquipe(
    id
  ) {

    const confirmar =
    window.confirm(
      "Deseja realmente excluir esta equipe?"
    );


    if (
      !confirmar
    ) {

      return;

    }


    try {

      const {
        error: vinculosError
      } = await supabase
      .from(
        "rdo_equipe_colaboradores"
      )
      .delete()
      .eq(
        "equipe_id",
        id
      );


      if (
        vinculosError
      ) {

        throw vinculosError;

      }


      const {
        error: equipeError
      } = await supabase
      .from(
        "rdo_equipes"
      )
      .delete()
      .eq(
        "id",
        id
      );


      if (
        equipeError
      ) {

        throw equipeError;

      }


      setEquipes(
        equipes.filter(
          (
            equipe
          ) =>
          equipe.id !==
          id
        )
      );


      alert(
        "Equipe excluída com sucesso!"
      );


    } catch (
      erro
    ) {

      console.error(
        "Erro ao excluir equipe:",
        erro
      );


      alert(
        "Erro ao excluir equipe."
      );

    }

  }

  // OBTER MEMBROS DA EQUIPE
  function obterMembrosEquipe(
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

  //FILTRAR COLABORADORES
  const colaboradoresFiltrados =
  colaboradores.filter(
    colaborador =>
    colaborador.nome
    .toLowerCase()
    .includes(
      buscaColaborador.toLowerCase()
    )
  );

  //FILTRAR EQUIPES
  const equipesFiltradas =
  equipes.filter(
    equipe =>
    equipe.nome
    .toLowerCase()
    .includes(
      buscaEquipe.toLowerCase()
    )
  );

  // TELA
  if (carregando) {
    return (
      <div className="loading-state">
        <p>
          Carregando...
        </p>
      </div>
    );
  }
  return (

    <div className="app-layout">
      <main className="app-content">

        <div className="page-header">

          <div>

            <button
              className="btn btn-ghost"
              onClick={() =>
              navegar(
                "home"
              )
              }
              >

              ← Voltar

            </button>


            <h1>
              Colaboradores e Equipes
            </h1>


            <p>
              Gerencie os colaboradores e as equipes das obras.
            </p>

          </div>

        </div>


        <div className="tabs">

          <button
            className={
            abaAtual ===
            "colaboradores"
            ? "tab active": "tab"
            }
            onClick={() => {

              setAbaAtual(
                "colaboradores"
              );
              setBuscaEquipe("");
              setMostrarFormularioEquipe(
                false
              );


              setEquipeEditando(
                null
              );

            }}
            >

            Colaboradores

          </button>


          <button
            className={
            abaAtual ===
            "equipes"
            ? "tab active": "tab"
            }
            onClick={() => {

              setAbaAtual(
                "equipes"
              );
              setBuscaColaborador("");
              setMostrarFormularioColaborador(
                false
              );

            }}
            >

            Equipes

          </button>

        </div>


        {abaAtual ===
        "colaboradores" && (

          <>

            <div className="page-actions">

              <button
                className="btn btn-primary"
                onClick={() =>
                setMostrarFormularioColaborador(
                  !mostrarFormularioColaborador
                )
                }
                >

                {
                mostrarFormularioColaborador
                ? "Fechar": "+ Novo Colaborador"
                }

              </button>

            </div>


            {mostrarFormularioColaborador && (

              <form
                className="form-card"
                onSubmit={
                cadastrarColaborador
                }
                >

                <h2>
                  Novo Colaborador
                </h2>


                <div className="form-group">

                  <label>
                    Nome completo
                  </label>


                  <input
                  type="text"
                  value={
                  nome
                  }
                  onChange={(
                    event
                  ) =>
                  setNome(
                    event.target.value
                  )
                  }
                  placeholder="Digite o nome"
                  required
                  />

              </div>


              <div className="form-group">

                <label>
                  Tipo
                </label>


                <select
                  value={
                  tipo
                  }
                  onChange={(
                    event
                  ) =>
                  setTipo(
                    event.target.value
                  )
                  }
                  >

                  <option value="fixo">
                    Colaborador fixo
                  </option>


                  <option value="diarista">
                    Diarista
                  </option>

                </select>

              </div>


              <div className="form-actions">

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                  setMostrarFormularioColaborador(
                    false
                  )
                  }
                  >

                  Cancelar

                </button>


                <button
                  type="submit"
                  className="btn btn-primary"
                  >

                  Cadastrar

                </button>

              </div>

            </form>

          )}

          < br/>
          <p>
            Filtro de busca
          </p>

          <div className="form-group">
            <input
            type="text"
            placeholder="Buscar colaborador..."
            value={buscaColaborador}
            onChange={(event) =>
            setBuscaColaborador(
              event.target.value
            )
            }
            />
        </div>

        <section className="section">

          <div className="section-header">

            <h2>
              Colaboradores cadastrados
            </h2>


            <span>
              {colaboradoresFiltrados.length}
              {" "}
              colaborador(es)
            </span>

          </div>


          {colaboradoresFiltrados.length === 0 ? (

            <div className="empty-state">

              <p>
                Nenhum colaborador encontrado.
              </p>

            </div>

          ): (

            <div className="cards-grid">

              {colaboradoresFiltrados.map(
                (
                  colaborador
                ) => (

                  <article
                    className="card"
                    key={
                    colaborador.id
                    }
                    >

                    <h3>
                      {
                      colaborador.nome
                      }
                    </h3>


                    <p>

                      Tipo:{" "}

                      {
                      colaborador.tipo ===
                      "fixo"
                      ? "Colaborador fixo": "Diarista"
                      }

                    </p>


                    <button
                      className="btn btn-danger"
                      onClick={() =>
                      excluirColaborador(
                        colaborador.id
                      )
                      }
                      >

                      Excluir

                    </button>

                  </article>

                )
              )}

            </div>

          )}

        </section>

      </>

    )}


    {abaAtual ===
    "equipes" && (

      <>

        <div className="page-actions">

          <button
            className="btn btn-primary"
            onClick={() => {

              if (
                mostrarFormularioEquipe
              ) {

                setNomeEquipe(
                  ""
                );


                setColaboradoresSelecionados(
                  []
                );


                setEquipeEditando(
                  null
                );

              }


              setMostrarFormularioEquipe(
                !mostrarFormularioEquipe
              );

            }}
            >

            {
            mostrarFormularioEquipe
            ? "Fechar": "+ Nova Equipe"
            }

          </button>

        </div>


        {mostrarFormularioEquipe && (

          <form
            className="form-card"
            onSubmit={
            criarEquipe
            }
            >

            <h2>

              {
              equipeEditando
              ? "Editar Equipe": "Nova Equipe"
              }

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
              Selecionar colaboradores
            </label>


            {colaboradores.length ===
            0 ? (

              <p>
                Cadastre colaboradores antes de criar uma equipe.
              </p>

            ): (

              <div className="selection-list">

                {colaboradoresFiltrados.map(
                  (
                    colaborador
                  ) => {

                    const jaPertenceAEquipe =
                    colaboradorJaPertenceAEquipe(
                      colaborador.id
                    );


                    return (

                      <label
                        className={
                        jaPertenceAEquipe
                        ? "selection-item disabled": "selection-item"
                        }
                        key={
                        colaborador.id
                        }
                        >

                        <input
                        type="checkbox"
                        checked={
                        colaboradoresSelecionados.includes(
                          colaborador.id
                        )
                        }
                        disabled={
                        jaPertenceAEquipe
                        }
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


                        {jaPertenceAEquipe && (

                          <small>

                            {" "}
                            — Já pertence a outra equipe

                          </small>

                        )}

                      </span>

                    </label>

                  );

                }

              )}

            </div>

          )}

        </div>


        <div className="form-actions">

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {

              setNomeEquipe(
                ""
              );


              setColaboradoresSelecionados(
                []
              );


              setEquipeEditando(
                null
              );


              setMostrarFormularioEquipe(
                false
              );

            }}
            >

            Cancelar

          </button>


          <button
            type="submit"
            className="btn btn-primary"
            disabled={
            salvandoEquipe
            }
            >

            {
            salvandoEquipe
            ? "Salvando...": equipeEditando
            ? "Salvar Alterações": "Criar Equipe"
            }

          </button>

        </div>

      </form>

    )}

    < br/>
    <p>
      Buscador de equipes
    </p>
    <div className="form-group">
      <input
      type="text"
      placeholder="Buscar equipe..."
      value={buscaEquipe}
      onChange={(event) =>
      setBuscaEquipe(
        event.target.value
      )
      }
      />
  </div>

  <section className="section">

    <div className="section-header">

      <h2>
        Equipes cadastradas
      </h2>


      <span>
        {equipesFiltradas.length}
        {" "}
        equipe(s)
      </span>

    </div>


    {equipesFiltradas.length ===
    0 ? (

      <div className="empty-state">

        <p>
          Nenhuma equipe encontrada.
        </p>

      </div>

    ): (

      <div className="cards-grid">

        {equipesFiltradas.map(
          (
            equipe
          ) => {

            const membros =
            obterMembrosEquipe(
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


                <div className="card-actions">

                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                    editarEquipe(
                      equipe
                    )
                    }
                    >

                    Editar

                  </button>


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

                </div>

              </article>

            );

          }

        )}

      </div>

    )}

  </section>

</>

)}

</main>

</div>

);

}

export default GerenciarColaboradores;