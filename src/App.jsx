import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'

import BookingDialog from './components/BookingDialog'
import AdminPage from './components/AdminPage'

import {
  auth,
  isFirebaseConfigured,
} from './services/firebase'

import {
  saveBookingToFirebase,
  subscribeToBookings,
} from './services/bookings'

import { formatINR } from './utils/calculateFare'

const bookingSteps = [
  {
    number: '01',
    title: 'Select your vehicle',
    text: 'Choose a cab that fits your travel group.',
  },
  {
    number: '02',
    title: 'Build your route',
    text: 'Add the From and To place for every day.',
  },
  {
    number: '03',
    title: 'Book with clarity',
    text: 'See the transport fare before you confirm.',
  },
]

export default function App() {
  /*
   * ─────────────────────────────────────────────
   * ADMIN ROUTE
   * ─────────────────────────────────────────────
   *
   * The admin dashboard is NOT shown anywhere
   * on the public website.
   *
   * It is accessible only through:
   *
   * /admin
   *
   * AdminPage handles Firebase authentication
   * and administrator authorization.
   */

  const isAdminRoute =
    window.location.pathname === '/admin'

  if (isAdminRoute) {
    return (
      <AdminPage
        onBack={() => {
          window.location.href = '/'
        }}
      />
    )
  }

  /*
   * ─────────────────────────────────────────────
   * PUBLIC WEBSITE STATE
   * ─────────────────────────────────────────────
   */

  const [booking, setBooking] = useState(null)
  const [bookings, setBookings] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [bookingError, setBookingError] = useState('')

  /*
   * ─────────────────────────────────────────────
   * FIREBASE BOOKING SUBSCRIPTION
   * ─────────────────────────────────────────────
   *
   * The dashboard uses Firebase Auth.
   *
   * Public users don't need to log in.
   *
   * Once an authenticated admin is detected,
   * bookings can be subscribed to.
   */

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      return undefined
    }

    let unsubscribeBookings = () => {}

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribeBookings()

        /*
         * Only subscribe to bookings when a Firebase
         * user is logged in.
         *
         * Firestore security rules will additionally
         * decide whether the user is actually allowed
         * to read the bookings.
         */
        unsubscribeBookings = user
          ? subscribeToBookings(
              setBookings,
              (error) => {
                console.error(
                  'Could not load bookings from Firebase.',
                  error
                )
              }
            )
          : () => {
              setBookings([])
            }
      }
    )

    return () => {
      unsubscribeBookings()
      unsubscribeAuth()
    }
  }, [])

  /*
   * ─────────────────────────────────────────────
   * OPEN BOOKING DIALOG
   * ─────────────────────────────────────────────
   */

  function openBookingDialog() {
    setBooking(null)
    setBookingError('')
    setIsDialogOpen(true)
  }

  /*
   * ─────────────────────────────────────────────
   * SAVE BOOKING
   * ─────────────────────────────────────────────
   */

  async function saveBooking(bookingData) {
    try {
      setBookingError('')

      const firebaseId =
        await saveBookingToFirebase(
          bookingData
        )

      const savedBooking = firebaseId
        ? {
            ...bookingData,
            id: firebaseId,
          }
        : bookingData

      setBooking(savedBooking)

      /*
       * If Firebase isn't configured,
       * keep the booking locally so the
       * demo still works.
       */
      if (!isFirebaseConfigured) {
        setBookings((oldBookings) => [
          savedBooking,
          ...oldBookings,
        ])
      }

      setIsDialogOpen(false)
    } catch (error) {
      console.error(
        'Could not save booking to Firebase.',
        error
      )

      setBookingError(
        'We could not save this booking right now. Please check your Firebase setup and try again.'
      )
    }
  }

  /*
   * ─────────────────────────────────────────────
   * PUBLIC WEBSITE
   * ─────────────────────────────────────────────
   */

  if (booking) {
    return (
      <BookingConfirmation
        booking={booking}
        onNewBooking={openBookingDialog}
      />
    )
  }

  return (
    <>
      <Header onBook={openBookingDialog} />

      <main>
        <Hero onBook={openBookingDialog} />

        <TrustStrip />

        <HowItWorks />

        <FleetCallout
          onBook={openBookingDialog}
        />
      </main>

      <Footer />

      {isDialogOpen && (
        <BookingDialog
          onClose={() => {
            setIsDialogOpen(false)
            setBookingError('')
          }}
          onBook={saveBooking}
          error={bookingError}
        />
      )}
    </>
  )
}

/*
 * ═══════════════════════════════════════════════
 * HEADER
 * ═══════════════════════════════════════════════
 *
 * IMPORTANT:
 *
 * There is intentionally NO Dashboard button here.
 *
 * Admin access is through:
 *
 * /admin
 *
 * This keeps the admin area out of the public UI.
 */

function Header({ onBook }) {
  return (
    <header className="topbar">

      <button
        className="logo"
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: 'smooth',
          })
        }
        aria-label="Tripmore home"
      >
        <i>✦</i>
        tripmore<span>.in</span>
      </button>

      <nav className="navigation">
        <a href="#how-it-works">
          How it works
        </a>

        <a href="#fleet">
          Our fleet
        </a>
      </nav>

      <div className="header-actions">
        <button
          className="topbar-button"
          onClick={onBook}
        >
          Book a cab
        </button>
      </div>

    </header>
  )
}

/*
 * ═══════════════════════════════════════════════
 * HERO
 * ═══════════════════════════════════════════════
 */

function Hero({ onBook }) {
  return (
    <section className="hero-section">

      <div className="hero-copy">

        <p className="eyebrow">
          KASHMIR & JAMMU TRANSPORT
        </p>

        <h1>
          Every beautiful road deserves a{' '}
          <em>better ride.</em>
        </h1>

        <p className="hero-description">
          Reliable local transport from Srinagar
          for your Kashmir holiday. Choose a day
          tour, pick your vehicle, and know the
          fare upfront.
        </p>

        <div className="hero-actions">

          <button
            className="button button-primary"
            onClick={onBook}
          >
            Plan your cab <span>→</span>
          </button>

          <span>
            Trusted local drivers · 24/7 assistance
          </span>

        </div>

      </div>

      <div
        className="hero-art"
        aria-label="Stylised Kashmir mountain landscape"
      >

        <div className="sun" />

        <div className="mountain mountain-back" />

        <div className="mountain mountain-front" />

        <div className="road" />

        <div className="car">
          🚙
        </div>

        <div className="hero-card">

          <span>
            TRIPMORE PROMISE
          </span>

          <strong>
            Easy booking.
            <br />
            Happy journeys.
          </strong>

        </div>

      </div>

    </section>
  )
}

/*
 * ═══════════════════════════════════════════════
 * TRUST STRIP
 * ═══════════════════════════════════════════════
 */

function TrustStrip() {
  return (
    <section className="trust-strip">

      <span>
        ✓ Experienced local drivers
      </span>

      <span>
        ✓ Transparent daily rates
      </span>

      <span>
        ✓ Flexible tour planning
      </span>

      <span>
        ✓ Srinagar-based travel experts
      </span>

    </section>
  )
}

/*
 * ═══════════════════════════════════════════════
 * HOW IT WORKS
 * ═══════════════════════════════════════════════
 */

function HowItWorks() {
  return (
    <section
      className="how-section"
      id="how-it-works"
    >

      <p className="eyebrow">
        SIMPLE FROM START TO FINISH
      </p>

      <h2>
        Your ride in three easy steps.
      </h2>

      <div className="steps">

        {bookingSteps.map((step) => (
          <article
            key={step.number}
            className="step-card"
          >

            <span>
              {step.number}
            </span>

            <h3>
              {step.title}
            </h3>

            <p>
              {step.text}
            </p>

          </article>
        ))}

      </div>

    </section>
  )
}

/*
 * ═══════════════════════════════════════════════
 * FLEET CALLOUT
 * ═══════════════════════════════════════════════
 */

function FleetCallout({ onBook }) {
  return (
    <section
      className="fleet-callout"
      id="fleet"
    >

      <div>

        <p className="eyebrow">
          A RIDE FOR EVERY GROUP
        </p>

        <h2>
          From a couple’s escape to a full
          family adventure.
        </h2>

      </div>

      <button
        className="button button-outline"
        onClick={onBook}
      >
        View rentals <span>→</span>
      </button>

    </section>
  )
}

/*
 * ═══════════════════════════════════════════════
 * FOOTER
 * ═══════════════════════════════════════════════
 */

function Footer() {
  return (
    <footer>

      <span>
        © {new Date().getFullYear()} Tripmore
      </span>

      <span>
        Kashmir tours, taxi services and travel
        support from Srinagar.
      </span>

    </footer>
  )
}

/*
 * ═══════════════════════════════════════════════
 * BOOKING CONFIRMATION
 * ═══════════════════════════════════════════════
 */

function BookingConfirmation({
  booking,
  onNewBooking,
}) {
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
            label="Vehicle"
            value={booking.vehicle.name}
          />

          <SummaryRow
            label="Journey"
            value={booking.tour.name}
          />

          <SummaryRow
            label="Duration"
            value={`${booking.days} ${
              booking.days === 1
                ? 'day'
                : 'days'
            }`}
          />

          <SummaryRow
            label="Total transport fare"
            value={formatINR(
              booking.fare.total
            )}
            isTotal
          />

        </div>

        <div className="confirmation-actions">

          <button
            className="button button-primary"
            onClick={onNewBooking}
          >
            Plan another journey{' '}
            <span>→</span>
          </button>

          <button
            className="button button-secondary"
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

/*
 * ═══════════════════════════════════════════════
 * SUMMARY ROW
 * ═══════════════════════════════════════════════
 */

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