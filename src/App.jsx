import { useCallback, useEffect, useState } from "react";
import {
  Boxes,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Heart,
  LayoutDashboard,
  LogOut,
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
import LoginModal from "./features/auth/LoginModal";
import ResourcePage, {
  DeleteResourceModal,
  ResourceModal,
} from "./features/resources/ResourcePage";
import SalesPage from "./features/sales/SalesPage";
import { NewSaleModal, SaleDetailModal } from "./features/sales/SalesModals";

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

export default function App() {
  const [data, setData] = useState(emptyData);
  const [page, setPage] = useState("overview");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [activeEmployee, setActiveEmployee] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sib-employee") || "null");
    } catch {
      return null;
    }
  });

  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const responses = await Promise.all(
        loadPaths.map(([, path]) => request(path)),
      );
      setData(
        Object.fromEntries(
          loadPaths.map(([key], index) => [key, responses[index]]),
        ),
      );
    } catch (loadError) {
      setError(loadError.message);
      setData(emptyData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const navigate = (target) => {
    setPage(target);
    setQuery("");
    setError("");
  };

  const refresh = async () => loadAll();

  const saveEmployee = (employee) => {
    setActiveEmployee(employee);
    localStorage.setItem("sib-employee", JSON.stringify(employee));
  };

  const signOut = () => {
    setActiveEmployee(null);
    localStorage.removeItem("sib-employee");
    notify("Sessão encerrada.");
  };

  const openSale = (sale) => setModal({ type: "sale-detail", sale });

  const mainNavigation = [
    { id: "overview", label: "Painel", icon: LayoutDashboard },
    {
      id: "vendas",
      label: "Vendas",
      icon: ShoppingBag,
      badge: data.vendas.filter((sale) => sale.status === 0).length,
    },
  ];

  const operationsNavigation = [
    { id: "produtos", label: "Produtos", icon: Shirt },
    { id: "clientes", label: "Clientes", icon: Users },
    { id: "funcionarios", label: "Funcionários", icon: UserRound },
  ];

  const settingsNavigation = [
    { id: "categorias", label: "Categorias", icon: Boxes },
    { id: "marcas", label: "Marcas", icon: Tag },
    { id: "metodos", label: "Pagamentos", icon: CreditCard },
    { id: "enderecos", label: "Endereços", icon: ClipboardList },
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

        <NavigationGroup
          title="VISÃO GERAL"
          items={mainNavigation}
          page={page}
          navigate={navigate}
        />
        <NavigationGroup
          title="OPERAÇÃO"
          items={operationsNavigation}
          page={page}
          navigate={navigate}
          spaced
        />
        <NavigationGroup
          title="CONFIGURAÇÃO"
          items={settingsNavigation}
          page={page}
          navigate={navigate}
          spaced
        />

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
            onClick={() => setModal({ type: "login" })}
          >
            <span className="avatar">
              {initials(activeEmployee?.nomePessoa)}
            </span>
            <span className="profile-copy">
              <b>{activeEmployee?.nomePessoa || "Acessar sistema"}</b>
              <small>
                {activeEmployee ? "Funcionário conectado" : "Faça seu login"}
              </small>
            </span>
            {activeEmployee ? (
              <LogOut
                size={18}
                onClick={(event) => {
                  event.stopPropagation();
                  signOut();
                }}
              />
            ) : (
              <ChevronRight size={18} />
            )}
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Início</span>
            <ChevronRight size={17} />
            <strong>
              {page === "overview"
                ? "Painel"
                : page === "vendas"
                  ? "Vendas"
                  : resourceDefs[page]?.label}
            </strong>
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
            <button
              className="avatar avatar-top"
              title={activeEmployee?.nomePessoa || "Entrar"}
              onClick={() => setModal({ type: "login" })}
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

          {page === "overview" && (
            <Dashboard
              data={data}
              loading={loading}
              go={navigate}
              setModal={setModal}
              activeEmployee={activeEmployee}
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
          {resourceDefs[page] && (
            <ResourcePage
              resource={page}
              data={data}
              query={query}
              setQuery={setQuery}
              setModal={setModal}
              notify={notify}
              refresh={refresh}
              loading={loading}
            />
          )}
        </div>
      </main>

      <Toast toast={toast} clear={() => setToast(null)} />
      {modal?.type === "login" && (
        <LoginModal
          data={data}
          onClose={() => setModal(null)}
          onLogin={saveEmployee}
          notify={notify}
        />
      )}
      {modal?.type === "resource" && (
        <ResourceModal
          key={`${modal.resource}-${modal.record?.[resourceDefs[modal.resource].id] ?? "new"}`}
          resource={modal.resource}
          record={modal.record}
          data={data}
          onClose={() => setModal(null)}
          notify={notify}
          refresh={refresh}
        />
      )}
      {modal?.type === "delete-resource" && (
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
        <SaleDetailModal
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
