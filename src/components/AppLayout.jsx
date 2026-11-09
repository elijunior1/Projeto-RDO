import {
  useState
} from "react";

import "./AppLayout.css";

function AppLayout( {
  usuario,
  navegar,
  sair,
  children
}) {

  const [menuAberto,
    setMenuAberto] = useState(false);

  const perfil = usuario?.perfil;

  const ehPintura =
    String(perfil || "").toLowerCase().includes("pintura") ||
    String(perfil || "").toLowerCase().includes("pintor");

  const titulo =
    perfil === "admin"
      ? "RDO Gestão"
      : ehPintura
        ? "Área da Pintura"
        : "Área do Encarregado";

  const subtitulo =
    perfil === "admin"
      ? "Painel administrativo"
      : ehPintura
        ? "Encarregado de pintura"
        : "Encarregado de obra";

  const icone =
    perfil === "admin"
      ? "📊"
      : ehPintura
        ? "🎨"
        : "🏗️";

  const iniciais =
    (usuario?.nome || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?";

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          {perfil === "admin" && (

            <button
              className="menu-toggle"
              onClick={() =>
              setMenuAberto(
                !menuAberto
              )
              }
              >
              ☰
            </button>

          )}
          <div className="header-brand">
            <span className="header-brand-icone">
              {icone}
            </span>
            <div className="header-brand-texto">
              <h1>
                {titulo}
              </h1>
              <small>
                {subtitulo}
              </small>
            </div>
          </div>
        </div>
        <div className="app-user">
          <span className="header-avatar">
            {iniciais}
          </span>
          <span className="header-nome">
            {usuario?.nome}
          </span>
          <button
            className="btn-sair"
            onClick={sair}
          >
            ⏻ Sair
          </button>
        </div>
      </header>
      {menuAberto && (
        <div
          className="menu-overlay"
          onClick={() =>
          setMenuAberto(false)
          }
          />
      )}

      <div className="app-body">
        {perfil === "admin" && (
          <aside
            className={
            menuAberto
            ? "app-menu aberto": "app-menu"
            }
            >

            <div className="menu-title">
              Administrador
            </div>

            <button
              onClick={() => {
                navegar("home");
                setMenuAberto(false);
              }}
              >
              🏠
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => {
                navegar("gerenciar-obras");
                setMenuAberto(false);
              }}
              >
              🏗
              <span>Obras</span>
            </button>

            <button
              onClick={() => {
                navegar("gerenciar-colaboradores");
                setMenuAberto(false);
              }}
              >
              👷
              <span>Colaboradores</span>
            </button>

            <button
              onClick={() => {
                navegar("selecionar-rdo");
                setMenuAberto(false);
              }}
              >
              📋
              <span>Consulta RDO</span>
            </button>

          </aside>

        )}

        <main className="app-content">
          {children}
        </main>

      </div>
    </div>
  );
}


export default AppLayout;
