import { formatINR } from '../utils/calculateFare'

export default function FareSummary({ booking, fare, compact = false }) {
  if (!booking.vehicle) return null
  return <aside className={`fare-summary ${compact ? 'compact' : ''}`}><div className="summary-top"><span>YOUR ESTIMATE</span><strong>{formatINR(fare.total)}</strong></div>
    {!compact && <><div className="summary-route"><span>{booking.pickup}</span><b>→</b><span>{booking.drop}</span><em>{booking.days} {booking.days === 1 ? 'day' : 'days'}</em></div>
    <div className="fare-lines"><p><span>{booking.vehicle.name} × {booking.days} day{booking.days > 1 ? 's' : ''}</span><b>{formatINR(fare.base)}</b></p>{fare.jammuCharge > 0 && <p><span>Jammu local supplement</span><b>{formatINR(fare.jammuCharge)}</b></p>}{fare.oneDayCharge > 0 && <p><span>Single-day supplement</span><b>{formatINR(fare.oneDayCharge)}</b></p>}</div></>}
    <p className="fare-includes">Includes driver, fuel & local transport</p></aside>
}
