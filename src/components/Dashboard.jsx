import { useEffect, useState } from 'react'

import { vehicles } from '../data/vehicles'
import {
  formatINR,
  placeKey,
  destinationPlaces,
} from '../utils/calculateFare'
import { defaultCatalog, saveCatalog, subscribeToCatalog } from '../services/catalog'
import {
  deleteBooking,
  setBookingCancelled,
  setBookingPaid,
} from '../services/bookings'

import '../styles/catalog.css'

export default function Dashboard({ bookings = [], onBack }) {
  const [catalog, setCatalog] = useState(defaultCatalog)
  const [catalogError, setCatalogError] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [busyId, setBusyId] = useState('')

  useEffect(() => {
    return subscribeToCatalog(
      (nextCatalog) => {
        setCatalog(nextCatalog)
        setCatalogError('')
      },
      () => setCatalogError('Could not load places and prices.')
    )
  }, [])

  const totalValue = bookings.reduce(
    (sum, booking) => sum + Number(booking.fare?.total || 0),
    0
  )

  const paidValue = bookings
    .filter(
      (booking) =>
        (booking.payment?.status || booking.paymentStatus || '').toUpperCase() ===
          'PAID' &&
        (booking.bookingStatus || '').toUpperCase() !== 'CANCELLED'
    )
    .reduce(
      (sum, booking) => sum + Number(booking.fare?.total || 0),
      0
    )

  async function runBookingAction(bookingId, action) {
    try {
      setActionError('')
      setBusyId(bookingId)
      await action()
    } catch (error) {
      console.error('Could not update booking.', error)
      setActionError(
        'Could not update the booking. Check your Firebase rules and try again.',
      )
    } finally {
      setBusyId('')
    }
  }

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
    }

    await updateCatalog({
      ...catalog,
      tours: [...catalog.tours, newTour],
    })
  }

  async function deleteTour(tourId) {
    await updateCatalog({
      ...catalog,
      tours: catalog.tours.filter((tour) => tour.id !== tourId),
    })
  }

  async function savePrices(nextPrices) {
    await updateCatalog({
      ...catalog,
      prices: nextPrices,
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

        {actionError && <div className="catalog-error">{actionError}</div>}

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
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) => {
                  const paid =
                    (booking.payment?.status || booking.paymentStatus || '')
                      .toUpperCase() === 'PAID'

                  return (
                    <BookingRow
                      key={booking.id}
                      booking={booking}
                      busy={busyId === booking.id}
                      onSetPaid={(next) =>
                        runBookingAction(booking.id, () =>
                          setBookingPaid(booking.id, next),
                        )
                      }
                      onSetCancelled={(next) =>
                        runBookingAction(booking.id, () =>
                          setBookingCancelled(booking.id, next, paid),
                        )
                      }
                      onDelete={() =>
                        runBookingAction(booking.id, () =>
                          deleteBooking(booking.id),
                        )
                      }
                    />
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <PricingManager
        catalog={catalog}
        saving={saving}
        onSave={savePrices}
      />

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">DAY TOUR ROUTES</p>
            <h2>Homepage day tours</h2>
          </div>
          <span>{catalog.tours.length} routes</span>
        </div>

        <p className="catalog-hint">
          These routes appear in the "Popular day tours" strip on the homepage.
          Fares are taken from the transport prices above, so there is nothing
          to price here.
        </p>

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
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {catalog.tours.length === 0 ? (
                <tr>
                  <td colSpan={4}>No day tours yet.</td>
                </tr>
              ) : (
                catalog.tours.map((tour) => (
                  <tr key={tour.id}>
                    <td><strong>{tour.name}</strong></td>
                    <td>{tour.origin || 'Srinagar'}</td>
                    <td>{tour.destination}</td>
                    <td>
                      <button
                        className="catalog-delete"
                        disabled={saving}
                        onClick={() => deleteTour(tour.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
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

function BookingRow({ booking, busy, onSetPaid, onSetCancelled, onDelete }) {
  const paymentStatus = (
    booking.payment?.status ||
    booking.paymentStatus ||
    'PENDING'
  ).toUpperCase()

  const isPaid = paymentStatus === 'PAID'

  const bookingStatus = (
    booking.bookingStatus || 'PENDING_PAYMENT'
  ).toUpperCase()

  const isCancelled = bookingStatus === 'CANCELLED'

  return (
    <tr className={isCancelled ? 'booking-row-cancelled' : undefined}>
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
        <strong>{describeJourney(booking)}</strong>
        <small>
          {booking.vehicle?.name || 'Vehicle unavailable'} · {booking.days || 1} days
        </small>
      </td>

      <td>
        <strong>{formatINR(booking.fare?.total || 0)}</strong>
      </td>

      <td>
        <span
          className={`status-badge ${
            isCancelled ? 'cancelled' : isPaid ? 'complete' : 'pending'
          }`}
        >
          {paymentStatus}
        </span>
        <small>{formatBookingStatus(bookingStatus)}</small>
      </td>

      <td>
        <div className="booking-actions">
          {!isCancelled &&
            (isPaid ? (
              <button
                className="row-action"
                type="button"
                disabled={busy}
                onClick={() => onSetPaid(false)}
              >
                Mark unpaid
              </button>
            ) : (
              <button
                className="row-action primary"
                type="button"
                disabled={busy}
                onClick={() => onSetPaid(true)}
              >
                Mark paid
              </button>
            ))}

          {isCancelled ? (
            <button
              className="row-action"
              type="button"
              disabled={busy}
              onClick={() => onSetCancelled(false)}
            >
              Reopen
            </button>
          ) : (
            <button
              className="row-action"
              type="button"
              disabled={busy}
              onClick={() => onSetCancelled(true)}
            >
              Cancel
            </button>
          )}

          <button
            className="row-action danger"
            type="button"
            disabled={busy}
            onClick={() => {
              if (
                window.confirm(
                  'Delete this booking permanently? This cannot be undone.',
                )
              ) {
                onDelete()
              }
            }}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}

function formatBookingStatus(status) {
  switch (status) {
    case 'CONFIRMED':
      return 'Confirmed'
    case 'CANCELLED':
      return 'Cancelled'
    case 'PENDING_PAYMENT':
    default:
      return 'Pending payment'
  }
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

      <button className="button button-primary" disabled={saving}>
        + Add day tour
      </button>
    </form>
  )
}

// ============================================================================
// PRICING MANAGER
// ============================================================================
//
// Edits the REAL price store (catalog.prices) that the booking flow reads:
//
//   prices[1][destinationSlug][vehicleId]  -> single-day fares
//   prices[days][vehicleId]                -> multi-day packages (days >= 2)
//
// Changes are held locally until "Save all prices" writes the whole store.
// ============================================================================

function clonePrices(source) {
  const result = {}

  Object.keys(source || {}).forEach((day) => {
    const dayValue = source[day]

    if (dayValue && typeof dayValue === 'object') {
      const inner = {}

      Object.keys(dayValue).forEach((key) => {
        const cell = dayValue[key]
        inner[key] =
          cell && typeof cell === 'object' ? { ...cell } : cell
      })

      result[day] = inner
    } else {
      result[day] = dayValue
    }
  })

  return result
}

function PricingManager({ catalog, saving, onSave }) {
  const [prices, setPrices] = useState(() => clonePrices(catalog.prices))

  useEffect(() => {
    setPrices(clonePrices(catalog.prices))
  }, [catalog.prices])

  const destinations = destinationPlaces(catalog.places)

  const packageDays = Object.keys(prices || {})
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= 2)
    .sort((a, b) => a - b)

  function setSingleDay(destKey, vehicleId, value) {
    setPrices((old) => {
      const dayOne = { ...(old[1] || {}) }
      const cell = { ...(dayOne[destKey] || {}) }
      cell[vehicleId] = Number(value) || 0
      dayOne[destKey] = cell
      return { ...old, 1: dayOne }
    })
  }

  function setPackage(day, vehicleId, value) {
    setPrices((old) => {
      const dayObj = { ...(old[day] || {}) }
      dayObj[vehicleId] = Number(value) || 0
      return { ...old, [day]: dayObj }
    })
  }

  function addDay() {
    setPrices((old) => {
      const existing = Object.keys(old)
        .map(Number)
        .filter((n) => Number.isInteger(n) && n >= 2)

      const next = existing.length ? Math.max(...existing) + 1 : 2

      const seed = {}
      vehicles.forEach((vehicle) => {
        seed[vehicle.id] = 0
      })

      return { ...old, [next]: seed }
    })
  }

  function removeDay(day) {
    setPrices((old) => {
      const copy = { ...old }
      delete copy[day]
      return copy
    })
  }

  return (
    <section className="dashboard-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">TRANSPORT PRICES</p>
          <h2>Fares &amp; packages</h2>
        </div>

        <button
          className="button button-primary"
          disabled={saving}
          onClick={() => onSave(prices)}
        >
          {saving ? 'Saving…' : 'Save all prices'}
        </button>
      </div>

      <h3 className="catalog-subheading">Single-day fares</h3>
      <p className="catalog-hint">
        Price per destination for a one-day trip. Fares are the same in both
        directions (Srinagar → Gulmarg and Gulmarg → Srinagar). Leave a cell at
        0 to mark that vehicle as unavailable for the destination.
      </p>

      <div className="dashboard-scroll">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Destination</th>
              {vehicles.map((vehicle) => (
                <th key={vehicle.id}>{vehicle.name}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {destinations.length === 0 ? (
              <tr>
                <td colSpan={vehicles.length + 1}>
                  Add a place first — every place except Srinagar becomes a
                  priceable destination.
                </td>
              </tr>
            ) : (
              destinations.map((destination) => {
                const key = placeKey(destination)

                return (
                  <tr key={key}>
                    <td><strong>{destination}</strong></td>

                    {vehicles.map((vehicle) => (
                      <td key={vehicle.id}>
                        <input
                          className="catalog-price-input"
                          type="number"
                          min="0"
                          value={prices?.[1]?.[key]?.[vehicle.id] ?? 0}
                          onChange={(e) =>
                            setSingleDay(key, vehicle.id, e.target.value)
                          }
                        />
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <h3 className="catalog-subheading">Multi-day packages</h3>
      <p className="catalog-hint">
        Fixed package price by number of days and vehicle, independent of the
        route. Use "Add another day package" to extend the range.
      </p>

      <div className="dashboard-scroll">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Duration</th>
              {vehicles.map((vehicle) => (
                <th key={vehicle.id}>{vehicle.name}</th>
              ))}
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {packageDays.length === 0 ? (
              <tr>
                <td colSpan={vehicles.length + 2}>
                  No multi-day packages yet. Add one below.
                </td>
              </tr>
            ) : (
              packageDays.map((day) => (
                <tr key={day}>
                  <td><strong>{day} days</strong></td>

                  {vehicles.map((vehicle) => (
                    <td key={vehicle.id}>
                      <input
                        className="catalog-price-input"
                        type="number"
                        min="0"
                        value={prices?.[day]?.[vehicle.id] ?? 0}
                        onChange={(e) =>
                          setPackage(day, vehicle.id, e.target.value)
                        }
                      />
                    </td>
                  ))}

                  <td>
                    <button
                      className="catalog-delete"
                      disabled={saving}
                      onClick={() => removeDay(day)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button
        className="button button-secondary"
        type="button"
        disabled={saving}
        onClick={addDay}
      >
        + Add another day package
      </button>
    </section>
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

function describeJourney(booking) {
  const legs = Array.isArray(booking.routes)
    ? booking.routes
        .filter((route) => route && (route.from || route.to))
        .map((route) => `${route.from || '—'} → ${route.to || '—'}`)
    : []

  if (legs.length > 0) {
    return legs.join('  ·  ')
  }

  if (booking.tour?.name) {
    return booking.tour.name
  }

  return 'Journey unavailable'
}

function formatDate(value) {
  if (!value) return 'Date unavailable'

  const date = value.toDate ? value.toDate() : new Date(value)

  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleString('en-IN')
}
