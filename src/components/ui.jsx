import { useEffect } from 'react'
import { CheckCircle2, CircleHelp, X } from 'lucide-react'

export function Toast({ toast, clear }) {
  if (!toast) return null
  return <div className={`toast ${toast.type}`} role="status"><span className="toast-icon">{toast.type === 'error' ? <CircleHelp size={18} /> : <CheckCircle2 size={18} />}</span>{toast.message}<button onClick={clear} aria-label="Fechar"><X size={16} /></button></div>
}

export function Modal({ title, subtitle, onClose, children, wide = false, nested = false }) {
  useEffect(() => {
    const fn = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])
  return <div className={`modal-backdrop ${nested ? 'nested' : ''}`} onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true"><header className="modal-head"><div><div className="eyebrow">SIB · SISTEMA INTEGRADO DE BRECHÓ</div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={20} /></button></header>{children}</section></div>
}

export function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

export function FormField({ label, required, hint, children, className = '' }) {
  return <label className={`form-field ${className}`}><span>{label}{required && <i>*</i>}</span>{children}{hint && <small className="field-hint">{hint}</small>}</label>
}

export function FieldInput({ label, required, hint, className = '', ...props }) {
  return <FormField label={label} required={required} hint={hint} className={className}><input required={required} {...props} /></FormField>
}

export function FieldSelect({ label, required, hint, children, className = '', ...props }) {
  return <FormField label={label} required={required} hint={hint} className={className}><select required={required} {...props}>{children}</select></FormField>
}

export function FormError({ children }) {
  if (!children) return null
  return <div className="form-error"><CircleHelp size={16} />{children}</div>
}

export function StatusBadge({ status }) {
  const labels = { pending: 'Em aberto', paid: 'Paga', cancelled: 'Cancelada', sold: 'Vendido', available: 'Disponível', active: 'Ativo', inactive: 'Inativo' }
  return <span className={`status-badge status-${status}`}><i />{labels[status] || status}</span>
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return <div className="empty-state"><span className="empty-state-icon"><Icon size={22} /></span><h3>{title}</h3><p>{description}</p>{action}</div>
}

export function LoadingRows() {
  return <div className="loading-rows">{[0,1,2,3].map((n) => <div className="skeleton-row" key={n}><i /><i /><i /><i /></div>)}</div>
}

