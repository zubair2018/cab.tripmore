const places = ['Srinagar', 'Gulmarg', 'Pahalgam', 'Sonamarg', 'Doodhpathri', 'Yusmarg', 'Jammu', 'Katra', 'Patnitop', 'Airport']

export default function Itinerary({ days, itinerary, onChange }) {
  return <div className="day-list">
    <div className="route-table-head"><span>Day</span><span>From</span><span>To</span></div>
    {Array.from({ length: days }, (_, index) => <div className="day-row" key={index}>
      <span>Day <b>{index + 1}</b></span>
      <select value={itinerary[index]?.from || ''} onChange={event => onChange(index, 'from', event.target.value)} aria-label={`Day ${index + 1} from`}><option value="">Select place</option>{places.map(place => <option key={place}>{place}</option>)}</select>
      <select value={itinerary[index]?.to || ''} onChange={event => onChange(index, 'to', event.target.value)} aria-label={`Day ${index + 1} to`}><option value="">Select place</option>{places.map(place => <option key={place}>{place}</option>)}</select>
    </div>)}
  </div>
}
