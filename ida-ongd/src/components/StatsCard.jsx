export default function StatsCard({ label, value, accent = 'green' }) {
  return (
    <div className="stats-card">
      <span className={`stats-accent stats-${accent}`} aria-hidden="true" />
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  )
}
