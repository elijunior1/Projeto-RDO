import {
  useEffect,
  useState
} from "react";

import {
  supabase
} from "../../supabase.js";

import "./GerenciarColaboradores.css";

function GerenciarColaboradores({
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
    encarregados,
    setEncarregados
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
    colaboradorEditando,
    setColaboradorEditando
  ] = useState(null);

  const [
    salvandoColaborador,
    setSalvandoColaborador
  ] = useState(false);

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

  const [
    buscaEncarregado,
    setBuscaEncarregado
  ] = useState("");

  const [
    mostrarFormularioEncarregado,
    setMostrarFormularioEncarregado
  ] = useState(false);

  const [
    nomeEncarregado,
    setNomeEncarregado
  ] = useState("");

  const [
    emailEncarregado,
    setEmailEncarregado
  ] = useState("");

  const [
    senhaEncarregado,
    setSenhaEncarregado
  ] = useState("");

  const [
    tipoEncarregado,
    setTipoEncarregado
  ] = useState("encarregado");

  const [
    ativoEncarregado,
    setAtivoEncarregado
  ] = useState(true);

  const [
    encarregadoEditando,
    setEncarregadoEditando
  ] = useState(null);

  const [
    salvandoEncarregado,
    setSalvandoEncarregado
  ] = useState(false);

  function ehPintura(perfil) {
    const p = String(perfil || "").toLowerCase().trim();
    return p.includes("pintura") || p.includes("pintor");
  }

  function tipoParaPerfil(tipo) {
    return tipo === "pintura" ? "pintura" : "encarregado";
  }

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

      // ENCARREGADOS (ativos e inativos) — todos da tabela usuarios
      const {
        data: usuariosData,
        error: usuariosError
      } = await supabase
        .from("usuarios")
        .select("id, nome, email, perfil, ativo")
        .order("nome", { ascending: true });

      if (!usuariosError && usuariosData) {
        const lista = (usuariosData || []).filter(u => {
          const p = String(u.perfil || "").toLowerCase().trim();
          return (
            p.includes("encarregado") ||
            p.includes("pintura") ||
            p.includes("pintor")
          );
        });
        setEncarregados(lista);
      }


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
  ================================================
  CADASTRAR OU EDITAR COLABORADOR
  ================================================
  */

  async function cadastrarColaborador(
    event
  ) {

    event.preventDefault();


    if (!nome.trim()) {

      alert(
        "Digite o nome do colaborador."
      );

      return;

    }


    /*
    ==============================================
    EDITAR COLABORADOR EXISTENTE
    ==============================================
    */

    if (colaboradorEditando) {

      try {

        setSalvandoColaborador(
          true
        );


        const {
          data,
          error
        } = await supabase
          .from(
            "rdo_colaboradores"
          )
          .update({

            nome:
              nome.trim(),

            tipo

          })
          .eq(
            "id",
            colaboradorEditando.id
          )
          .select()
          .single();


        if (error) {

          throw error;

        }


        /*
        ==========================================
        ATUALIZAR LISTA
        ==========================================
        */

        setColaboradores(
          colaboradores
            .map(
              colaborador =>
                colaborador.id ===
                  colaboradorEditando.id
                  ? data
                  : colaborador
            )
            .sort(
              (
                a,
                b
              ) =>
                a.nome.localeCompare(
                  b.nome
                )
            )
        );


        /*
        ==========================================
        LIMPAR FORMULÁRIO
        ==========================================
        */

        setNome("");

        setTipo(
          "fixo"
        );

        setColaboradorEditando(
          null
        );

        setMostrarFormularioColaborador(
          false
        );


        alert(
          "Colaborador atualizado com sucesso!"
        );


      } catch (
      erro
      ) {

        console.error(
          "Erro ao atualizar colaborador:",
          erro
        );


        alert(
          "Erro ao atualizar colaborador."
        );


      } finally {

        setSalvandoColaborador(
          false
        );

      }


      return;

    }


    /*
    ==============================================
    CADASTRAR NOVO COLABORADOR
    ==============================================
    */

    try {

      setSalvandoColaborador(
        true
      );


      const {
        data,
        error
      } = await supabase
        .from(
          "rdo_colaboradores"
        )
        .insert([
          {

            nome:
              nome.trim(),

            tipo,

            ativo:
              true

          }
        ])
        .select()
        .single();


      if (error) {

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


    } finally {

      setSalvandoColaborador(
        false
      );

    }

  }

  /*
================================================
INICIAR EDIÇÃO DO COLABORADOR
================================================
*/

  function editarColaborador(
    colaborador
  ) {

    setColaboradorEditando(
      colaborador
    );


    setNome(
      colaborador.nome
    );


    setTipo(
      colaborador.tipo || "fixo"
    );


    setMostrarFormularioColaborador(
      true
    );

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
              } : equipe
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
        .insert([ {

          nome:
            nomeEquipe.trim()

        } ])
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

  // ================= ENCARREGADOS (CRUD) =================
  function limparFormularioEncarregado() {
    setNomeEncarregado("");
    setEmailEncarregado("");
    setSenhaEncarregado("");
    setTipoEncarregado("encarregado");
    setAtivoEncarregado(true);
    setEncarregadoEditando(null);
  }

  function editarEncarregado(enc) {
    setEncarregadoEditando(enc);
    setNomeEncarregado(enc.nome || "");
    setEmailEncarregado(enc.email || "");
    setSenhaEncarregado("");
    setTipoEncarregado(ehPintura(enc.perfil) ? "pintura" : "encarregado");
    setAtivoEncarregado(enc.ativo !== false);
    setMostrarFormularioEncarregado(true);
    setAbaAtual("encarregados");
  }

  async function salvarEncarregado(event) {
    event.preventDefault();
    if (!nomeEncarregado.trim() || !emailEncarregado.trim()) {
      alert("Preencha nome e e-mail.");
      return;
    }
    const perfil = tipoParaPerfil(tipoEncarregado);
    try {
      setSalvandoEncarregado(true);
      if (encarregadoEditando) {
        const { data, error } = await supabase
          .from("usuarios")
          .update({
            nome: nomeEncarregado.trim(),
            email: emailEncarregado.trim(),
            perfil,
            ativo: ativoEncarregado,
          })
          .eq("id", encarregadoEditando.id)
          .select()
          .single();
        if (error) throw error;
        setEncarregados(encarregados.map(e => (e.id === data.id ? data : e)));
        alert("Encarregado atualizado com sucesso!");
      } else {
        if (!senhaEncarregado || senhaEncarregado.length < 6) {
          alert("Informe uma senha de login com no mínimo 6 caracteres.");
          setSalvandoEncarregado(false);
          return;
        }
        const { data, error } = await supabase.functions.invoke("criar-encarregado", {
          body: {
            nome: nomeEncarregado.trim(),
            email: emailEncarregado.trim(),
            senha: senhaEncarregado,
            perfil,
            ativo: ativoEncarregado,
          },
        });
        if (error) {
          let detalhe = error.message;
          try {
            const texto = await error.context?.text?.();
            if (texto) {
              try {
                const ctx = JSON.parse(texto);
                detalhe = ctx?.error || texto;
              } catch (ignorar) {
                detalhe = texto;
              }
              if (error.context?.status) detalhe = `[HTTP ${error.context.status}] ${detalhe}`;
            }
          } catch (ignorar) {}
          console.error("Edge Function criar-encarregado:", error, detalhe);
          throw new Error(
            `Não foi possível criar o login (${detalhe}). ` +
            "Veja os logs: supabase functions logs criar-encarregado --tail"
          );
        }
        if (!data?.perfil) {
          throw new Error(data?.error || "Resposta inválida da Edge Function.");
        }
        setEncarregados([...encarregados, data.perfil].sort((a, b) => a.nome.localeCompare(b.nome)));
        alert("Encarregado cadastrado com sucesso! Ele já pode logar com o e-mail e senha informados.");
      }
      limparFormularioEncarregado();
      setMostrarFormularioEncarregado(false);
    } catch (erro) {
      console.error("Erro ao salvar encarregado:", erro);
      alert(erro?.message || "Erro ao salvar encarregado. Rode supabase/gerenciar_encarregados.sql no Supabase.");
    } finally {
      setSalvandoEncarregado(false);
    }
  }

  async function alternarAtivoEncarregado(enc) {
    const novo = !(enc.ativo !== false);
    const acao = novo ? "ativar" : "desativar";
    if (!window.confirm(`Deseja ${acao} o perfil de ${enc.nome}?`)) return;
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .update({ ativo: novo })
        .eq("id", enc.id)
        .select()
        .single();
      if (error) throw error;
      setEncarregados(encarregados.map(e => (e.id === data.id ? data : e)));
      alert(`Perfil ${novo ? "ativado" : "desativado"} com sucesso!`);
    } catch (erro) {
      console.error("Erro ao alternar ativo:", erro);
      alert(erro?.message || "Erro ao alterar status.");
    }
  }

  async function trocarTipoEncarregado(enc) {
    const novoPerfil = ehPintura(enc.perfil) ? "encarregado" : "pintura";
    const novoTipo = novoPerfil === "pintura" ? "Pintura" : "Obra";
    if (!window.confirm(`Deseja mudar ${enc.nome} para o tipo ${novoTipo}?`)) return;
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .update({ perfil: novoPerfil })
        .eq("id", enc.id)
        .select()
        .single();
      if (error) throw error;
      setEncarregados(encarregados.map(e => (e.id === data.id ? data : e)));
      alert(`Tipo alterado para ${novoTipo} com sucesso!`);
    } catch (erro) {
      console.error("Erro ao trocar tipo:", erro);
      alert(erro?.message || "Erro ao trocar tipo.");
    }
  }

  const encarregadosFiltrados = encarregados.filter(enc =>
    (enc.nome || "").toLowerCase().includes(buscaEncarregado.toLowerCase()) ||
    (enc.email || "").toLowerCase().includes(buscaEncarregado.toLowerCase())
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
              Colaboradores, Equipes e Encarregados
            </h1>


            <p>
              Gerencie os colaboradores, as equipes e os encarregados das obras.
            </p>

          </div>

        </div>


        <div className="tabs">

          <button
            className={
              abaAtual ===
                "colaboradores"
                ? "tab active" : "tab"
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
                ? "tab active" : "tab"
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

          <button
            className={
              abaAtual ===
                "encarregados"
                ? "tab active" : "tab"
            }
            onClick={() => {
              setAbaAtual("encarregados");
              setBuscaColaborador("");
              setBuscaEquipe("");
              setMostrarFormularioColaborador(false);
              setMostrarFormularioEquipe(false);
            }}
          >
            Encarregados {encarregados.length ? `(${encarregados.length})` : ""}
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
                      ? "Fechar" : "+ Novo Colaborador"
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

                    {
                      colaboradorEditando
                        ? "Editar Colaborador"
                        : "Novo Colaborador"
                    }

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
                        Funcionário
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
                      onClick={() => {

                        setNome("");

                        setTipo(
                          "fixo"
                        );

                        setColaboradorEditando(
                          null
                        );

                        setMostrarFormularioColaborador(
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
                        salvandoColaborador
                      }
                    >

                      {
                        salvandoColaborador
                          ? "Salvando..."
                          : colaboradorEditando
                            ? "Salvar Alterações"
                            : "Cadastrar"
                      }

                    </button>

                  </div>

                </form>

              )}

              < br />
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

                ) : (

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
                                ? "Funcionário" : "Diarista"
                            }

                          </p>


                          <div className="card-actions">

                            <button
                              className="btn btn-secondary"
                              onClick={() =>
                                editarColaborador(
                                  colaborador
                                )
                              }
                            >

                              Editar

                            </button>


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

                          </div>

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
                      ? "Fechar" : "+ Nova Equipe"
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
                        ? "Editar Equipe" : "Nova Equipe"
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

                    ) : (

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
                                    ? "selection-item disabled" : "selection-item"
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
                          ? "Salvando..." : equipeEditando
                            ? "Salvar Alterações" : "Criar Equipe"
                      }

                    </button>

                  </div>

                </form>

              )}

              < br />
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

                ) : (

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

        {abaAtual === "encarregados" && (
          <>
            <div className="page-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (mostrarFormularioEncarregado) {
                    limparFormularioEncarregado();
                  }
                  setMostrarFormularioEncarregado(!mostrarFormularioEncarregado);
                }}
              >
                {mostrarFormularioEncarregado ? "Fechar" : "+ Novo Encarregado"}
              </button>
            </div>

            {mostrarFormularioEncarregado && (
              <form className="form-card" onSubmit={salvarEncarregado}>
                <h2>{encarregadoEditando ? "Editar Encarregado" : "Novo Encarregado"}</h2>

                <div className="form-group">
                  <label>Nome completo</label>
                  <input
                    type="text"
                    value={nomeEncarregado}
                    onChange={(e) => setNomeEncarregado(e.target.value)}
                    placeholder="Digite o nome"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>E-mail</label>
                  <input
                    type="email"
                    value={emailEncarregado}
                    onChange={(e) => setEmailEncarregado(e.target.value)}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de encarregado</label>
                  <select
                    value={tipoEncarregado}
                    onChange={(e) => setTipoEncarregado(e.target.value)}
                  >
                    <option value="encarregado">🏗 Encarregado de Obra</option>
                    <option value="pintura">🎨 Encarregado de Pintura</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={ativoEncarregado}
                      onChange={(e) => setAtivoEncarregado(e.target.checked)}
                      style={{ width: "auto", minHeight: "auto", marginRight: 8 }}
                    />
                    Perfil ativo
                  </label>
                </div>

                {!encarregadoEditando && (
                  <div className="form-group">
                    <label>Senha de login (mín. 6 caracteres)</label>
                    <input
                      type="password"
                      value={senhaEncarregado}
                      onChange={(e) => setSenhaEncarregado(e.target.value)}
                      placeholder="Senha que ele usará para logar"
                      required
                      minLength={6}
                    />
                    <p style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>
                      Ao salvar, o sistema cria o login e o perfil automaticamente (sem precisar copiar UUID).
                      Informe essa senha ao encarregado.
                    </p>
                  </div>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      limparFormularioEncarregado();
                      setMostrarFormularioEncarregado(false);
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={salvandoEncarregado}
                  >
                    {salvandoEncarregado ? "Salvando..." : encarregadoEditando ? "Salvar Alterações" : "Cadastrar"}
                  </button>
                </div>
              </form>
            )}

            <br />
            <p>Filtro de busca</p>
            <div className="form-group">
              <input
                type="text"
                placeholder="Buscar encarregado..."
                value={buscaEncarregado}
                onChange={(e) => setBuscaEncarregado(e.target.value)}
              />
            </div>

            <section className="section">
              <div className="section-header">
                <h2>Encarregados cadastrados</h2>
                <span>
                  {encarregadosFiltrados.length} encarregado(s)
                </span>
              </div>

              {encarregadosFiltrados.length === 0 ? (
                <div className="empty-state">
                  <p>Nenhum encarregado encontrado.</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {encarregadosFiltrados.map((enc) => {
                    const pintura = ehPintura(enc.perfil);
                    const ativo = enc.ativo !== false;
                    return (
                      <article className="card" key={enc.id}>
                        <h3>{enc.nome}</h3>
                        <p>{enc.email || "Sem e-mail"}</p>
                        <p>
                          Tipo: {pintura ? "🎨 Pintura" : "🏗 Obra"} · Perfil: {enc.perfil || "-"}
                        </p>
                        <p>Status: {ativo ? "🟢 Ativo" : "🔴 Inativo"}</p>
                        <div className="card-actions">
                          <button
                            className="btn btn-secondary"
                            onClick={() => editarEncarregado(enc)}
                          >
                            Editar
                          </button>
                          <button
                            className={ativo ? "btn btn-danger" : "btn btn-success"}
                            onClick={() => alternarAtivoEncarregado(enc)}
                          >
                            {ativo ? "Desativar" : "Ativar"}
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => trocarTipoEncarregado(enc)}
                          >
                            {pintura ? "Mudar para Obra" : "Mudar para Pintura"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
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