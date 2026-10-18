import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck,
  Banknote, Box, Boxes, CalendarDays, Check, CheckCircle2, ChevronDown,
  ChevronRight, CircleHelp, ClipboardList, Clock3, CreditCard, Eye, FileText,
  Filter, Heart, LayoutDashboard, LogIn, LogOut, Menu, MoreHorizontal,
  Package, Pencil, Plus, Search, Settings2, Shirt, ShoppingBag, ShoppingCart,
  SlidersHorizontal, Sparkles, Tag, Trash2, TrendingUp, UserRound, Users, X,
} from 'lucide-react'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/$/, '')
const resourceDefs = {
  produtos: { label: 'Produtos', singular: 'produto', icon: Shirt, route: '/produtos', id: 'codProd', title: (x) => x.descProd, columns: [['Produto', 'descProd'], ['Marca', 'marcaProd.nomeMarca'], ['Categoria', 'catProd.nomeCat'], ['Tamanho', 'tamanhoProd'], ['Preço', 'precoProd', 'money'], ['Status', 'selled', 'sold']], fields: [
    { name: 'descProd', label: 'Descrição', required: true }, { name: 'tamanhoProd', label: 'Tamanho', type: 'select', options: ['XS','PP','P','M','G','GG','XG','XGG','XXG','XXXG','XL','XXL','XXXL','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47','48','36','38','40','42','44','46','48','50','52','54','56'], required: true }, { name: 'marcaProd', label: 'Marca', type: 'ref', resource: 'marcas', id: 'codMarca', text: 'nomeMarca', required: true }, { name: 'catProd', label: 'Categoria', type: 'ref', resource: 'categorias', id: 'codCat', text: 'nomeCat', required: true }, { name: 'precoProd', label: 'Preço', type: 'number', step: '0.01', required: true },
  ] },
  clientes: { label: 'Clientes', singular: 'cliente', icon: Users, route: '/clientes', id: 'cpfPessoa', title: (x) => x.nomePessoa, columns: [['Cliente', 'nomePessoa'], ['CPF', 'cpfPessoa'], ['Telefone', 'telPessoa'], ['Cidade', 'endPessoa.cidade']], fields: [
    { name: 'cpfPessoa', label: 'CPF', required: true, createOnly: true }, { name: 'nomePessoa', label: 'Nome completo', required: true }, { name: 'telPessoa', label: 'Telefone' }, { name: 'endPessoa', label: 'Endereço', type: 'ref', resource: 'enderecos', id: 'codEnd', text: 'logradouro', optional: true },
  ] },
  funcionarios: { label: 'Funcionários', singular: 'funcionário', icon: UserRound, route: '/funcionarios', id: 'cpfPessoa', title: (x) => x.nomePessoa, columns: [['Funcionário', 'nomePessoa'], ['CPF', 'cpfPessoa'], ['Telefone', 'telPessoa'], ['Salário', 'salarioFunc', 'money']], fields: [
    { name: 'cpfPessoa', label: 'CPF', required: true, createOnly: true }, { name: 'nomePessoa', label: 'Nome completo', required: true }, { name: 'telPessoa', label: 'Telefone' }, { name: 'salarioFunc', label: 'Salário', type: 'number', step: '0.01', required: true }, { name: 'senha', label: 'Senha', type: 'password', required: true, editHint: 'Deixe em branco para manter a senha atual.' }, { name: 'endPessoa', label: 'Endereço', type: 'ref', resource: 'enderecos', id: 'codEnd', text: 'logradouro', optional: true },
  ] },
  categorias: { label: 'Categorias', singular: 'categoria', icon: Boxes, route: '/categorias', id: 'codCat', title: (x) => x.nomeCat, columns: [['Categoria', 'nomeCat']], fields: [{ name: 'nomeCat', label: 'Nome da categoria', required: true }] },
  marcas: { label: 'Marcas', singular: 'marca', icon: Tag, route: '/marcas', id: 'codMarca', title: (x) => x.nomeMarca, columns: [['Marca', 'nomeMarca']], fields: [{ name: 'nomeMarca', label: 'Nome da marca', required: true }] },
  metodos: { label: 'Pagamentos', singular: 'método de pagamento', icon: CreditCard, route: '/metodos-pagamento', id: 'codMetodoPag', title: (x) => x.descMetodoPag, columns: [['Método', 'descMetodoPag'], ['Status', 'activeMetodoPag', 'active']], fields: [{ name: 'descMetodoPag', label: 'Descrição', required: true }, { name: 'activeMetodoPag', label: 'Ativo', type: 'checkbox', createDefault: true }] },
  enderecos: { label: 'Endereços', singular: 'endereço', icon: ClipboardList, route: '/enderecos', id: 'codEnd', title: (x) => `${x.logradouro}, ${x.numero || 's/n'}`, columns: [['Logradouro', 'logradouro'], ['Bairro', 'bairro'], ['Cidade', 'cidade'], ['UF', 'uf'], ['CEP', 'cep']], fields: [
    { name: 'uf', label: 'UF', required: true, maxLength: 2 }, { name: 'cep', label: 'CEP', required: true }, { name: 'cidade', label: 'Cidade', required: true }, { name: 'bairro', label: 'Bairro', required: true }, { name: 'logradouro', label: 'Logradouro', required: true }, { name: 'numero', label: 'Número' }, { name: 'complemento', label: 'Complemento' },
  ] },
}

const emptyData = { produtos: [], clientes: [], funcionarios: [], categorias: [], marcas: [], metodos: [], enderecos: [], vendas: [] }
const fmt = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
const read = (obj, path) => path.split('.').reduce((value, key) => value?.[key], obj)
const boolValue = (obj, key) => key === 'selled' ? (obj?.selled ?? obj?.isSelled ?? false) : (obj?.[key] ?? obj?.isActiveMetodoPag ?? false)
const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'S'
const saleDate = (value = '') => { const [date, time = '00:00'] = value.split(' '); const [day, month, year] = (date || '').split('/').map(Number); const [hour, minute] = time.split(':').map(Number); return day && month && year ? new Date(2000 + year, month - 1, day, hour || 0, minute || 0) : null }
const dateLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${API}${path}`, { ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers } })
  } catch {
    throw new Error(`Não foi possível acessar o SIB v2 em ${API}. Inicie a API Spring Boot e tente novamente.`)
  }
  if (!response.ok) {
    let body = {}
    try { body = await response.json() } catch { /* resposta sem JSON */ }
    throw new Error(body.detail || body.message || `Falha na API (${response.status})`)
  }
  if (response.status === 204) return null
  return response.json()
}
const json = (method, body) => ({ method, body: JSON.stringify(body) })

function Toast({ toast, clear }) {
  if (!toast) return null
  return <div className={`toast ${toast.type}`} role="status"><span className="toast-icon">{toast.type === 'error' ? <CircleHelp size={18} /> : <CheckCircle2 size={18} />}</span>{toast.message}<button onClick={clear} aria-label="Fechar"><X size={16} /></button></div>
}

function Modal({ title, subtitle, onClose, children, wide = false }) {
  useEffect(() => { const fn = (event) => event.key === 'Escape' && onClose(); window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn) }, [onClose])
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true"><header className="modal-head"><div><div className="eyebrow">SIB · SISTEMA INTEGRADO DE BRECHÓ</div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={20} /></button></header>{children}</section></div>
}

function App() {
  const [data, setData] = useState(emptyData)
  const [page, setPage] = useState('overview')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [modal, setModal] = useState(null)
  const [activeEmployee, setActiveEmployee] = useState(() => { try { return JSON.parse(localStorage.getItem('sib-employee') || 'null') } catch { return null } })
  const [mobileNav, setMobileNav] = useState(false)

  const notify = useCallback((message, type = 'success') => { setToast({ message, type }); window.setTimeout(() => setToast(null), 4200) }, [])
  const loadAll = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [produtos, clientes, funcionarios, categorias, marcas, metodos, enderecos, vendas] = await Promise.all([
        '/produtos', '/clientes', '/funcionarios', '/categorias', '/marcas', '/metodos-pagamento', '/enderecos', '/vendas',
      ].map((path) => request(path)))
      setData({ produtos, clientes, funcionarios, categorias, marcas, metodos, enderecos, vendas })
    } catch (err) { setError(err.message); setData(emptyData) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { loadAll() }, [loadAll])

  const availableProducts = useMemo(() => data.produtos.filter((p) => !boolValue(p, 'selled')), [data.produtos])
  const openSales = useMemo(() => data.vendas.filter((sale) => sale.status === 0), [data.vendas])
  const paidSales = useMemo(() => data.vendas.filter((sale) => sale.status === 1), [data.vendas])
  const go = (target) => { setPage(target); setQuery(''); setMobileNav(false); setError('') }
  const saveEmployee = (employee) => { setActiveEmployee(employee); localStorage.setItem('sib-employee', JSON.stringify(employee)) }
  const signOut = () => { setActiveEmployee(null); localStorage.removeItem('sib-employee'); notify('Sessão encerrada.') }
  const refresh = async () => { await loadAll() }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <a className="brand" href="#inicio" onClick={(e) => { e.preventDefault(); go('overview') }}><span className="brand-mark"><Heart size={19} strokeWidth={1.8} /></span><span className="brand-word">sib<span>.</span><small>BRECHÓ & VESTUÁRIO</small></span></a>
      <div className="side-section-label">VISÃO GERAL</div>
      <button className={`nav-item ${page === 'overview' ? 'active' : ''}`} onClick={() => go('overview')}><LayoutDashboard size={18} /><span>Painel</span></button>
      <button className={`nav-item ${page === 'vendas' ? 'active' : ''}`} onClick={() => go('vendas')}><ShoppingBag size={18} /><span>Vendas</span>{openSales.length > 0 && <i className="nav-count">{openSales.length}</i>}</button>
      <div className="side-section-label side-label-spaced">OPERAÇÃO</div>
      <button className={`nav-item ${page === 'produtos' ? 'active' : ''}`} onClick={() => go('produtos')}><Shirt size={18} /><span>Produtos</span></button>
      <button className={`nav-item ${page === 'clientes' ? 'active' : ''}`} onClick={() => go('clientes')}><Users size={18} /><span>Clientes</span></button>
      <button className={`nav-item ${page === 'funcionarios' ? 'active' : ''}`} onClick={() => go('funcionarios')}><UserRound size={18} /><span>Equipe</span></button>
      <div className="side-section-label side-label-spaced">CONFIGURAÇÃO</div>
      <button className={`nav-item ${page === 'categorias' ? 'active' : ''}`} onClick={() => go('categorias')}><Boxes size={18} /><span>Categorias</span></button>
      <button className={`nav-item ${page === 'marcas' ? 'active' : ''}`} onClick={() => go('marcas')}><Tag size={18} /><span>Marcas</span></button>
      <button className={`nav-item ${page === 'metodos' ? 'active' : ''}`} onClick={() => go('metodos')}><CreditCard size={18} /><span>Pagamentos</span></button>
      <button className={`nav-item ${page === 'enderecos' ? 'active' : ''}`} onClick={() => go('enderecos')}><ClipboardList size={18} /><span>Endereços</span></button>
      <div className="sidebar-bottom"><div className="side-tip"><Sparkles size={16} /><div><strong>Peças com história.</strong><p>Gestão simples para um negócio único.</p></div></div><button className="profile-mini" onClick={() => setModal({ type: 'login' })}><span className="avatar">{initials(activeEmployee?.nomePessoa)}</span><span className="profile-copy"><b>{activeEmployee?.nomePessoa || 'Acessar sistema'}</b><small>{activeEmployee ? 'Funcionário conectado' : 'Faça seu login'}</small></span>{activeEmployee ? <LogOut size={15} onClick={(event) => { event.stopPropagation(); signOut() }} /> : <ChevronRight size={15} />}</button></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Abrir menu"><Menu size={20} /></button><div className="breadcrumb"><span>Início</span><ChevronRight size={14} /><strong>{page === 'overview' ? 'Painel' : page === 'vendas' ? 'Vendas' : resourceDefs[page]?.label}</strong></div><div className="topbar-right"><span className="top-date"><CalendarDays size={15} />{dateLabel}</span><span className="top-divider" /><button className="api-indicator" onClick={refresh}><span className={`api-dot ${error ? 'offline' : loading ? 'connecting' : 'online'}`} />{error ? 'API desconectada' : loading ? 'Conectando' : 'API conectada'}</button><button className="avatar avatar-top" title={activeEmployee?.nomePessoa || 'Entrar'} onClick={() => setModal({ type: 'login' })}>{initials(activeEmployee?.nomePessoa)}</button></div></header>
      <div className="content-area">
        {error && <div className="connection-banner"><div><span className="connection-icon"><Activity size={18} /></span><div><strong>Não conseguimos conectar ao backend</strong><p>{error}</p></div></div><button className="button button-outline button-small" onClick={refresh}>Tentar novamente <ArrowRight size={15} /></button></div>}
        {page === 'overview' && <Dashboard data={data} loading={loading} go={go} setModal={setModal} activeEmployee={activeEmployee} onRefresh={refresh} />}
        {page === 'vendas' && <SalesPage data={data} query={query} setQuery={setQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} setModal={setModal} notify={notify} refresh={refresh} activeEmployee={activeEmployee} />}
        {resourceDefs[page] && <ResourcePage resource={page} data={data} query={query} setQuery={setQuery} setModal={setModal} notify={notify} refresh={refresh} loading={loading} />}
      </div>
    </main>
    <Toast toast={toast} clear={() => setToast(null)} />
    {modal?.type === 'login' && <LoginModal data={data} onClose={() => setModal(null)} onLogin={saveEmployee} notify={notify} />}
    {modal?.type === 'resource' && <ResourceModal resource={modal.resource} record={modal.record} data={data} onClose={() => setModal(null)} notify={notify} refresh={refresh} />}
    {modal?.type === 'delete-resource' && <DeleteResourceModal resource={modal.resource} record={modal.record} onClose={() => setModal(null)} notify={notify} refresh={refresh} />}
    {modal?.type === 'new-sale' && <NewSaleModal data={data} employee={activeEmployee} onClose={() => setModal(null)} notify={notify} refresh={refresh} openSale={(sale) => setModal({ type: 'sale-detail', sale })} request={request} />}
    {modal?.type === 'sale-detail' && <SaleDetailModal sale={modal.sale} data={data} onClose={() => setModal(null)} notify={notify} refresh={refresh} request={request} />}
  </div>
}

function PageHeading({ eyebrow, title, description, action }) { return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div> }
function Dashboard({ data, loading, go, setModal, activeEmployee, onRefresh }) {
  const unsold = data.produtos.filter((p) => !boolValue(p, 'selled'))
  const recent = [...data.vendas].sort((a, b) => b.codVenda - a.codVenda).slice(0, 5)
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthSales = data.vendas.filter((sale) => sale.status === 1 && saleDate(sale.dataVenda) >= firstOfMonth)
  const monday = new Date(now); monday.setHours(0, 0, 0, 0); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const weekDays = Array.from({ length: 7 }, (_, index) => { const date = new Date(monday); date.setDate(monday.getDate() + index); return { date, label: ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'][date.getDay()], amount: 0 } })
  for (const sale of data.vendas.filter((item) => item.status === 1)) { const when = saleDate(sale.dataVenda); const index = when ? Math.round((new Date(when.getFullYear(), when.getMonth(), when.getDate()) - monday) / 86400000) : -1; if (index >= 0 && index < 7) weekDays[index].amount += Number(sale.valorTotal || 0) }
  const maxWeekAmount = Math.max(...weekDays.map((day) => day.amount), 1)
  return <>
    <PageHeading eyebrow={dateLabel.toLocaleUpperCase('pt-BR')} title={<>Um bom dia para <em>novas histórias.</em></>} description={<>Aqui está o resumo do seu brechó. <span className="subtle-greeting">{activeEmployee ? `Olá, ${activeEmployee.nomePessoa.split(' ')[0]}.` : 'Vamos colocar tudo em ordem?'}</span></>} action={<button className="button button-primary" onClick={() => activeEmployee ? setModal({ type: 'new-sale' }) : setModal({ type: 'login' })}><Plus size={17} /> Nova venda</button>} />
    {!loading && data.vendas.length === 0 && data.produtos.length === 0 && <div className="welcome-strip"><span className="welcome-art"><Sparkles size={19} /></span><div><strong>Seu espaço está pronto para começar.</strong><p>Cadastre marcas e categorias, depois adicione seus produtos para abrir a primeira venda.</p></div><button className="text-button" onClick={() => go('produtos')}>Cadastrar produtos <ArrowRight size={15} /></button></div>}
    <div className="metrics-grid">
      <MetricCard label="VENDAS DO MÊS" value={loading ? '—' : String(monthSales.length).padStart(2, '0')} detail="Vendas finalizadas" icon={ShoppingBag} tone="olive" trend="Concluídas" />
      <MetricCard label="FATURAMENTO DO MÊS" value={loading ? '—' : fmt(monthSales.reduce((sum, s) => sum + Number(s.valorTotal || 0), 0))} detail="Vendas pagas" icon={Banknote} tone="sand" trend="Este mês" />
      <MetricCard label="PEÇAS DISPONÍVEIS" value={loading ? '—' : String(unsold.length).padStart(2, '0')} detail="No seu catálogo" icon={Shirt} tone="peach" trend="Em estoque" />
      <MetricCard label="VENDAS EM ABERTO" value={loading ? '—' : String(data.vendas.filter((s) => s.status === 0).length).padStart(2, '0')} detail="Aguardando pagamento" icon={Clock3} tone="blue" trend="Em andamento" />
    </div>
    <div className="dashboard-grid">
      <section className="panel sales-panel"><div className="panel-heading"><div><div className="eyebrow">ACOMPANHAMENTO</div><h2>Movimento de vendas</h2><p>Vendas pagas nos últimos sete dias</p></div><button className="select-button" onClick={() => go('vendas')}>Esta semana <ChevronDown size={14} /></button></div><div className="chart-summary"><div><strong>{fmt(weekDays.reduce((sum, day) => sum + day.amount, 0))}</strong><span><span className="tiny-trend"><ArrowUpRight size={13} /></span> Recebido nesta semana</span></div><div className="chart-legend"><span /><span>Vendas pagas</span></div></div><div className="chart-area"><div className="chart-y"><span>{fmt(maxWeekAmount)}</span><span>{fmt(maxWeekAmount * .75)}</span><span>{fmt(maxWeekAmount * .5)}</span><span>{fmt(maxWeekAmount * .25)}</span><span>{fmt(0)}</span></div><div className="chart-plot"><div className="chart-gridlines"><i /><i /><i /><i /><i /></div><div className="chart-columns">{weekDays.map((day, index) => <div className="chart-column" key={`${day.label}-${index}`} title={`${day.label}: ${fmt(day.amount)}`}><div className="bar-pair"><span style={{ height: `${day.amount ? Math.max(5, (day.amount / maxWeekAmount) * 100) : 0}%` }} /></div><small>{day.label}</small></div>)}</div></div></div><div className="chart-caption"><span>Segunda a domingo</span><span><i className="caption-dot" /> Valores em reais</span></div></section>
      <section className="panel shortcuts-panel"><div className="panel-heading"><div><div className="eyebrow">ACESSO RÁPIDO</div><h2>O que você precisa?</h2><p>Atalhos para sua rotina</p></div><span className="decor-star">✳</span></div><div className="shortcut-list"><Shortcut icon={ShoppingCart} title="Registrar uma venda" description="Inicie um novo atendimento" onClick={() => activeEmployee ? setModal({ type: 'new-sale' }) : setModal({ type: 'login' })} /><Shortcut icon={Package} title="Adicionar produto" description="Cadastre uma nova peça" onClick={() => go('produtos')} /><Shortcut icon={Users} title="Ver clientes" description={`${data.clientes.length} ${data.clientes.length === 1 ? 'pessoa cadastrada' : 'pessoas cadastradas'}`} onClick={() => go('clientes')} /></div><button className="shortcut-footer" onClick={() => go('categorias')}>Organizar catálogo <ArrowRight size={15} /></button></section>
    </div>
    <section className="panel table-panel recent-panel"><div className="panel-heading table-head"><div><div className="eyebrow">ATIVIDADE RECENTE</div><h2>Últimas vendas</h2></div><button className="text-button" onClick={() => go('vendas')}>Ver todas <ArrowRight size={15} /></button></div>{recent.length ? <SalesTable sales={recent} onOpen={(sale) => setModal({ type: 'sale-detail', sale })} compact /> : <div className="empty-table"><span className="empty-icon"><ShoppingBag size={20} /></span><div><b>Nenhuma venda por aqui ainda</b><p>Assim que registrar uma venda, ela aparece neste espaço.</p></div></div>}</section>
  </>
}
function MetricCard({ label, value, detail, icon: Icon, tone, trend }) { return <article className="metric-card"><div className="metric-top"><span className={`metric-icon ${tone}`}><Icon size={18} strokeWidth={1.8} /></span><span className="metric-trend"><span className="metric-trend-dot" />{trend}</span></div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-detail">{detail}</div></article> }
function Shortcut({ icon: Icon, title, description, onClick }) { return <button className="shortcut" onClick={onClick}><span className="shortcut-icon"><Icon size={18} /></span><span className="shortcut-text"><b>{title}</b><small>{description}</small></span><ChevronRight className="shortcut-arrow" size={17} /></button> }

function ResourcePage({ resource, data, query, setQuery, setModal, notify, refresh, loading }) {
  const def = resourceDefs[resource]
  const records = data[resource] || []
  const filtered = records.filter((record) => !query || JSON.stringify(record).toLowerCase().includes(query.toLowerCase()))
  const [view, setView] = useState('table')
  const Icon = def.icon
  return <>
    <PageHeading eyebrow="GESTÃO DO BRECHÓ" title={<>{def.label}<em>.</em></>} description={`Gerencie ${def.label.toLowerCase()} e mantenha as informações do sistema atualizadas.`} action={<button className="button button-primary" onClick={() => setModal({ type: 'resource', resource })}><Plus size={17} /> Novo {def.singular}</button>} />
    <div className="resource-summary"><span className="resource-icon"><Icon size={19} /></span><div><b>{records.length} {records.length === 1 ? def.singular : def.label.toLowerCase()}</b><small>Registros cadastrados</small></div><span className="resource-summary-line" /><button className="text-button" onClick={refresh}><Activity size={15} /> Atualizar</button></div>
    <section className="panel table-panel resource-panel"><div className="resource-toolbar"><div className="search-field"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Buscar ${def.label.toLowerCase()}...`} /><kbd>⌘ K</kbd></div><div className="toolbar-actions"><button className="select-button" onClick={() => setView(view === 'table' ? 'grid' : 'table')}><SlidersHorizontal size={15} />{view === 'table' ? 'Lista' : 'Grade'}<ChevronDown size={14} /></button><button className="icon-button subtle-button" onClick={refresh} title="Atualizar"><Activity size={17} /></button></div></div>
      {loading ? <LoadingRows /> : filtered.length === 0 ? <EmptyState icon={Icon} title={query ? 'Nada encontrado' : `Ainda sem ${def.label.toLowerCase()}`} description={query ? 'Tente ajustar sua busca.' : 'Adicione seu primeiro registro para começar.'} action={!query && <button className="button button-primary button-small" onClick={() => setModal({ type: 'resource', resource })}><Plus size={15} /> Cadastrar {def.singular}</button>} /> : view === 'table' ? <div className="table-scroll"><table className="data-table"><thead><tr>{def.columns.map(([label]) => <th key={label}>{label}</th>)}<th className="action-col">AÇÕES</th></tr></thead><tbody>{filtered.map((item) => <tr key={item[def.id]}>{def.columns.map(([label, path, format]) => <td key={path}>{format === 'money' ? fmt(read(item, path)) : format === 'sold' ? <StatusBadge status={boolValue(item, path) ? 'sold' : 'available'} /> : format === 'active' ? <StatusBadge status={boolValue(item, path) ? 'active' : 'inactive'} /> : <span className={path === 'descProd' || path === 'nomePessoa' || path === 'nomeCat' || path === 'nomeMarca' ? 'cell-strong' : ''}>{read(item, path) || '—'}</span>}</td>)}<td className="action-cell"><button className="row-action" title="Editar" onClick={() => setModal({ type: 'resource', resource, record: item })}><Pencil size={15} /></button><button className="row-action danger-action" title="Excluir" onClick={() => setModal({ type: 'delete-resource', resource, record: item })}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div> : <div className="resource-card-grid">{filtered.map((item) => <ResourceCard key={item[def.id]} item={item} def={def} onEdit={() => setModal({ type: 'resource', resource, record: item })} onDelete={() => setModal({ type: 'delete-resource', resource, record: item })} />)}</div>}
      {!loading && filtered.length > 0 && <div className="table-footer"><span>Mostrando <b>{filtered.length}</b> de <b>{records.length}</b> registros</span><div className="table-pages"><button disabled><ArrowLeft size={14} /></button><span>1</span><button disabled><ArrowRight size={14} /></button></div></div>}
    </section>
  </>
}
function ResourceCard({ item, def, onEdit, onDelete }) { return <article className="resource-card"><div className="resource-card-icon"><def.icon size={17} /></div><h3>{def.title(item)}</h3><p>{def.columns.slice(1, 3).map(([, key]) => read(item, key)).filter(Boolean).join(' · ') || def.label}</p><div className="resource-card-foot"><span>#{item[def.id]}</span><div><button className="row-action" onClick={onEdit}><Pencil size={15} /></button><button className="row-action danger-action" onClick={onDelete}><Trash2 size={15} /></button></div></div></article> }

function DeleteResourceModal({ resource, record, onClose, notify, refresh }) {
  const def = resourceDefs[resource]
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const remove = async () => { setBusy(true); setError(''); try { await request(`${def.route}/${encodeURIComponent(record[def.id])}`, { method: 'DELETE' }); await refresh(); notify(`${def.singular[0].toUpperCase()}${def.singular.slice(1)} removido com sucesso.`); onClose() } catch (err) { setError(err.message) } finally { setBusy(false) } }
  return <Modal title={`Remover ${def.singular}?`} subtitle="Esta ação não pode ser desfeita." onClose={onClose}><div className="delete-body"><span className="delete-warning"><Trash2 size={20} /></span><p>Tem certeza de que deseja remover <b>{def.title(record)}</b>? Os dados vinculados podem impedir a exclusão.</p>{error && <div className="form-error"><CircleHelp size={16} />{error}</div>}<div className="modal-actions"><button className="button button-ghost" onClick={onClose}>Manter registro</button><button className="button button-danger" disabled={busy} onClick={remove}>{busy ? 'Removendo…' : 'Remover registro'}</button></div></div></Modal>
}

function ResourceModal({ resource, record, data, onClose, notify, refresh }) {
  const def = resourceDefs[resource]
  const [form, setForm] = useState(() => Object.fromEntries(def.fields.map((field) => {
    let value = record ? record[field.name] : field.createDefault ?? (field.type === 'checkbox' ? false : '')
    if (field.type === 'ref') value = record?.[field.name]?.[field.id] ?? ''
    return [field.name, field.name === 'activeMetodoPag' ? (record?.isActiveMetodoPag ?? record?.activeMetodoPag ?? true) : value]
  })))
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState('')
  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }))
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setLocalError('')
    const body = { ...form }
    for (const field of def.fields) {
      if (field.type === 'ref') body[field.name] = body[field.name] ? { [field.id]: field.name === 'endPessoa' ? Number(body[field.name]) : (field.id.startsWith('cod') ? Number(body[field.name]) : body[field.name]) } : null
      if (field.type === 'number') body[field.name] = Number(body[field.name] || 0)
    }
    try {
      const id = record?.[def.id]
      await request(id ? `${def.route}/${encodeURIComponent(id)}` : def.route, json(id ? 'PUT' : 'POST', body))
      notify(`${def.singular[0].toUpperCase()}${def.singular.slice(1)} ${id ? 'atualizado' : 'cadastrado'} com sucesso.`)
      await refresh(); onClose()
    } catch (err) { setLocalError(err.message) }
    finally { setBusy(false) }
  }
  return <Modal title={`${record ? 'Editar' : 'Novo'} ${def.singular}`} subtitle="Preencha os campos abaixo. As informações serão salvas diretamente no sistema." onClose={onClose}>
    <form className="form-body" onSubmit={submit}><div className="form-grid">{def.fields.filter((field) => !(record && field.createOnly)).map((field) => <label className={`form-field ${field.type === 'checkbox' ? 'checkbox-field' : ''}`} key={field.name}><span>{field.label}{field.required && <i>*</i>}</span>{field.type === 'ref' ? <select required={!field.optional} value={form[field.name] || ''} onChange={(e) => set(field.name, e.target.value)}><option value="">{field.optional ? 'Nenhum endereço' : `Selecione ${field.label.toLowerCase()}`}</option>{(data[field.resource] || []).map((item) => <option key={item[field.id]} value={item[field.id]}>{item[field.text]}{field.resource === 'enderecos' ? ` · ${item.cidade}/${item.uf}` : ''}</option>)}</select> : field.type === 'select' ? <select required value={form[field.name] || ''} onChange={(e) => set(field.name, e.target.value)}><option value="">Selecione</option>{[...new Set(field.options)].map((option, index) => <option value={option} key={`${option}-${index}`}>{option}</option>)}</select> : field.type === 'checkbox' ? <input type="checkbox" checked={Boolean(form[field.name])} onChange={(e) => set(field.name, e.target.checked)} /> : <input type={field.type || 'text'} required={field.required && !(record && field.name === 'senha')} maxLength={field.maxLength} step={field.step} min={field.type === 'number' ? 0 : undefined} placeholder={record && field.name === 'senha' ? '••••••••' : field.type === 'number' ? '0,00' : `Informe ${field.label.toLowerCase()}`} value={form[field.name] ?? ''} onChange={(e) => set(field.name, e.target.value)} />}{record && field.editHint && <small className="field-hint">{field.editHint}</small>}</label>)}</div>{localError && <div className="form-error"><CircleHelp size={16} />{localError}</div>}<div className="modal-actions"><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={busy}>{busy ? <span className="spinner" /> : <Check size={16} />}{busy ? 'Salvando…' : 'Salvar registro'}</button></div></form>
  </Modal>
}

function LoginModal({ data, onClose, onLogin, notify }) {
  const [mode, setMode] = useState(data.funcionarios.length === 0 ? 'signup' : 'login')
  const [cpf, setCpf] = useState(''); const [nome, setNome] = useState(''); const [telefone, setTelefone] = useState(''); const [salario, setSalario] = useState(''); const [senha, setSenha] = useState(''); const [confirmarSenha, setConfirmarSenha] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const switchMode = () => { setError(''); setMode((current) => current === 'login' ? 'signup' : 'login') }
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('')
    const normalizedCpf = cpf.replace(/\D/g, '')
    try {
      if (mode === 'signup') {
        if (senha !== confirmarSenha) throw new Error('As senhas não coincidem.')
        await request('/funcionarios', json('POST', { cpfPessoa: normalizedCpf, nomePessoa: nome.trim(), telPessoa: telefone, salarioFunc: Number(salario), senha, endPessoa: null }))
        try {
          const user = await request('/auth/login', json('POST', { cpf: normalizedCpf, senha }))
          onLogin(user); notify(`Conta criada. Bem-vindo(a), ${user.nomePessoa.split(' ')[0]}!`); onClose()
        } catch (loginError) {
          setMode('login'); setError(`Conta criada, mas não foi possível entrar automaticamente: ${loginError.message}`)
        }
      } else {
        const user = await request('/auth/login', json('POST', { cpf: normalizedCpf, senha }))
        onLogin(user); notify(`Bem-vindo(a), ${user.nomePessoa.split(' ')[0]}!`); onClose()
      }
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  const signingUp = mode === 'signup'
  return <Modal title={signingUp ? 'Crie seu acesso ao SIB.' : 'Que bom ter você por aqui.'} subtitle={signingUp ? 'Cadastre seu perfil de funcionário para começar a usar o sistema.' : 'Entre com seu cadastro de funcionário para começar uma venda.'} onClose={onClose}>
    <form className="form-body" onSubmit={submit}>
      {signingUp && <label className="form-field"><span>Nome completo <i>*</i></span><input required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como podemos chamar você?" autoFocus /></label>}
      <label className="form-field"><span>CPF <i>*</i></span><input required inputMode="numeric" maxLength={14} value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" autoFocus={!signingUp} /></label>
      {signingUp && <div className="signup-fields"><label className="form-field"><span>Telefone</span><input inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" /></label><label className="form-field"><span>Salário mensal <i>*</i></span><input required type="number" min="0" step="0.01" value={salario} onChange={(e) => setSalario(e.target.value)} placeholder="0,00" /></label></div>}
      <label className="form-field"><span>Senha <i>*</i></span><input required type="password" minLength={signingUp ? 3 : undefined} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder={signingUp ? 'Crie uma senha' : 'Sua senha'} /></label>
      {signingUp && <label className="form-field"><span>Confirme a senha <i>*</i></span><input required type="password" minLength={3} value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} placeholder="Digite a senha novamente" /></label>}
      {error && <div className="form-error"><CircleHelp size={16} />{error}</div>}
      <div className="login-info"><BadgeCheck size={17} /><span>{signingUp ? 'Seu cadastro será salvo no banco de dados do SIB v2.' : 'Seu acesso é validado pela API do SIB v2.'}</span></div>
      <div className="modal-actions"><button type="button" className="button button-ghost" onClick={onClose}>Agora não</button><button className="button button-primary" disabled={busy}>{busy ? <span className="spinner" /> : signingUp ? <UserRound size={16} /> : <LogIn size={16} />}{busy ? signingUp ? 'Criando conta…' : 'Validando…' : signingUp ? 'Criar conta' : 'Entrar no sistema'}</button></div>
      <div className="login-switch">{signingUp ? 'Já tem uma conta?' : 'Ainda não tem cadastro?'} <button type="button" onClick={switchMode}>{signingUp ? 'Fazer login' : 'Criar conta'}</button></div>
    </form>
  </Modal>
}

function NewSaleModal({ data, employee, onClose, notify, refresh, openSale, request }) {
  const [clientCpf, setClientCpf] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const submit = async (event) => { event.preventDefault(); if (!employee) { setError('Entre como funcionário para registrar uma venda.'); return } setBusy(true); setError(''); try { const sale = await request('/vendas', json('POST', { clienteCpf: clientCpf, funcionarioCpf: employee.cpfPessoa })); await refresh(); notify('Venda iniciada. Adicione as peças ao carrinho.'); openSale(sale) } catch (err) { setError(err.message) } finally { setBusy(false) } }
  return <Modal title="Iniciar venda" subtitle="Escolha o cliente para abrir um novo atendimento." onClose={onClose}><form className="form-body" onSubmit={submit}><div className="selected-employee"><span className="avatar">{initials(employee?.nomePessoa)}</span><div><small>ATENDIMENTO POR</small><b>{employee?.nomePessoa || 'Nenhum funcionário conectado'}</b></div><button type="button" className="text-button" onClick={onClose}>Alterar</button></div><label className="form-field"><span>Cliente <i>*</i></span><select required value={clientCpf} onChange={(e) => setClientCpf(e.target.value)}><option value="">Selecione o cliente</option>{data.clientes.map((client) => <option value={client.cpfPessoa} key={client.cpfPessoa}>{client.nomePessoa} · {client.cpfPessoa}</option>)}</select></label>{data.clientes.length === 0 && <div className="inline-hint">Cadastre um cliente primeiro em <b>Clientes</b>.</div>}{error && <div className="form-error"><CircleHelp size={16} />{error}</div>}<div className="modal-actions"><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={busy || data.clientes.length === 0 || !employee}>{busy ? <span className="spinner" /> : <ArrowRight size={16} />}{busy ? 'Iniciando…' : 'Continuar para venda'}</button></div></form></Modal>
}

function SaleDetailModal({ sale: initialSale, data, onClose, notify, refresh, request }) {
  const [sale, setSale] = useState(initialSale); const [selected, setSelected] = useState([]); const [payRows, setPayRows] = useState([{ method: '', amount: '' }]); const [action, setAction] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  const paid = sale.status === 1; const cancelled = sale.status === 2; const open = sale.status === 0
  const linkedIds = new Set((sale.produtos || []).map((p) => p.codProd))
  const available = data.produtos.filter((p) => !boolValue(p, 'selled') && !linkedIds.has(p.codProd))
  const enabledMethods = data.metodos.filter((m) => m.activeMetodoPag ?? m.isActiveMetodoPag)
  const reload = async () => { const current = await request(`/vendas/${sale.codVenda}`); setSale(current); await refresh() }
  const withBusy = async (fn, success) => { setBusy(true); setError(''); try { await fn(); await reload(); setAction(''); setSelected([]); setPayRows([{ method: '', amount: '' }]); notify(success) } catch (err) { setError(err.message) } finally { setBusy(false) } }
  const addItems = () => withBusy(() => request(`/vendas/${sale.codVenda}/produtos`, json('POST', { codigos: selected })), 'Peças adicionadas à venda.')
  const pay = () => withBusy(() => request(`/vendas/${sale.codVenda}/pagamentos`, json('POST', payRows.map((row) => ({ metodoPagamentoId: Number(row.method), valorPago: Number(String(row.amount).replace(',', '.')) })))), 'Pagamento concluído. Venda finalizada!')
  const cancel = () => withBusy(() => request(`/vendas/${sale.codVenda}/cancelamento`, { method: 'POST' }), 'Venda cancelada.')
  const setRow = (index, key, value) => setPayRows((rows) => rows.map((row, i) => i === index ? { ...row, [key]: value } : row))
  const paymentSum = payRows.reduce((total, row) => total + Number(String(row.amount || 0).replace(',', '.')), 0)
  return <Modal title={`Venda #${String(sale.codVenda).padStart(4, '0')}`} subtitle={`Aberta em ${sale.dataVenda || '—'} · ${sale.clienteVenda?.nomePessoa || 'Cliente'}`} onClose={onClose} wide><div className="sale-detail"><div className="sale-detail-top"><div className="sale-detail-info"><span className="eyebrow">ATENDIMENTO</span><b>{sale.funcVenda?.nomePessoa || 'Funcionário'}</b><small>Cliente · {sale.clienteVenda?.nomePessoa || '—'}</small></div><StatusBadge status={sale.status === 0 ? 'pending' : sale.status === 1 ? 'paid' : 'cancelled'} /></div>
    <div className="sale-detail-total"><div><small>VALOR DA VENDA</small><strong>{fmt(sale.valorTotal)}</strong></div><div className="sale-count"><ShoppingBag size={17} /> {(sale.produtos || []).length} {(sale.produtos || []).length === 1 ? 'peça' : 'peças'}</div></div>
    <div className="sale-products"><div className="sale-section-head"><b>Peças no carrinho</b>{open && action !== 'items' && <button className="text-button" onClick={() => { setAction('items'); setError('') }}><Plus size={15} /> Adicionar peças</button>}</div>{sale.produtos?.length ? sale.produtos.map((p) => <div className="sale-product-row" key={p.codProd}><span className="sale-product-thumb"><Shirt size={17} /></span><div className="sale-product-name"><b>{p.descProd}</b><small>{p.marcaProd?.nomeMarca || '—'} · {p.tamanhoProd || '—'}</small></div><strong>{fmt(p.precoProd)}</strong></div>) : <p className="sale-empty-line">Nenhuma peça adicionada ainda.</p>}
      {action === 'items' && <div className="inline-action-panel"><div className="inline-panel-head"><div><b>Adicionar peças</b><small>Selecione produtos disponíveis no estoque.</small></div><button className="icon-button" onClick={() => setAction('')}><X size={17} /></button></div>{available.length ? <div className="product-picker">{available.map((p) => <label className={`picker-item ${selected.includes(p.codProd) ? 'selected' : ''}`} key={p.codProd}><input type="checkbox" checked={selected.includes(p.codProd)} onChange={() => setSelected((ids) => ids.includes(p.codProd) ? ids.filter((id) => id !== p.codProd) : [...ids, p.codProd])} /><span className="picker-thumb"><Shirt size={16} /></span><span className="picker-text"><b>{p.descProd}</b><small>{p.marcaProd?.nomeMarca} · {p.tamanhoProd}</small></span><strong>{fmt(p.precoProd)}</strong></label>)}</div> : <div className="inline-hint">Não há peças disponíveis para adicionar.</div>}<div className="inline-actions"><span>{selected.length} selecionadas</span><button className="button button-primary button-small" disabled={!selected.length || busy} onClick={addItems}>{busy ? 'Salvando…' : 'Adicionar ao carrinho'}</button></div></div>}
    </div>
    {paid && <div className="sale-products payment-list"><div className="sale-section-head"><b>Formas de pagamento</b><BadgeCheck size={17} className="paid-check" /></div>{sale.pagamentos?.map((p, index) => <div className="payment-row" key={p.codVendaPagamento || index}><span>{p.metodoPagamento?.descMetodoPag || 'Método'}</span><b>{fmt(p.valorPago)}</b></div>)}</div>}
    {action === 'pay' && <div className="inline-action-panel"><div className="inline-panel-head"><div><b>Receber pagamento</b><small>Saldo de {fmt(Math.max(0, Number(sale.valorTotal) - paymentSum))} · você pode dividir entre métodos.</small></div><button className="icon-button" onClick={() => setAction('')}><X size={17} /></button></div>{payRows.map((row, index) => <div className="pay-row-form" key={index}><label className="form-field"><span>Método</span><select required value={row.method} onChange={(e) => setRow(index, 'method', e.target.value)}><option value="">Selecione</option>{enabledMethods.map((method) => <option key={method.codMetodoPag} value={method.codMetodoPag}>{method.descMetodoPag}</option>)}</select></label><label className="form-field"><span>Valor (R$)</span><input required type="number" min="0.01" step="0.01" value={row.amount} onChange={(e) => setRow(index, 'amount', e.target.value)} placeholder="0,00" /></label>{payRows.length > 1 && <button className="row-action danger-action remove-pay-row" onClick={() => setPayRows((rows) => rows.filter((_, i) => i !== index))}><X size={15} /></button>}</div>)}<div className="inline-actions pay-actions"><button className="text-button" onClick={() => setPayRows((rows) => [...rows, { method: '', amount: '' }])}><Plus size={14} /> Outra forma</button><span>Total informado <b>{fmt(paymentSum)}</b></span><button className="button button-primary button-small" disabled={busy || paymentSum < Number(sale.valorTotal) || !payRows.every((r) => r.method)} onClick={pay}>{busy ? 'Processando…' : 'Confirmar pagamento'}</button></div></div>}
    {action === 'cancel' && <div className="cancel-confirm"><span><CircleHelp size={18} /></span><div><b>Cancelar esta venda?</b><small>A venda será marcada como cancelada. Os produtos adicionados continuarão marcados como vendidos, conforme a regra atual do SIB.</small></div><button className="button button-danger button-small" disabled={busy} onClick={cancel}>{busy ? 'Cancelando…' : 'Confirmar cancelamento'}</button><button className="icon-button" onClick={() => setAction('')} aria-label="Voltar"><X size={16} /></button></div>}
    {error && <div className="form-error"><CircleHelp size={16} />{error}</div>}
    {open && !action && <div className="sale-detail-actions"><button className="button button-outline button-danger-outline" onClick={() => setAction('cancel')}>Cancelar venda</button>{sale.produtos?.length > 0 && <button className="button button-primary" onClick={() => setAction('pay')}><CreditCard size={16} /> Receber pagamento</button>}</div>}
  </div></Modal>
}

function SalesPage({ data, query, setQuery, statusFilter, setStatusFilter, setModal, notify, refresh, activeEmployee }) {
  const filtered = data.vendas.filter((sale) => (statusFilter === 'all' || sale.status === Number(statusFilter)) && (!query || `${sale.clienteVenda?.nomePessoa} ${sale.funcVenda?.nomePessoa} ${sale.dataVenda} ${sale.valorTotal} ${sale.status}`.toLowerCase().includes(query.toLowerCase())))
  return <><PageHeading eyebrow="ATENDIMENTOS E CAIXA" title={<>Vendas<em>.</em></>} description="Acompanhe cada atendimento, peça por peça, até o pagamento." action={<button className="button button-primary" onClick={() => activeEmployee ? setModal({ type: 'new-sale' }) : setModal({ type: 'login' })}><Plus size={17} /> Iniciar venda</button>} /><div className="sales-stats"><button className={`sales-stat ${statusFilter === 'all' ? 'selected' : ''}`} onClick={() => setStatusFilter('all')}><span>Todas</span><b>{data.vendas.length}</b></button><button className={`sales-stat ${statusFilter === '0' ? 'selected' : ''}`} onClick={() => setStatusFilter('0')}><span>Em aberto</span><b>{data.vendas.filter((s) => s.status === 0).length}</b></button><button className={`sales-stat ${statusFilter === '1' ? 'selected' : ''}`} onClick={() => setStatusFilter('1')}><span>Pagas</span><b>{data.vendas.filter((s) => s.status === 1).length}</b></button><button className={`sales-stat ${statusFilter === '2' ? 'selected' : ''}`} onClick={() => setStatusFilter('2')}><span>Canceladas</span><b>{data.vendas.filter((s) => s.status === 2).length}</b></button><div className="sales-total"><small>TOTAL RECEBIDO</small><b>{fmt(data.vendas.filter((s) => s.status === 1).reduce((total, s) => total + Number(s.valorTotal || 0), 0))}</b></div></div>
    <section className="panel table-panel sales-table-panel"><div className="resource-toolbar"><div className="search-field"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente, funcionário, data..." /></div><button className="select-button" onClick={refresh}><Activity size={15} /> Atualizar</button></div>{filtered.length ? <SalesTable sales={[...filtered].sort((a, b) => b.codVenda - a.codVenda)} onOpen={(sale) => setModal({ type: 'sale-detail', sale })} /> : <EmptyState icon={ShoppingBag} title={query ? 'Nenhuma venda encontrada' : 'Nenhuma venda neste filtro'} description={query ? 'Tente buscar pelo nome do cliente ou número da venda.' : 'Inicie um novo atendimento para registrar a primeira venda.'} action={statusFilter === 'all' && <button className="button button-primary button-small" onClick={() => activeEmployee ? setModal({ type: 'new-sale' }) : setModal({ type: 'login' })}><Plus size={15} /> Iniciar venda</button>} />}</section>
  </>
}
function SalesTable({ sales, onOpen, compact = false }) { return <div className="table-scroll"><table className="data-table"><thead><tr><th>VENDA</th><th>CLIENTE</th><th>DATA</th>{!compact && <th>FUNCIONÁRIO</th>}<th>VALOR</th><th>STATUS</th><th className="action-col">DETALHES</th></tr></thead><tbody>{sales.map((sale) => <tr key={sale.codVenda} onClick={() => onOpen(sale)} className="clickable-row"><td><span className="sale-number">#{String(sale.codVenda).padStart(4, '0')}</span></td><td><div className="customer-cell"><span className="customer-avatar">{initials(sale.clienteVenda?.nomePessoa)}</span><span className="cell-strong">{sale.clienteVenda?.nomePessoa || 'Cliente'}</span></div></td><td>{sale.dataVenda || '—'}</td>{!compact && <td>{sale.funcVenda?.nomePessoa || '—'}</td>}<td className="cell-strong">{fmt(sale.valorTotal)}</td><td><StatusBadge status={sale.status === 0 ? 'pending' : sale.status === 1 ? 'paid' : 'cancelled'} /></td><td className="action-cell"><button className="row-action" title="Ver detalhes" onClick={(e) => { e.stopPropagation(); onOpen(sale) }}><Eye size={15} /></button></td></tr>)}</tbody></table></div> }
function StatusBadge({ status }) { const labels = { pending: 'Em aberto', paid: 'Paga', cancelled: 'Cancelada', sold: 'Vendido', available: 'Disponível', active: 'Ativo', inactive: 'Inativo' }; return <span className={`status-badge status-${status}`}><i />{labels[status] || status}</span> }
function EmptyState({ icon: Icon, title, description, action }) { return <div className="empty-state"><span className="empty-state-icon"><Icon size={22} /></span><h3>{title}</h3><p>{description}</p>{action}</div> }
function LoadingRows() { return <div className="loading-rows">{[0,1,2,3].map((n) => <div className="skeleton-row" key={n}><i /><i /><i /><i /></div>)}</div> }

export default App

