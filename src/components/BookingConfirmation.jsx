import { useState } from 'react'

import { formatINR } from '../utils/calculateFare'
import { isFirebaseConfigured } from '../services/firebase'
import { payForBooking } from '../services/payments'
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

  const alreadyPaid =
    (booking?.payment?.status || booking?.paymentStatus || '')
      .toString()
      .toUpperCase() === 'PAID'

  // idle | processing | paid
  const [payState, setPayState] = useState(
    alreadyPaid ? 'paid' : 'idle',
  )
  const [payError, setPayError] = useState('')

  // Online payment only makes sense once the booking is really in Firebase
  // (so it has an id the backend can look up) and there is an amount to charge.
  const canPay =
    isFirebaseConfigured &&
    Boolean(booking?.id) &&
    fare > 0 &&
    payState !== 'paid'

  async function handlePay() {
    setPayError('')
    setPayState('processing')

    try {
      const result = await payForBooking(booking)

      if (result.status === 'PAID') {
        setPayState('paid')
      } else {
        // Customer dismissed the payment window — let them try again.
        setPayState('idle')
      }
    } catch (error) {
      console.error('Could not complete payment.', error)
      setPayError(
        error.message ||
          'Payment could not be completed. Please try again.',
      )
      setPayState('idle')
    }
  }

  return (
    <main className="confirmation-page">
      <div className="confirmation-shell">

        <span className="success-mark">
          ✓
        </span>

        <p className="eyebrow">
          {payState === 'paid'
            ? 'PAYMENT RECEIVED'
            : 'BOOKING REQUEST RECEIVED'}
        </p>

        <h1>
          Your journey is taking shape.
        </h1>

        <p className="confirmation-copy">
          {payState === 'paid'
            ? 'Your payment is confirmed and a receipt has been emailed to you. Your Tripmore team will be in touch with the final trip details.'
            : 'Your Tripmore team will confirm your transport booking shortly.'}
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

        {/* PAYMENT */}
        {(canPay || payState === 'paid') && (
          <div className="confirmation-payment">
            {payState === 'paid' ? (
              <p className="payment-paid">
                <span aria-hidden="true">✓</span>
                Payment received — your booking is confirmed.
              </p>
            ) : (
              <>
                <button
                  className="payment-button"
                  type="button"
                  disabled={payState === 'processing'}
                  onClick={handlePay}
                >
                  {payState === 'processing'
                    ? 'Opening secure payment…'
                    : `Pay ${formatINR(fare)} securely →`}
                </button>

                <small>
                  Secure payment by Razorpay · UPI, cards &amp; netbanking
                </small>

                {payError && (
                  <p className="payment-error">
                    {payError}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        <div className="confirmation-note">
          <strong>
            What happens next?
          </strong>

          <p>
            {payState === 'paid'
              ? 'Your team will reach out on WhatsApp or email with your pickup time and driver details.'
              : 'Our team will review your booking and contact you on WhatsApp or email to confirm vehicle availability and the booking details.'}
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