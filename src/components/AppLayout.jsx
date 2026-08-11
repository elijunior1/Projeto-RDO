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

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          {usuario?.perfil === "admin" && (

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
          <h1>
            RDO
            <span>Gestão</span>
          </h1>
        </div>
        <div className="app-user">
          <span>
            {usuario?.nome}
          </span>
          <button onClick={sair}>
            Sair
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
        {usuario?.perfil === "admin" && (
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