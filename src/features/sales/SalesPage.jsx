import { useMemo } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import { fmt } from "../../lib/format";
import { EmptyState, PageHeading } from "../../components/ui";
import { SalesTable } from "./SalesTable";

export default function SalesPage({
  data,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  setModal,
  refresh,
  activeEmployee,
}) {
  const filtered = useMemo(
    () =>
      data.vendas.filter(
        (sale) =>
          (statusFilter === "all" || sale.status === Number(statusFilter)) &&
          (!query ||
            `${sale.clienteVenda?.nomePessoa} ${sale.funcVenda?.nomePessoa} ${sale.dataVenda} ${sale.valorTotal} ${sale.status}`
              .toLowerCase()
              .includes(query.toLowerCase())),
      ),
    [data.vendas, query, statusFilter],
  );
  const paidTotal = data.vendas
    .filter((sale) => sale.status === 1)
    .reduce((total, sale) => total + Number(sale.valorTotal || 0), 0);
  const createSale = () =>
    setModal({ type: activeEmployee ? "new-sale" : "login" });

  return (
    <>
      <PageHeading
        eyebrow="ATENDIMENTOS E CAIXA"
        title={
          <>
            Vendas<em>.</em>
          </>
        }
        description="Acompanhe cada atendimento, peça por peça, até o pagamento."
        action={
          <button className="button button-primary" onClick={createSale}>
            <Plus size={19} /> Iniciar venda
          </button>
        }
      />
      <div className="sales-stats">
        <SalesFilter
          label="Todas"
          value="all"
          count={data.vendas.length}
          current={statusFilter}
          onSelect={setStatusFilter}
        />
        <SalesFilter
          label="Em aberto"
          value="0"
          count={data.vendas.filter((sale) => sale.status === 0).length}
          current={statusFilter}
          onSelect={setStatusFilter}
        />
        <SalesFilter
          label="Pagas"
          value="1"
          count={data.vendas.filter((sale) => sale.status === 1).length}
          current={statusFilter}
          onSelect={setStatusFilter}
        />
        <SalesFilter
          label="Canceladas"
          value="2"
          count={data.vendas.filter((sale) => sale.status === 2).length}
          current={statusFilter}
          onSelect={setStatusFilter}
        />
        <div className="sales-total">
          <small>TOTAL RECEBIDO</small>
          <b>{fmt(paidTotal)}</b>
        </div>
      </div>
      <section className="panel table-panel sales-table-panel">
        <div className="resource-toolbar">
          <div className="search-field">
            <Search size={19} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar cliente, funcionário, data..."
            />
          </div>
          <button className="select-button" onClick={refresh}>
            <RefreshCw size={18} /> Atualizar
          </button>
        </div>
        {filtered.length ? (
          <SalesTable
            sales={[...filtered].sort((a, b) => b.codVenda - a.codVenda)}
            onOpen={(sale) => setModal({ type: "sale-detail", sale })}
          />
        ) : (
          <EmptyState
            icon={Search}
            title={
              query ? "Nenhuma venda encontrada" : "Nenhuma venda neste filtro"
            }
            description={
              query
                ? "Tente buscar pelo nome do cliente ou número da venda."
                : "Inicie um novo atendimento para registrar a primeira venda."
            }
            action={
              statusFilter === "all" && (
                <button
                  className="button button-primary button-small"
                  onClick={createSale}
                >
                  <Plus size={17} /> Iniciar venda
                </button>
              )
            }
          />
        )}
      </section>
    </>
  );
}

function SalesFilter({ label, value, count, current, onSelect }) {
  return (
    <button
      className={`sales-stat ${current === value ? "selected" : ""}`}
      onClick={() => onSelect(value)}
    >
      <span>{label}</span>
      <b>{count}</b>
    </button>
  );
}
