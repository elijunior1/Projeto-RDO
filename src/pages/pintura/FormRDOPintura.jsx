import FormRDO from "../encarregado/FormRDO";

// A página do encarregado de pintura segue o mesmo padrão do encarregado.
// A diferença é o perfil ("pintura"), que faz o FormRDO renderizar a
// produção de pintura: Faixas, Copinhos, Módulos, Terças e Manutenção
// (ver src/config/producao.js).
function FormRDOPintura(props) {
  const usuarioPintura = props.usuario
    ? { ...props.usuario, perfil: "pintura" }
    : props.usuario;
  return <FormRDO {...props} usuario={usuarioPintura} />;
}

export default FormRDOPintura;
