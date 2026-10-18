import { useState } from 'react'
import { ArrowRight, BadgeCheck, CircleHelp, CreditCard, Plus, Shirt, ShoppingBag, UserRound, X } from 'lucide-react'
import { request, jsonRequest } from '../../api/client'
import { boolValue, fmt, initials } from '../../lib/format'
import { FieldInput, FieldSelect, FormError, Modal, StatusBadge } from '../../components/ui'
import { ResourceModal } from '../resources/ResourcePage'

export function NewSaleModal({ data, employee, onClose, notify, refresh, openSale }) {
  const [clientCpf, setClientCpf] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [createClient, setCreateClient] = useState(false)
  const employeeExists = employee && data.funcionarios.some((item) => item.cpfPessoa === employee.cpfPessoa)

  const submit = async (event) => {
    event.preventDefault()
    if (!employee) { setError('Entre como funcionário para registrar uma venda.'); return }
    if (!employeeExists) { setError('O funcionário conectado não foi encontrado na API. Saia da sessão e entre novamente ou crie uma conta.'); return }
    setBusy(true); setError('')
    try {
      const sale = await request('/vendas', jsonRequest('POST', { clienteCpf: clientCpf, funcionarioCpf: employee.cpfPessoa }))
      await refresh(); notify('Venda iniciada. Adicione as peças ao carrinho.'); openSale(sale)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return <>
    <Modal title="Iniciar venda" subtitle="Escolha o cliente para abrir um novo atendimento." onClose={onClose}>
      <form className="form-body" onSubmit={submit}>
        <div className="selected-employee"><span className="avatar">{initials(employee?.nomePessoa)}</span><div><small>ATENDIMENTO POR</small><b>{employee?.nomePessoa || 'Nenhum funcionário conectado'}</b></div><span className="selected-role"><UserRound size={17} /></span></div>
        {employee && !employeeExists && <div className="inline-hint">Este perfil não está cadastrado na base atual do backend. Saia da sessão e entre novamente ou crie uma conta de funcionário antes de iniciar a venda.</div>}
        <div className="reference-field"><div className="reference-heading"><span className="field-label">Cliente <i>*</i></span><button type="button" className="text-button" onClick={() => setCreateClient(true)}><Plus size={17} /> Novo cliente</button></div><FieldSelect required value={clientCpf} onChange={(event) => setClientCpf(event.target.value)} aria-label="Cliente"><option value="">Selecione o cliente</option>{data.clientes.map((client) => <option value={client.cpfPessoa} key={client.cpfPessoa}>{client.nomePessoa} · {client.cpfPessoa}</option>)}</FieldSelect></div>
        {data.clientes.length === 0 && <div className="inline-hint">Cadastre um cliente para continuar a venda.</div>}
        <FormError>{error}</FormError>
        <div className="modal-actions"><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={busy || data.clientes.length === 0 || !employeeExists}>{busy ? <span className="spinner" /> : <ArrowRight size={19} />}{busy ? 'Iniciando…' : 'Continuar para venda'}</button></div>
      </form>
    </Modal>
    {createClient && <ResourceModal resource="clientes" data={data} nested onClose={() => setCreateClient(false)} notify={notify} refresh={refresh} onCreated={(client) => setClientCpf(client.cpfPessoa)} />}
  </>
}

export function SaleDetailModal({ sale: initialSale, data, onClose, notify, refresh }) {
  const [sale, setSale] = useState(initialSale)
  const [selected, setSelected] = useState([])
  const [payRows, setPayRows] = useState([{ method: '', amount: '' }])
  const [action, setAction] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [inlineMethodRow, setInlineMethodRow] = useState(null)
  const paid = sale.status === 1
  const open = sale.status === 0
  const linkedIds = new Set((sale.produtos || []).map((product) => product.codProd))
  const available = data.produtos.filter((product) => !boolValue(product, 'selled') && !linkedIds.has(product.codProd))
  const enabledMethods = data.metodos.filter((method) => method.activeMetodoPag ?? method.isActiveMetodoPag)

  const reload = async () => {
    const current = await request(`/vendas/${sale.codVenda}`)
    setSale(current)
    await refresh()
  }
  const withBusy = async (operation, success) => {
    setBusy(true); setError('')
    try {
      await operation(); await reload(); setAction(''); setSelected([]); setPayRows([{ method: '', amount: '' }]); notify(success)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const addItems = () => withBusy(() => request(`/vendas/${sale.codVenda}/produtos`, jsonRequest('POST', { codigos: selected })), 'Peças adicionadas à venda.')
  const pay = () => withBusy(() => request(`/vendas/${sale.codVenda}/pagamentos`, jsonRequest('POST', payRows.map((row) => ({ metodoPagamentoId: Number(row.method), valorPago: Number(String(row.amount).replace(',', '.')) })))), 'Pagamento concluído. Venda finalizada!')
  const cancel = () => withBusy(() => request(`/vendas/${sale.codVenda}/cancelamento`, { method: 'POST' }), 'Venda cancelada.')
  const setRow = (index, key, value) => setPayRows((rows) => rows.map((row, position) => position === index ? { ...row, [key]: value } : row))
  const paymentSum = payRows.reduce((total, row) => total + Number(String(row.amount || 0).replace(',', '.')), 0)

  return <>
    <Modal title={`Venda #${String(sale.codVenda).padStart(4, '0')}`} subtitle={`Aberta em ${sale.dataVenda || '—'} · ${sale.clienteVenda?.nomePessoa || 'Cliente'}`} onClose={onClose} wide>
      <div className="sale-detail">
        <div className="sale-detail-top"><div className="sale-detail-info"><span className="eyebrow">ATENDIMENTO</span><b>{sale.funcVenda?.nomePessoa || 'Funcionário'}</b><small>Cliente · {sale.clienteVenda?.nomePessoa || '—'}</small></div><StatusBadge status={sale.status === 0 ? 'pending' : paid ? 'paid' : 'cancelled'} /></div>
        <div className="sale-detail-total"><div><small>VALOR DA VENDA</small><strong>{fmt(sale.valorTotal)}</strong></div><div className="sale-count"><ShoppingBag size={19} /> {(sale.produtos || []).length} {(sale.produtos || []).length === 1 ? 'peça' : 'peças'}</div></div>
        <div className="sale-products"><div className="sale-section-head"><b>Peças no carrinho</b>{open && action !== 'items' && <button className="text-button" onClick={() => { setAction('items'); setError('') }}><Plus size={17} /> Adicionar peças</button>}</div>
          {sale.produtos?.length ? sale.produtos.map((product) => <div className="sale-product-row" key={product.codProd}><span className="sale-product-thumb"><Shirt size={19} /></span><div className="sale-product-name"><b>{product.descProd}</b><small>{product.marcaProd?.nomeMarca || '—'} · {product.tamanhoProd || '—'}</small></div><strong>{fmt(product.precoProd)}</strong></div>) : <p className="sale-empty-line">Nenhuma peça adicionada ainda.</p>}
          {action === 'items' && <div className="inline-action-panel"><div className="inline-panel-head"><div><b>Adicionar peças</b><small>Selecione produtos disponíveis no estoque.</small></div><button className="icon-button" onClick={() => setAction('')}><X size={19} /></button></div>{available.length ? <div className="product-picker">{available.map((product) => <label className={`picker-item ${selected.includes(product.codProd) ? 'selected' : ''}`} key={product.codProd}><input type="checkbox" checked={selected.includes(product.codProd)} onChange={() => setSelected((ids) => ids.includes(product.codProd) ? ids.filter((id) => id !== product.codProd) : [...ids, product.codProd])} /><span className="picker-thumb"><Shirt size={18} /></span><span className="picker-text"><b>{product.descProd}</b><small>{product.marcaProd?.nomeMarca} · {product.tamanhoProd}</small></span><strong>{fmt(product.precoProd)}</strong></label>)}</div> : <div className="inline-hint">Não há peças disponíveis para adicionar.</div>}<div className="inline-actions"><span>{selected.length} selecionadas</span><button className="button button-primary button-small" disabled={!selected.length || busy} onClick={addItems}>{busy ? 'Salvando…' : 'Adicionar ao carrinho'}</button></div></div>}
        </div>
        {paid && <div className="sale-products payment-list"><div className="sale-section-head"><b>Formas de pagamento</b><BadgeCheck size={19} className="paid-check" /></div>{sale.pagamentos?.map((payment, index) => <div className="payment-row" key={payment.codVendaPagamento || index}><span>{payment.metodoPagamento?.descMetodoPag || 'Método'}</span><b>{fmt(payment.valorPago)}</b></div>)}</div>}
        {action === 'pay' && <div className="inline-action-panel"><div className="inline-panel-head"><div><b>Receber pagamento</b><small>Saldo de {fmt(Math.max(0, Number(sale.valorTotal) - paymentSum))} · você pode dividir entre métodos.</small></div><button className="icon-button" onClick={() => setAction('')}><X size={19} /></button></div>{payRows.map((row, index) => <div className="pay-row-form" key={index}><div className="reference-field"><div className="reference-heading"><span className="field-label">Método de pagamento</span><button type="button" className="text-button" onClick={() => setInlineMethodRow(index)}><Plus size={16} /> Novo método</button></div><FieldSelect required value={row.method} onChange={(event) => setRow(index, 'method', event.target.value)} aria-label="Método de pagamento"><option value="">Selecione</option>{enabledMethods.map((method) => <option key={method.codMetodoPag} value={method.codMetodoPag}>{method.descMetodoPag}</option>)}</FieldSelect></div><FieldInput label="Valor (R$)" required type="number" min="0.01" step="0.01" value={row.amount} onChange={(event) => setRow(index, 'amount', event.target.value)} placeholder="0,00" />{payRows.length > 1 && <button className="row-action danger-action remove-pay-row" onClick={() => setPayRows((rows) => rows.filter((_, position) => position !== index))}><X size={17} /></button>}</div>)}<div className="inline-actions pay-actions"><button className="text-button" onClick={() => setPayRows((rows) => [...rows, { method: '', amount: '' }])}><Plus size={16} /> Outra forma</button><span>Total informado <b>{fmt(paymentSum)}</b></span><button className="button button-primary button-small" disabled={busy || paymentSum < Number(sale.valorTotal) || !payRows.every((row) => row.method)} onClick={pay}>{busy ? 'Processando…' : 'Confirmar pagamento'}</button></div></div>}
        {action === 'cancel' && <div className="cancel-confirm"><span><CircleHelp size={20} /></span><div><b>Cancelar esta venda?</b><small>A venda será marcada como cancelada. Os produtos adicionados continuarão marcados como vendidos, conforme a regra atual do SIB.</small></div><button className="button button-danger button-small" disabled={busy} onClick={cancel}>{busy ? 'Cancelando…' : 'Confirmar cancelamento'}</button><button className="icon-button" onClick={() => setAction('')} aria-label="Voltar"><X size={18} /></button></div>}
        <FormError>{error}</FormError>
        {open && !action && <div className="sale-detail-actions"><button className="button button-outline button-danger-outline" onClick={() => setAction('cancel')}>Cancelar venda</button>{sale.produtos?.length > 0 && <button className="button button-primary" onClick={() => setAction('pay')}><CreditCard size={19} /> Receber pagamento</button>}</div>}
      </div>
    </Modal>
    {inlineMethodRow !== null && <ResourceModal resource="metodos" data={data} nested onClose={() => setInlineMethodRow(null)} notify={notify} refresh={refresh} onCreated={(method) => setRow(inlineMethodRow, 'method', method.codMetodoPag)} />}
  </>
}
