import { Link } from 'react-router-dom'

export default function Button({ to, href, variant = 'primary', children, className = '', ...props }) {
  const classes = `button button-${variant} ${className}`.trim()
  if (to) return <Link className={classes} to={to} {...props}>{children}</Link>
  if (href) return <a className={classes} href={href} {...props}>{children}</a>
  return <button className={classes} {...props}>{children}</button>
}