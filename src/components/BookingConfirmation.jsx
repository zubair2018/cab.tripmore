import { formatINR } from '../utils/calculateFare'

export default function BookingConfirmation({ booking, onNewBooking }) {
  return (
    <main className="confirmation-page">
      <div className="confirmation-shell">
        <span className="success-mark">✓</span>
        <p className="eyebrow">BOOKING REQUEST RECEIVED</p>
        <h1>Your journey is taking shape.</h1>
        <p className="confirmation-copy">Your Tripmore team will confirm your transport booking shortly.</p>

        <div className="confirmation-card">
          <SummaryRow label="Vehicle" value={booking.vehicle.name} />
          <SummaryRow label="Journey" value={booking.tour.name} />
          <SummaryRow label="Duration" value={`${booking.days} ${booking.days === 1 ? 'day' : 'days'}`} />
          <SummaryRow label="Total transport fare" value={formatINR(booking.fare.total)} isTotal />
        </div>

        <div className="confirmation-actions">
          <button className="button button-primary" type="button" onClick={onNewBooking}>Plan another journey →</button>
          <button className="button button-secondary" type="button" onClick={() => { window.location.href = '/' }}>Back to website</button>
        </div>
      </div>
    </main>
  )
}

function SummaryRow({ label, value, isTotal = false }) {
  return <p className={isTotal ? 'confirmation-total' : ''}><span>{label}</span><strong>{value}</strong></p>
}
