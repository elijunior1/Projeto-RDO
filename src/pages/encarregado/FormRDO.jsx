import {
  useEffect,
  useState
} from "react";

import {
  supabase
} from "../../supabase.js";

import "./FormRDO.css";

function FormRDO({
  usuario,
  obra,
  colaboradores,
  equipes,
  rdos,
  setRdos,
  navegar,
  voltar,
  sair,
}) {

  const [ materiais,
    setMateriais ] = useState([]);

  const [
    colaboradoresDaObra,

    setColaboradoresDaObra

  ] = useState([]);

  const [
    carregando,

    setCarregando

  ] = useState(true);

  const [
    salvando,

    setSalvando

  ] = useState(false);

  const [
    efetivo,

    setEfetivo

  ] = useState([]);

  const [
    producao,

    setProducao

  ] = useState({

    escavacao: 0,

    concretagem: 0,

    acabamento: 0,

    instalacaoModulo: 0,

    instalacaoTerca: 0,

    instalacaoTelha: 0,

  });

  const [
    motivosBaixaProdutividade,

    setMotivosBaixaProdutividade

  ] = useState([]);

  const [
    detalhamentoBaixaProdutividade,

    setDetalhamentoBaixaProdutividade

  ] = useState("");

  const chaveRascunho = obra?.id
    ? `rdo_rascunho_${obra.id}_${usuario?.id}`
    : null;

  useEffect(() => {

    if (!chaveRascunho) {
      return;
    }

    try {

      const rascunhoSalvo =
        localStorage.getItem(
          chaveRascunho
        );

      if (!rascunhoSalvo) {
        return;
      }

      const rascunho =
        JSON.parse(
          rascunhoSalvo
        );

      if (rascunho.materiais) {

        setMateriais(
          rascunho.materiais
        );

      }

      if (rascunho.efetivo) {

        setEfetivo(
          rascunho.efetivo
        );

      }

      if (rascunho.producao) {

        setProducao(
          rascunho.producao
        );

      }

      if (
        rascunho.motivosBaixaProdutividade
      ) {

        setMotivosBaixaProdutividade(
          rascunho.motivosBaixaProdutividade
        );

      }

      if (
        typeof rascunho.detalhamentoBaixaProdutividade ===
        "string"
      ) {

        setDetalhamentoBaixaProdutividade(
          rascunho.detalhamentoBaixaProdutividade
        );

      }

      console.log(
        "Rascunho do RDO restaurado."
      );

    } catch (erro) {

      console.error(
        "Erro ao restaurar rascunho do RDO:",
        erro
      );

    }

  }, [
    chaveRascunho
  ]);

  useEffect(() => {

    if (!chaveRascunho) {
      return;
    }

    const rascunho = {

      materiais,

      efetivo,

      producao,

      motivosBaixaProdutividade,

      detalhamentoBaixaProdutividade,

      atualizadoEm:
        new Date().toISOString()

    };

    try {

      localStorage.setItem(
        chaveRascunho,
        JSON.stringify(
          rascunho
        )
      );

    } catch (erro) {

      console.error(
        "Erro ao salvar rascunho do RDO:",
        erro
      );

    }

  }, [
    chaveRascunho,
    materiais,
    efetivo,
    producao,
    motivosBaixaProdutividade,
    detalhamentoBaixaProdutividade
  ]);

  const motivosDisponiveis = [ {
    id: "chuva",

    nome: "Chuva",

  },

  {
    id: "falta_equipamento",

    nome: "Falta de equipamento",

  },

  {
    id: "falta_material",

    nome: "Falta de material",

  },

  {
    id: "falta_mao_de_obra",

    nome: "Falta de mão de obra",

  },

  {
    id: "condicoes_climaticas",

    nome: "Condições climáticas",

  },

  {
    id: "interferencia_terceiros",

    nome: "Interferência de terceiros",

  },

  {
    id: "retrabalho",

    nome: "Retrabalho",

  },

  {
    id: "outros",

    nome: "Outros",

  },

  ];

  /*

DATA DE HOJE

*/

  function obterDataHoje() {

    const hoje =
      new Date();


    const ano =
      hoje.getFullYear();


    const mes =
      String(
        hoje.getMonth() + 1
      ).padStart(
        2,
        "0"
      );


    const dia =
      String(
        hoje.getDate()
      ).padStart(
        2,
        "0"
      );


    return `${ano}-${mes}-${dia}`;

  }

  /*

CARREGAR COLABORADORES DA OBRA

*/

  useEffect(() => {

    if (
      !obra?.id
    ) {

      setColaboradoresDaObra([]);

      setCarregando(false);

      return;

    }


    carregarColaboradoresDaObra();

  },
    [ obra ]);

  async function carregarColaboradoresDaObra() {

    try {

      setCarregando(true);


      const colaboradoresIds =
        new Set();


      /*
  ==============================
  1. COLABORADORES INDIVIDUAIS
  ==============================
  */

      const {

        data: individuais,

        error: individuaisError

      } = await supabase

        .from(
          "rdo_obra_colaboradores"
        )

        .select(
          "colaborador_id"
        )

        .eq(
          "obra_id",

          obra.id
        );


      if (
        individuaisError
      ) {

        throw individuaisError;

      }


      individuais?.forEach(
        colaborador => {

          colaboradoresIds.add(
            colaborador.colaborador_id
          );

        }
      );


      /*
  ==============================
  2. EQUIPE DA OBRA
  ==============================
  */

      if (
        obra.equipe_id
      ) {

        const {

          data: membrosEquipe,

          error: equipeError

        } = await supabase

          .from(
            "rdo_equipe_colaboradores"
          )

          .select(
            "colaborador_id"
          )

          .eq(
            "equipe_id",

            obra.equipe_id
          );


        if (
          equipeError
        ) {

          throw equipeError;

        }


        membrosEquipe?.forEach(
          colaborador => {

            colaboradoresIds.add(
              colaborador.colaborador_id
            );

          }
        );

      }


      /*
  ==============================
  3. BUSCAR COLABORADORES
  ==============================
  */

      if (
        colaboradoresIds.size ===
        0
      ) {

        setColaboradoresDaObra([]);

        setEfetivo([]);

        return;

      }


      const {

        data: colaboradores,

        error: colaboradoresError

      } = await supabase

        .from(
          "rdo_colaboradores"
        )

        .select(
          "id, nome, tipo"
        )

        .in(
          "id",

          Array.from(
            colaboradoresIds
          )
        )

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


      setColaboradoresDaObra(
        colaboradores ||
        []
      );


      setEfetivo(

        (
          colaboradores ||
          []
        ).map(
          colaborador => ({

            colaboradorId:
              colaborador.id,

            nome:
              colaborador.nome,

            presenca:
              "presente",

          })
        )

      );


    } catch (
    erro
    ) {

      console.error(

        "Erro ao carregar colaboradores da obra:",

        erro

      );


      alert(

        "Erro ao carregar os colaboradores da obra."

      );


    } finally {

      setCarregando(
        false
      );

    }

  }

  /*

ALTERAR PRESENÇA

*/

  function alterarPresenca(

    colaboradorId,

    presenca

  ) {

    setEfetivo(

      efetivoAtual =>

        efetivoAtual.map(

          colaborador =>

            colaborador.colaboradorId ===
              colaboradorId

              ? {

                ...colaborador,

                presenca,

              } : colaborador

        )

    );

  }

  /*

ALTERAR PRODUÇÃO

*/

  function alterarProducao(

    atividade,

    quantidade

  ) {

    setProducao(

      producaoAtual => ({

        ...producaoAtual,

        [ atividade ]:

          Number(
            quantidade
          ),

      })

    );

  }

  /*

ALTERNAR MOTIVO

*/

  function alternarMotivo(

    motivoId

  ) {

    setMotivosBaixaProdutividade(

      motivosAtuais => {

        if (

          motivosAtuais.includes(
            motivoId
          )

        ) {

          return motivosAtuais.filter(

            motivo =>

              motivo !==
              motivoId

          );

        }


        return [

          ...motivosAtuais,

          motivoId,

        ];

      }

    );

  }

  /*

ENVIAR RDO

*/

  async function enviarRDO(

    event

  ) {

    event.preventDefault();


    if (

      !obra?.id

    ) {

      alert(

        "Nenhuma obra foi selecionada."

      );

      return;

    }


    if (

      !usuario?.id

    ) {

      alert(

        "Usuário não identificado."

      );

      return;

    }


    if (

      motivosBaixaProdutividade.length >
      0 &&

      !detalhamentoBaixaProdutividade.trim()

    ) {

      alert(

        "Detalhe o motivo da baixa produtividade."

      );

      return;

    }


    try {

      setSalvando(
        true
      );


      const dataHoje =
        obterDataHoje();


      console.log(

        "INICIANDO ENVIO DO RDO"

      );


      console.log(

        "Obra:",

        obra

      );


      console.log(

        "Encarregado:",

        usuario

      );


      /*
  ========================================
  1. VERIFICAR RDO EXISTENTE
  ========================================
  */

      const {

        data: rdoExistente,

        error: consultaError

      } = await supabase

        .from(
          "rdos"
        )

        .select(
          "id"
        )

        .eq(
          "obra_id",

          obra.id
        )

        .eq(
          "data",

          dataHoje
        )

        .maybeSingle();


      if (

        consultaError

      ) {

        console.error(

          "ERRO AO VERIFICAR RDO EXISTENTE:",

          consultaError

        );

        throw consultaError;

      }


      if (

        rdoExistente

      ) {

        alert(

          "A RDO desta obra já foi enviada hoje."

        );

        return;

      }


      console.log(

        "VERIFICAÇÃO DE RDO OK"

      );


      /*
  ========================================
  2. CRIAR RDO
  ========================================
  */

      const {
        data: novaRDO,
        error: rdoError
      } = await supabase
        .from(
          "rdos"
        )
        .insert([ {

          obra_id:
            obra.id,

          encarregado_id:
            usuario.id,

          encarregado_nome:
            usuario.nome || null,

          equipe_id:
            obra.equipe_id || null,

          equipe_nome:
            obra.equipe?.nome || null,

          data:
            dataHoje,

          observacoes:
            detalhamentoBaixaProdutividade.trim() ||
            null,

        } ])

        .select(`
  id,
  codigo,
  obra_id,
  encarregado_id,
  encarregado_nome,
  equipe_id,
  equipe_nome,
  data,
  observacoes,
  created_at`)

        .single();


      if (

        rdoError

      ) {

        console.error(

          "ERRO AO INSERIR NA TABELA RDOS:",

          rdoError

        );

        throw rdoError;

      }


      console.log(
        "RDO CRIADA:",
        novaRDO
      );

      console.log(
        "CÓDIGO DA RDO:",
        novaRDO.codigo
      );


      /*
  ========================================
  3. SALVAR PRODUÇÃO
  ========================================
  */

      const producaoParaSalvar = [ {

        atividade:

          "escavacao",

        quantidade:

          producao.escavacao,

      },


      {

        atividade:

          "concretagem",

        quantidade:

          producao.concretagem,

      },


      {

        atividade:

          "acabamento",

        quantidade:

          producao.acabamento,

      },


      {

        atividade:

          "instalacao_modulo",

        quantidade:

          producao.instalacaoModulo,

      },


      {

        atividade:

          "instalacao_terca",

        quantidade:

          producao.instalacaoTerca,

      },


      {

        atividade:

          "instalacao_telha",

        quantidade:

          producao.instalacaoTelha,

      },

      ]

        .filter(

          item =>

            item.quantidade >

            0

        )

        .map(

          item => ({

            rdo_id:

              novaRDO.id,

            atividade:

              item.atividade,

            quantidade:

              item.quantidade,

          })

        );


      if (

        producaoParaSalvar.length >

        0

      ) {

        const {

          error: producaoError

        } = await supabase

          .from(

            "rdo_producao"

          )

          .insert(

            producaoParaSalvar

          );


        if (

          producaoError

        ) {

          console.error(

            "ERRO AO INSERIR PRODUÇÃO:",

            producaoError

          );

          throw producaoError;

        }

      }


      console.log(

        "PRODUÇÃO SALVA"

      );


      /*
  ========================================
  4. SALVAR EFETIVO
  ========================================
  */

      const efetivoParaSalvar =

        efetivo.map(

          colaborador => ({

            rdo_id:

              novaRDO.id,

            colaborador_id:

              colaborador.colaboradorId,

            presenca:

              colaborador.presenca,

          })

        );


      if (

        efetivoParaSalvar.length >

        0

      ) {

        const {

          error: efetivoError

        } = await supabase

          .from(

            "rdo_efetivo"

          )

          .insert(

            efetivoParaSalvar

          );


        if (

          efetivoError

        ) {

          console.error(

            "ERRO AO INSERIR EFETIVO:",

            efetivoError

          );

          throw efetivoError;

        }

      }


      console.log(

        "EFETIVO SALVO"

      );


      /*
  ========================================
  5. SALVAR MOTIVOS
  ========================================
  */

      const motivosParaSalvar =

        motivosBaixaProdutividade.map(

          motivo => ({

            rdo_id:

              novaRDO.id,

            motivo:

              motivo,

          })

        );


      if (

        motivosParaSalvar.length >

        0

      ) {

        const {

          error: motivosError

        } = await supabase

          .from(

            "rdo_motivos"

          )

          .insert(

            motivosParaSalvar

          );


        if (

          motivosError

        ) {

          console.error(

            "ERRO AO INSERIR MOTIVOS:",

            motivosError

          );

          throw motivosError;

        }

      }


      console.log(

        "MOTIVOS SALVOS"

      );
      /*
========================================
6. SALVAR MATERIAIS
========================================
*/

      const materiaisParaSalvar =
        materiais

          .filter(
            item => item.descricao.trim()
          )

          .map(
            item => ({

              rdo_id: novaRDO.id,

              descricao: item.descricao,

              quantidade:
                Number(item.quantidade || 0),

              unidade:
                item.unidade || "un"

            })
          );

      if (
        materiaisParaSalvar.length > 0
      ) {

        const {
          error: materiaisError
        } = await supabase

          .from(
            "rdo_materiais"
          )

          .insert(
            materiaisParaSalvar
          );

        if (
          materiaisError
        ) {

          console.error(
            "ERRO AO INSERIR MATERIAIS:",
            materiaisError
          );

          throw materiaisError;

        }

      }

      console.log(
        "MATERIAIS SALVOS"
      );


      alert(
        "RDO enviada com sucesso!"
      );

      if (chaveRascunho) {

        localStorage.removeItem(
          chaveRascunho
        );

      }

      navegar(
        "home"
      );


    } catch (

    erro

    ) {

      console.error(

        "ERRO COMPLETO AO ENVIAR RDO:",

        erro

      );


      alert(

        `Erro ao enviar RDO: ${erro.message ||

        "Erro desconhecido"

        }`

      );


    } finally {

      setSalvando(

        false

      );

    }

  }

  function adicionarMaterial() {
    setMateriais([
      ...materiais,
      {
        descricao: "",
        quantidade: "",
        unidade: "un",
      },
    ]);
  }

  function removerMaterial(index) {
    setMateriais(
      materiais.filter((_, i) => i !== index)
    );
  }

  function atualizarMaterial(index, campo, valor) {
    const novosMateriais = [ ...materiais ];

    novosMateriais[ index ][ campo ] = valor;

    setMateriais(novosMateriais);
  }

  /*

CARREGANDO

*/

  if (

    carregando

  ) {

    return (

      <div className="app-layout">

        <main className="app-content">

          <div className="empty-state">

            <p>

              Carregando colaboradores da obra...

            </p>

          </div>

        </main>

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
              onClick={voltar}
            >
              ← Voltar
            </button>


            <h1>

              Formulário RDO

            </h1>


            <p>

              Preencha as informações diárias da obra.

            </p>

          </div>

        </div>

        <section className="form-card">

          <div className="form-rdo-obra">

            <span className="form-rdo-obra-label">
              OBRA
            </span>

            <h2>
              {
                obra?.nome_condominio ||
                "Obra não selecionada"
              }
            </h2>

            <p>
              <strong>Endereço:</strong>{" "}
              {
                obra?.endereco ||
                "Não informado"
              }
            </p>

          </div>

          <hr />


          <h2>

            Produção Diária

          </h2>


          <div className="producao-grid">

            <div className="form-group">

              <label>

                Escavação

              </label>


              <input

                type="number"

                min="0"

                value={

                  producao.escavacao

                }

                onChange={

                  event =>

                    alterarProducao(

                      "escavacao",

                      event.target.value

                    )

                }

              />

            </div>


            <div className="form-group">

              <label>

                Concretagem

              </label>


              <input

                type="number"

                min="0"

                value={

                  producao.concretagem

                }

                onChange={

                  event =>

                    alterarProducao(

                      "concretagem",

                      event.target.value

                    )

                }

              />

            </div>


            <div className="form-group">

              <label>

                Acabamento

              </label>


              <input

                type="number"

                min="0"

                value={

                  producao.acabamento

                }

                onChange={

                  event =>

                    alterarProducao(

                      "acabamento",

                      event.target.value

                    )

                }

              />

            </div>


            <div className="form-group">

              <label>

                Instalação de Módulo

              </label>


              <input

                type="number"

                min="0"

                value={

                  producao.instalacaoModulo

                }

                onChange={

                  event =>

                    alterarProducao(

                      "instalacaoModulo",

                      event.target.value

                    )

                }

              />

            </div>


            <div className="form-group">

              <label>

                Instalação de Terça

              </label>


              <input

                type="number"

                min="0"

                value={

                  producao.instalacaoTerca

                }

                onChange={

                  event =>

                    alterarProducao(

                      "instalacaoTerca",

                      event.target.value

                    )

                }

              />

            </div>


            <div className="form-group">

              <label>

                Instalação de Telha

              </label>


              <input

                type="number"

                min="0"

                value={

                  producao.instalacaoTelha

                }

                onChange={

                  event =>

                    alterarProducao(

                      "instalacaoTelha",

                      event.target.value

                    )

                }

              />

            </div>

          </div>


          <hr />


          <h2>

            Controle de Efetivo

          </h2>


          {

            colaboradoresDaObra.length ===

              0

              ? (

                <div className="empty-state">

                  <p>

                    Nenhum colaborador foi atribuído a esta obra.

                  </p>

                </div>

              ) : (

                <div className="efetivo-lista">

                  {

                    colaboradoresDaObra.map(

                      colaborador => {

                        const registro =

                          efetivo.find(

                            item =>

                              item.colaboradorId ===

                              colaborador.id

                          );


                        return (

                          <div

                            className="efetivo-item"

                            key={

                              colaborador.id

                            }

                          >

                            <div>

                              <strong>

                                {

                                  colaborador.nome

                                }

                              </strong>


                              <small>

                                {

                                  colaborador.tipo ===

                                    "diarista"

                                    ? "Diarista" : "Colaborador fixo"

                                }

                              </small>

                            </div>


                            <div

                              className="presenca-acoes"

                            >

                              <button

                                type="button"

                                className={

                                  registro?.presenca ===

                                    "presente"

                                    ? "btn btn-success" : "btn btn-secondary"

                                }

                                onClick={() =>

                                  alterarPresenca(

                                    colaborador.id,

                                    "presente"

                                  )

                                }

                              >

                                Presente

                              </button>


                              <button

                                type="button"

                                className={

                                  registro?.presenca ===

                                    "ausente"

                                    ? "btn btn-danger" : "btn btn-secondary"

                                }

                                onClick={() =>

                                  alterarPresenca(

                                    colaborador.id,

                                    "ausente"

                                  )

                                }

                              >

                                Ausente

                              </button>

                            </div>

                          </div>

                        );

                      }

                    )

                  }

                </div>

              )

          }

          <hr />

          <h2>
            Materiais Enviados
          </h2>

          <div className="section-header">

            <button
              type="button"
              className="btn btn-primary"
              onClick={adicionarMaterial}
            >
              + Adicionar Material
            </button>

          </div>

          {
            materiais.length === 0 ? (

              <div className="empty-state">
                <p>
                  Nenhum material informado.
                </p>
              </div>

            ) : (

              <div className="materiais-lista">

                {materiais.map((material, index) => (

                  <div
                    className="material-item"
                    key={index}
                  >

                    <input
                      type="text"
                      placeholder="Descrição"
                      value={material.descricao}
                      onChange={(e) =>
                        atualizarMaterial(
                          index,
                          "descricao",
                          e.target.value
                        )
                      }
                    />

                    <input
                      type="number"
                      placeholder="Quantidade"
                      value={material.quantidade}
                      onChange={(e) =>
                        atualizarMaterial(
                          index,
                          "quantidade",
                          e.target.value
                        )
                      }
                    />

                    <input
                      type="text"
                      placeholder="Unidade"
                      value={material.unidade}
                      onChange={(e) =>
                        atualizarMaterial(
                          index,
                          "unidade",
                          e.target.value
                        )
                      }
                    />

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() =>
                        removerMaterial(index)
                      }
                    >
                      ✕
                    </button>

                  </div>

                ))}

              </div>

            )}

          <hr />


          <h2>

            Motivo de Baixa Produtividade

          </h2>


          <p>

            Selecione um ou mais motivos, caso tenha ocorrido baixa produtividade.

          </p>


          <div

            className="motivos-grid"

          >

            {

              motivosDisponiveis.map(

                motivo => (

                  <label

                    className="selection-item"

                    key={

                      motivo.id

                    }

                  >

                    <input

                      type="checkbox"

                      checked={

                        motivosBaixaProdutividade.includes(

                          motivo.id

                        )

                      }

                      onChange={() =>

                        alternarMotivo(

                          motivo.id

                        )

                      }

                    />


                    <span>

                      {

                        motivo.nome

                      }

                    </span>

                  </label>

                )

              )

            }

          </div>


          <div className="form-group">

            <label>

              Detalhamento

            </label>


            <textarea

              rows="5"

              value={

                detalhamentoBaixaProdutividade

              }

              onChange={

                event =>

                  setDetalhamentoBaixaProdutividade(

                    event.target.value

                  )

              }

              placeholder="Descreva o que aconteceu..."

            />

          </div>


          <div className="form-actions">

            <button

              type="button"

              className="btn btn-primary"

              onClick={

                enviarRDO

              }

              disabled={

                salvando

              }

            >

              {

                salvando

                  ? "Enviando RDO..." : "Enviar RDO"

              }

            </button>

          </div>

        </section>

      </main>

    </div>

  );

}

export default FormRDO;