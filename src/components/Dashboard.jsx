import {
  useEffect,
  useState,
} from 'react'

import {
  signInWithEmailAndPassword,
} from 'firebase/auth'

import {
  doc,
  getDoc,
} from 'firebase/firestore'

import {
  formatINR,
} from '../utils/calculateFare'

import {
  auth,
  db,
  isFirebaseConfigured,
} from '../services/firebase'

import {
  addFarePlace,
  deleteFarePlace,
  seedDefaultFarePlaces,
  subscribeToFarePlaces,
  toggleFarePlace,
  updateFarePlace,
} from '../services/farePlaces.jsx'


export default function Dashboard({
  bookings,
  onBack,
}) {
  if (
    isFirebaseConfigured &&
    !auth.currentUser
  ) {
    return (
      <DashboardLogin
        onBack={onBack}
      />
    )
  }

  return (
    <DashboardContent
      bookings={bookings}
      onBack={onBack}
    />
  )
}


/* ═══════════════════════════════════
   DASHBOARD CONTENT
═══════════════════════════════════ */

function DashboardContent({
  bookings,
  onBack,
}) {
  const [
    places,
    setPlaces,
  ] = useState([])

  const [
    placesLoading,
    setPlacesLoading,
  ] = useState(true)

  const [
    placesError,
    setPlacesError,
  ] = useState('')

  const [
    showPlaceForm,
    setShowPlaceForm,
  ] = useState(false)

  const [
    editingPlace,
    setEditingPlace,
  ] = useState(null)


  /*
   * Load places in real time.
   */

  useEffect(() => {
    let unsubscribe =
      () => {}

    async function loadPlaces() {
      try {
        /*
         * Only administrators can seed
         * the default pricing records.
         */

        if (
          auth.currentUser &&
          db
        ) {
          const adminDoc =
            await getDoc(
              doc(
                db,
                'admins',
                auth.currentUser.uid,
              ),
            )

          const adminData =
            adminDoc.data()

          if (
            adminDoc.exists() &&
            adminData?.role ===
              'admin' &&
            adminData?.active ===
              true
          ) {
            await seedDefaultFarePlaces()
          }
        }

        unsubscribe =
          subscribeToFarePlaces(
            (loadedPlaces) => {
              setPlaces(
                loadedPlaces,
              )

              setPlacesLoading(
                false,
              )
            },
            (error) => {
              console.error(
                error,
              )

              setPlacesError(
                'Could not load places from Firebase.',
              )

              setPlacesLoading(
                false,
              )
            },
          )
      } catch (error) {
        console.error(
          error,
        )

        setPlacesError(
          'Could not load pricing settings.',
        )

        setPlacesLoading(
          false,
        )
      }
    }

    loadPlaces()

    return () => {
      unsubscribe()
    }
  }, [])


  const totalRevenue =
    bookings.reduce(
      (sum, booking) =>
        sum +
        Number(
          booking.fare?.total ||
            0,
        ),
      0,
    )

  const paidRevenue =
    bookings
      .filter(
        (booking) =>
          booking.paymentStatus ===
          'Paid',
      )
      .reduce(
        (sum, booking) =>
          sum +
          Number(
            booking.fare?.total ||
              0,
          ),
        0,
      )


  return (
    <main className="dashboard-page">

      <header className="dashboard-header">

        <div>

          <p className="eyebrow">
            TRIPMORE OPERATIONS
          </p>

          <h1>
            Booking dashboard
          </h1>

          <p>
            Manage bookings, places
            and transport pricing.
          </p>

        </div>


        <button
          className="button button-secondary"
          onClick={onBack}
        >
          Back to website
        </button>

      </header>


      {/* STATS */}

      <section className="dashboard-stats">

        <StatCard
          label="Total bookings"
          value={
            bookings.length
          }
          detail="All booking requests"
        />

        <StatCard
          label="Total booking value"
          value={formatINR(
            totalRevenue,
          )}
          detail="Including pending payments"
        />

        <StatCard
          label="Paid revenue"
          value={formatINR(
            paidRevenue,
          )}
          detail="Confirmed payments"
        />

        <StatCard
          label="Active places"
          value={
            places.filter(
              (place) =>
                place.active !==
                false,
            ).length
          }
          detail="Available to customers"
        />

      </section>


      {/* ═════════════════════════════
          PLACES & PRICING
      ═════════════════════════════ */}

      <section className="pricing-manager">

        <div className="dashboard-section-heading">

          <div>

            <p className="eyebrow">
              FARE MANAGEMENT
            </p>

            <h2>
              Places & pricing
            </h2>

            <p>
              Add destinations and
              control the vehicle fare
              shown to customers.
            </p>

          </div>


          <button
            className="button button-primary"
            onClick={() => {
              setEditingPlace(null)
              setShowPlaceForm(true)
            }}
          >
            + Add place
          </button>

        </div>


        {placesError && (
          <p className="login-error">
            {placesError}
          </p>
        )}


        {showPlaceForm && (
          <PlaceForm
            place={editingPlace}
            onClose={() => {
              setShowPlaceForm(
                false,
              )
              setEditingPlace(
                null,
              )
            }}
            onSaved={() => {
              setShowPlaceForm(
                false,
              )
              setEditingPlace(
                null,
              )
            }}
          />
        )}


        {placesLoading ? (
          <div className="dashboard-empty">
            <strong>
              Loading pricing...
            </strong>
          </div>
        ) : (
          <div className="pricing-table-wrap">

            <table className="pricing-table">

              <thead>

                <tr>
                  <th>Place</th>
                  <th>Sedan</th>
                  <th>Innova</th>
                  <th>Tempo Traveller</th>
                  <th>Urbania</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>

              </thead>


              <tbody>

                {places.map(
                  (place) => (

                    <tr
                      key={
                        place.id
                      }
                    >

                      <td>
                        <strong>
                          {place.name}
                        </strong>
                      </td>


                      <td>
                        {formatINR(
                          place.prices
                            ?.sedan ||
                            0,
                        )}
                      </td>


                      <td>
                        {formatINR(
                          place.prices
                            ?.innova ||
                            0,
                        )}
                      </td>


                      <td>
                        {formatINR(
                          place.prices
                            ?.tempo ||
                            0,
                        )}
                      </td>


                      <td>
                        {formatINR(
                          place.prices
                            ?.urbania ||
                            0,
                        )}
                      </td>


                      <td>

                        <span
                          className={`status-badge ${
                            place.active !==
                            false
                              ? 'complete'
                              : 'pending'
                          }`}
                        >
                          {place.active !==
                          false
                            ? 'Active'
                            : 'Hidden'}
                        </span>

                      </td>


                      <td>

                        <div className="pricing-actions">

                          <button
                            type="button"
                            onClick={() => {
                              setEditingPlace(
                                place,
                              )
                              setShowPlaceForm(
                                true,
                              )
                            }}
                          >
                            Edit
                          </button>


                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await toggleFarePlace(
                                  place.id,
                                  !place.active,
                                )
                              } catch (
                                error
                              ) {
                                alert(
                                  'Could not change place status.',
                                )
                              }
                            }}
                          >
                            {place.active !==
                            false
                              ? 'Hide'
                              : 'Show'}
                          </button>


                          <button
                            type="button"
                            className="danger-action"
                            onClick={async () => {

                              const confirmed =
                                window.confirm(
                                  `Delete ${place.name}?`,
                                )

                              if (
                                !confirmed
                              ) {
                                return
                              }

                              try {
                                await deleteFarePlace(
                                  place.id,
                                )
                              } catch (
                                error
                              ) {
                                alert(
                                  'Could not delete this place.',
                                )
                              }
                            }}
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  ),
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>


      {/* ═════════════════════════════
          BOOKINGS
      ═════════════════════════════ */}

      <section className="dashboard-table-section">

        <div className="dashboard-section-heading">

          <div>

            <p className="eyebrow">
              BOOKING RECORDS
            </p>

            <h2>
              Recent bookings
            </h2>

          </div>

          <span className="record-count">
            {bookings.length}{' '}
            records
          </span>

        </div>


        {bookings.length ===
        0 ? (
          <div className="dashboard-empty">

            <strong>
              No bookings yet
            </strong>

            <p>
              New bookings will
              appear here after a
              customer submits the
              booking form.
            </p>

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

                {bookings.map(
                  (booking) => (
                    <BookingRow
                      key={
                        booking.id
                      }
                      booking={
                        booking
                      }
                    />
                  ),
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </main>
  )
}


/* ═══════════════════════════════════
   PLACE FORM
═══════════════════════════════════ */

function PlaceForm({
  place,
  onClose,
  onSaved,
}) {
  const isEditing =
    Boolean(place)

  const [
    name,
    setName,
  ] = useState(
    place?.name || '',
  )

  const [
    prices,
    setPrices,
  ] = useState({
    sedan:
      place?.prices?.sedan ||
      '',
    innova:
      place?.prices?.innova ||
      '',
    tempo:
      place?.prices?.tempo ||
      '',
    urbania:
      place?.prices?.urbania ||
      '',
  })

  const [
    active,
    setActive,
  ] = useState(
    place?.active !== false,
  )

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')


  function updatePrice(
    vehicle,
    value,
  ) {
    setPrices(
      (oldPrices) => ({
        ...oldPrices,
        [vehicle]: value,
      }),
    )
  }


  async function save(
    event,
  ) {
    event.preventDefault()

    setError('')

    if (!name.trim()) {
      setError(
        'Please enter a place name.',
      )
      return
    }

    setSaving(true)

    try {
      if (isEditing) {

        await updateFarePlace(
          place.id,
          {
            name,
            active,
            prices,
          },
        )

      } else {

        await addFarePlace({
          name,
          prices,
        })

      }

      onSaved()

    } catch (error) {
      console.error(
        error,
      )

      setError(
        error.message ||
          'Could not save place.',
      )
    } finally {
      setSaving(false)
    }
  }


  return (
    <form
      className="place-form"
      onSubmit={save}
    >

      <div className="place-form-header">

        <div>

          <p className="eyebrow">
            {isEditing
              ? 'EDIT PLACE'
              : 'NEW PLACE'}
          </p>

          <h3>
            {isEditing
              ? `Edit ${place.name}`
              : 'Add a destination'}
          </h3>

        </div>

        <button
          type="button"
          onClick={onClose}
        >
          ×
        </button>

      </div>


      <label>
        Place name

        <input
          value={name}
          onChange={(event) =>
            setName(
              event.target.value,
            )
          }
          placeholder="e.g. Doda"
          required
        />

      </label>


      <div className="price-input-grid">

        <label>
          Sedan

          <input
            type="number"
            min="0"
            value={
              prices.sedan
            }
            onChange={(event) =>
              updatePrice(
                'sedan',
                event.target.value,
              )
            }
            placeholder="3500"
            required
          />

        </label>


        <label>
          Innova

          <input
            type="number"
            min="0"
            value={
              prices.innova
            }
            onChange={(event) =>
              updatePrice(
                'innova',
                event.target.value,
              )
            }
            placeholder="4000"
            required
          />

        </label>


        <label>
          Tempo Traveller

          <input
            type="number"
            min="0"
            value={
              prices.tempo
            }
            onChange={(event) =>
              updatePrice(
                'tempo',
                event.target.value,
              )
            }
            placeholder="5500"
            required
          />

        </label>


        <label>
          Urbania

          <input
            type="number"
            min="0"
            value={
              prices.urbania
            }
            onChange={(event) =>
              updatePrice(
                'urbania',
                event.target.value,
              )
            }
            placeholder="7000"
            required
          />

        </label>

      </div>


      {isEditing && (
        <label className="checkbox-label">

          <input
            type="checkbox"
            checked={active}
            onChange={(event) =>
              setActive(
                event.target.checked,
              )
            }
          />

          Show this place to
          customers

        </label>
      )}


      {error && (
        <p className="login-error">
          {error}
        </p>
      )}


      <div className="place-form-actions">

        <button
          type="button"
          className="button button-secondary"
          onClick={onClose}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="button button-primary"
          disabled={saving}
        >
          {saving
            ? 'Saving...'
            : isEditing
              ? 'Save changes'
              : 'Add place'}
        </button>

      </div>

    </form>
  )
}


/* ═══════════════════════════════════
   LOGIN
═══════════════════════════════════ */

function DashboardLogin({
  onBack,
}) {
  const [
    email,
    setEmail,
  ] = useState('')

  const [
    password,
    setPassword,
  ] = useState('')

  const [
    error,
    setError,
  ] = useState('')


  async function login(
    event,
  ) {
    event.preventDefault()

    setError('')

    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password,
      )

      window.location.reload()

    } catch {
      setError(
        'Login failed. Check the company email and password.',
      )
    }
  }


  return (
    <main className="dashboard-login-page">

      <form
        className="dashboard-login"
        onSubmit={login}
      >

        <p className="eyebrow">
          TRIPMORE OPERATIONS
        </p>

        <h1>
          Company dashboard
        </h1>

        <p>
          Sign in to manage bookings
          and transport pricing.
        </p>


        <label>
          Email address

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value,
              )
            }
            required
          />

        </label>


        <label>
          Password

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value,
              )
            }
            required
          />

        </label>


        {error && (
          <p className="login-error">
            {error}
          </p>
        )}


        <button
          className="button button-primary"
          type="submit"
        >
          Sign in
        </button>


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


/* ═══════════════════════════════════
   STAT CARD
═══════════════════════════════════ */

function StatCard({
  label,
  value,
  detail,
}) {
  return (
    <article className="stat-card">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        {detail}
      </small>

    </article>
  )
}


/* ═══════════════════════════════════
   BOOKING ROW
═══════════════════════════════════ */

function BookingRow({
  booking,
}) {
  const bookingDate =
    booking.createdAt?.toDate
      ? booking.createdAt.toDate()
      : new Date(
          booking.createdAt,
        )

  return (
    <tr>

      <td>

        <strong>
          {booking.id}
        </strong>

        <small>
          {bookingDate.toLocaleDateString(
            'en-IN',
          )}
        </small>

      </td>


      <td>

        <strong>
          {booking.customer.name}
        </strong>

        <small>
          {booking.customer.email}
          <br />
          {booking.customer.phone}
        </small>

      </td>


      <td>

        <strong>
          {booking.tour.name}
        </strong>

        <small>
          {booking.vehicle.name}{' '}
          · {booking.days}{' '}
          {booking.days === 1
            ? 'day'
            : 'days'}
        </small>

      </td>


      <td>

        <strong>
          {formatINR(
            booking.fare.total,
          )}
        </strong>

        <small>
          Transport fare
        </small>

      </td>


      <td>
        <StatusBadge
          status={
            booking.paymentStatus
          }
        />
      </td>


      <td className="notification-statuses">

        <small>
          Customer email{' '}
          <StatusBadge
            status={
              booking.customerEmailStatus
            }
          />
        </small>

        <small>
          Customer WhatsApp{' '}
          <StatusBadge
            status={
              booking.customerWhatsappStatus
            }
          />
        </small>

        <small>
          Company email{' '}
          <StatusBadge
            status={
              booking.companyEmailStatus
            }
          />
        </small>

        <small>
          Company WhatsApp{' '}
          <StatusBadge
            status={
              booking.companyWhatsappStatus
            }
          />
        </small>

      </td>

    </tr>
  )
}


/* ═══════════════════════════════════
   STATUS
═══════════════════════════════════ */

function StatusBadge({
  status,
}) {
  const isComplete =
    status === 'Paid' ||
    status === 'Sent'

  return (
    <span
      className={`status-badge ${
        isComplete
          ? 'complete'
          : 'pending'
      }`}
    >
      {status}
    </span>
  )
}