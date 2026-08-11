import "./RdoPdfTemplate.css";

import logoAcodez from "../assets/logo-acodez.png";

function nomeAtividade(atividade) {
  const atividades = {
    escavacao: "Escavação",
    concretagem: "Concretagem",
    acabamento: "Acabamento",
    instalacao_modulo: "Instalação de Módulo",
    instalacao_terca: "Instalação de Terça",
    instalacao_telha: "Instalação de Telha",
  };

  return atividades[atividade] || atividade;
}

function formatarDataBR(data) {
  if (!data) return "";

  const [ano,
    mes,
    dia] = data.split("-");

  return `${dia}/${mes}/${ano}`;
}

function RdoPdfTemplate( {
  obra, rdo
}) {
  if (!obra || !rdo) return null;

  const totalPresentes =
  (rdo.rdo_efetivo || []).filter(
    (item) => item.presenca === "presente"
  ).length;

  // Divide o efetivo em 2 colunas
  const efetivo = rdo.rdo_efetivo || [];

  const metade = Math.ceil(efetivo.length / 2);

  const coluna1 = efetivo.slice(0, metade);

  const coluna2 = efetivo.slice(metade);

  return (
    <div id="rdo-pdf">

      {/* CABEÇALHO */}

      <div className="pdf-topo">

        <div className="pdf-logo">
          <img
          src={logoAcodez}
          alt="Aço 10"
          className="logo-pdf"
          />
      </div>

      <div className="pdf-info">

        <div className="linha">
          <span>Condomínio:</span>
          <strong>{obra.nome_condominio}</strong>
        </div>

        <div className="linha">
          <span>Endereço:</span>
          <strong>{obra.endereco}</strong>
        </div>

        <div className="linha">
          <span>Equipe:</span>
          <strong>{obra.equipe?.nome || "-"}</strong>
        </div>

        <div className="linha">
          <span>Encarregado:</span>
          <strong>{obra.encarregado?.nome || "-"}</strong>
        </div>

      </div>

      <div className="pdf-rdo">

        <div>
          <span>Nº RDO</span>
          {/* DEIXA EM BRANCO */}
          <strong>__________</strong>
        </div>

        <div>
          <span>Data</span>
          <strong>{formatarDataBR(rdo.data)}</strong>
        </div>

      </div>

    </div>

    {/* PRODUÇÃO E EFETIVO */}

    <div className="pdf-meio">

      <div className="pdf-box">

        <div className="titulo-box">
          PRODUÇÃO DIÁRIA
        </div>

        <table>

          <thead>
            <tr>
              <th>Atividade</th>
              <th>Quantidade</th>
            </tr>
          </thead>

          <tbody>

            {(rdo.rdo_producao || []).map((item) => (

              <tr key={item.id}>
                <td>{nomeAtividade(item.atividade)}</td>
                <td>{item.quantidade}</td>
              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* CONTROLE DE EFETIVO */}

      <div className="pdf-box">

        <div className="titulo-box">
          CONTROLE DE EFETIVO
        </div>

        <table>

          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Presença</th>
              <th>Colaborador</th>
              <th>Presença</th>
            </tr>
          </thead>

          <tbody>

            {Array.from({
              length: Math.max(
                coluna1.length,
                coluna2.length
              )
            }).map((_, index) => (

              <tr key={index}>

                <td>
                  {coluna1[index]?.rdo_colaboradores?.nome || ""}
                </td>

                <td>
                  {coluna1[index]
                  ? coluna1[index].presenca === "presente"
                  ? "P": "A": ""}
                </td>

                <td>
                  {coluna2[index]?.rdo_colaboradores?.nome || ""}
                </td>

                <td>
                  {coluna2[index]
                  ? coluna2[index].presenca === "presente"
                  ? "P": "A": ""}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

        <div className="total-efetivo">
          Total: {totalPresentes}
        </div>

      </div>

    </div>

    {/* MATERIAIS */}

    <div className="pdf-box">

      <div className="titulo-box">
        MATERIAIS UTILIZADOS
      </div>

      {(rdo.rdo_materiais || []).length === 0 ? (

        <div className="sem-dados">
          Nenhum material informado
        </div>

      ): (

        <table>

          <thead>
            <tr>
              <th>Material</th>
              <th>Quantidade</th>
              <th>Unidade</th>
            </tr>
          </thead>

          <tbody>

            {rdo.rdo_materiais.map(material => (

              <tr key={material.id}>

                <td>
                  {material.descricao}
                </td>

                <td>
                  {material.quantidade}
                </td>

                <td>
                  {material.unidade}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      )}

    </div>

    {/* OBSERVAÇÕES */}

    <div className="pdf-box observacoes">

      <div className="titulo-box">
        OBSERVAÇÕES
      </div>

      <div className="texto-observacao">
        {rdo.observacoes || "Sem observações"}
      </div>

    </div>

  </div>
);
}

export default RdoPdfTemplate;