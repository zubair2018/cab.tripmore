import { formatINR } from '../utils/calculateFare'
import '../styles/booking-confirmation.css'

export default function BookingConfirmation({
  booking,
  onNewBooking,
}) {
  const vehicleName =
    booking?.vehicle?.name || 'Selected vehicle'

  const duration = `${booking?.days || 1} ${
    booking?.days === 1 ? 'day' : 'days'
  }`

  const fare =
    Number(booking?.fare?.total || 0)

  const routes =
    Array.isArray(booking?.routes)
      ? booking.routes
      : []

  const bookingReference =
    booking?.bookingReference ||
    booking?.id ||
    'Pending'

  return (
    <main className="confirmation-page">
      <div className="confirmation-shell">

        <span className="success-mark">
          ✓
        </span>

        <p className="eyebrow">
          BOOKING REQUEST RECEIVED
        </p>

        <h1>
          Your journey is taking shape.
        </h1>

        <p className="confirmation-copy">
          Your Tripmore team will confirm your
          transport booking shortly.
        </p>

        <div className="confirmation-card">

          <SummaryRow
            label="Booking reference"
            value={bookingReference}
          />

          <SummaryRow
            label="Vehicle"
            value={vehicleName}
          />

          <SummaryRow
            label="Duration"
            value={duration}
          />

          <div className="confirmation-route">
            <span>Journey</span>

            <div className="route-list">
              {routes.length > 0 ? (
                routes.map(
                  (route, index) => (
                    <div
                      className="route-item"
                      key={index}
                    >
                      <strong>
                        Day {index + 1}
                      </strong>

                      <span>
                        {route?.from ||
                          'Not selected'}
                      </span>

                      <span className="route-arrow">
                        →
                      </span>

                      <span>
                        {route?.to ||
                          'Not selected'}
                      </span>
                    </div>
                  ),
                )
              ) : (
                <span>
                  Journey details unavailable
                </span>
              )}
            </div>
          </div>

          <SummaryRow
            label="Total transport fare"
            value={formatINR(fare)}
            isTotal
          />

        </div>

        <div className="confirmation-note">
          <strong>
            What happens next?
          </strong>

          <p>
            Our team will review your booking
            and contact you on WhatsApp or
            email to confirm vehicle availability
            and the booking details.
          </p>
        </div>

        <div className="confirmation-actions">

          <button
            className="button button-primary"
            type="button"
            onClick={onNewBooking}
          >
            Plan another journey →
          </button>

          <button
            className="button button-secondary"
            type="button"
            onClick={() => {
              window.location.href = '/'
            }}
          >
            Back to website
          </button>

        </div>

      </div>
    </main>
  )
}

function SummaryRow({
  label,
  value,
  isTotal = false,
}) {
  return (
    <p
      className={
        isTotal
          ? 'confirmation-total'
          : ''
      }
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </p>
  )
}