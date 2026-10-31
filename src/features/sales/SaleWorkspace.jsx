import { useState } from "react";
import {
  BadgeCheck,
  CircleHelp,
  CreditCard,
  Minus,
  Plus,
  Search,
  Shirt,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { request, jsonRequest } from "../../api/client";
import { boolValue, fmt } from "../../lib/format";
import {
  FieldInput,
  FieldSelect,
  FormError,
  Modal,
  StatusBadge,
} from "../../components/ui";

export default function SaleWorkspace({
  sale: initialSale,
  data,
  onClose,
  notify,
  refresh,
}) {
  const [sale, setSale] = useState(initialSale);
  const firstMethod = data.metodos.find(
    (method) => method.activeMetodoPag ?? method.isActiveMetodoPag,
  );
  const [payRows, setPayRows] = useState([
    {
      method: firstMethod ? String(firstMethod.codMetodoPag) : "",
      amount: moneyInput(initialSale.valorTotal),
    },
  ]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const isOpen = sale.status === 0;
  const linkedIds = new Set(
    (sale.produtos || []).map((product) => product.codProd),
  );
  const assignedElsewhere = new Set(
    data.vendas
      .filter(
        (other) => other.status === 0 && other.codVenda !== sale.codVenda,
      )
      .flatMap((other) =>
        (other.produtos || []).map((product) => product.codProd),
      ),
  );
  const available = data.produtos.filter((product) => {
    const searchableText = [
      product.descProd,
      product.marcaProd?.nomeMarca,
      product.tamanhoProd,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesSearch = searchableText.includes(search.toLowerCase());

    return (
      !boolValue(product, "selled") &&
      !linkedIds.has(product.codProd) &&
      !assignedElsewhere.has(product.codProd) &&
      (!search || matchesSearch)
    );
  });
  const enabledMethods = data.metodos.filter(
    (method) => method.activeMetodoPag ?? method.isActiveMetodoPag,
  );
  const paymentSumCents = payRows.reduce(
    (sum, row) => sum + toCents(row.amount),
    0,
  );
  const totalCents = toCents(sale.valorTotal);
  const paymentSum = paymentSumCents / 100;
  const remainingCents = totalCents - paymentSumCents;
  const paymentDifferenceLabel =
    remainingCents < 0
      ? "Valor sobressalente"
      : remainingCents === 0
        ? "Total conferido"
        : "Falta para completar o total";
  const paymentDifference = fmt(Math.abs(remainingCents) / 100);

  const reload = async () => {
    const current = await request(`/vendas/${sale.codVenda}`);
    setSale(current);
    setPayRows((rows) =>
      rows.map((row, index) => ({
        ...row,
        method:
          row.method ||
          (index === 0 && enabledMethods[0]
            ? String(enabledMethods[0].codMetodoPag)
            : ""),
        amount: splitAmount(current.valorTotal, rows.length)[index],
      })),
    );
    await refresh();
  };

  const run = async (operation, message) => {
    setBusy(true);
    setError("");
    try {
      await operation();
      await reload();
      setConfirmCancel(false);
      notify(message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const addProduct = (code) =>
    run(
      () =>
        request(
          `/vendas/${sale.codVenda}/produtos`,
          jsonRequest("POST", { codigos: [code] }),
        ),
      "Produto vinculado à venda.",
    );

  const removeProduct = (code) =>
    run(
      () =>
        request(`/vendas/${sale.codVenda}/produtos/${code}`, {
          method: "DELETE",
        }),
      "Produto removido da venda e devolvido à grade.",
    );

  const pay = () =>
    run(
      () =>
        request(
          `/vendas/${sale.codVenda}/pagamentos`,
          jsonRequest(
            "POST",
            payRows.map((row) => ({
              metodoPagamentoId: Number(row.method),
              valorPago: Number(String(row.amount).replace(",", ".")),
            })),
          ),
        ),
      "Pagamento concluído. Venda finalizada!",
    );

  const cancel = () =>
    run(
      () =>
        request(`/vendas/${sale.codVenda}/cancelamento`, {
          method: "POST",
        }),
      "Venda cancelada.",
    );

  const setRow = (index, key, value) =>
    setPayRows((rows) =>
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    );

  const addPaymentMethod = () =>
    setPayRows((rows) => {
      const amounts = splitAmount(sale.valorTotal, rows.length + 1);
      const nextRows = [...rows, { method: "", amount: "" }];
      return nextRows.map((row, index) => ({
        ...row,
        amount: amounts[index],
      }));
    });

  const removePaymentMethod = (index) =>
    setPayRows((rows) => {
      const nextRows = rows.filter((_, rowIndex) => rowIndex !== index);
      const amounts = splitAmount(sale.valorTotal, nextRows.length);
      return nextRows.map((row, rowIndex) => ({
        ...row,
        amount: amounts[rowIndex],
      }));
    });

  return (
    <>
      <Modal
        title={`Venda #${String(sale.codVenda).padStart(4, "0")}`}
        onClose={onClose}
        wide
      >
        <div className="sale-workspace">
          <section className="workspace-products">
            <div className="workspace-section-heading">
              <div>
                <span className="eyebrow">CATÁLOGO</span>
                <h3>Produtos disponíveis</h3>
              </div>
              <span className="workspace-count">{available.length}</span>
            </div>

            <label className="workspace-search">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar produto, marca ou tamanho"
              />
            </label>

            {available.length ? (
              <div className="workspace-product-grid">
                {available.map((product) => (
                  <button
                    type="button"
                    className="workspace-product-card"
                    key={product.codProd}
                    onClick={() => addProduct(product.codProd)}
                    disabled={busy || !isOpen}
                  >
                    <span className="workspace-check">
                      <Plus size={14} />
                    </span>
                    <span className="workspace-product-icon">
                      <Shirt size={21} />
                    </span>
                    <b>{product.descProd}</b>
                    <small>
                      {product.marcaProd?.nomeMarca || "Sem marca"} ·{" "}
                      {product.tamanhoProd || "Sem tamanho"}
                    </small>
                    <strong>{fmt(product.precoProd)}</strong>
                  </button>
                ))}
              </div>
            ) : (
              <div className="workspace-empty">
                {search
                  ? "Nenhum produto corresponde à busca."
                  : "Não há produtos disponíveis no estoque."}
              </div>
            )}

            {isOpen && (
              <div
                className={`workspace-cancel-widget ${confirmCancel ? "confirming" : ""}`}
              >
                {confirmCancel ? (
                  <>
                    <span>
                      <CircleHelp size={17} /> Cancelar esta venda?
                    </span>
                    <button
                      className="button button-danger button-small"
                      disabled={busy}
                      onClick={cancel}
                    >
                      {busy ? "Cancelando…" : "Confirmar"}
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => setConfirmCancel(false)}
                      aria-label="Voltar"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <button
                    className="workspace-cancel-trigger"
                    onClick={() => setConfirmCancel(true)}
                    aria-label="Cancelar venda"
                  >
                    <Trash2 size={17} />
                    <span>Cancelar venda</span>
                  </button>
                )}
              </div>
            )}
          </section>

          <aside className="workspace-cart">
            <div className="workspace-section-heading">
              <div>
                <span className="eyebrow">
                  ATENDIMENTO por: {sale.funcVenda?.nomePessoa || "Funcionário"}
                </span>
                <h3>Itens da venda</h3>
              </div>
              <StatusBadge
                status={
                  sale.status === 0
                    ? "pending"
                    : sale.status === 1
                      ? "paid"
                      : "cancelled"
                }
              />
            </div>

            <div className="workspace-client">
              <small>CLIENTE</small>
              <b>{sale.clienteVenda?.nomePessoa || "—"}</b>
              <span>{sale.clienteVenda?.cpfPessoa || ""}</span>
            </div>

            <div className="workspace-cart-items">
              {sale.produtos?.length ? (
                sale.produtos.map((product) => (
                  <div className="workspace-cart-row" key={product.codProd}>
                    <span className="workspace-product-icon">
                      <Shirt size={18} />
                    </span>
                    <div>
                      <b>{product.descProd}</b>
                      <small>
                        {product.marcaProd?.nomeMarca || "—"} ·{" "}
                        {product.tamanhoProd || "—"}
                      </small>
                    </div>
                    <strong>{fmt(product.precoProd)}</strong>
                    {isOpen && (
                      <button
                        className="workspace-remove-item"
                        disabled={busy}
                        onClick={() => removeProduct(product.codProd)}
                        aria-label={`Remover ${product.descProd} desta venda`}
                        title="Remover da venda"
                      >
                        <Minus size={16} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="workspace-empty cart-empty">
                  <ShoppingBag size={22} />
                  <span>Adicione produtos para iniciar a venda.</span>
                </div>
              )}
            </div>

            <div className="workspace-total">
              <span>Total da venda</span>
              <strong>{fmt(sale.valorTotal)}</strong>
            </div>

            {isOpen && (
              <div className="workspace-payment-summary">
                <div>
                  <span>Valor informado</span>
                  <b>{fmt(paymentSum)}</b>
                </div>
                <div
                  className={`workspace-remaining ${
                    remainingCents <= 0 ? "balanced" : ""
                  }`}
                >
                  <span>{paymentDifferenceLabel}</span>
                  <b>{paymentDifference}</b>
                </div>
              </div>
            )}

            <section className="workspace-payments">
              <div className="workspace-section-heading payment-heading">
                <div>
                  <span className="eyebrow">CAIXA</span>
                  <h3>Formas de pagamento</h3>
                </div>
                {sale.status === 1 && (
                  <BadgeCheck size={20} className="paid-check" />
                )}
              </div>

              {sale.status === 1 ? (
                sale.pagamentos?.map((payment, index) => (
                  <div
                    className="payment-row"
                    key={payment.codVendaPagamento || index}
                  >
                    <span>
                      {payment.metodoPagamento?.descMetodoPag || "Método"}
                    </span>
                    <b>{fmt(payment.valorPago)}</b>
                  </div>
                ))
              ) : isOpen ? (
                <>
                  {payRows.map((row, index) => (
                    <div className="workspace-pay-row" key={index}>
                      <FieldSelect
                        label={index === 0 ? "Método" : `Método ${index + 1}`}
                        value={row.method}
                        onChange={(event) =>
                          setRow(index, "method", event.target.value)
                        }
                      >
                        <option value="">Selecione</option>
                        {enabledMethods.map((method) => (
                          <option
                            key={method.codMetodoPag}
                            value={method.codMetodoPag}
                          >
                            {method.descMetodoPag}
                          </option>
                        ))}
                      </FieldSelect>
                      <FieldInput
                        label="Valor (R$)"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={row.amount}
                        onChange={(event) =>
                          setRow(index, "amount", event.target.value)
                        }
                        placeholder="0,00"
                      />
                      {payRows.length > 1 && (
                        <button
                          className="icon-button"
                          onClick={() => removePaymentMethod(index)}
                          aria-label="Remover forma de pagamento"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}

                  {enabledMethods.length === 0 && (
                    <div className="inline-hint">
                      Cadastre um método de pagamento para finalizar a venda.
                    </div>
                  )}

                  <div className="workspace-payment-footer">
                    <button
                      type="button"
                      className="button button-outline workspace-add-method"
                      onClick={addPaymentMethod}
                    >
                      <Plus size={16} /> Adicionar método
                    </button>
                  </div>

                  <button
                    className="button button-primary workspace-confirm-payment"
                    disabled={
                      busy ||
                      !sale.produtos?.length ||
                      !enabledMethods.length ||
                      paymentSumCents !== totalCents ||
                      !payRows.every((row) => row.method)
                    }
                    onClick={pay}
                  >
                    <CreditCard size={17} />
                    {busy ? "Processando…" : "Confirmar pagamento"}
                  </button>
                </>
              ) : (
                <p className="workspace-cancelled">Esta venda foi cancelada.</p>
              )}
            </section>

            <FormError>{error}</FormError>
          </aside>
        </div>
      </Modal>
    </>
  );
}

function moneyInput(value) {
  return Number(value || 0).toFixed(2);
}

function toCents(value) {
  const amount = Number(String(value || 0).replace(",", "."));
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

function splitAmount(total, count) {
  const cents = Math.round(Number(total || 0) * 100);
  const base = Math.floor(cents / count);
  const remainder = cents - base * count;

  return Array.from({ length: count }, (_, index) =>
    ((base + (index < remainder ? 1 : 0)) / 100).toFixed(2),
  );
}
