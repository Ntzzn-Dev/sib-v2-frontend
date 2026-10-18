import { useState } from 'react'
import { Activity, ArrowLeft, ArrowRight, Check, CircleHelp, Plus, Search, SlidersHorizontal, Trash2, Pencil } from 'lucide-react'
import { request, jsonRequest } from '../../api/client'
import { resourceDefs } from '../../config/resources'
import { boolValue, fmt, read } from '../../lib/format'
import { EmptyState, FieldInput, FieldSelect, FormError, FormField, LoadingRows, Modal, PageHeading, StatusBadge } from '../../components/ui'

export default function ResourcePage({ resource, data, query, setQuery, setModal, notify, refresh, loading }) {
  const def = resourceDefs[resource]
  const records = data[resource] || []
  const filtered = records.filter((record) => !query || JSON.stringify(record).toLowerCase().includes(query.toLowerCase()))
  const [view, setView] = useState('table')
  const Icon = def.icon
  return <>
    <PageHeading eyebrow="GESTÃO DO BRECHÓ" title={<>{def.label}<em>.</em></>} description={`Gerencie ${def.label.toLowerCase()} e mantenha as informações do sistema atualizadas.`} action={<button className="button button-primary" onClick={() => setModal({ type: 'resource', resource })}><Plus size={19} /> Novo {def.singular}</button>} />
    <div className="resource-summary"><span className="resource-icon"><Icon size={21} /></span><div><b>{records.length} {records.length === 1 ? def.singular : def.label.toLowerCase()}</b><small>Registros cadastrados</small></div><span className="resource-summary-line" /><button className="text-button" onClick={refresh}><Activity size={18} /> Atualizar</button></div>
    <section className="panel table-panel resource-panel"><div className="resource-toolbar"><div className="search-field"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar ${def.label.toLowerCase()}...`} /><kbd>⌘ K</kbd></div><div className="toolbar-actions"><button className="select-button" onClick={() => setView(view === 'table' ? 'grid' : 'table')}><SlidersHorizontal size={17} />{view === 'table' ? 'Lista' : 'Grade'}</button><button className="icon-button subtle-button" onClick={refresh} title="Atualizar"><Activity size={19} /></button></div></div>
      {loading ? <LoadingRows /> : filtered.length === 0 ? <EmptyState icon={Icon} title={query ? 'Nada encontrado' : `Ainda sem ${def.label.toLowerCase()}`} description={query ? 'Tente ajustar sua busca.' : 'Adicione seu primeiro registro para começar.'} action={!query && <button className="button button-primary button-small" onClick={() => setModal({ type: 'resource', resource })}><Plus size={17} /> Cadastrar {def.singular}</button>} /> : view === 'table' ? <div className="table-scroll"><table className="data-table"><thead><tr>{def.columns.map(([label]) => <th key={label}>{label}</th>)}<th className="action-col">AÇÕES</th></tr></thead><tbody>{filtered.map((item) => <tr key={item[def.id]}>{def.columns.map(([, path, format]) => <td key={path}>{format === 'money' ? fmt(read(item, path)) : format === 'sold' ? <StatusBadge status={boolValue(item, path) ? 'sold' : 'available'} /> : format === 'active' ? <StatusBadge status={boolValue(item, path) ? 'active' : 'inactive'} /> : <span className={['descProd','nomePessoa','nomeCat','nomeMarca'].includes(path) ? 'cell-strong' : ''}>{read(item, path) || '—'}</span>}</td>)}<td className="action-cell"><button className="row-action" title="Editar" onClick={() => setModal({ type: 'resource', resource, record: item })}><Pencil size={18} /></button><button className="row-action danger-action" title="Excluir" onClick={() => setModal({ type: 'delete-resource', resource, record: item })}><Trash2 size={18} /></button></td></tr>)}</tbody></table></div> : <div className="resource-card-grid">{filtered.map((item) => <ResourceCard key={item[def.id]} item={item} def={def} onEdit={() => setModal({ type: 'resource', resource, record: item })} onDelete={() => setModal({ type: 'delete-resource', resource, record: item })} />)}</div>}
      {!loading && filtered.length > 0 && <div className="table-footer"><span>Mostrando <b>{filtered.length}</b> de <b>{records.length}</b> registros</span><div className="table-pages"><button disabled><ArrowLeft size={17} /></button><span>1</span><button disabled><ArrowRight size={17} /></button></div></div>}
    </section>
  </>
}

function ResourceCard({ item, def, onEdit, onDelete }) {
  const Icon = def.icon
  return <article className="resource-card"><div className="resource-card-icon"><Icon size={19} /></div><h3>{def.title(item)}</h3><p>{def.columns.slice(1, 3).map(([, key]) => read(item, key)).filter(Boolean).join(' · ') || def.label}</p><div className="resource-card-foot"><span>#{item[def.id]}</span><div><button className="row-action" onClick={onEdit}><Pencil size={17} /></button><button className="row-action danger-action" onClick={onDelete}><Trash2 size={17} /></button></div></div></article>
}

export function DeleteResourceModal({ resource, record, onClose, notify, refresh }) {
  const def = resourceDefs[resource]
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const remove = async () => {
    setBusy(true); setError('')
    try {
      await request(`${def.route}/${encodeURIComponent(record[def.id])}`, { method: 'DELETE' })
      await refresh(); notify(`${def.singular[0].toUpperCase()}${def.singular.slice(1)} removido com sucesso.`); onClose()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <Modal title={`Remover ${def.singular}?`} subtitle="Esta ação não pode ser desfeita." onClose={onClose}><div className="delete-body"><span className="delete-warning"><Trash2 size={23} /></span><p>Tem certeza de que deseja remover <b>{def.title(record)}</b>? Os dados vinculados podem impedir a exclusão.</p><FormError>{error}</FormError><div className="modal-actions"><button className="button button-ghost" onClick={onClose}>Manter registro</button><button className="button button-danger" disabled={busy} onClick={remove}>{busy ? 'Removendo…' : 'Remover registro'}</button></div></div></Modal>
}

export function ResourceModal({ resource, record, data, onClose, notify, refresh, onCreated, nested = false }) {
  const def = resourceDefs[resource]
  const [form, setForm] = useState(() => Object.fromEntries(def.fields.map((field) => {
    const value = record ? record[field.name] : field.createDefault ?? (field.type === 'checkbox' ? false : '')
    return [field.name, field.type === 'ref' ? record?.[field.name]?.[field.id] ?? '' : field.name === 'activeMetodoPag' ? (record?.activeMetodoPag ?? record?.isActiveMetodoPag ?? true) : value]
  })))
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState('')
  const [inlineResource, setInlineResource] = useState(null)
  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }))

  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setLocalError('')
    const body = { ...form }
    for (const field of def.fields) {
      if (field.type === 'ref') body[field.name] = body[field.name] ? { [field.id]: field.id.startsWith('cod') ? Number(body[field.name]) : body[field.name] } : null
      if (field.type === 'number') body[field.name] = Number(body[field.name] || 0)
    }
    try {
      const id = record?.[def.id]
      const saved = await request(id ? `${def.route}/${encodeURIComponent(id)}` : def.route, jsonRequest(id ? 'PUT' : 'POST', body))
      if (!id) onCreated?.(saved)
      notify(`${def.singular[0].toUpperCase()}${def.singular.slice(1)} ${id ? 'atualizado' : 'cadastrado'} com sucesso.`)
      await refresh(); onClose()
    } catch (err) { setLocalError(err.message) } finally { setBusy(false) }
  }

  return <>
    <Modal title={`${record ? 'Editar' : 'Novo'} ${def.singular}`} subtitle="Preencha os campos abaixo. As informações serão salvas diretamente no sistema." onClose={onClose} nested={nested}>
      <form className="form-body" onSubmit={submit}>
        <div className="form-grid">{def.fields.filter((field) => !(record && field.createOnly)).map((field) => <ResourceField key={field.name} field={field} record={record} data={data} value={form[field.name]} onChange={(value) => set(field.name, value)} onCreateReference={(target) => setInlineResource(target)} />)}</div>
        <FormError>{localError}</FormError>
        <div className="modal-actions"><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={busy}>{busy ? <span className="spinner" /> : <Check size={19} />}{busy ? 'Salvando…' : 'Salvar registro'}</button></div>
      </form>
    </Modal>
    {inlineResource && <ResourceModal key={inlineResource} resource={inlineResource} data={data} nested onClose={() => setInlineResource(null)} notify={notify} refresh={refresh} onCreated={(item) => {
      const targetField = def.fields.find((field) => field.resource === inlineResource)
      if (targetField) set(targetField.name, item[targetField.id])
    }} />}
  </>
}

function ResourceField({ field, record, data, value, onChange, onCreateReference }) {
  if (field.type === 'ref') {
    const target = resourceDefs[field.resource]
    return <div className="form-field reference-field"><span>{field.label}{field.required && <i>*</i>}</span><div className="reference-control"><select required={!field.optional} value={value || ''} onChange={(event) => onChange(event.target.value)} aria-label={field.label}><option value="">{field.optional ? 'Nenhum endereço' : `Selecione ${field.label.toLowerCase()}`}</option>{(data[field.resource] || []).map((item) => <option key={item[field.id]} value={item[field.id]}>{item[field.text]}{field.resource === 'enderecos' ? ` · ${item.cidade}/${item.uf}` : ''}</option>)}</select><button type="button" className="button button-outline button-small reference-create" onClick={() => onCreateReference(field.resource)} title={`Cadastrar ${target.singular}`}><Plus size={18} /><span>Novo</span></button></div></div>
  }
  if (field.type === 'select') return <FieldSelect label={field.label} required={field.required} value={value || ''} onChange={(event) => onChange(event.target.value)}><option value="">Selecione</option>{[...new Set(field.options)].map((option, index) => <option value={option} key={`${option}-${index}`}>{option}</option>)}</FieldSelect>
  if (field.type === 'checkbox') return <FormField label={field.label} className="checkbox-field"><input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} /></FormField>
  return <FieldInput label={field.label} required={field.required && !(record && field.name === 'senha')} type={field.type || 'text'} maxLength={field.maxLength} step={field.step} min={field.type === 'number' ? 0 : undefined} placeholder={record && field.name === 'senha' ? '••••••••' : field.type === 'number' ? '0,00' : `Informe ${field.label.toLowerCase()}`} value={value ?? ''} onChange={(event) => onChange(event.target.value)} hint={record ? field.editHint : undefined} />
}
