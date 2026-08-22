import { useEffect, useState } from 'react'

import {
  vehicles as defaultVehicles,
} from '../data/vehicles'

import {
  defaultCatalog,
  subscribeToCatalog,
} from '../services/catalog'

import {
  formatINR,
} from '../utils/calculateFare'

import '../styles/booking-dialog.css'


/*
|--------------------------------------------------------------------------
| Create empty journey rows
|--------------------------------------------------------------------------
*/

function makeRoutes(days) {
  return Array.from(
    { length: days },
    () => ({
      from: '',
      to: '',
    }),
  )
}


/*
|--------------------------------------------------------------------------
| Normalize place name
|--------------------------------------------------------------------------
|
| Converts:
|
| Srinagar
| srinagar
|  Srinagar
|
| into the same comparison value.
|
|--------------------------------------------------------------------------
*/

function normalizePlace(place) {
  return String(place || '')
    .trim()
    .toLowerCase()
}


/*
|--------------------------------------------------------------------------
| Find route price
|--------------------------------------------------------------------------
|
| For one-day journeys:
|
| catalog.prices[1] contains:
|
| {
|   gulmarg: {
|     sedan: 3500,
|     innova: 4000
|   },
|   pahalgam: {
|     ...
|   }
| }
|
| This function dynamically finds the destination key.
|
| Therefore, if the admin adds:
|
| Doodhpathri
|
| with:
|
| sedan: 4000
| innova: 4500
|
| the booking dialog automatically uses it.
|
|--------------------------------------------------------------------------
*/

function getOneDayRoutePrice(
  prices,
  from,
  to,
  vehicleId,
) {
  if (
    !prices ||
    !vehicleId ||
    !from ||
    !to
  ) {
    return 0
  }

  const fromKey =
    normalizePlace(from)

  const toKey =
    normalizePlace(to)

  /*
  |--------------------------------------------------------------------------
  | Same-place route
  |--------------------------------------------------------------------------
  |
  | Example:
  |
  | Srinagar → Srinagar
  |
  | Try to find a matching route using the place name.
  |
  |--------------------------------------------------------------------------
  */

  const dayOnePrices =
    prices?.[1] || {}

  /*
  |--------------------------------------------------------------------------
  | First: direct destination match
  |--------------------------------------------------------------------------
  |
  | Example:
  |
  | Srinagar → Gulmarg
  |
  | Gulmarg → Srinagar
  |
  | Both use:
  |
  | prices[1].gulmarg
  |
  |--------------------------------------------------------------------------
  */

  const destinationKeys =
    Object.keys(dayOnePrices)

  for (
    const routeKey of destinationKeys
  ) {
    const normalizedRouteKey =
      normalizePlace(routeKey)

    /*
    |--------------------------------------------------------------------------
    | Direct destination match
    |--------------------------------------------------------------------------
    */

    if (
      normalizedRouteKey ===
      toKey
    ) {
      const routePrice =
        dayOnePrices[
          routeKey
        ]

      if (
        routePrice &&
        typeof routePrice === 'object'
      ) {
        return Number(
          routePrice?.[
            vehicleId
          ] || 0,
        )
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Special handling for Srinagar Local Sightseeing
  |--------------------------------------------------------------------------
  |
  | The dashboard may store it as:
  |
  | srinagar-local
  |
  | while the place selector displays:
  |
  | Srinagar Local Sightseeing
  |
  |--------------------------------------------------------------------------
  */

  if (
    toKey ===
      'srinagar local sightseeing' ||
    toKey ===
      'srinagar-local'
  ) {
    const localPrice =
      dayOnePrices?.[
        'srinagar-local'
      ]

    if (
      localPrice &&
      typeof localPrice === 'object'
    ) {
      return Number(
        localPrice?.[
          vehicleId
        ] || 0,
      )
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Airport is normally bidirectional
  |--------------------------------------------------------------------------
  |
  | Srinagar → Airport
  |
  | Airport → Srinagar
  |
  | both use:
  |
  | prices[1].airport
  |
  |--------------------------------------------------------------------------
  */

  if (
    fromKey === 'airport' ||
    toKey === 'airport'
  ) {
    const airportPrice =
      dayOnePrices?.airport

    if (
      airportPrice &&
      typeof airportPrice === 'object'
    ) {
      return Number(
        airportPrice?.[
          vehicleId
        ] || 0,
      )
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Reverse journey support
  |--------------------------------------------------------------------------
  |
  | If the selected route is:
  |
  | Gulmarg → Srinagar
  |
  | the price should still come from:
  |
  | prices[1].gulmarg
  |
  |--------------------------------------------------------------------------
  */

  for (
    const routeKey of destinationKeys
  ) {
    const normalizedRouteKey =
      normalizePlace(routeKey)

    if (
      normalizedRouteKey ===
      fromKey
    ) {
      const routePrice =
        dayOnePrices[
          routeKey
        ]

      if (
        routePrice &&
        typeof routePrice === 'object'
      ) {
        return Number(
          routePrice?.[
            vehicleId
          ] || 0,
        )
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | No configured price
  |--------------------------------------------------------------------------
  */

  return 0
}


/*
|--------------------------------------------------------------------------
| Booking Dialog
|--------------------------------------------------------------------------
*/

export default function BookingDialog({
  onClose,
  onBook,
  error,
}) {
  const [catalog, setCatalog] =
    useState(defaultCatalog)

  const [vehicle, setVehicle] =
    useState(
      defaultVehicles[0] || null,
    )

  const [days, setDays] =
    useState(1)

  const [routes, setRoutes] =
    useState(
      makeRoutes(1),
    )

  const [customer, setCustomer] =
    useState({
      name: '',
      email: '',
      phone: '',
    })

  const [showTerms, setShowTerms] =
    useState(false)

  const [validationErrors, setValidationErrors] =
    useState({})


  /*
  |--------------------------------------------------------------------------
  | Load Firebase catalog
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const unsubscribe =
      subscribeToCatalog(
        (nextCatalog) => {
          setCatalog(nextCatalog)
        },
        (catalogError) => {
          console.error(
            'Could not load TripMore catalog.',
            catalogError,
          )
        },
      )

    return unsubscribe
  }, [])


  /*
  |--------------------------------------------------------------------------
  | Vehicles
  |--------------------------------------------------------------------------
  |
  | Vehicles can now also come from the dashboard.
  |
  |--------------------------------------------------------------------------
  */

  const vehicles =
    catalog?.vehicles?.length
      ? catalog.vehicles
      : defaultVehicles


  /*
  |--------------------------------------------------------------------------
  | Places
  |--------------------------------------------------------------------------
  */

  const places =
    catalog?.places?.length
      ? catalog.places
      : defaultCatalog.places


  /*
  |--------------------------------------------------------------------------
  | Keep selected vehicle synchronized
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!vehicles.length) {
      setVehicle(null)
      return
    }

    const selectedVehicle =
      vehicles.find(
        (item) =>
          item.id ===
          vehicle?.id,
      )

    if (selectedVehicle) {
      setVehicle(
        selectedVehicle,
      )
      return
    }

    setVehicle(
      vehicles[0],
    )
  }, [
    catalog?.vehicles,
    vehicle?.id,
  ])


  /*
  |--------------------------------------------------------------------------
  | Calculate price for a specific vehicle
  |--------------------------------------------------------------------------
  */

  function getPriceForVehicle(
    selectedVehicle,
  ) {
    if (
      !catalog?.prices ||
      !selectedVehicle
    ) {
      return 0
    }


    /*
    |--------------------------------------------------------------------------
    | One-day booking
    |--------------------------------------------------------------------------
    */

    if (days === 1) {
      const route =
        routes[0]

      if (
        !route?.from ||
        !route?.to
      ) {
        return 0
      }

      return getOneDayRoutePrice(
        catalog.prices,
        route.from,
        route.to,
        selectedVehicle.id,
      )
    }


    /*
    |--------------------------------------------------------------------------
    | Multiple-day package
    |--------------------------------------------------------------------------
    |
    | For 2+ days the price is based on:
    |
    | number of days + vehicle
    |
    |--------------------------------------------------------------------------
    */

    return Number(
      catalog.prices?.[
        days
      ]?.[
        selectedVehicle.id
      ] || 0,
    )
  }


  /*
  |--------------------------------------------------------------------------
  | Current selected vehicle price
  |--------------------------------------------------------------------------
  */

  const currentPrice =
    getPriceForVehicle(
      vehicle,
    )


  /*
  |--------------------------------------------------------------------------
  | Fare
  |--------------------------------------------------------------------------
  */

  const fare = {
    base: currentPrice,
    total: currentPrice,
  }


  /*
  |--------------------------------------------------------------------------
  | Update number of days
  |--------------------------------------------------------------------------
  */

  function changeDays(
    nextDays,
  ) {
    const newDays =
      Math.max(
        1,
        Math.min(
          14,
          nextDays,
        ),
      )

    setDays(
      newDays,
    )

    setRoutes(
      (oldRoutes) =>
        Array.from(
          {
            length:
              newDays,
          },
          (
            _,
            index,
          ) =>
            oldRoutes[index] || {
              from: '',
              to: '',
            },
        ),
    )

    setValidationErrors({})
  }


  /*
  |--------------------------------------------------------------------------
  | Update route
  |--------------------------------------------------------------------------
  */

  function updateRoute(
    index,
    field,
    value,
  ) {
    setRoutes(
      (oldRoutes) =>
        oldRoutes.map(
          (
            route,
            routeIndex,
          ) =>
            routeIndex ===
            index
              ? {
                  ...route,
                  [field]:
                    value,
                }
              : route,
        ),
    )

    setValidationErrors(
      (oldErrors) => ({
        ...oldErrors,
        routes: '',
        price: '',
      }),
    )
  }


  /*
  |--------------------------------------------------------------------------
  | Update customer
  |--------------------------------------------------------------------------
  */

  function updateCustomer(
    field,
    value,
  ) {
    setCustomer(
      (oldCustomer) => ({
        ...oldCustomer,
        [field]:
          value,
      }),
    )

    setValidationErrors(
      (oldErrors) => ({
        ...oldErrors,
        [field]: '',
      }),
    )
  }


  /*
  |--------------------------------------------------------------------------
  | Validate booking
  |--------------------------------------------------------------------------
  */

  function validateBooking() {
    const errors = {}

    const incompleteRoute =
      routes.some(
        (route) =>
          !route.from ||
          !route.to,
      )

    if (incompleteRoute) {
      errors.routes =
        'Please select both From and To for every journey day.'
    }


    if (!customer.name.trim()) {
      errors.name =
        'Please enter your full name.'
    }


    if (!customer.email.trim()) {
      errors.email =
        'Please enter your email address.'
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        customer.email.trim(),
      )
    ) {
      errors.email =
        'Please enter a valid email address.'
    }


    if (!customer.phone.trim()) {
      errors.phone =
        'Please enter your WhatsApp number.'
    }


    if (!vehicle) {
      errors.vehicle =
        'Please select a vehicle.'
    }


    if (currentPrice <= 0) {
      errors.price =
        'No fare is configured for this journey and vehicle. Please choose another route or contact TripMore.'
    }


    setValidationErrors(
      errors,
    )

    return (
      Object.keys(errors).length ===
      0
    )
  }


  /*
  |--------------------------------------------------------------------------
  | Submit booking
  |--------------------------------------------------------------------------
  */

  function submitBooking() {
    const isValid =
      validateBooking()

    if (!isValid) {
      return
    }

    onBook({
      id: `TRP-${Date.now()
        .toString()
        .slice(-6)}`,

      customer,

      vehicle,

      days,

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


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className="booking-overlay"
      onMouseDown={
        onClose
      }
    >
      <section
        className="booking-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        onMouseDown={(
          event,
        ) =>
          event.stopPropagation()
        }
      >

        {/* CLOSE */}

        <button
          className="dialog-close"
          type="button"
          onClick={
            onClose
          }
          aria-label="Close booking form"
        >
          ×
        </button>


        {/* INTRO */}

        <div className="dialog-intro">

          <p className="eyebrow">
            TRIPMORE CAB SERVICE
          </p>

          <h2 id="booking-title">
            Plan your Kashmir ride.
          </h2>

          <p>
            Select your vehicle,
            journey and details
            to book your cab.
          </p>

        </div>


        {/* VEHICLES */}

        <StepTitle
          number="1"
          title="Choose a vehicle"
        />

        {validationErrors.vehicle && (
          <p className="booking-validation-error">
            {validationErrors.vehicle}
          </p>
        )}

        <div className="vehicle-tabs">

          {vehicles.map(
            (option) => {
              const vehiclePrice =
                getPriceForVehicle(
                  option,
                )

              const isSelected =
                vehicle?.id ===
                option.id

              return (
                <button
                  className={`vehicle-tab ${
                    isSelected
                      ? 'active'
                      : ''
                  }`}
                  type="button"
                  key={
                    option.id
                  }
                  onClick={() => {
                    setVehicle(
                      option,
                    )

                    setValidationErrors(
                      (oldErrors) => ({
                        ...oldErrors,
                        vehicle: '',
                        price: '',
                      }),
                    )
                  }}
                >

                  <i>
                    {
                      option.icon
                    }
                  </i>

                  <strong>
                    {
                      option.name
                    }
                  </strong>

                  <small>
                    {
                      option.seats
                    }
                    {' · '}
                    {
                      option.luggage
                    }
                  </small>

                  <b>
                    {vehiclePrice > 0
                      ? formatINR(
                          vehiclePrice,
                        )
                      : 'Select journey'}

                    {vehiclePrice > 0 && (
                      <em>
                        {' '}
                        total
                      </em>
                    )}
                  </b>

                </button>
              )
            },
          )}

        </div>


        {/* JOURNEY */}

        <StepTitle
          number="2"
          title="Set your journey"
        />

        <div className="journey-controls">

          <div className="days-control">

            <label>
              Number of days
            </label>

            <div className="day-counter">

              <button
                type="button"
                onClick={() =>
                  changeDays(
                    days - 1,
                  )
                }
                aria-label="Remove a day"
              >
                −
              </button>

              <strong>
                {days}
              </strong>

              <button
                type="button"
                onClick={() =>
                  changeDays(
                    days + 1,
                  )
                }
                aria-label="Add a day"
              >
                +
              </button>

            </div>

          </div>

        </div>


        {/* JOURNEY ROUTES */}

        <div className="route-plan">

          <div className="route-heading">

            <span>
              Day
            </span>

            <span>
              From
            </span>

            <span>
              To
            </span>

          </div>


          {routes.map(
            (
              route,
              index,
            ) => (

              <div
                className="route-row"
                key={
                  index
                }
              >

                <strong>
                  Day{' '}
                  {index + 1}
                </strong>


                <PlaceSelect
                  places={
                    places
                  }
                  value={
                    route.from
                  }
                  onChange={(
                    value,
                  ) =>
                    updateRoute(
                      index,
                      'from',
                      value,
                    )
                  }
                />


                <PlaceSelect
                  places={
                    places
                  }
                  value={
                    route.to
                  }
                  onChange={(
                    value,
                  ) =>
                    updateRoute(
                      index,
                      'to',
                      value,
                    )
                  }
                />

              </div>

            ),
          )}

          {validationErrors.routes && (
            <p className="booking-validation-error">
              {validationErrors.routes}
            </p>
          )}

          {validationErrors.price && (
            <p className="booking-validation-error">
              {validationErrors.price}
            </p>
          )}

        </div>


        {/* CUSTOMER DETAILS */}

        <StepTitle
          number="3"
          title="Your details"
        />


        <div className="customer-fields">

          <CustomerField
            label="Full name"
            value={
              customer.name
            }
            error={
              validationErrors.name
            }
            onChange={(
              value,
            ) =>
              updateCustomer(
                'name',
                value,
              )
            }
          />


          <CustomerField
            label="Email address"
            type="email"
            value={
              customer.email
            }
            error={
              validationErrors.email
            }
            onChange={(
              value,
            ) =>
              updateCustomer(
                'email',
                value,
              )
            }
          />


          <CustomerField
            label="WhatsApp number"
            type="tel"
            value={
              customer.phone
            }
            error={
              validationErrors.phone
            }
            onChange={(
              value,
            ) =>
              updateCustomer(
                'phone',
                value,
              )
            }
          />

        </div>


        {/* ERROR FROM PARENT */}

        {error && (
          <p className="booking-error">
            {error}
          </p>
        )}


        {/* FARE */}

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
              {
                vehicle?.name
              }
              {' · '}
              {days}{' '}
              {
                days === 1
                  ? 'day'
                  : 'days'
              }
            </small>

          </div>


          <button
            className="button button-primary"
            type="button"
            onClick={
              submitBooking
            }
          >
            Book my cab →
          </button>


          {/* TERMS */}

          <div className="terms-section">

            <button
              className="terms-button"
              type="button"
              onClick={() =>
                setShowTerms(
                  !showTerms,
                )
              }
            >
              {showTerms
                ? 'Hide Terms & Conditions'
                : 'Terms & Conditions'}
            </button>


            {showTerms && (

              <div className="terms-box">

                <h3>
                  Terms & Conditions
                </h3>

                <ol>

                  <li>
                    Booking requests are
                    subject to vehicle
                    availability.
                  </li>

                  <li>
                    The displayed fare is
                    based on the selected
                    vehicle, number of days
                    and journey details.
                  </li>

                  <li>
                    Any change in the
                    journey after booking
                    may affect the final
                    fare.
                  </li>

                  <li>
                    The customer must
                    provide accurate contact
                    information.
                  </li>

                  <li>
                    A booking is confirmed
                    only after confirmation
                    from TripMore.
                  </li>

                  <li>
                    The customer should be
                    available at the agreed
                    pickup location and
                    reporting time.
                  </li>

                  <li>
                    Additional charges may
                    apply if the journey is
                    changed, extended or
                    requires additional
                    services.
                  </li>

                  <li>
                    TripMore may modify or
                    cancel a booking because
                    of vehicle availability,
                    weather, road conditions
                    or other unforeseen
                    circumstances.
                  </li>

                  <li>
                    The final booking amount
                    and payment terms will be
                    communicated during booking
                    confirmation.
                  </li>

                </ol>

              </div>

            )}

          </div>

        </div>

      </section>
    </div>
  )
}


/*
|--------------------------------------------------------------------------
| Step title
|--------------------------------------------------------------------------
*/

function StepTitle({
  number,
  title,
}) {
  return (
    <div className="dialog-step">

      <span>
        {number}
      </span>

      <strong>
        {title}
      </strong>

    </div>
  )
}


/*
|--------------------------------------------------------------------------
| Place selector
|--------------------------------------------------------------------------
|
| Places are received directly from the Firebase catalog.
|
| Therefore:
|
| Dashboard adds:
|
| Doodhpathri
|
| ↓
|
| Firebase catalog.places
|
| ↓
|
| BookingDialog
|
| ↓
|
| Doodhpathri appears here automatically.
|
|--------------------------------------------------------------------------
*/

function PlaceSelect({
  places,
  value,
  onChange,
}) {
  return (
    <select
      value={
        value || ''
      }
      onChange={(
        event,
      ) =>
        onChange(
          event.target.value,
        )
      }
      aria-label="Select place"
    >

      <option value="">
        Select place
      </option>

      {places.map(
        (place) => (

          <option
            key={place}
            value={place}
          >
            {place}
          </option>

        ),
      )}

    </select>
  )
}


/*
|--------------------------------------------------------------------------
| Customer field
|--------------------------------------------------------------------------
*/

function CustomerField({
  label,
  type = 'text',
  value,
  error,
  onChange,
}) {
  return (
    <label
      className={
        error
          ? 'field-error'
          : ''
      }
    >

      <span>
        {label}
        <b aria-hidden="true">
          {' '}*
        </b>
      </span>

      <input
        type={type}
        value={value}
        onChange={(
          event,
        ) =>
          onChange(
            event.target.value,
          )
        }
        required
        aria-invalid={
          Boolean(error)
        }
      />

      {error && (
        <small>
          {error}
        </small>
      )}

    </label>
  )
}