import { ArrowRight, ArrowUpRight, Banknote, Boxes, ChevronDown, Clock3, Package, Plus, Shirt, ShoppingBag, ShoppingCart, Sparkles, Users } from 'lucide-react'
import { dateLabel, fmt, boolValue, saleDate } from '../../lib/format'
import { PageHeading } from '../../components/ui'
import { SalesTable } from '../sales/SalesTable'

export default function Dashboard({ data, loading, go, setModal, activeEmployee }) {
  const unsold = data.produtos.filter((product) => !boolValue(product, 'selled'))
  const recent = [...data.vendas].sort((a, b) => b.codVenda - a.codVenda).slice(0, 5)
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthSales = data.vendas.filter((sale) => sale.status === 1 && saleDate(sale.dataVenda) >= firstOfMonth)
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return { date, label: ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'][date.getDay()], amount: 0 }
  })
  for (const sale of data.vendas.filter((item) => item.status === 1)) {
    const when = saleDate(sale.dataVenda)
    const index = when ? Math.round((new Date(when.getFullYear(), when.getMonth(), when.getDate()) - monday) / 86400000) : -1
    if (index >= 0 && index < 7) weekDays[index].amount += Number(sale.valorTotal || 0)
  }
  const maxWeekAmount = Math.max(...weekDays.map((day) => day.amount), 1)
  return <>
    <PageHeading eyebrow={dateLabel.toLocaleUpperCase('pt-BR')} title={<>Um bom dia para <em>novas histórias.</em></>} description={<>Aqui está o resumo do seu brechó. <span className="subtle-greeting">{activeEmployee ? `Olá, ${activeEmployee.nomePessoa.split(' ')[0]}.` : 'Vamos colocar tudo em ordem?'}</span></>} action={<button className="button button-primary" onClick={() => activeEmployee ? setModal({ type: 'new-sale' }) : setModal({ type: 'login' })}><Plus size={17} /> Nova venda</button>} />
    {!loading && data.vendas.length === 0 && data.produtos.length === 0 && <div className="welcome-strip"><span className="welcome-art"><Sparkles size={19} /></span><div><strong>Seu espaço está pronto para começar.</strong><p>Cadastre marcas e categorias, depois adicione seus produtos para abrir a primeira venda.</p></div><button className="text-button" onClick={() => go('produtos')}>Cadastrar produtos <ArrowRight size={15} /></button></div>}
    <div className="metrics-grid">
      <MetricCard label="VENDAS DO MÊS" value={loading ? '—' : String(monthSales.length).padStart(2, '0')} detail="Vendas finalizadas" icon={ShoppingBag} tone="olive" trend="Concluídas" />
      <MetricCard label="FATURAMENTO DO MÊS" value={loading ? '—' : fmt(monthSales.reduce((sum, sale) => sum + Number(sale.valorTotal || 0), 0))} detail="Vendas pagas" icon={Banknote} tone="sand" trend="Este mês" />
      <MetricCard label="PEÇAS DISPONÍVEIS" value={loading ? '—' : String(unsold.length).padStart(2, '0')} detail="No seu catálogo" icon={Shirt} tone="peach" trend="Em estoque" />
      <MetricCard label="VENDAS EM ABERTO" value={loading ? '—' : String(data.vendas.filter((sale) => sale.status === 0).length).padStart(2, '0')} detail="Aguardando pagamento" icon={Clock3} tone="blue" trend="Em andamento" />
    </div>
    <div className="dashboard-grid">
      <section className="panel sales-panel"><div className="panel-heading"><div><div className="eyebrow">ACOMPANHAMENTO</div><h2>Movimento de vendas</h2><p>Vendas pagas nos últimos sete dias</p></div><button className="select-button" onClick={() => go('vendas')}>Esta semana <ChevronDown size={14} /></button></div><div className="chart-summary"><div><strong>{fmt(weekDays.reduce((sum, day) => sum + day.amount, 0))}</strong><span><span className="tiny-trend"><ArrowUpRight size={13} /></span> Recebido nesta semana</span></div><div className="chart-legend"><span /><span>Vendas pagas</span></div></div><div className="chart-area"><div className="chart-y"><span>{fmt(maxWeekAmount)}</span><span>{fmt(maxWeekAmount * .75)}</span><span>{fmt(maxWeekAmount * .5)}</span><span>{fmt(maxWeekAmount * .25)}</span><span>{fmt(0)}</span></div><div className="chart-plot"><div className="chart-gridlines"><i /><i /><i /><i /><i /></div><div className="chart-columns">{weekDays.map((day, index) => <div className="chart-column" key={`${day.label}-${index}`} title={`${day.label}: ${fmt(day.amount)}`}><div className="bar-pair"><span style={{ height: `${day.amount ? Math.max(5, (day.amount / maxWeekAmount) * 100) : 0}%` }} /></div><small>{day.label}</small></div>)}</div></div></div><div className="chart-caption"><span>Segunda a domingo</span><span><i className="caption-dot" /> Valores em reais</span></div></section>
      <section className="panel shortcuts-panel"><div className="panel-heading"><div><div className="eyebrow">ACESSO RÁPIDO</div><h2>O que você precisa?</h2><p>Atalhos para sua rotina</p></div><span className="decor-star">✳</span></div><div className="shortcut-list"><Shortcut icon={ShoppingCart} title="Registrar uma venda" description="Inicie um novo atendimento" onClick={() => activeEmployee ? setModal({ type: 'new-sale' }) : setModal({ type: 'login' })} /><Shortcut icon={Package} title="Adicionar produto" description="Cadastre uma nova peça" onClick={() => go('produtos')} /><Shortcut icon={Users} title="Ver clientes" description={`${data.clientes.length} ${data.clientes.length === 1 ? 'pessoa cadastrada' : 'pessoas cadastradas'}`} onClick={() => go('clientes')} /></div><button className="shortcut-footer" onClick={() => go('categorias')}>Organizar catálogo <ArrowRight size={15} /></button></section>
    </div>
    <section className="panel table-panel recent-panel"><div className="panel-heading table-head"><div><div className="eyebrow">ATIVIDADE RECENTE</div><h2>Últimas vendas</h2></div><button className="text-button" onClick={() => go('vendas')}>Ver todas <ArrowRight size={15} /></button></div>{recent.length ? <SalesTable sales={recent} onOpen={(sale) => setModal({ type: 'sale-detail', sale })} compact /> : <div className="empty-table"><span className="empty-icon"><ShoppingBag size={20} /></span><div><b>Nenhuma venda por aqui ainda</b><p>Assim que registrar uma venda, ela aparece neste espaço.</p></div></div>}</section>
  </>
}

function MetricCard({ label, value, detail, icon: Icon, tone, trend }) {
  return <article className="metric-card"><div className="metric-top"><span className={`metric-icon ${tone}`}><Icon size={18} strokeWidth={1.8} /></span><span className="metric-trend"><span className="metric-trend-dot" />{trend}</span></div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-detail">{detail}</div></article>
}

function Shortcut({ icon: Icon, title, description, onClick }) {
  return <button className="shortcut" onClick={onClick}><span className="shortcut-icon"><Icon size={18} /></span><span className="shortcut-text"><b>{title}</b><small>{description}</small></span><span className="shortcut-arrow">›</span></button>
}
