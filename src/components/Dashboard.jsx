import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'

import { tours, vehicles } from '../data/vehicles'
import { formatINR } from '../utils/calculateFare'
import { auth, isFirebaseConfigured } from '../services/firebase'

export default function Dashboard({ bookings = [], onBack }) {
  if (isFirebaseConfigured && !auth?.currentUser) {
    return <DashboardLogin onBack={onBack} />
  }

  const totalValue = bookings.reduce((sum, booking) => sum + Number(booking.fare?.total || 0), 0)
  const paidValue = bookings
    .filter((booking) => booking.paymentStatus === 'Paid')
    .reduce((sum, booking) => sum + Number(booking.fare?.total || 0), 0)

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div><p className="eyebrow">TRIPMORE OPERATIONS</p><h1>Booking dashboard</h1><p>View bookings and the published transport rates.</p></div>
        <button className="button button-secondary" type="button" onClick={onBack}>Back to website</button>
      </header>

      <section className="dashboard-stats">
        <Stat label="Bookings" value={bookings.length} detail="All requests" />
        <Stat label="Booking value" value={formatINR(totalValue)} detail="Pending and paid" />
        <Stat label="Paid revenue" value={formatINR(paidValue)} detail="Confirmed payments" />
        <Stat label="Routes" value={tours.length} detail="Published day tours" />
      </section>

      <section className="dashboard-section">
        <div className="section-heading"><div><p className="eyebrow">PUBLISHED RATES</p><h2>Three Kashmir day tours</h2></div></div>
        <div className="dashboard-scroll"><table className="dashboard-table"><thead><tr><th>Tour</th>{vehicles.map((vehicle) => <th key={vehicle.id}>{vehicle.name}</th>)}</tr></thead><tbody>{tours.map((tour) => <tr key={tour.id}><td><strong>{tour.name}</strong></td>{vehicles.map((vehicle) => <td key={vehicle.id}>{formatINR(vehicle.prices[tour.id])}</td>)}</tr>)}</tbody></table></div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading"><div><p className="eyebrow">BOOKING RECORDS</p><h2>Recent bookings</h2></div><span>{bookings.length} records</span></div>
        {bookings.length === 0 ? <EmptyState /> : <div className="dashboard-scroll"><table className="dashboard-table booking-table"><thead><tr><th>Booking</th><th>Customer</th><th>Journey</th><th>Fare</th><th>Payment</th></tr></thead><tbody>{bookings.map((booking) => <BookingRow key={booking.id} booking={booking} />)}</tbody></table></div>}
      </section>
    </main>
  )
}

function Stat({ label, value, detail }) {
  return <article className="stat-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

function BookingRow({ booking }) {
  return <tr><td><strong>{booking.id}</strong><small>{formatDate(booking.createdAt)}</small></td><td><strong>{booking.customer?.name || 'Unknown'}</strong><small>{booking.customer?.email}<br />{booking.customer?.phone}</small></td><td><strong>{booking.tour?.name}</strong><small>{booking.vehicle?.name} · {booking.days} days</small></td><td><strong>{formatINR(booking.fare?.total || 0)}</strong></td><td><span className={`status-badge ${booking.paymentStatus === 'Paid' ? 'complete' : 'pending'}`}>{booking.paymentStatus || 'Pending'}</span></td></tr>
}

function EmptyState() {
  return <div className="dashboard-empty"><strong>No bookings yet</strong><p>New customer requests will appear here.</p></div>
}

function formatDate(value) {
  if (!value) return 'Date unavailable'
  const date = value.toDate ? value.toDate() : new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString('en-IN')
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

  return <main className="dashboard-login-page"><form className="dashboard-login" onSubmit={login}><p className="eyebrow">TRIPMORE OPERATIONS</p><h1>Company dashboard</h1><p>Sign in to view bookings and published rates.</p><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <p className="login-error">{error}</p>}<button className="button button-primary" type="submit">Sign in</button><button className="button button-secondary" type="button" onClick={onBack}>Back to website</button></form></main>
}
