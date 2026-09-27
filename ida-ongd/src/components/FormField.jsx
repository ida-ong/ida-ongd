export default function FormField({ label, name, error, as: Element = 'input', children, ...props }) {
  const errorId = `${name}-error`
  return <div className={`form-field${error ? ' form-field-error' : ''}`}>
    <label htmlFor={name}>{label}</label>
    <Element id={name} name={name} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} {...props}>{children}</Element>
    {error && <span id={errorId} className="field-error">{error}</span>}
  </div>
}