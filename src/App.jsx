import { useEffect, useState } from 'react'
import BookingDialog from './components/BookingDialog'
import Dashboard from './components/Dashboard'
import { isFirebaseConfigured } from './services/firebase'
import { saveBookingToFirebase, subscribeToBookings } from './services/bookings'
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
  // `booking` stays null until the visitor clicks “Book this cab”.
  const [booking, setBooking] = useState(null)
  const [bookings, setBookings] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
    const [bookingError, setBookingError] = useState('')

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined

    return subscribeToBookings(setBookings, (error) => {
      console.error('Could not load bookings from Firebase.', error)
    })
  }, [])

  function openBookingDialog() {
    setBooking(null)
      setBookingError('')
      setIsDialogOpen(true)
  }

  async function saveBooking(bookingData) {
      try {
        const firebaseId = await saveBookingToFirebase(bookingData)
        const savedBooking = firebaseId ? { ...bookingData, id: firebaseId } : bookingData

        setBooking(savedBooking)
        if (!isFirebaseConfigured) setBookings((oldBookings) => [savedBooking, ...oldBookings])
        setIsDialogOpen(false)
      } catch (error) {
        console.error('Could not save booking to Firebase.', error)
        setBookingError('We could not save this booking right now. Please check your Firebase setup and try again.')
      }
  }

  if (showDashboard) {
    return <Dashboard bookings={bookings} onBack={() => setShowDashboard(false)} />
  }

  if (booking) {
    return <BookingConfirmation booking={booking} onNewBooking={openBookingDialog} onDashboard={() => setShowDashboard(true)} />
  }

  return (
    <>
      <Header onBook={openBookingDialog} onDashboard={() => setShowDashboard(true)} />

      <main>
        <Hero onBook={openBookingDialog} />
        <TrustStrip />
        <HowItWorks />
        <FleetCallout onBook={openBookingDialog} />
      </main>

      <Footer />

      {isDialogOpen && (
        <BookingDialog
          onClose={() => setIsDialogOpen(false)}
          onBook={saveBooking}
            error={bookingError}
        />
      )}
    </>
  )
}

function Header({ onBook, onDashboard }) {
  return (
    <header className="topbar">
      <button className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <i>✦</i>
        tripmore<span>.in</span>
      </button>

      <nav className="navigation">
        <a href="#how-it-works">How it works</a>
        <a href="#fleet">Our fleet</a>
      </nav>

      <div className="header-actions">
        <button className="dashboard-link" onClick={onDashboard}>Dashboard</button>
        <button className="topbar-button" onClick={onBook}>Book a cab</button>
      </div>
    </header>
  )
}

function Hero({ onBook }) {
  return (
    <section className="hero-section">
      <div className="hero-copy">
        <p className="eyebrow">KASHMIR & JAMMU TRANSPORT</p>
        <h1>Every beautiful road deserves a <em>better ride.</em></h1>
        <p className="hero-description">
          Reliable local transport from Srinagar for your Kashmir holiday. Choose
          a day tour, pick your vehicle, and know the fare upfront.
        </p>

        <div className="hero-actions">
          <button className="button button-primary" onClick={onBook}>
            Plan your cab <span>→</span>
          </button>
          <span>Trusted local drivers · 24/7 assistance</span>
        </div>
      </div>

      <div className="hero-art" aria-label="Stylised Kashmir mountain landscape">
        <div className="sun" />
        <div className="mountain mountain-back" />
        <div className="mountain mountain-front" />
        <div className="road" />
        <div className="car">🚙</div>

        <div className="hero-card">
          <span>TRIPMORE PROMISE</span>
          <strong>Easy booking.<br />Happy journeys.</strong>
        </div>
      </div>
    </section>
  )
}

function TrustStrip() {
  return (
    <section className="trust-strip">
      <span>✓ Experienced local drivers</span>
      <span>✓ Transparent daily rates</span>
      <span>✓ Flexible tour planning</span>
      <span>✓ Srinagar-based travel experts</span>
    </section>
  )
}

function HowItWorks() {
  return (
    <section className="how-section" id="how-it-works">
      <p className="eyebrow">SIMPLE FROM START TO FINISH</p>
      <h2>Your ride in three easy steps.</h2>

      <div className="steps">
        {bookingSteps.map((step) => (
          <article key={step.number} className="step-card">
            <span>{step.number}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function FleetCallout({ onBook }) {
  return (
    <section className="fleet-callout" id="fleet">
      <div>
        <p className="eyebrow">A RIDE FOR EVERY GROUP</p>
        <h2>From a couple’s escape to a full family adventure.</h2>
      </div>

      <button className="button button-outline" onClick={onBook}>
        View rentals <span>→</span>
      </button>
    </section>
  )
}

function Footer() {
  return (
    <footer>
      <span>© {new Date().getFullYear()} Tripmore</span>
      <span>Kashmir tours, taxi services and travel support from Srinagar.</span>
    </footer>
  )
}

function BookingConfirmation({ booking, onNewBooking, onDashboard }) {
  return (
    <main className="confirmation-page">
      <div className="confirmation-shell">
        <span className="success-mark">✓</span>
        <p className="eyebrow">BOOKING REQUEST RECEIVED</p>
        <h1>Your journey is taking shape.</h1>
        <p className="confirmation-copy">
          Your Tripmore team will confirm your transport booking shortly.
        </p>

        <div className="confirmation-card">
          <SummaryRow label="Vehicle" value={booking.vehicle.name} />
          <SummaryRow label="Journey" value={booking.tour.name} />
          <SummaryRow label="Duration" value={`${booking.days} ${booking.days === 1 ? 'day' : 'days'}`} />
          <SummaryRow label="Total transport fare" value={formatINR(booking.fare.total)} isTotal />
        </div>

        <div className="confirmation-actions">
          <button className="button button-primary" onClick={onNewBooking}>Plan another journey <span>→</span></button>
          <button className="button button-secondary" onClick={onDashboard}>Open dashboard</button>
        </div>
      </div>
    </main>
  )
}

function SummaryRow({ label, value, isTotal = false }) {
  return (
    <p className={isTotal ? 'confirmation-total' : ''}>
      <span>{label}</span>
      <strong>{value}</strong>
    </p>
  )
}
