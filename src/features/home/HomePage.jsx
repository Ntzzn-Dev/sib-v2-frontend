import {
  ArrowRight,
  ClipboardList,
  Heart,
  LogIn,
  MapPin,
  Package,
  Plus,
  ShoppingBag,
  Users,
} from "lucide-react";
import { PageHeading } from "../../components/ui";

export function PublicHome({ onLogin, onSignup, allowSignup }) {
  return (
    <section className="public-home">
      <div className="public-home-copy">
        <div className="public-home-brand"><Heart size={18} /> SISTEMA INTEGRADO DE BRECHÓ</div>
        <h1>Organize seu brechó com <em>mais tranquilidade.</em></h1>
        <p>
          O SIB reúne estoque, clientes e vendas em um só lugar para facilitar a rotina da equipe.
        </p>
        <div className="public-home-actions">
          <button className="button button-primary" onClick={onLogin}>
            <LogIn size={17} /> Entrar no sistema
          </button>
          {allowSignup && (
            <button className="button button-outline" onClick={onSignup}>
              <Plus size={17} /> Cadastrar primeiro administrador
            </button>
          )}
        </div>
      </div>
      <div className="public-home-highlights" aria-label="Recursos do sistema">
        <div><Package size={19} /><span><strong>Estoque organizado</strong><small>Acompanhe as peças disponíveis.</small></span></div>
        <div><ShoppingBag size={19} /><span><strong>Vendas registradas</strong><small>Consulte os movimentos da operação.</small></span></div>
        <div><Users size={19} /><span><strong>Cadastros centralizados</strong><small>Tenha clientes e equipe no mesmo sistema.</small></span></div>
      </div>
    </section>
  );
}

export function AttendantHome({ employee, go, onNewSale }) {
  const firstName = employee?.nomePessoa?.trim().split(/\s+/)[0] || "Atendente";
  const actions = [
    { id: "vendas", label: "Vendas", description: "Abrir e acompanhar vendas.", icon: ShoppingBag },
    { id: "produtos", label: "Produtos", description: "Consultar peças disponíveis.", icon: Package },
    { id: "clientes", label: "Clientes", description: "Consultar ou cadastrar clientes.", icon: Users },
    { id: "enderecos", label: "Endereços", description: "Consultar ou cadastrar endereços.", icon: MapPin },
  ];

  return (
    <>
      <PageHeading
        eyebrow="OPERAÇÃO"
        title={<>Olá, <em>{firstName}.</em></>}
        description="Acesse suas tarefas e continue o atendimento."
        action={(
          <button className="button button-primary" onClick={onNewSale}>
            <Plus size={17} /> Nova venda
          </button>
        )}
      />
      <div className="attendant-home-grid">
        {actions.map(({ id, label, description, icon: Icon }) => (
          <button className="attendant-home-card panel" key={id} onClick={() => go(id)}>
            <span className="attendant-home-icon"><Icon size={20} /></span>
            <strong>{label}</strong>
            <small>{description}</small>
            <span className="attendant-home-link">Abrir <ArrowRight size={15} /></span>
          </button>
        ))}
      </div>
      <div className="attendant-home-note">
        <ClipboardList size={18} />
        <span>As opções de configuração ficam disponíveis somente para o administrador.</span>
      </div>
    </>
  );
}
