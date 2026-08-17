import { useState } from 'react'
import BookingDialog from './components/BookingDialog'
import { formatINR } from './utils/calculateFare'

export default function App() {
  // Controls whether the booking dialog is visible.
  const [showDialog, setShowDialog] = useState(false)

  // Stores the booking data after the user clicks Book.
  const [confirmedBooking, setConfirmedBooking] = useState(null)

  function handleBook(bookingData) {
    // bookingData comes from BookingDialog.jsx.
    // It includes vehicle, days, daily routes, and calculated fare.
    setConfirmedBooking(bookingData)
    setShowDialog(false)
  }

  function startNewBooking() {
    setConfirmedBooking(null)
    setShowDialog(true)
  }

  // This screen appears after the user clicks Book.
  if (confirmedBooking) {
    return (
      <main className="confirmation-page">
        <p className="confirmation-label">BOOKING REQUEST RECEIVED</p>

        <h1>Your cab is ready to plan.</h1>

        <p>
          You selected a <strong>{confirmedBooking.vehicle.name}</strong> for{' '}
          <strong>
            {confirmedBooking.days}{' '}
            {confirmedBooking.days === 1 ? 'day' : 'days'}.
          </strong>
        </p>

        <section className="confirmation-card">
          <p>
            <span>Pickup city</span>
            <strong>{confirmedBooking.pickupCity}</strong>
          </p>

          <p>
            <span>Drop city</span>
            <strong>{confirmedBooking.dropCity}</strong>
          </p>

          <p>
            <span>Vehicle</span>
            <strong>{confirmedBooking.vehicle.name}</strong>
          </p>

          <p>
            <span>Total fare</span>
            <strong className="total-price">
              {formatINR(confirmedBooking.fare.total)}
            </strong>
          </p>
        </section>

        <button className="new-booking-button" onClick={startNewBooking}>
          Plan another cab
        </button>
      </main>
    )
  }

  // Main starting screen.
  return (
    <main className="home-page">
      <section className="home-content">
        <p className="home-label">TRIPMORE TRANSPORT</p>

        <h1>
          Book your Kashmir
          <br />
          cab with ease.
        </h1>

        <p className="home-description">
          Select a rental, plan your day-wise journey, and get a clear fare
          before booking.
        </p>

        <button
          className="open-dialog-button"
          onClick={() => setShowDialog(true)}
        >
          Select a rental
        </button>
      </section>

      {/* Dialog appears only when showDialog is true */}
      {showDialog && (
        <BookingDialog
          onClose={() => setShowDialog(false)}
          onBook={handleBook}
        />
      )}
    </main>
  )
}