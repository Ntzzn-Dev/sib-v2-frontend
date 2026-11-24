import { useCallback, useEffect, useState } from "react";
import {
  Boxes,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Database,
  Heart,
  LayoutDashboard,
  LogOut,
  Mail,
  RefreshCw,
  Shirt,
  ShoppingBag,
  Sparkles,
  Tag,
  UserRound,
  Users,
} from "lucide-react";
import { request } from "./api/client";
import { resourceDefs } from "./config/resources";
import { initials } from "./lib/format";
import { Toast } from "./components/ui";
import Dashboard from "./features/dashboard/Dashboard";
import { AttendantHome, PublicHome } from "./features/home/HomePage";
import LoginModal from "./features/auth/LoginModal";
import MyProfileModal from "./features/auth/MyProfileModal";
import EmailSettingsPage from "./features/auth/EmailSettingsPage";
import BackupPage from "./features/auth/BackupPage";
import ResourcePage, {
  DeleteResourceModal,
  ResourceModal,
} from "./features/resources/ResourcePage";
import SalesPage from "./features/sales/SalesPage";
import { NewSaleModal } from "./features/sales/SalesModals";
import SaleWorkspace from "./features/sales/SaleWorkspace";

const emptyData = {
  produtos: [],
  clientes: [],
  funcionarios: [],
  categorias: [],
  marcas: [],
  metodos: [],
  enderecos: [],
  vendas: [],
};

const loadPaths = [
  ["produtos", "/produtos"],
  ["clientes", "/clientes"],
  ["funcionarios", "/funcionarios"],
  ["categorias", "/categorias"],
  ["marcas", "/marcas"],
  ["metodos", "/metodos-pagamento"],
  ["enderecos", "/enderecos"],
  ["vendas", "/vendas"],
];

const attendantLoadPaths = [
  ["produtos", "/produtos"],
  ["clientes", "/clientes"],
  ["metodos", "/metodos-pagamento"],
  ["enderecos", "/enderecos"],
  ["vendas", "/vendas"],
];

export default function App() {
  const [data, setData] = useState(emptyData);
  const [page, setPage] = useState("overview");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [activeEmployee, setActiveEmployee] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [initialSetup, setInitialSetup] = useState(false);
  const isAdmin = activeEmployee?.perfil === 0;
  const attendantResources = ["produtos", "clientes", "enderecos"];

  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const loadAll = useCallback(async (employee) => {
    if (!employee) {
      setData(emptyData);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const paths = employee.perfil === 0 ? loadPaths : attendantLoadPaths;
      const responses = await Promise.all(
        paths.map(([, path]) => request(
          employee.perfil === 0 ? `${path}?incluirInativos=true` : path,
        )),
      );
      setData(
        { ...emptyData, ...Object.fromEntries(paths.map(([key], index) => [key, responses[index]])) },
      );
    } catch (loadError) {
      setError(loadError.message);
      setData(emptyData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    request("/auth/bootstrap")
      .then((status) => {
        if (mounted) setInitialSetup(status.cadastroInicial === true);
      })
      .catch((bootstrapError) => {
        if (mounted) setError(bootstrapError.message);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    request("/auth/me")
      .then((profile) => {
        if (mounted) {
          setActiveEmployee(profile);
          loadAll(profile);
        }
      })
      .catch((sessionError) => {
        // Sem uma sessão válida, a interface começa no estado deslogado.
        if (mounted && !sessionError.message.includes("Faça login para realizar esta operação.")) {
          setError(sessionError.message);
        }
      })
      .finally(() => {
        if (mounted) setSessionReady(true);
      });
    return () => { mounted = false; };
  }, [loadAll]);

  const navigate = (target) => {
    if (["email-config", "backup"].includes(target) && !isAdmin) {
      setPage("overview");
      return;
    }
    if (resourceDefs[target] && !isAdmin && !attendantResources.includes(target)) {
      setPage("overview");
      setQuery("");
      setError("");
      return;
    }
    setPage(target);
    setQuery("");
    setError("");
  };

  const refresh = async () => {
    if (activeEmployee) {
      await loadAll(activeEmployee);
      return;
    }
    try {
      const status = await request("/auth/bootstrap");
      setInitialSetup(status.cadastroInicial === true);
      setError("");
    } catch (refreshError) {
      setError(refreshError.message);
    }
  };

  const saveEmployee = async (employee) => {
    setActiveEmployee(employee);
    setSessionReady(true);
    setInitialSetup(false);
    setPage("overview");
    setQuery("");
    setError("");
    await loadAll(employee);
  };

  const syncActiveEmployee = (employee) => {
    setActiveEmployee((current) => {
      if (!current || current.cpfPessoa?.replace(/\D/g, "") !== employee.cpfPessoa?.replace(/\D/g, "")) {
        return current;
      }
      return { ...current, ...employee };
    });
  };

  const signOut = async () => {
    try {
      await request("/auth/logout", { method: "POST" });
    } catch {
      // Encerra também a sessão visual quando a API estiver indisponível.
    }
    setActiveEmployee(null);
    setData(emptyData);
    setLoading(false);
    setPage("overview");
    setQuery("");
    setStatusFilter("all");
    setError("");
    notify("Sessão encerrada.");
  };

  const openSale = (sale) => setModal({ type: "sale-detail", sale });

  const mainNavigation = [
    { id: "overview", label: isAdmin ? "Painel" : "Início", icon: LayoutDashboard },
  ];

  const operationsNavigation = [
    {
      id: "vendas",
      label: "Vendas",
      icon: ShoppingBag,
      badge: data.vendas.filter((sale) => sale.status === 0).length,
    },
    { id: "produtos", label: "Produtos", icon: Shirt },
    { id: "clientes", label: "Clientes", icon: Users },
    { id: "enderecos", label: "Endereços", icon: ClipboardList },
  ];

  const settingsNavigation = [
    { id: "funcionarios", label: "Funcionários", icon: UserRound },
    { id: "categorias", label: "Categorias", icon: Boxes },
    { id: "marcas", label: "Marcas", icon: Tag },
    { id: "metodos", label: "Pagamentos", icon: CreditCard },
    { id: "email-config", label: "E-mail remetente", icon: Mail },
    { id: "backup", label: "Backup do banco", icon: Database },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#inicio"
          onClick={(event) => {
            event.preventDefault();
            navigate("overview");
          }}
        >
          <span className="brand-mark">
            <Heart size={22} strokeWidth={1.8} />
          </span>
          <span className="brand-word">
            sib<span>.</span>
            <small>BRECHÓ &amp; VESTUÁRIO</small>
          </span>
        </a>

        {activeEmployee && <NavigationGroup
          title="VISÃO GERAL"
          items={mainNavigation}
          page={page}
          navigate={navigate}
        />}
        {activeEmployee && <NavigationGroup
          title="OPERAÇÃO"
          items={operationsNavigation}
          page={page}
          navigate={navigate}
          spaced
        />}
        {isAdmin && <NavigationGroup
          title="CONFIGURAÇÃO"
          items={settingsNavigation}
          page={page}
          navigate={navigate}
          spaced
        />}

        <div className="sidebar-bottom">
          <div className="side-tip">
            <Sparkles size={19} />
            <div>
              <strong>Peças com história.</strong>
              <p>Gestão simples para um negócio único.</p>
            </div>
          </div>
          <button
            className="profile-mini"
            onClick={() => setModal({ type: activeEmployee ? "my-profile" : "login" })}
            disabled={!sessionReady}
          >
            <span className="avatar">
              {initials(activeEmployee?.nomePessoa)}
            </span>
            <span className="profile-copy">
              <b>{activeEmployee?.nomePessoa || (sessionReady ? "Acessar sistema" : "Verificando sessão…")}</b>
              <small>
                {activeEmployee
                  ? isAdmin ? "Administrador" : "Atendente"
                  : sessionReady ? "Faça seu login" : "Restaurando acesso"}
              </small>
            </span>
            <ChevronRight size={18} />
          </button>
          {activeEmployee && <button className="signout-button" onClick={signOut}>
            <LogOut size={17} /> Sair da conta
          </button>}
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            {activeEmployee ? <>
              <span>Início</span>
              <ChevronRight size={17} />
              <strong>
                {page === "overview"
                  ? isAdmin ? "Painel" : "Operação"
                  : page === "vendas"
                    ? "Vendas"
                    : page === "email-config"
                      ? "E-mail remetente"
                      : page === "backup"
                        ? "Backup do banco"
                        : resourceDefs[page]?.label}
              </strong>
            </> : <strong>Sistema Integrado de Brechó</strong>}
          </div>

          <div className="topbar-right">
            <span className="top-date">
              <CalendarDays size={18} />
              {new Intl.DateTimeFormat("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(new Date())}
            </span>
            {activeEmployee && <>
              <span className="top-divider" />
              <button className="api-indicator" onClick={refresh}>
              <span
                className={`api-dot ${
                  error ? "offline" : loading ? "connecting" : "online"
                }`}
              />
              {error
                ? "API desconectada"
                : loading
                  ? "Conectando"
                  : "API conectada"}
              </button>
            </>}
            <button
              className="avatar avatar-top"
              title={activeEmployee?.nomePessoa || "Entrar"}
              onClick={() => setModal({ type: activeEmployee ? "my-profile" : "login" })}
              disabled={!sessionReady}
            >
              {initials(activeEmployee?.nomePessoa)}
            </button>
          </div>
        </header>

        <div className="content-area">
          {error && (
            <div className="connection-banner">
              <div>
                <span className="connection-icon">
                  <RefreshCw size={20} />
                </span>
                <div>
                  <strong>Não conseguimos conectar ao backend</strong>
                  <p>{error}</p>
                </div>
              </div>
              <button
                className="button button-outline button-small"
                onClick={refresh}
              >
                Tentar novamente <RefreshCw size={16} />
              </button>
            </div>
          )}

          {page === "overview" && !sessionReady && (
            <div className="session-loading"><span className="spinner" /> Verificando acesso…</div>
          )}
          {page === "overview" && sessionReady && !activeEmployee && (
            <PublicHome
              onLogin={() => setModal({ type: "login" })}
              onSignup={() => setModal({ type: "resource", resource: "funcionarios" })}
              allowSignup={initialSetup}
            />
          )}
          {page === "overview" && activeEmployee && isAdmin && (
            <Dashboard
              data={data}
              loading={loading}
              go={navigate}
              setModal={setModal}
              activeEmployee={activeEmployee}
            />
          )}
          {page === "overview" && activeEmployee && !isAdmin && (
            <AttendantHome
              employee={activeEmployee}
              go={navigate}
              onNewSale={() => setModal({ type: "new-sale" })}
            />
          )}
          {page === "vendas" && (
            <SalesPage
              data={data}
              query={query}
              setQuery={setQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              setModal={setModal}
              refresh={refresh}
              activeEmployee={activeEmployee}
            />
          )}
          {page === "email-config" && isAdmin && <EmailSettingsPage notify={notify} />}
          {page === "backup" && isAdmin && (
            <BackupPage
              notify={notify}
              onRestored={async () => {
                await signOut();
                notify("Backup restaurado. Entre novamente no sistema.");
              }}
            />
          )}
          {resourceDefs[page] && (isAdmin || attendantResources.includes(page)) && (
            <ResourcePage
              resource={page}
              data={data}
              query={query}
              setQuery={setQuery}
              setModal={setModal}
              notify={notify}
              refresh={refresh}
              loading={loading}
              canManage={isAdmin}
              canEdit={isAdmin || (!!activeEmployee && ["clientes", "enderecos"].includes(page))}
              canCreate={isAdmin || (!!activeEmployee && ["clientes", "enderecos"].includes(page))}
            />
          )}
        </div>
      </main>

      <Toast toast={toast} clear={() => setToast(null)} />
      {modal?.type === "login" && (
        <LoginModal
          onClose={() => setModal(null)}
          onLogin={saveEmployee}
          onSignup={() =>
            setModal({ type: "resource", resource: "funcionarios" })
          }
          allowSignup={initialSetup}
          notify={notify}
        />
      )}
      {modal?.type === "my-profile" && activeEmployee && (
        <MyProfileModal
          onClose={() => setModal(null)}
          onSaved={async (profile) => {
            syncActiveEmployee(profile);
            await refresh();
          }}
          fallbackAddress={activeEmployee?.endPessoa}
          onSignOut={async () => { setModal(null); await signOut(); }}
          notify={notify}
        />
      )}
      {modal?.type === "resource" && (isAdmin || (!!activeEmployee && ["clientes", "enderecos"].includes(modal.resource)) || (initialSetup && modal.resource === "funcionarios")) && (
        <ResourceModal
          key={`${modal.resource}-${modal.record?.[resourceDefs[modal.resource].id] ?? "new"}`}
          resource={modal.resource}
          record={modal.record}
          data={data}
          onClose={() => setModal(null)}
          notify={notify}
          refresh={refresh}
          onSaved={modal.resource === "funcionarios" ? syncActiveEmployee : undefined}
          onCreated={modal.resource === "funcionarios" && initialSetup ? saveEmployee : undefined}
        />
      )}
      {modal?.type === "delete-resource" && isAdmin && (
        <DeleteResourceModal
          resource={modal.resource}
          record={modal.record}
          onClose={() => setModal(null)}
          notify={notify}
          refresh={refresh}
        />
      )}
      {modal?.type === "new-sale" && (
        <NewSaleModal
          data={data}
          employee={activeEmployee}
          onClose={() => setModal(null)}
          notify={notify}
          refresh={refresh}
          openSale={openSale}
        />
      )}
      {modal?.type === "sale-detail" && (
        <SaleWorkspace
          sale={modal.sale}
          data={data}
          onClose={() => setModal(null)}
          notify={notify}
          refresh={refresh}
        />
      )}
    </div>
  );
}

function NavigationGroup({ title, items, page, navigate, spaced = false }) {
  return (
    <div className={`side-navigation-group ${spaced ? "spaced" : ""}`}>
      <div className="side-section-label">{title}</div>
      {items.map(({ id, label, icon: Icon, badge }) => (
        <button
          className={`nav-item ${page === id ? "active" : ""}`}
          key={id}
          onClick={() => navigate(id)}
        >
          <Icon size={21} />
          <span>{label}</span>
          {badge > 0 && <i className="nav-count">{badge}</i>}
        </button>
      ))}
    </div>
  );
}
