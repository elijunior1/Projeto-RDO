import { useEffect, useState } from "react";

import { supabase } from "../../supabase.js";

import "./GerenciarObras.css";

function GerenciarObras({ usuario }) {
  const [obras, setObras] = useState([]);

  const [equipes, setEquipes] = useState([]);

  const [colaboradores, setColaboradores] = useState([]);

  const [encarregados, setEncarregados] = useState([]);

  const [carregando, setCarregando] = useState(true);

  const [salvando, setSalvando] = useState(false);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [nomeCondominio, setNomeCondominio] = useState("");

  const [endereco, setEndereco] = useState("");

  const [dataInicio, setDataInicio] = useState("");

  const [dataFinalizacao, setDataFinalizacao] = useState("");

  const [encarregadosIds, setEncarregadosIds] = useState([]);

  const [menuEncarregadosAberto, setMenuEncarregadosAberto] = useState(false);

  const [equipeId, setEquipeId] = useState("");

  const [status, setStatus] = useState("em_andamento");

  const [colaboradoresIndividuaisIds, setColaboradoresIndividuaisIds] =
    useState([]);

  // Divisão de funcionários por encarregado: { [encarregadoId]: [colaboradorId, ...] }
  const [colaboradoresPorEncarregado, setColaboradoresPorEncarregado] =
    useState({});

  const [obraEditando, setObraEditando] = useState(null);

  const [busca, setBusca] = useState("");

  // Ordem: em andamento > paralisadas > finalizadas,
  // dentro de cada status a mais antiga (data de início) primeiro.
  const ordemStatus = { em_andamento: 0, paralisada: 1, finalizada: 2 };
  const obrasFiltradas = obras
    .filter((obra) =>
      obra.nome_condominio.toLowerCase().includes(busca.toLowerCase()),
    )
    .sort((a, b) => {
      const statusA = ordemStatus[a.status] ?? 3;
      const statusB = ordemStatus[b.status] ?? 3;
      if (statusA !== statusB) return statusA - statusB;
      const dataA = new Date(a.data_inicio || "9999-12-31").getTime();
      const dataB = new Date(b.data_inicio || "9999-12-31").getTime();
      return dataA - dataB;
    });

  //CARREGAR DADOS
  useEffect(() => {
    // Sempre abre no topo, mostrando os cards de resumo
    window.scrollTo({ top: 0, behavior: "instant" });
    carregarDados();
  }, []);
  async function carregarDados() {
    try {
      setCarregando(true);

      // Todas as consultas em PARALELO (antes eram 7 em sequência,
      // somando a latência de cada uma no carregamento da tela).
      const [
        { data: obrasData, error: obrasError },
        { data: equipesData, error: equipesError },
        { data: colaboradoresData, error: colaboradoresError },
        { data: encarregadosTodos, error: encarregadosError },
        { data: vinculosData, error: vinculosError },
        { data: vinculosEncData },
        { data: membrosEquipesData, error: membrosEquipesError },
      ] = await Promise.all([
        supabase
          .from("rdo_obras")
          .select(
            "id, nome_condominio, endereco, data_inicio, data_finalizacao, status, encarregado_id, equipe_id, created_at, encarregado:usuarios!rdo_obras_encarregado_id_fkey(id, nome, email), equipe:rdo_equipes(id, nome)",
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("rdo_equipes")
          .select("*")
          .order("nome", { ascending: true }),
        supabase
          .from("rdo_colaboradores")
          .select("id, nome, tipo, ativo")
          .eq("ativo", true)
          .order("nome", { ascending: true }),
        supabase
          .from("usuarios")
          .select("id, nome, email, perfil, ativo")
          .order("nome", { ascending: true }),
        supabase
          .from("rdo_obra_colaboradores")
          .select("obra_id, colaborador_id"),
        supabase
          .from("rdo_obra_encarregados")
          .select("obra_id, encarregado_id"),
        supabase
          .from("rdo_equipe_colaboradores")
          .select("equipe_id, colaborador_id"),
      ]);

      if (obrasError) throw obrasError;
      if (equipesError) throw equipesError;
      if (colaboradoresError) throw colaboradoresError;
      if (encarregadosError) throw encarregadosError;
      if (vinculosError) throw vinculosError;
      if (membrosEquipesError) throw membrosEquipesError;
      // vínculos de encarregados: se a tabela não existir, segue sem eles
      const vinculosEncarregadosData = vinculosEncData || [];

      // Filtra em JS para não perder pintura com perfil variado
      // ou ativo nulo (mesmo critério do dashboard).
      const encarregadosData = (encarregadosTodos || []).filter(
        (usuarioItem) => {
          const perfilNormalizado = String(usuarioItem.perfil || "")
            .toLowerCase()
            .trim();

          const ehEncarregado = ["encarregado", "pintura"].includes(
            perfilNormalizado,
          );

          // Só exclui quem foi explicitamente desativado.
          const estaAtivo = usuarioItem.ativo !== false;

          return ehEncarregado && estaAtivo;
        },
      );

      /*
  ==============================
  ADICIONAR COLABORADORES ÀS OBRAS
  ==============================
  */

      const obrasComColaboradores = (obrasData || []).map((obra) => {
        const colaboradoresIds = (vinculosData || [])
          .filter((vinculo) => vinculo.obra_id === obra.id)
          .map((vinculo) => vinculo.colaborador_id);

        const encarregadosIdsObra = [
          ...new Set([
            ...(vinculosEncarregadosData || [])
              .filter((v) => v.obra_id === obra.id)
              .map((v) => v.encarregado_id),
            ...(obra.encarregado_id ? [obra.encarregado_id] : []),
          ]),
        ];

        return {
          ...obra,

          colaboradoresIds,
          encarregadosIds: encarregadosIdsObra,
        };
      });

      /*
  ==============================
  ADICIONAR MEMBROS ÀS EQUIPES
  ==============================
  */

      const equipesComColaboradores = (equipesData || []).map((equipe) => {
        const colaboradoresIds = (membrosEquipesData || [])
          .filter((membro) => membro.equipe_id === equipe.id)
          .map((membro) => membro.colaborador_id);

        return {
          ...equipe,

          colaboradoresIds,
        };
      });

      setObras(obrasComColaboradores);

      setEquipes(equipesComColaboradores);

      setColaboradores(colaboradoresData || []);

      setEncarregados(encarregadosData || []);
    } catch (erro) {
      console.error("Erro ao carregar dados:", erro);

      alert(erro.message || "Erro ao carregar os dados das obras.");
    } finally {
      setCarregando(false);
    }
  }

  /*

LIMPAR FORMULÁRIO

*/

  function limparFormulario() {
    setNomeCondominio("");

    setEndereco("");

    setDataInicio("");

    setDataFinalizacao("");

    setEncarregadosIds([]);

    setEquipeId("");

    setColaboradoresIndividuaisIds([]);

    setColaboradoresPorEncarregado({});

    setStatus("em_andamento");

    setObraEditando(null);
  }

  /*

VERIFICAR COLABORADOR NA EQUIPE

*/

  function colaboradorPertenceAEquipeSelecionada(colaboradorId) {
    const equipeSelecionada = equipes.find(
      (equipe) => equipe.id === Number(equipeId),
    );

    if (!equipeSelecionada) {
      return false;
    }

    return (equipeSelecionada.colaboradoresIds || []).includes(colaboradorId);
  }

  /*

SELECIONAR COLABORADOR INDIVIDUAL

*/

  function alternarColaboradorPorEncarregado(encarregadoId, colaboradorId) {
    const key = String(encarregadoId);
    setColaboradoresPorEncarregado((prev) => {
      const atual = prev[key] || [];
      const novo = atual.includes(colaboradorId)
        ? atual.filter((id) => id !== colaboradorId)
        : [...atual, colaboradorId];
      return { ...prev, [key]: novo };
    });
  }

  function alternarColaboradorIndividual(colaboradorId) {
    if (colaboradoresIndividuaisIds.includes(colaboradorId)) {
      setColaboradoresIndividuaisIds((ids) =>
        ids.filter((id) => id !== colaboradorId),
      );

      return;
    }

    if (colaboradorPertenceAEquipeSelecionada(colaboradorId)) {
      alert("Este colaborador já pertence à equipe selecionada.");

      return;
    }

    setColaboradoresIndividuaisIds((ids) => [...ids, colaboradorId]);
  }

  /*

EDITAR OBRA

*/

  async function editarObra(obra) {
    try {
      const { data: vinculos, error } = await supabase
        .from("rdo_obra_colaboradores")
        .select("colaborador_id")
        .eq("obra_id", obra.id);

      if (error) {
        throw error;
      }

      // Vínculos de encarregados (tabela nova). Se ainda não existem
      // ou a query falhar, cai para o campo único legado.
      let vinculosEncarregados = [];
      try {
        const { data: vinculosEncData } = await supabase
          .from("rdo_obra_encarregados")
          .select("encarregado_id")
          .eq("obra_id", obra.id);
        vinculosEncarregados = vinculosEncData || [];
      } catch {
        vinculosEncarregados = [];
      }

      // Divisão de funcionários por encarregado
      let mapaPorEncarregado = {};
      try {
        const { data: vinculosDivData } = await supabase
          .from("rdo_obra_encarregado_colaboradores")
          .select("encarregado_id, colaborador_id")
          .eq("obra_id", obra.id);
        (vinculosDivData || []).forEach((v) => {
          const key = String(v.encarregado_id);
          if (!mapaPorEncarregado[key]) mapaPorEncarregado[key] = [];
          mapaPorEncarregado[key].push(v.colaborador_id);
        });
      } catch {
        mapaPorEncarregado = {};
      }

      setObraEditando(obra);

      setNomeCondominio(obra.nome_condominio);

      setEndereco(obra.endereco);

      setDataInicio(obra.data_inicio);

      setDataFinalizacao(obra.data_finalizacao);

      setStatus(obra.status || "em_andamento");

      setEncarregadosIds([
        ...new Set([
          ...vinculosEncarregados.map((v) => String(v.encarregado_id)),
          ...(obra.encarregado_id ? [String(obra.encarregado_id)] : []),
          ...(obra.encarregadosIds || []).map(String),
        ]),
      ]);

      setEquipeId(obra.equipe_id ? String(obra.equipe_id) : "");

      setColaboradoresIndividuaisIds(
        (vinculos || []).map((vinculo) => vinculo.colaborador_id),
      );

      setColaboradoresPorEncarregado(mapaPorEncarregado);

      setMostrarFormulario(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (erro) {
      console.error("Erro ao carregar obra para edição:", erro);

      alert("Erro ao carregar os dados da obra.");
    }
  }

  /*

SALVAR OBRA

*/

  async function sincronizarColaboradoresPorEncarregado(obraId) {
    try {
      await supabase
        .from("rdo_obra_encarregado_colaboradores")
        .delete()
        .eq("obra_id", obraId);
      const linhas = [];
      Object.entries(colaboradoresPorEncarregado || {}).forEach(
        ([encarregadoId, colIds]) => {
          (colIds || []).forEach((colaboradorId) => {
            linhas.push({
              obra_id: obraId,
              encarregado_id: encarregadoId,
              colaborador_id: colaboradorId,
            });
          });
        },
      );
      if (linhas.length > 0) {
        const { error } = await supabase
          .from("rdo_obra_encarregado_colaboradores")
          .insert(linhas);
        if (error) throw error;
      }
    } catch (erroVinculos) {
      console.warn(
        "Divisão de funcionários não sincronizada (rode supabase/dividir_funcionarios.sql):",
        erroVinculos,
      );
    }
  }

  async function cadastrarObra(event) {
    event.preventDefault();

    if (
      !nomeCondominio.trim() ||
      !endereco.trim() ||
      !dataInicio ||
      !dataFinalizacao
    ) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    if (new Date(dataFinalizacao) < new Date(dataInicio)) {
      alert("A data de finalização não pode ser anterior à data de início.");

      return;
    }

    try {
      setSalvando(true);

      if (obraEditando) {
        const { error: obraError } = await supabase
          .from("rdo_obras")
          .update({
            nome_condominio: nomeCondominio.trim(),

            endereco: endereco.trim(),

            data_inicio: dataInicio,

            data_finalizacao: dataFinalizacao,

            encarregado_id: encarregadosIds[0] || null,

            equipe_id: equipeId ? Number(equipeId) : null,

            status,
          })
          .eq("id", obraEditando.id);

        if (obraError) throw obraError;

        await supabase
          .from("rdo_obra_colaboradores")
          .delete()
          .eq("obra_id", obraEditando.id);

        if (colaboradoresIndividuaisIds.length > 0) {
          const vinculos = colaboradoresIndividuaisIds.map((colaboradorId) => ({
            obra_id: obraEditando.id,

            colaborador_id: colaboradorId,
          }));

          const { error: vinculosError } = await supabase
            .from("rdo_obra_colaboradores")
            .insert(vinculos);

          if (vinculosError) throw vinculosError;
        }

        // Sincronizar vínculos de encarregados (multi-responsável)
        try {
          await supabase
            .from("rdo_obra_encarregados")
            .delete()
            .eq("obra_id", obraEditando.id);
          if (encarregadosIds.length > 0) {
            const { error: vinculosEncError } = await supabase
              .from("rdo_obra_encarregados")
              .insert(
                encarregadosIds.map((encarregadoId) => ({
                  obra_id: obraEditando.id,
                  encarregado_id: encarregadoId,
                })),
              );
            if (vinculosEncError) throw vinculosEncError;
          }
        } catch (erroVinculos) {
          console.warn(
            "Vínculos de encarregados não sincronizados (rode o SQL multi_encarregados):",
            erroVinculos,
          );
        }

        await sincronizarColaboradoresPorEncarregado(obraEditando.id);

        await carregarDados();

        limparFormulario();

        setMostrarFormulario(false);

        alert("Obra atualizada com sucesso!");

        return;
      }

      const { data: novaObra, error: obraError } = await supabase
        .from("rdo_obras")
        .insert([
          {
            nome_condominio: nomeCondominio.trim(),

            endereco: endereco.trim(),

            data_inicio: dataInicio,

            data_finalizacao: dataFinalizacao,

            encarregado_id: encarregadosIds[0] || null,

            equipe_id: equipeId ? Number(equipeId) : null,

            status,
          },
        ])
        .select()
        .single();

      if (obraError) throw obraError;

      if (colaboradoresIndividuaisIds.length > 0) {
        const vinculos = colaboradoresIndividuaisIds.map((colaboradorId) => ({
          obra_id: novaObra.id,

          colaborador_id: colaboradorId,
        }));

        const { error: vinculosError } = await supabase
          .from("rdo_obra_colaboradores")
          .insert(vinculos);

        if (vinculosError) throw vinculosError;
      }

      // Vínculos de encarregados (multi-responsável)
      if (encarregadosIds.length > 0) {
        try {
          const { error: vinculosEncError } = await supabase
            .from("rdo_obra_encarregados")
            .insert(
              encarregadosIds.map((encarregadoId) => ({
                obra_id: novaObra.id,
                encarregado_id: encarregadoId,
              })),
            );
          if (vinculosEncError) throw vinculosEncError;
        } catch (erroVinculos) {
          console.warn(
            "Vínculos de encarregados não sincronizados (rode o SQL multi_encarregados):",
            erroVinculos,
          );
        }
      }

      await sincronizarColaboradoresPorEncarregado(novaObra.id);

      await carregarDados();

      limparFormulario();

      setMostrarFormulario(false);

      alert("Obra cadastrada com sucesso!");
    } catch (erro) {
      console.error(erro);

      alert(erro.message || "Erro ao salvar obra.");
    } finally {
      setSalvando(false);
    }
  }

  /*

EXCLUIR OBRA

*/

  async function excluirObra(obra) {
    const confirmar = window.confirm(
      `Deseja realmente excluir a obra "${obra.nome_condominio}"?`,
    );

    if (!confirmar) {
      return;
    }

    try {
      /*
  ==============================================
  VERIFICAR RDOs
  ==============================================
  */

      const { data: rdosExistentes, error: rdosError } = await supabase
        .from("rdos")
        .select("id")
        .eq("obra_id", obra.id)
        .limit(1);

      if (rdosError) {
        throw rdosError;
      }

      if (rdosExistentes && rdosExistentes.length > 0) {
        alert("Esta obra possui RDOs registrados e não pode ser excluída.");

        return;
      }

      /*
  ==============================================
  REMOVER VÍNCULOS
  ==============================================
  */

      const { error: vinculosError } = await supabase
        .from("rdo_obra_colaboradores")
        .delete()
        .eq("obra_id", obra.id);

      if (vinculosError) {
        throw vinculosError;
      }

      try {
        await supabase
          .from("rdo_obra_encarregados")
          .delete()
          .eq("obra_id", obra.id);
        await supabase
          .from("rdo_obra_encarregado_colaboradores")
          .delete()
          .eq("obra_id", obra.id);
      } catch {
        // vínculos opcionais — ignora se a tabela não existir
      }

      /*
  ==============================================
  EXCLUIR OBRA
  ==============================================
  */

      const { error: obraError } = await supabase
        .from("rdo_obras")
        .delete()
        .eq("id", obra.id);

      if (obraError) {
        throw obraError;
      }

      setObras((obrasAtuais) =>
        obrasAtuais.filter((obraAtual) => obraAtual.id !== obra.id),
      );

      alert("Obra excluída com sucesso!");
    } catch (erro) {
      console.error("Erro ao excluir obra:", erro);

      alert(erro.message || "Erro ao excluir obra.");
    }
  }

  /*

FORMATAR DATA

*/

  function formatarData(data) {
    if (!data) {
      return "Não informado";
    }

    const [ano, mes, dia] = data.split("-");

    return `${dia}/${mes}/${ano}`;
  }

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

  /*
TELA
*/
  if (carregando) {
    return (
      <main className="app-content">
        <div className="empty-state">
          <p>Carregando obras...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-container">
      <div className="admin-resumo-topo">
        <div>
          <h2>
            👋 {obterSaudacao()}, {usuario?.nome}
          </h2>
          <small>Visão geral · {dataHojeTexto}</small>
        </div>
        <span className="admin-resumo-badge">
          {obras.filter((obra) => obra.status === "em_andamento").length} obra(s) ativa(s)&nbsp;·&nbsp;
          {obras.length} obra(s) no total
        </span>
      </div>

      <section className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-icon">🏗</div>

          <span className="dashboard-label">Total de obras</span>

          <div className="dashboard-number">{obras.length}</div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-icon">🔧</div>

          <span className="dashboard-label">Em andamento</span>

          <div className="dashboard-number">
            {obras.filter((obra) => obra.status === "em_andamento").length}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-icon">⏸️</div>

          <span className="dashboard-label">Paralisadas</span>

          <div className="dashboard-number">
            {obras.filter((obra) => obra.status === "paralisada").length}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-icon">✅</div>

          <span className="dashboard-label">Finalizadas</span>

          <div className="dashboard-number">
            {obras.filter((obra) => obra.status === "finalizada").length}
          </div>
        </div>
      </section>

      <button
        className="btn btn-primary btn-nova-obra"
        onClick={() => {
          if (mostrarFormulario) {
            limparFormulario();
          }
          setMostrarFormulario(!mostrarFormulario);
        }}
      >
        {mostrarFormulario ? "✖ Fechar Formulário" : "➕ Nova Obra"}
      </button>
      {mostrarFormulario && (
        <form className="form-card form-group-full" onSubmit={cadastrarObra}>
          <h2>{obraEditando ? "Editar Obra" : "Nova Obra"}</h2>
          <div className="form-grid form-grid-4">
            <div className="form-group">
              <label>Nome do condomínio</label>
              <input
                type="text"
                value={nomeCondominio}
                onChange={(event) => setNomeCondominio(event.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Endereço</label>
              <input
                type="text"
                value={endereco}
                onChange={(event) => setEndereco(event.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Data de início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(event) => setDataInicio(event.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Data de finalização</label>
              <input
                type="date"
                value={dataFinalizacao}
                onChange={(event) => setDataFinalizacao(event.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-grid form-grid-status">
            <div className="form-group">
              <label>Status da obra</label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="em_andamento">Em andamento</option>
                <option value="paralisada">Paralisada</option>

                <option value="finalizada">Finalizada</option>
              </select>
            </div>

            <div className="form-group">
              <label>Encarregados responsáveis (pode marcar mais de um)</label>
              {encarregados.length === 0 ? (
                <p>Nenhum encarregado cadastrado.</p>
              ) : (
                <div className="dropdown-encarregados">
                  <button
                    type="button"
                    className="dropdown-encarregados-botao"
                    onClick={() =>
                      setMenuEncarregadosAberto(!menuEncarregadosAberto)
                    }
                  >
                    <span>
                      {encarregadosIds.length === 0
                        ? "Selecione os encarregados..."
                        : encarregadosIds.length === 1
                          ? encarregados.find(
                              (e) =>
                                String(e.id) === String(encarregadosIds[0]),
                            )?.nome || "1 selecionado"
                          : `${encarregadosIds.length} selecionados`}
                    </span>
                    <span>{menuEncarregadosAberto ? "▲" : "▼"}</span>
                  </button>
                  {menuEncarregadosAberto && (
                    <div className="dropdown-encarregados-painel">
                      {encarregados.map((encarregado) => (
                        <label
                          key={encarregado.id}
                          className="dropdown-encarregado-item"
                        >
                          <input
                            type="checkbox"
                            checked={encarregadosIds.includes(encarregado.id)}
                            onChange={() =>
                              setEncarregadosIds((prev) =>
                                prev.includes(encarregado.id)
                                  ? prev.filter((id) => id !== encarregado.id)
                                  : [...prev, encarregado.id],
                              )
                            }
                          />
                          <span>
                            {encarregado.nome}
                            {encarregado.perfil === "pintura"
                              ? " (Pintura)"
                              : ""}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Equipe da obra</label>

              <select
                value={equipeId}
                onChange={(event) => {
                  setEquipeId(event.target.value);

                  setColaboradoresIndividuaisIds([]);
                }}
              >
                <option value="">Nenhuma equipe selecionada</option>

                {equipes.map((equipe) => (
                  <option key={equipe.id} value={equipe.id}>
                    {equipe.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group form-group-full">
            <label>Colaboradores individuais</label>
            {colaboradores.length === 0 ? (
              <p>Nenhum colaborador cadastrado.</p>
            ) : (
              <div className="colaboradores-grid">
                {colaboradores.map((colaborador) => {
                  const pertenceAEquipe = colaboradorPertenceAEquipeSelecionada(
                    colaborador.id,
                  );

                  return (
                    <label
                      key={colaborador.id}
                      className={
                        pertenceAEquipe
                          ? "selection-item disabled"
                          : "selection-item"
                      }
                    >
                      <input
                        type="checkbox"
                        checked={colaboradoresIndividuaisIds.includes(
                          colaborador.id,
                        )}
                        disabled={pertenceAEquipe}
                        onChange={() =>
                          alternarColaboradorIndividual(colaborador.id)
                        }
                      />

                      <span>
                        {colaborador.nome}
                        {pertenceAEquipe && (
                          <small> — Já pertence à equipe</small>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {encarregadosIds.length > 1 && (
            <div className="form-group form-group-full">
              <label>Funcionários por encarregado</label>
              <p>
                Se marcar funcionários abaixo, cada encarregado verá{" "}
                <strong>só</strong> os dele no RDO. Se deixar vazio, vale a
                equipe/colaboradores acima para todos.
              </p>
              {encarregadosIds.map((encarregadoId) => {
                const enc = encarregados.find(
                  (e) => String(e.id) === String(encarregadoId),
                );
                const selecionados =
                  colaboradoresPorEncarregado[String(encarregadoId)] || [];
                return (
                  <div key={encarregadoId} style={{ marginTop: 12 }}>
                    <strong>
                      {enc?.nome || "Encarregado"}
                      {enc?.perfil === "pintura" ? " (Pintura)" : ""} —{" "}
                      {selecionados.length} funcionário(s)
                    </strong>
                    <div className="selection-list">
                      {colaboradores.map((colaborador) => (
                        <label key={colaborador.id} className="selection-item">
                          <input
                            type="checkbox"
                            checked={selecionados.includes(colaborador.id)}
                            onChange={() =>
                              alternarColaboradorPorEncarregado(
                                encarregadoId,
                                colaborador.id,
                              )
                            }
                          />
                          <span>{colaborador.nome}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                limparFormulario();

                setMostrarFormulario(false);
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={salvando}
            >
              {salvando
                ? "Salvando..."
                : obraEditando
                  ? "Atualizar Obra"
                  : "Salvar Obra"}
            </button>
          </div>
        </form>
      )}

      <section className="section">
        <div className="section-header">
          <div className="obra-filtros">
            <input
              type="text"
              placeholder="Buscar condomínio..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
          </div>

          <h2>Obras cadastradas</h2>

          <span>{obras.length} obra(s)</span>
        </div>

        {obras.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma obra cadastrada.</p>

            <p>Clique em "+ Nova Obra" para começar.</p>
          </div>
        ) : (
          <div className="obras-grid-gerenciar">
            {obrasFiltradas.map((obra) => (
              <div className="obra-card" key={obra.id}>
                <div className="obra-card-header">
                  <h3>🏗 {obra.nome_condominio}</h3>
                  <span
                    className={
                      obra.status === "em_andamento"
                        ? "badge badge-success"
                        : obra.status === "paralisada"
                          ? "badge badge-warning"
                          : "badge badge-secondary"
                    }
                  >
                    {obra.status === "em_andamento"
                      ? "Em andamento"
                      : obra.status === "paralisada"
                        ? "Paralisada"
                        : "Finalizada"}
                  </span>
                </div>

                <p>
                  👷{" "}
                  {(obra.encarregadosIds && obra.encarregadosIds.length > 0
                    ? obra.encarregadosIds
                    : obra.encarregado_id
                      ? [obra.encarregado_id]
                      : []
                  )
                    .map(
                      (id) =>
                        encarregados.find((e) => String(e.id) === String(id))
                          ?.nome,
                    )
                    .filter(Boolean)
                    .join(", ") ||
                    obra.encarregado?.nome ||
                    "Sem encarregado"}
                </p>

                <p>👥 {obra.equipe?.nome || "Sem equipe"}</p>

                <p>📅 {formatarData(obra.data_finalizacao)}</p>

                <div className="obra-card-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => editarObra(obra)}
                  >
                    Editar
                  </button>

                  <button
                    className="btn btn-danger"
                    onClick={() => excluirObra(obra)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default GerenciarObras;
