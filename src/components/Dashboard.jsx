import { useEffect, useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'

import { vehicles } from '../data/vehicles'
import { formatINR } from '../utils/calculateFare'
import { auth, isFirebaseConfigured } from '../services/firebase'
import {defaultCatalog, saveCatalog, subscribeToCatalog} from '../services/catalog'

import '../styles/catalog.css'

export default function Dashboard({ bookings = [], onBack }) {
  const [catalog, setCatalog] = useState(defaultCatalog)
  const [catalogError, setCatalogError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    return subscribeToCatalog(
      (nextCatalog) => {
        setCatalog(nextCatalog)
        setCatalogError('')
      },
      () => setCatalogError('Could not load places and prices.')
    )
  }, [])

  if (isFirebaseConfigured && !auth?.currentUser) {
    return <DashboardLogin onBack={onBack} />
  }

  const totalValue = bookings.reduce(
    (sum, booking) => sum + Number(booking.fare?.total || 0),
    0
  )

  const paidValue = bookings
    .filter(
      (booking) =>
        (booking.payment?.status || booking.paymentStatus || '').toUpperCase() ===
        'PAID'
    )
    .reduce(
      (sum, booking) => sum + Number(booking.fare?.total || 0),
      0
    )

  async function updateCatalog(nextCatalog) {
    try {
      setSaving(true)
      setCatalogError('')
      await saveCatalog(nextCatalog)
      setCatalog(nextCatalog)
    } catch (error) {
      console.error('Could not save catalog.', error)
      setCatalogError('Could not save changes. Check your Firebase rules.')
    } finally {
      setSaving(false)
    }
  }

  async function addPlace(placeName) {
    const name = placeName.trim()
    if (!name) return

    if (
      catalog.places.some(
        (place) => place.toLowerCase() === name.toLowerCase()
      )
    ) {
      setCatalogError('This place already exists.')
      return
    }

    await updateCatalog({
      ...catalog,
      places: [...catalog.places, name],
    })
  }

  async function deletePlace(place) {
    const used = catalog.tours.some(
      (tour) =>
        (tour.origin || 'Srinagar') === place ||
        tour.destination === place
    )

    if (used) {
      setCatalogError(`${place} is being used by a tour. Delete that tour first.`)
      return
    }

    await updateCatalog({
      ...catalog,
      places: catalog.places.filter((item) => item !== place),
    })
  }

  async function addTour(form) {
    const name = form.name.trim()

    if (!name || !form.origin || !form.destination) {
      setCatalogError('Fill in tour name, from place and destination.')
      return
    }

    if (form.origin === form.destination) {
      setCatalogError('From and destination cannot be the same.')
      return
    }

    const id = `${form.origin}-${form.destination}-${Date.now()}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')

    const newTour = {
      id,
      name,
      origin: form.origin,
      destination: form.destination,
      prices: {
        sedan: Number(form.sedan || 0),
        innova: Number(form.innova || 0),
        tempo: Number(form.tempo || 0),
        urbania: Number(form.urbania || 0),
      },
    }

    await updateCatalog({
      ...catalog,
      tours: [...catalog.tours, newTour],
    })
  }

  async function updateTourPrices(tourId, prices) {
    await updateCatalog({
      ...catalog,
      tours: catalog.tours.map((tour) =>
        tour.id === tourId
          ? { ...tour, prices: { ...tour.prices, ...prices } }
          : tour
      ),
    })
  }

  async function deleteTour(tourId) {
    await updateCatalog({
      ...catalog,
      tours: catalog.tours.filter((tour) => tour.id !== tourId),
    })
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">TRIPMORE OPERATIONS</p>
          <h1>Booking dashboard</h1>
          <p>Manage bookings, places, day tours and transport prices.</p>
        </div>

        <button className="button button-secondary" onClick={onBack}>
          Back to website
        </button>
      </header>

      <section className="dashboard-stats">
        <Stat label="Bookings" value={bookings.length} detail="All requests" />
        <Stat label="Booking value" value={formatINR(totalValue)} detail="Pending and paid" />
        <Stat label="Paid revenue" value={formatINR(paidValue)} detail="Confirmed payments" />
        <Stat label="Day tours" value={catalog.tours.length} detail="Published routes" />
      </section>

      {catalogError && <div className="catalog-error">{catalogError}</div>}

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">BOOKING RECORDS</p>
            <h2>Recent bookings</h2>
          </div>
          <span>{bookings.length} records</span>
        </div>

        {bookings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="dashboard-scroll">
            <table className="dashboard-table booking-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Journey</th>
                  <th>Fare</th>
                  <th>Payment</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) => (
                  <BookingRow key={booking.id} booking={booking} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TOURS & PRICES</p>
            <h2>Manage day tours</h2>
          </div>
        </div>

        <AddTourForm
          places={catalog.places}
          saving={saving}
          onAdd={addTour}
        />

        <div className="dashboard-scroll">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Day tour</th>
                <th>From</th>
                <th>To</th>
                {vehicles.map((vehicle) => (
                  <th key={vehicle.id}>{vehicle.name}</th>
                ))}
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {catalog.tours.map((tour) => (
                <TourPriceRow
                  key={tour.id}
                  tour={tour}
                  saving={saving}
                  onSave={updateTourPrices}
                  onDelete={deleteTour}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <PlacesManager
        places={catalog.places}
        saving={saving}
        onAdd={addPlace}
        onDelete={deletePlace}
      />
    </main>
  )
}

function BookingRow({ booking }) {
  const paymentStatus =
    booking.payment?.status ||
    booking.paymentStatus ||
    'PENDING'

  const isPaid = paymentStatus.toUpperCase() === 'PAID'

  return (
    <tr>
      <td>
        <strong>{booking.bookingReference || booking.id}</strong>
        <small>{formatDate(booking.createdAt)}</small>
      </td>

      <td>
        <strong>{booking.customer?.name || 'Unknown'}</strong>
        <small>
          {booking.customer?.email}
          <br />
          {booking.customer?.phone}
        </small>
      </td>

      <td>
        <strong>{booking.tour?.name || 'Journey unavailable'}</strong>
        <small>
          {booking.vehicle?.name || 'Vehicle unavailable'} · {booking.days || 1} days
        </small>
      </td>

      <td>
        <strong>{formatINR(booking.fare?.total || 0)}</strong>
      </td>

      <td>
        <span className={`status-badge ${isPaid ? 'complete' : 'pending'}`}>
          {paymentStatus}
        </span>
      </td>
    </tr>
  )
}

function PlacesManager({ places, saving, onAdd, onDelete }) {
  const [place, setPlace] = useState('')

  function submit(event) {
    event.preventDefault()
    onAdd(place)
    setPlace('')
  }

  return (
    <section className="dashboard-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">PLACES</p>
          <h2>Manage places</h2>
        </div>
      </div>

      <form className="catalog-add-form" onSubmit={submit}>
        <input
          value={place}
          onChange={(event) => setPlace(event.target.value)}
          placeholder="Enter new place, e.g. Jammu"
        />

        <button className="button button-primary" disabled={saving}>
          + Add place
        </button>
      </form>

      <div className="place-list">
        {places.map((place) => (
          <div className="place-chip" key={place}>
            <span>{place}</span>

            <button
              type="button"
              disabled={saving}
              onClick={() => onDelete(place)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

function AddTourForm({ places, saving, onAdd }) {
  const [form, setForm] = useState({
    name: '',
    origin: places[0] || 'Srinagar',
    destination: places[1] || 'Pahalgam',
    sedan: '',
    innova: '',
    tempo: '',
    urbania: '',
  })

  function update(field, value) {
    setForm((old) => ({ ...old, [field]: value }))
  }

  function submit(event) {
    event.preventDefault()
    onAdd(form)

    setForm({
      name: '',
      origin: places[0] || 'Srinagar',
      destination: places[1] || 'Pahalgam',
      sedan: '',
      innova: '',
      tempo: '',
      urbania: '',
    })
  }

  return (
    <form className="catalog-tour-form" onSubmit={submit}>
      <h3>Add a new day tour</h3>

      <div className="catalog-form-grid">
        <label>
          Tour name
          <input
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Srinagar to Jammu day tour"
            required
          />
        </label>

        <label>
          From
          <select value={form.origin} onChange={(e) => update('origin', e.target.value)}>
            {places.map((place) => <option key={place}>{place}</option>)}
          </select>
        </label>

        <label>
          Destination
          <select value={form.destination} onChange={(e) => update('destination', e.target.value)}>
            {places.map((place) => <option key={place}>{place}</option>)}
          </select>
        </label>
      </div>

      <div className="catalog-price-grid">
        {['sedan', 'innova', 'tempo', 'urbania'].map((type) => (
          <label key={type}>
            {type === 'tempo' ? 'Tempo Traveller' : type[0].toUpperCase() + type.slice(1)}
            <input
              type="number"
              min="0"
              value={form[type]}
              onChange={(e) => update(type, e.target.value)}
              required
            />
          </label>
        ))}
      </div>

      <button className="button button-primary" disabled={saving}>
        + Add day tour
      </button>
    </form>
  )
}

function TourPriceRow({ tour, saving, onSave, onDelete }) {
  const [prices, setPrices] = useState(tour.prices || {})

  useEffect(() => {
    setPrices(tour.prices || {})
  }, [tour.prices])

  return (
    <tr>
      <td><strong>{tour.name}</strong></td>
      <td>{tour.origin || 'Srinagar'}</td>
      <td>{tour.destination}</td>

      {vehicles.map((vehicle) => (
        <td key={vehicle.id}>
          <input
            className="catalog-price-input"
            type="number"
            min="0"
            value={prices[vehicle.id] || 0}
            onChange={(e) =>
              setPrices((old) => ({
                ...old,
                [vehicle.id]: Number(e.target.value),
              }))
            }
          />
        </td>
      ))}

      <td>
        <div className="catalog-actions">
          <button
            className="button button-primary"
            disabled={saving}
            onClick={() => onSave(tour.id, prices)}
          >
            Save
          </button>

          <button
            className="catalog-delete"
            disabled={saving}
            onClick={() => onDelete(tour.id)}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}

function Stat({ label, value, detail }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

function EmptyState() {
  return (
    <div className="dashboard-empty">
      <strong>No bookings yet</strong>
      <p>New customer requests will appear here.</p>
    </div>
  )
}

function formatDate(value) {
  if (!value) return 'Date unavailable'

  const date = value.toDate ? value.toDate() : new Date(value)

  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleString('en-IN')
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
        <p>Sign in to manage bookings, places and prices.</p>

        <label>
          Email address
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="login-error">{error}</p>}

        <button className="button button-primary">Sign in</button>

        <button
          className="button button-secondary"
          type="button"
          onClick={onBack}
        >
          Back to website
        </button>
      </form>
    </main>
  )
}