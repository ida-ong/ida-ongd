export default function DateRangeFilter({ startDate, endDate, onStartChange, onEndChange, onReset }) {
  return (
    <div className="table-toolbar">
      <label className="search-field" style={{ minWidth: 180 }}>
        <span>Du</span>
        <input type="date" value={startDate || ''} onChange={(event) => onStartChange(event.target.value)} />
      </label>
      <label className="search-field" style={{ minWidth: 180 }}>
        <span>Au</span>
        <input type="date" value={endDate || ''} onChange={(event) => onEndChange(event.target.value)} />
      </label>
      {(startDate || endDate) && (
        <button type="button" className="button button-outline small-button" onClick={onReset}>Réinitialiser</button>
      )}
    </div>
  )
}
