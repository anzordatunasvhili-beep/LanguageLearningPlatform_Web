import { useEffect, useId, useRef } from 'react';

export function Icon({ name, className = '', ...props }) {
  return (
    <span className={`material-symbols-rounded ${className}`} aria-hidden="true" {...props}>
      {name}
    </span>
  );
}
export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  children,
  ...props
}) {
  return (
    <button type={type} className={`button button-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function Card({ children, className = '', ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}
export function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function ProgressBar({ value = 0, max = 100, label = 'Progress' }) {
  const percent = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(Math.max(value, 0), max)}
    >
      <span style={{ width: `${percent}%` }} />
    </div>
  );
}
export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}
export function EmptyState({ icon = 'explore', title, description }) {
  return (
    <div className="empty-state">
      <Icon name={icon} />
      <h2>{title}</h2>
      <p className="muted">{description}</p>
    </div>
  );
}
export function Skeleton() {
  return (
    <div className="page-stack" role="status" aria-label="Loading page">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-panel" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
export function Modal({ open, onClose, title, children }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="modal"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <header>
        <h2 id={titleId}>{title}</h2>
        <Button variant="ghost" aria-label="Close dialog" onClick={onClose}>
          <Icon name="close" />
        </Button>
      </header>
      {children}
    </dialog>
  );
}
