import {
  useEffect,
  useState
} from "react";

import {
  supabase
} from "../../supabase.js";

import "./HomeAdmin.css";

function HomeAdmin( {
  usuario,
  navegar,
  setEncarregadoSelecionado,
  sair,
}) {
  const [
    carregando,
    setCarregando
  ] = useState(true);


  const [
    obrasEmAndamento,
    setObrasEmAndamento
  ] = useState(0);


  const [
    obrasPausadas,
    setObrasPausadas
  ] = useState(0);


  const [
    rdosHoje,
    setRdosHoje
  ] = useState(0);


  const [
    encarregados,
    setEncarregados
  ] = useState([]);

  const [
    pendentesHoje,
    setPendentesHoje
  ] = useState([]);


  useEffect(() => {
    carregarDashboard();
  }, []);


  async function carregarDashboard() {
    setCarregando(true);


    const {
      data: obras,
      error: erroObras
    } = await supabase
    .from("rdo_obras")
    .select(
      "id, nome_condominio, status, encarregado_id"
    );


    if (erroObras) {
      console.error(
        "Erro ao carregar obras:",
        erroObras
      );

      setCarregando(false);

      return;
    }


    const emAndamento =
    obras.filter(
      obra =>
      obra.status ===
      "em_andamento"
    );


    const pausadas =
    obras.filter(
      obra =>
      obra.status ===
      "paralisada"
    );


    setObrasEmAndamento(
      emAndamento.length
    );


    setObrasPausadas(
      pausadas.length
    );


    // Datas no fuso LOCAL (toISOString usa UTC e erra à noite no Brasil)
    const formatarDataLocal = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const hoje = formatarDataLocal(new Date());
    const ontemData = new Date();
    ontemData.setDate(ontemData.getDate() - 1);
    const ontem = formatarDataLocal(ontemData);

    // Busca hoje (contador) e ontem (pendentes) de uma vez
    const {
      data: rdos,
      error: erroRdos
    } = await supabase
    .from("rdos")
    .select("id, obra_id, encarregado_id, data")
    .in("data", [hoje, ontem]);


    if (
      !erroRdos
    ) {
      setRdosHoje(
        (rdos || []).filter((r) => r.data === hoje).length
      );
    }


    let vinculosEncarregados = [];
    try {
      const { data: vinculosData } = await supabase
        .from("rdo_obra_encarregados")
        .select("obra_id, encarregado_id");
      vinculosEncarregados = vinculosData || [];
    } catch (ignorar) {
      vinculosEncarregados = [];
    }

    const {
      data: usuarios,
      error: erroUsuarios
    } = await supabase
    .from("usuarios")
    .select(
      "id, nome, email, perfil, ativo"
    )
    .order(
      "nome",
      {
        ascending: true
      }
    );


    if (
      !erroUsuarios
    ) {
      // O usuário de pintura TAMBÉM é encarregado: ele entra no
      // contador do dashboard e na lista abaixo. Filtramos no JS
      // (e não só no banco) para não perder quem tem perfil com
      // maiúscula/espço ou ativo nulo (cadastrado sem flag).
      const candidatos = (usuarios || []).filter(
        (usuarioItem) => {
          const perfilNormalizado = String(
            usuarioItem.perfil || ""
          )
            .toLowerCase()
            .trim();

          // Aceita variações comuns: "pintura", "pintor",
          // "encarregado_pintura", "encarregado-pintura", etc.
          const ehEncarregado = [
            "encarregado",
            "pintura"
          ].includes(
            perfilNormalizado
          ) ||
            perfilNormalizado.includes("pintura") ||
            perfilNormalizado.includes("pintor") ||
            perfilNormalizado.includes("encarregado");

          // Só exclui quem foi explicitamente desativado.
          // ativo = null conta como ativo.
          const estaAtivo =
            usuarioItem.ativo !== false;

          return (
            ehEncarregado &&
            estaAtivo
          );
        }
      );
      const lista =
      candidatos.map(
        encarregado => {
          const obrasDoEncarregado =
          obras.filter(
            obra =>
            obra.encarregado_id ===
            encarregado.id ||
            vinculosEncarregados.some(
              v => v.obra_id === obra.id && v.encarregado_id === encarregado.id
            )
          );


          return {
            ...encarregado,

            obrasAtribuidas:
            obrasDoEncarregado.length,

            obras:
            obrasDoEncarregado,
          };
        }
      );


      setEncarregados(
        lista
      );

      // RDOs pendentes de ONTEM: quem não enviou ontem falhou de verdade
      // (mostrar "hoje" geraria falsa pendência durante o dia).
      const pendentes = [];
      (obras || [])
        .filter((obra) => obra.status === "em_andamento")
        .forEach((obra) => {
          const responsaveis = [
            ...new Set([
              ...(obra.encarregado_id ? [obra.encarregado_id] : []),
              ...vinculosEncarregados.filter((v) => v.obra_id === obra.id).map((v) => v.encarregado_id),
            ]),
          ];
          responsaveis.forEach((encarregadoId) => {
            const enviou = (rdos || []).some(
              (rdo) => rdo.data === ontem && String(rdo.obra_id) === String(obra.id) && String(rdo.encarregado_id) === String(encarregadoId)
            );
            if (!enviou) {
              const enc = (usuarios || []).find((u) => String(u.id) === String(encarregadoId));
              // Ignora usuários desativados (não cobra RDO de quem foi desligado)
              if (enc && enc.ativo === false) return;
              pendentes.push({
                obraId: obra.id,
                obraNome: obra.nome_condominio,
                encarregadoId,
                encarregadoNome: enc?.nome || "Sem nome",
                tipo: enc && String(enc.perfil || "").toLowerCase().includes("pintura") ? "🎨 Pintura" : "🏗 Obra",
              });
            }
          });
        });
      setPendentesHoje(pendentes);
    } else {
      console.error(
        "Erro ao carregar encarregados:",
        erroUsuarios
      );
    }


    setCarregando(false);
  }


  function abrirObrasDoEncarregado(
    encarregado
  ) {
    setEncarregadoSelecionado(
      encarregado
    );

    navegar(
      "obras-encarregado"
    );
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

  return (
    <>
      <div className="admin-banner">

        <div className="admin-banner-content">

          <div>

            <h2>
              👋 {obterSaudacao()}, {usuario.nome}
            </h2>

            <p>
              Bem-vindo ao painel administrativo do RDO Gestão.
            </p>

            <small>
              Acompanhe obras, colaboradores e relatórios em tempo real.
            </small>

          </div>

          <div className="admin-banner-icon">
            📊
          </div>

        </div>

      </div>
      <main className="admin-container">
        <section className="dashboard-grid">

          <div className="dashboard-card">
            <div className="dashboard-icon">
              🏗
            </div>

            <span className="dashboard-label">
              Obras em andamento
            </span>

            <div className="dashboard-number">
              {obrasEmAndamento}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-icon">
              ⏸️
            </div>

            <span className="dashboard-label">
              Obras pausadas
            </span>

            <div className="dashboard-number">
              {obrasPausadas}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-icon">
              📋
            </div>

            <span className="dashboard-label">
              RDOs hoje
            </span>

            <div className="dashboard-number">
              {rdosHoje}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-icon">
              ⚠️
            </div>

            <span className="dashboard-label">
              Pendentes ontem
            </span>

            <div className="dashboard-number">
              {pendentesHoje.length}
            </div>
          </div>

        </section>
        {pendentesHoje.length > 0 && (
          <section className="section" style={{ marginTop: 24 }}>
            <div className="section-header">
              <h2>⚠️ RDOs pendentes de ontem</h2>
              <span>{pendentesHoje.length} pendência(s)</span>
            </div>
            <div className="cards-grid">
              {pendentesHoje.map((p, i) => (
                <article className="card" key={`${p.obraId}-${p.encarregadoId}-${i}`}>
                  <h3>🏗 {p.obraNome}</h3>
                  <p>👷 {p.encarregadoNome} · {p.tipo}</p>
                  <p>🔴 RDO não enviada ontem</p>
                </article>
              ))}
            </div>
          </section>
        )}
        <section className="acoes">
          <h2>
            Ações rápidas
          </h2>
          <div className="acoes-grid">
            <button
              onClick={() =>
              navegar(
                "gerenciar-obras"
              )
              }
              >
              🏗
              <span>
                Gerenciar Obras
              </span>
            </button>

            <button
              onClick={() =>
              navegar(
                "gerenciar-colaboradores"
              )
              }
              >
              👷
              <span>
                Colaboradores
              </span>
            </button>

            <button
              onClick={() =>
              navegar(
                "selecionar-rdo"
              )
              }
              >
              📋
              <span>
                Consultar RDO
              </span>
            </button>
          </div>
        </section>
        <section className="encarregados">
          <h2>
            Encarregados
          </h2>
          <div className="encarregados-grid">
            {
            encarregados.map(
              encarregado => (
                <article
                  className="card-encarregado"
                  key={
                  encarregado.id
                  }
                  >
                  <h3>
                    {encarregado.nome}
                  </h3>
                  <p>
                    {
                      String(
                        encarregado.perfil || ""
                      )
                        .toLowerCase()
                        .trim() === "pintura"
                        ? "🎨 Pintura"
                        : "🏗 Encarregado"
                    }
                  </p>
                  <p>
                    Obras:
                    {
                    encarregado.obrasAtribuidas
                    }
                  </p>
                  <button
                    onClick={() =>
                    abrirObrasDoEncarregado(
                      encarregado
                    )
                    }
                    >
                    Ver obras
                  </button>
                </article>
              )
            )
            }
          </div>
        </section>
      </main>
    </>
  );
}


export default HomeAdmin;