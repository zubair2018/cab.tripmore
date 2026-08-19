import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { formatINR } from '../utils/calculateFare'
import { auth, isFirebaseConfigured } from '../services/firebase'

export default function Dashboard({ bookings, onBack }) {
  if (isFirebaseConfigured && !auth.currentUser) return <DashboardLogin onBack={onBack} />

  const totalRevenue = bookings.reduce((sum, booking) => sum + booking.fare.total, 0)
  const paidRevenue = bookings
    .filter((booking) => booking.paymentStatus === 'Paid')
    .reduce((sum, booking) => sum + booking.fare.total, 0)

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">TRIPMORE OPERATIONS</p>
          <h1>Booking dashboard</h1>
          <p>Track customers, vehicles, fares, payments and notifications in one place.</p>
        </div>
        <button className="button button-secondary" onClick={onBack}>Back to website</button>
      </header>

      <section className="dashboard-stats">
        <StatCard label="Total bookings" value={bookings.length} detail="All booking requests" />
        <StatCard label="Total booking value" value={formatINR(totalRevenue)} detail="Including pending payments" />
        <StatCard label="Paid revenue" value={formatINR(paidRevenue)} detail="Confirmed by payment gateway" />
        <StatCard label="Pending payments" value={bookings.filter((booking) => booking.paymentStatus !== 'Paid').length} detail="Needs payment confirmation" />
      </section>

      <section className="dashboard-table-section">
        <div className="dashboard-section-heading">
          <div>
            <p className="eyebrow">BOOKING RECORDS</p>
            <h2>Recent bookings</h2>
          </div>
          <span className="record-count">{bookings.length} records</span>
        </div>

        <p className={`firebase-connection ${isFirebaseConfigured ? 'connected' : 'local'}`}>
          {isFirebaseConfigured ? 'Connected to Firebase Firestore' : 'Local demo mode: add Firebase environment values to save bookings online'}
        </p>

        {bookings.length === 0 ? (
          <div className="dashboard-empty">
            <strong>No bookings yet</strong>
            <p>New bookings will appear here after a customer submits the booking form.</p>
          </div>
        ) : (
          <div className="booking-table-wrap">
            <table className="booking-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Tour / vehicle</th>
                  <th>Fare</th>
                  <th>Payment</th>
                  <th>Messages</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => <BookingRow key={booking.id} booking={booking} />)}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="integration-note">
        <div>
          <p className="eyebrow">READY FOR INTEGRATION</p>
          <h2>Payment and messages will update from your backend.</h2>
          <p>Connect the payment gateway webhook to `paymentStatus`, then trigger email and WhatsApp providers from the same confirmed booking event.</p>
        </div>
        <div className="integration-list">
          <span>Payment gateway <b>Pending setup</b></span>
          <span>Customer email + WhatsApp <b>Pending setup</b></span>
          <span>Company email + WhatsApp <b>Pending setup</b></span>
        </div>
      </section>
    </main>
  )
}

function DashboardLogin({ onBack }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function login(event) {
    event.preventDefault()
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      window.location.reload()
    } catch {
      setError('Login failed. Check the company email and password.')
    }
  }

  return (
    <main className="dashboard-login-page">
      <form className="dashboard-login" onSubmit={login}>
        <p className="eyebrow">TRIPMORE OPERATIONS</p>
        <h1>Company dashboard</h1>
        <p>Sign in to view customer bookings and payment information.</p>
        <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        {error && <p className="login-error">{error}</p>}
        <button className="button button-primary" type="submit">Sign in</button>
        <button className="button button-secondary" type="button" onClick={onBack}>Back to website</button>
      </form>
    </main>
  )
}

function StatCard({ label, value, detail }) {
  return <article className="stat-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

function BookingRow({ booking }) {
  const bookingDate = booking.createdAt?.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt)

  return (
    <tr>
      <td><strong>{booking.id}</strong><small>{bookingDate.toLocaleDateString('en-IN')}</small></td>
      <td><strong>{booking.customer.name}</strong><small>{booking.customer.email}<br />{booking.customer.phone}</small></td>
      <td><strong>{booking.tour.name}</strong><small>{booking.vehicle.name} · {booking.days} {booking.days === 1 ? 'day' : 'days'}</small></td>
      <td><strong>{formatINR(booking.fare.total)}</strong><small>Transport fare</small></td>
      <td><StatusBadge status={booking.paymentStatus} /></td>
      <td className="notification-statuses">
        <small>Customer email <StatusBadge status={booking.customerEmailStatus} /></small>
        <small>Customer WhatsApp <StatusBadge status={booking.customerWhatsappStatus} /></small>
        <small>Company email <StatusBadge status={booking.companyEmailStatus} /></small>
        <small>Company WhatsApp <StatusBadge status={booking.companyWhatsappStatus} /></small>
      </td>
    </tr>
  )
}

function StatusBadge({ status }) {
  const isComplete = status === 'Paid' || status === 'Sent'
  return <span className={`status-badge ${isComplete ? 'complete' : 'pending'}`}>{status}</span>
}
