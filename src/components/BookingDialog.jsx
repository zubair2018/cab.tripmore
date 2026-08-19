import { useEffect, useState } from 'react'

import {
  vehicles,
} from '../data/vehicles'

import {
  subscribeToFarePlaces,
} from '../services/farePlaces'

import {
  calculateFare,
  formatINR,
} from '../utils/calculateFare'

export default function BookingDialog({
  onClose,
  onBook,
  error,
}) {
  const [
    places,
    setPlaces,
  ] = useState([])

  const [
    vehicle,
    setVehicle,
  ] = useState(vehicles[0])

  const [
    tour,
    setTour,
  ] = useState(null)

  const [
    days,
    setDays,
  ] = useState(2)

  const [
    routes,
    setRoutes,
  ] = useState([
    {
      from: '',
      to: '',
    },
    {
      from: '',
      to: '',
    },
  ])

  const [
    customer,
    setCustomer,
  ] = useState({
    name: '',
    email: '',
    phone: '',
  })


  /*
  |--------------------------------------------------------------------------
  | Load places from Firebase
  |--------------------------------------------------------------------------
  |
  | If admin adds a new place, the booking dialog automatically
  | receives it without changing the code.
  |
  */

  useEffect(() => {
    const unsubscribe =
      subscribeToFarePlaces(
        (loadedPlaces) => {
          const activePlaces =
            loadedPlaces.filter(
              (place) =>
                place.active !== false,
            )

          setPlaces(activePlaces)

          setTour((currentTour) => {
            if (!activePlaces.length) {
              return null
            }

            if (!currentTour) {
              return activePlaces[0]
            }

            const updated =
              activePlaces.find(
                (place) =>
                  place.id ===
                  currentTour.id,
              )

            return (
              updated ||
              activePlaces[0]
            )
          })
        },
        (firebaseError) => {
          console.error(
            'Could not load fare places.',
            firebaseError,
          )
        },
      )

    return () => unsubscribe()
  }, [])


  /*
  |--------------------------------------------------------------------------
  | Fare calculation
  |--------------------------------------------------------------------------
  */

  const fare =
    calculateFare({
      vehicle,
      days,
      tour,
      routes,
    })


  /*
  |--------------------------------------------------------------------------
  | Days
  |--------------------------------------------------------------------------
  */

  function changeDays(
    nextDays,
  ) {
    const safeDays =
      Math.min(
        14,
        Math.max(
          1,
          nextDays,
        ),
      )

    setDays(safeDays)

    setRoutes(
      (oldRoutes) =>
        Array.from(
          {
            length:
              safeDays,
          },
          (_, index) =>
            oldRoutes[index] ||
            {
              from: '',
              to: '',
            },
        ),
    )
  }


  /*
  |--------------------------------------------------------------------------
  | Route
  |--------------------------------------------------------------------------
  */

  function changeRoute(
    dayIndex,
    field,
    value,
  ) {
    setRoutes(
      (oldRoutes) =>
        oldRoutes.map(
          (route, index) =>
            index === dayIndex
              ? {
                  ...route,
                  [field]:
                    value,
                }
              : route,
        ),
    )
  }


  /*
  |--------------------------------------------------------------------------
  | Customer
  |--------------------------------------------------------------------------
  */

  function updateCustomer(
    field,
    value,
  ) {
    setCustomer(
      (oldCustomer) => ({
        ...oldCustomer,
        [field]: value,
      }),
    )
  }


  /*
  |--------------------------------------------------------------------------
  | Booking
  |--------------------------------------------------------------------------
  */

  function confirmBooking() {
    if (!tour) {
      return
    }

    onBook({
      id: `TRP-${Date.now()
        .toString()
        .slice(-6)}`,

      customer,

      vehicle,

      days,

      /*
       * Store the actual place and its price
       * at the time of booking.
       */
      tour,

      routes,

      fare,

      paymentStatus:
        'Pending',

      customerEmailStatus:
        'Pending',

      customerWhatsappStatus:
        'Pending',

      companyEmailStatus:
        'Pending',

      companyWhatsappStatus:
        'Pending',

      createdAt:
        new Date().toISOString(),
    })
  }


  return (
    <div
      className="booking-overlay"
      onMouseDown={onClose}
    >
      <section
        className="booking-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        <button
          className="dialog-close"
          onClick={onClose}
          aria-label="Close booking dialog"
        >
          ×
        </button>


        {/* INTRO */}

        <div className="dialog-intro">

          <p className="eyebrow">
            YOUR TRANSPORT PLAN
          </p>

          <h2 id="booking-title">
            Build your perfect ride.
          </h2>

          <p>
            Choose your destination,
            select your vehicle, and
            see the exact fare upfront.
          </p>

        </div>


        {/* VEHICLE */}

        <StepTitle
          number="1"
          title="Choose your vehicle"
        />

        <VehiclePicker
          selectedVehicle={vehicle}
          selectedTour={tour}
          onSelect={setVehicle}
        />


        {/* JOURNEY */}

        <StepTitle
          number="2"
          title="Set your journey"
        />

        <JourneySettings
          days={days}
          tour={tour}
          places={places}
          onChangeDays={changeDays}
          onChangeTour={setTour}
        />


        {/* ROUTES */}

        <RouteTable
          routes={routes}
          places={places}
          onChangeRoute={
            changeRoute
          }
        />


        {/* CUSTOMER */}

        <CustomerDetails
          customer={customer}
          onChange={
            updateCustomer
          }
        />


        {error && (
          <p className="booking-error">
            {error}
          </p>
        )}


        {/* FARE */}

        <FarePanel
          vehicle={vehicle}
          days={days}
          fare={fare}
          customerCanBook={Boolean(
            customer.name &&
            customer.email &&
            customer.phone &&
            tour,
          )}
          onBook={
            confirmBooking
          }
        />

      </section>
    </div>
  )
}


/* ═══════════════════════════════
   STEP TITLE
═══════════════════════════════ */

function StepTitle({
  number,
  title,
}) {
  return (
    <div className="dialog-step">
      <span>{number}</span>
      <strong>{title}</strong>
    </div>
  )
}


/* ═══════════════════════════════
   VEHICLE PICKER
═══════════════════════════════ */

function VehiclePicker({
  selectedVehicle,
  selectedTour,
  onSelect,
}) {
  return (
    <div className="vehicle-tabs">

      {vehicles.map(
        (vehicle) => {

          const price =
            selectedTour
              ? Number(
                  selectedTour
                    .prices?.[
                    vehicle.id
                  ],
                ) || 0
              : 0

          return (
            <button
              key={vehicle.id}
              type="button"
              className={`vehicle-tab ${
                selectedVehicle.id ===
                vehicle.id
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                onSelect(
                  vehicle,
                )
              }
            >

              <i>
                {vehicle.icon}
              </i>

              <strong>
                {vehicle.name}
              </strong>

              <small>
                {vehicle.seats}
              </small>

              <b>
                {formatINR(
                  price,
                )}

                <em>
                  / tour
                </em>
              </b>

            </button>
          )
        },
      )}

    </div>
  )
}


/* ═══════════════════════════════
   JOURNEY SETTINGS
═══════════════════════════════ */

function JourneySettings({
  days,
  tour,
  places,
  onChangeDays,
  onChangeTour,
}) {
  return (
    <div className="journey-controls">

      <div className="days-control">

        <div>

          <label>
            Number of days
          </label>

          <small>
            Each day uses the
            selected destination rate.
          </small>

        </div>


        <div className="day-counter">

          <button
            type="button"
            onClick={() =>
              onChangeDays(
                days - 1,
              )
            }
            aria-label="Remove a day"
          >
            −
          </button>

          <b>{days}</b>

          <button
            type="button"
            onClick={() =>
              onChangeDays(
                days + 1,
              )
            }
            aria-label="Add a day"
          >
            +
          </button>

        </div>

      </div>


      <label className="city-select">

        Day tour

        <select
          value={
            tour?.id || ''
          }
          onChange={(event) => {

            const selected =
              places.find(
                (place) =>
                  place.id ===
                  event.target.value,
              )

            onChangeTour(
              selected || null,
            )
          }}
        >

          {!places.length && (
            <option value="">
              Loading places...
            </option>
          )}

          {places.map(
            (place) => (
              <option
                key={place.id}
                value={place.id}
              >
                Srinagar to{' '}
                {place.name}
              </option>
            ),
          )}

        </select>

      </label>

    </div>
  )
}


/* ═══════════════════════════════
   ROUTE TABLE
═══════════════════════════════ */

function RouteTable({
  routes,
  places,
  onChangeRoute,
}) {
  return (
    <div className="route-plan">

      <div className="route-heading">

        <span>
          DAY
        </span>

        <span>
          FROM
        </span>

        <span>
          TO
        </span>

      </div>


      {routes.map(
        (route, index) => (

          <div
            className="route-row"
            key={index}
          >

            <strong>
              Day {index + 1}
            </strong>


            <PlaceSelect
              value={
                route.from
              }
              places={places}
              onChange={(
                value,
              ) =>
                onChangeRoute(
                  index,
                  'from',
                  value,
                )
              }
            />


            <PlaceSelect
              value={
                route.to
              }
              places={places}
              onChange={(
                value,
              ) =>
                onChangeRoute(
                  index,
                  'to',
                  value,
                )
              }
            />

          </div>

        ),
      )}

    </div>
  )
}


/* ═══════════════════════════════
   PLACE SELECT
═══════════════════════════════ */

function PlaceSelect({
  value,
  places,
  onChange,
}) {
  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(
          event.target.value,
        )
      }
    >

      <option value="">
        Select place
      </option>

      {places.map(
        (place) => (
          <option
            key={place.id}
            value={place.name}
          >
            {place.name}
          </option>
        ),
      )}

    </select>
  )
}


/* ═══════════════════════════════
   CUSTOMER DETAILS
═══════════════════════════════ */

function CustomerDetails({
  customer,
  onChange,
}) {
  return (
    <div className="customer-details">

      <StepTitle
        number="3"
        title="Customer details"
      />

      <div className="customer-fields">

        <label>
          Full name

          <input
            required
            value={
              customer.name
            }
            onChange={(event) =>
              onChange(
                'name',
                event.target.value,
              )
            }
            placeholder="Enter customer name"
          />

        </label>


        <label>
          Email address

          <input
            required
            type="email"
            value={
              customer.email
            }
            onChange={(event) =>
              onChange(
                'email',
                event.target.value,
              )
            }
            placeholder="name@example.com"
          />

        </label>


        <label>
          WhatsApp number

          <input
            required
            type="tel"
            value={
              customer.phone
            }
            onChange={(event) =>
              onChange(
                'phone',
                event.target.value,
              )
            }
            placeholder="+91 00000 00000"
          />

        </label>
      </div>

    </div>
  )
}


/* ═══════════════════════════════
   FARE PANEL
═══════════════════════════════ */

function FarePanel({
  vehicle,
  days,
  fare,
  customerCanBook,
  onBook,
}) {
  return (
    <div className="fare-panel">

      <div>

        <span>
          YOUR TRANSPORT FARE
        </span>

        <strong>
          {formatINR(
            fare.total,
          )}
        </strong>

        <small>
          {vehicle.name} ·{' '}
          {days}{' '}
          {days === 1
            ? 'tour day'
            : 'tour days'}
        </small>


        {fare.jammuLocalCharge >
          0 && (
          <small>
            Includes ₹1,000 Jammu
            local pickup & drop
            charge
          </small>
        )}

      </div>


      <button
        type="button"
        className="button button-primary"
        onClick={onBook}
        disabled={
          !customerCanBook
        }
      >
        Book this cab{' '}
        <span>→</span>
      </button>

    </div>
  )
}