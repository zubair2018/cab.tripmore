import { formatINR } from '../utils/calculateFare'

export default function VehicleCard({ vehicle, selected, onSelect }) {
  return <button type="button" className={`vehicle-card ${selected ? 'selected' : ''}`} onClick={() => onSelect(vehicle)}>
    {selected && <span className="chosen">Selected</span>}
    <span className="car-icon">{vehicle.icon}</span><span className="vehicle-name">{vehicle.name}</span>
    <span className="vehicle-meta">{vehicle.seats} · {vehicle.luggage}</span><span className="vehicle-note">{vehicle.note}</span>
    <span className="vehicle-price">From {formatINR(Math.min(...Object.values(vehicle.prices)))}<small>/ tour</small></span>
  </button>
}
