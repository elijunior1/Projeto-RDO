import {
  useState
} from "react";

import {
  supabase
} from "../supabase.js";

import {
  getToken
} from "firebase/messaging";

import {
  messaging
} from "../firebase";

import "../styles/login.css";

function Login( {
  aoEntrar
}) {
  const [
    email,
    setEmail
  ] = useState("");

  const [
    senha,
    setSenha
  ] = useState("");

  const [
    carregando,
    setCarregando
  ] = useState(false);

  const [
    erro,
    setErro
  ] = useState("");

  async function registrarPush(usuarioId) {
    try {
      const permissao = await Notification.requestPermission();

      if (permissao !== "granted") {
        console.log("Permissão negada.");
        return;
      }

      const token = await getToken(messaging, {
        vapidKey: "BBnNkQN4noJl0sap1sqs6QTnAHDCc1FBGE3EJRUdcFLvJ-KrPEhAS3TRq3k8UtSMLmO-LSsIgSrkqcY8fq1C0UQ"
      });

      if (!token) return;

      console.log("Token:", token);

      await supabase
      .from("usuarios")
      .update({
        push_token: token
      })
      .eq("id", usuarioId);

    } catch (erro) {
      console.error("Erro ao registrar Push:", erro);
    }
  }

  async function fazerLogin(event) {
    event.preventDefault();

    setErro("");
    setCarregando(true);

    const {
      data,
      error
    } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });

    if (error) {
      setErro(
        "E-mail ou senha inválidos."
      );

      setCarregando(false);

      return;
    }

    if (data.user) {

      const {
        data: usuario
      } = await supabase
      .from("usuarios")
      .select("id")
      .eq("auth_user_id", data.user.id)
      .single();

      if (usuario) {
        await registrarPush(usuario.id);
      }

      aoEntrar(data.user);
    }

    setCarregando(false);
  }

  return (
    <main className="login-page">

      <section className="login-card">

        <div className="login-header">

          <h1>
            RDO
            <span>
              Gestão
            </span>
          </h1>

          <p>
            Relatório Diário de Obra
          </p>

        </div>

        <form
          className="login-form"
          onSubmit={fazerLogin}
          >

          <div className="input-group">

            <label>
              E-mail
            </label>

            <input
            type="email"
            value={email}
            onChange={(event)=>
            setEmail(event.target.value)
            }
            placeholder="Digite seu e-mail"
            required
            />

        </div>

        <div className="input-group">

          <label>
            Senha
          </label>

          <input
          type="password"
          value={senha}
          onChange={(event)=>
          setSenha(event.target.value)
          }
          placeholder="Digite sua senha"
          required
          />

      </div>

      {
      erro &&
      (
        <div className="login-error">
          {erro}
        </div>
      )
      }

      <button
        type="submit"
        disabled={carregando}
        className="login-btn"
        >

        {
        carregando
        ?
        "Entrando...":
        "Entrar"
        }

      </button>

    </form>

    <footer>
      Sistema de gerenciamento de obras
    </footer>

  </section>

</main>
);
}

export default Login;