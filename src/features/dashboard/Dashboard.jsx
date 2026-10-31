import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Clock3,
  Package,
  Plus,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react";
import { dateLabel, fmt, boolValue, saleDate } from "../../lib/format";
import { PageHeading } from "../../components/ui";
import { SalesTable } from "../sales/SalesTable";

export default function Dashboard({
  data,
  loading,
  go,
  setModal,
  activeEmployee,
}) {
  const unsold = data.produtos.filter(
    (product) => !boolValue(product, "selled"),
  );
  const recent = [...data.vendas]
    .sort((a, b) => b.codVenda - a.codVenda)
    .slice(0, 5);
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthSales = data.vendas.filter(
    (sale) => sale.status === 1 && saleDate(sale.dataVenda) >= firstOfMonth,
  );
  const [chartPeriod, setChartPeriod] = useState("month");
  const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  sunday.setDate(sunday.getDate() - sunday.getDay());
  const periods =
    chartPeriod === "week"
      ? ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"].map(
          emptyPeriod,
        )
      : chartPeriod === "year"
        ? [
            "JAN",
            "FEV",
            "MAR",
            "ABR",
            "MAI",
            "JUN",
            "JUL",
            "AGO",
            "SET",
            "OUT",
            "NOV",
            "DEZ",
          ].map(emptyPeriod)
        : Array.from({ length: 4 }, (_, index) =>
            emptyPeriod(`SEM ${index + 1}`),
          );
  for (const sale of data.vendas.filter((item) => [0, 1].includes(item.status))) {
    const when = saleDate(sale.dataVenda);
    let index = -1;
    const isCurrentMonth =
      when &&
      when.getFullYear() === now.getFullYear() &&
      when.getMonth() === now.getMonth();
    const isCurrentYear = when && when.getFullYear() === now.getFullYear();
    if (when && chartPeriod === "month" && isCurrentMonth) {
      index = Math.min(3, Math.floor((when.getDate() - 1) / 7));
    } else if (when && chartPeriod === "week") {
      const saleDay = new Date(when.getFullYear(), when.getMonth(), when.getDate());
      index = Math.round((saleDay - sunday) / 86400000);
    } else if (when && chartPeriod === "year" && isCurrentYear) {
      index = when.getMonth();
    }
    if (index >= 0 && index < periods.length) {
      const key = sale.status === 1 ? "paid" : "open";
      periods[index][key] += Number(sale.valorTotal || 0);
    }
  }
  const maxWeekAmount = Math.max(
    ...periods.flatMap((period) => [period.paid, period.open]),
    1,
  );
  const paidPeriodTotal = periods.reduce((sum, period) => sum + period.paid, 0);
  const periodDescription =
    chartPeriod === "month"
      ? "Vendas deste mês, agrupadas por semana"
      : chartPeriod === "week"
        ? "Vendas desta semana, de domingo a sábado"
        : "Vendas deste ano, de janeiro a dezembro";
  const periodSummary =
    chartPeriod === "month"
      ? "Recebido neste mês"
      : chartPeriod === "week"
        ? "Recebido nesta semana"
        : "Recebido neste ano";
  const shortcutCounts = {
    products: loading
      ? "—"
      : `${data.produtos.length} ${
          data.produtos.length === 1
            ? "produto cadastrado"
            : "produtos cadastrados"
        }`,
    sales: loading
      ? "—"
      : `${data.vendas.length} ${data.vendas.length === 1 ? "venda registrada" : "vendas registradas"}`,
  };
  return (
    <>
      <PageHeading
        eyebrow={dateLabel.toLocaleUpperCase("pt-BR")}
        title={
          <>
            Um bom dia para <em>novas histórias.</em>
          </>
        }
        description={
          <>
            Aqui está o resumo do seu brechó.{" "}
            <span className="subtle-greeting">
              {activeEmployee
                ? `Olá, ${activeEmployee.nomePessoa.split(" ")[0]}.`
                : "Vamos colocar tudo em ordem?"}
            </span>
          </>
        }
        action={
          <button
            className="button button-primary"
            onClick={() =>
              activeEmployee
                ? setModal({ type: "new-sale" })
                : setModal({ type: "login" })
            }
          >
            <Plus size={17} /> Nova venda
          </button>
        }
      />
      {!loading && data.vendas.length === 0 && data.produtos.length === 0 && (
        <div className="welcome-strip">
          <span className="welcome-art">
            <Sparkles size={19} />
          </span>
          <div>
            <strong>Seu espaço está pronto para começar.</strong>
            <p>
              Cadastre marcas e categorias, depois adicione seus produtos para
              abrir a primeira venda.
            </p>
          </div>
          <button className="text-button" onClick={() => go("produtos")}>
            Cadastrar produtos <ArrowRight size={15} />
          </button>
        </div>
      )}
      <div className="metrics-grid">
        <MetricCard
          label="VENDAS DO MÊS"
          value={loading ? "—" : String(monthSales.length).padStart(2, "0")}
          detail="Vendas finalizadas"
          icon={ShoppingBag}
          tone="olive"
          trend="Concluídas"
        />
        <MetricCard
          label="FATURAMENTO DO MÊS"
          value={
            loading
              ? "—"
              : fmt(
                  monthSales.reduce(
                    (sum, sale) => sum + Number(sale.valorTotal || 0),
                    0,
                  ),
                )
          }
          detail="Vendas pagas"
          icon={Banknote}
          tone="sand"
          trend="Este mês"
        />
        <MetricCard
          label="PEÇAS DISPONÍVEIS"
          value={loading ? "—" : String(unsold.length).padStart(2, "0")}
          detail="No seu catálogo"
          icon={Shirt}
          tone="peach"
          trend="Em estoque"
        />
        <MetricCard
          label="VENDAS EM ABERTO"
          value={
            loading
              ? "—"
              : String(
                  data.vendas.filter((sale) => sale.status === 0).length,
                ).padStart(2, "0")
          }
          detail="Aguardando pagamento"
          icon={Clock3}
          tone="blue"
          trend="Em andamento"
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel sales-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">ACOMPANHAMENTO</div>
              <h2>Movimento de vendas</h2>
              <p>{periodDescription}</p>
            </div>
            <select
              className="select-button"
              value={chartPeriod}
              onChange={(event) => setChartPeriod(event.target.value)}
              aria-label="Período do movimento de vendas"
            >
              <option value="month">Este mês · semanas 1–4</option>
              <option value="week">Esta semana · dom–sáb</option>
              <option value="year">Este ano · jan–dez</option>
            </select>
          </div>
          <div className="chart-summary">
            <div>
              <strong>
                {fmt(paidPeriodTotal)}
              </strong>
              <span>
                <span className="tiny-trend">
                  <ArrowUpRight size={13} />
                </span>{" "}
                {periodSummary}
              </span>
            </div>
            <div className="chart-legend">
              <span />
              <span>Vendas pagas</span>
              <span className="open-legend-dot" />
              <span>Vendas abertas</span>
            </div>
          </div>
          <div className="chart-area">
            <div className="chart-y">
              <span>{fmt(maxWeekAmount)}</span>
              <span>{fmt(maxWeekAmount * 0.75)}</span>
              <span>{fmt(maxWeekAmount * 0.5)}</span>
              <span>{fmt(maxWeekAmount * 0.25)}</span>
              <span>{fmt(0)}</span>
            </div>
            <div className="chart-plot">
              <div className="chart-gridlines">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="chart-columns">
                {periods.map((period, index) => (
                  <div
                    className="chart-column"
                    key={`${period.label}-${index}`}
                    title={`${period.label}: pagas ${fmt(period.paid)}, abertas ${fmt(period.open)}`}
                  >
                    <div className="bar-pair">
                      <span
                        style={{
                          height: `${period.paid ? Math.max(5, (period.paid / maxWeekAmount) * 100) : 0}%`,
                        }}
                      />
                      <span
                        className="open-sale-bar"
                        style={{
                          height: `${period.open ? Math.max(5, (period.open / maxWeekAmount) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <small>{period.label}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="chart-caption">
            <span>
              {chartPeriod === "month"
                ? "Semanas 1 a 4"
                : chartPeriod === "week"
                  ? "Domingo a sábado"
                  : "Janeiro a dezembro"}
            </span>
            <span>
              <i className="caption-dot" /> Valores em reais
            </span>
          </div>
        </section>
        <section className="panel shortcuts-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">ACESSO RÁPIDO</div>
              <h2>O que você precisa?</h2>
              <p>Atalhos para sua rotina</p>
            </div>
            <span className="decor-star">✳</span>
          </div>
          <div className="shortcut-list">
            <Shortcut
              icon={ShoppingCart}
              title="Registrar uma venda"
              description={shortcutCounts.sales}
              onClick={() =>
                activeEmployee
                  ? setModal({ type: "new-sale" })
                  : setModal({ type: "login" })
              }
            />
            <Shortcut
              icon={Package}
              title="Adicionar produto"
              description={shortcutCounts.products}
              onClick={() => go("produtos")}
            />
            <Shortcut
              icon={Users}
              title="Ver clientes"
              description={`${data.clientes.length} ${
                data.clientes.length === 1
                  ? "pessoa cadastrada"
                  : "pessoas cadastradas"
              }`}
              onClick={() => go("clientes")}
            />
          </div>
        </section>
      </div>
      <section className="panel table-panel recent-panel">
        <div className="panel-heading table-head">
          <div>
            <div className="eyebrow">ATIVIDADE RECENTE</div>
            <h2>Últimas vendas</h2>
          </div>
          <button className="text-button" onClick={() => go("vendas")}>
            Ver todas <ArrowRight size={15} />
          </button>
        </div>
        {recent.length ? (
          <SalesTable
            sales={recent}
            onOpen={(sale) => setModal({ type: "sale-detail", sale })}
            compact
          />
        ) : (
          <div className="empty-table">
            <span className="empty-icon">
              <ShoppingBag size={20} />
            </span>
            <div>
              <b>Nenhuma venda por aqui ainda</b>
              <p>Assim que registrar uma venda, ela aparece neste espaço.</p>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function MetricCard({ label, value, detail, icon: Icon, tone, trend }) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className={`metric-icon ${tone}`}>
          <Icon size={18} strokeWidth={1.8} />
        </span>
        <span className="metric-trend">
          <span className="metric-trend-dot" />
          {trend}
        </span>
      </div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-detail">{detail}</div>
    </article>
  );
}

function Shortcut({ icon: Icon, title, description, onClick }) {
  return (
    <button className="shortcut" onClick={onClick}>
      <span className="shortcut-icon">
        <Icon size={18} />
      </span>
      <span className="shortcut-text">
        <b>{title}</b>
        <small>{description}</small>
      </span>
      <span className="shortcut-arrow">›</span>
    </button>
  );
}

function emptyPeriod(label) {
  return { label, paid: 0, open: 0 };
}
