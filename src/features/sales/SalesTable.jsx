import { Eye } from "lucide-react";
import { fmt, initials } from "../../lib/format";
import { StatusBadge } from "../../components/ui";

export function SalesTable({ sales, onOpen, compact = false }) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>VENDA</th>
            <th>CLIENTE</th>
            <th>DATA</th>
            {!compact && <th>FUNCIONÁRIO</th>}
            <th>VALOR</th>
            <th>STATUS</th>
            <th className="action-col">DETALHES</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr
              key={sale.codVenda}
              onClick={() => onOpen(sale)}
              className="clickable-row"
            >
              <td>
                <span className="sale-number">
                  #{String(sale.codVenda).padStart(4, "0")}
                </span>
              </td>
              <td>
                <div className="customer-cell">
                  <span className="customer-avatar">
                    {initials(sale.clienteVenda?.nomePessoa)}
                  </span>
                  <span className="cell-strong">
                    {sale.clienteVenda?.nomePessoa || "Cliente"}
                  </span>
                </div>
              </td>
              <td>{sale.dataVenda || "—"}</td>
              {!compact && <td>{sale.funcVenda?.nomePessoa || "—"}</td>}
              <td className="cell-strong">{fmt(sale.valorTotal)}</td>
              <td>
                <StatusBadge
                  status={
                    sale.status === 0
                      ? "pending"
                      : sale.status === 1
                        ? "paid"
                        : "cancelled"
                  }
                />
              </td>
              <td className="action-cell">
                <button
                  className="row-action"
                  title="Ver detalhes"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpen(sale);
                  }}
                >
                  <Eye size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
