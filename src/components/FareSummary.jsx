import { formatINR } from '../utils/calculateFare'

export default function FareSummary({ booking, fare, compact = false }) {
  if (!booking.vehicle) return null
  return <aside className={`fare-summary ${compact ? 'compact' : ''}`}><div className="summary-top"><span>YOUR ESTIMATE</span><strong>{formatINR(fare.total)}</strong></div>
    {!compact && <><div className="summary-route"><span>{booking.tour.name}</span><em>{booking.days} {booking.days === 1 ? 'day' : 'days'}</em></div>
    <div className="fare-lines"><p><span>{booking.vehicle.name} × {booking.days} tour{booking.days > 1 ? 's' : ''}</span><b>{formatINR(fare.base)}</b></p></div></>}
    <p className="fare-includes">Includes driver, fuel & local transport</p></aside>
}
