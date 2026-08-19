import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  vehicles as defaultVehicles,
} from '../data/vehicles'

import {
  calculateFare,
  formatINR,
} from '../utils/calculateFare'

import {
  defaultCatalog,
  subscribeToCatalog,
} from '../services/catalog'

function makeRoutes(
  days,
  tour,
) {
  return Array.from(
    { length: days },
    () => ({
      from:
        tour?.origin ||
        'Srinagar',

      to:
        tour?.destination ||
        '',
    }),
  )
}

export default function BookingDialog({
  onClose,
  onBook,
  error,
}) {
  const [catalog, setCatalog] =
    useState(defaultCatalog)

  const [vehicle, setVehicle] =
    useState(
      defaultVehicles[0],
    )

  const [tour, setTour] =
    useState(
      defaultCatalog.tours[0],
    )

  const [days, setDays] =
    useState(1)

  const [routes, setRoutes] =
    useState(
      makeRoutes(
        1,
        defaultCatalog.tours[0],
      ),
    )

  const [customer, setCustomer] =
    useState({
      name: '',
      email: '',
      phone: '',
    })

  /*
   * Load places, tours and prices
   * from Firebase in real time.
   */
  useEffect(() => {
    const unsubscribe =
      subscribeToCatalog(
        (nextCatalog) => {
          setCatalog(
            nextCatalog,
          )
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
   * Convert the Firebase catalog
   * into the same vehicle structure
   * already used by the application.
   */
  const vehicles =
    useMemo(() => {
      return defaultVehicles.map(
        (vehicleItem) => ({
          ...vehicleItem,

          prices:
            Object.fromEntries(
              catalog.tours.map(
                (tourItem) => [
                  tourItem.id,

                  Number(
                    tourItem
                      .prices?.[
                      vehicleItem
                        .id
                    ] || 0,
                  ),
                ],
              ),
            ),
        }),
      )
    }, [
      catalog.tours,
    ])

  /*
   * Keep selected vehicle synced
   * with the updated vehicle list.
   */
  useEffect(() => {
    const updatedVehicle =
      vehicles.find(
        (item) =>
          item.id ===
          vehicle.id,
      )

    if (updatedVehicle) {
      setVehicle(
        updatedVehicle,
      )
    }
  }, [
    vehicles,
    vehicle.id,
  ])

  /*
   * If Firebase catalog changes,
   * make sure the selected tour
   * still exists.
   */
  useEffect(() => {
    const updatedTour =
      catalog.tours.find(
        (item) =>
          item.id ===
          tour?.id,
      )

    if (
      updatedTour &&
      updatedTour !== tour
    ) {
      setTour(
        updatedTour,
      )
    }

    if (
      !updatedTour &&
      catalog.tours.length
    ) {
      setTour(
        catalog.tours[0],
      )
    }
  }, [
    catalog.tours,
    tour,
  ])

  const fare =
    calculateFare({
      vehicle,
      tour,
      days,
    })

  const completeRoutes =
    routes.every(
      (route) =>
        route.from &&
        route.to,
    )

  const completeCustomer =
    Object.values(
      customer,
    ).every(
      (value) =>
        value.trim(),
    )

  const canBook =
    completeRoutes &&
    completeCustomer

  /*
   * Number of days.
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
            oldRoutes[
              index
            ] || {
              from:
                tour?.origin ||
                'Srinagar',

              to:
                tour?.destination ||
                '',
            },
        ),
    )
  }

  /*
   * Tour selection.
   *
   * Selecting:
   * Srinagar → Pahalgam
   *
   * automatically fills:
   * From = Srinagar
   * To   = Pahalgam
   */
  function handleTourChange(
    tourId,
  ) {
    const selectedTour =
      catalog.tours.find(
        (item) =>
          item.id ===
          tourId,
      )

    if (
      !selectedTour
    ) {
      return
    }

    setTour(
      selectedTour,
    )

    setRoutes(
      (oldRoutes) =>
        oldRoutes.map(
          (
            route,
            index,
          ) =>
            index === 0
              ? {
                  ...route,

                  from:
                    selectedTour.origin ||
                    'Srinagar',

                  to:
                    selectedTour.destination,
                }
              : route,
        ),
    )
  }

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
  }

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
  }

  function submitBooking() {
    if (!canBook) {
      return
    }

    onBook({
      id: `TRP-${Date.now()
        .toString()
        .slice(-6)}`,

      customer,

      vehicle,

      tour,

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

        <div className="dialog-intro">
          <p className="eyebrow">
            TRIPMORE CAB SERVICE
          </p>

          <h2 id="booking-title">
            Plan your Kashmir
            ride.
          </h2>

          <p>
            Select a tour and
            vehicle. The fare
            uses Tripmore's
            published daily
            rates.
          </p>
        </div>

        {/* VEHICLES */}

        <StepTitle
          number="1"
          title="Choose a vehicle"
        />

        <div className="vehicle-tabs">
          {vehicles.map(
            (option) => (
              <button
                className={`vehicle-tab ${
                  vehicle.id ===
                  option.id
                    ? 'active'
                    : ''
                }`}
                type="button"
                key={
                  option.id
                }
                onClick={() =>
                  setVehicle(
                    option,
                  )
                }
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
                  }{' '}
                  ·{' '}
                  {
                    option.luggage
                  }
                </small>

                <b>
                  {formatINR(
                    option
                      .prices?.[
                      tour?.id
                    ] || 0,
                  )}

                  <em>
                    {' '}
                    / day
                  </em>
                </b>
              </button>
            ),
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

          <label className="city-select">
            Day tour

            <select
              value={
                tour?.id ||
                ''
              }
              onChange={(
                event,
              ) =>
                handleTourChange(
                  event.target
                    .value,
                )
              }
            >
              {catalog.tours.map(
                (item) => (
                  <option
                    key={
                      item.id
                    }
                    value={
                      item.id
                    }
                  >
                    {
                      item.name
                    }
                  </option>
                ),
              )}
            </select>
          </label>
        </div>

        {/* ROUTES */}

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
                  {index +
                    1}
                </strong>

                <PlaceSelect
                  places={
                    catalog.places
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
                    catalog.places
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
        </div>

        {/* CUSTOMER */}

        <StepTitle
          number="3"
          title="Your details"
        />

        <div className="customer-fields">
          <label>
            Full name

            <input
              value={
                customer.name
              }
              onChange={(
                event,
              ) =>
                updateCustomer(
                  'name',
                  event.target
                    .value,
                )
              }
              placeholder="Your name"
            />
          </label>

          <label>
            Email address

            <input
              type="email"
              value={
                customer.email
              }
              onChange={(
                event,
              ) =>
                updateCustomer(
                  'email',
                  event.target
                    .value,
                )
              }
              placeholder="name@example.com"
            />
          </label>

          <label>
            WhatsApp number

            <input
              type="tel"
              value={
                customer.phone
              }
              onChange={(
                event,
              ) =>
                updateCustomer(
                  'phone',
                  event.target
                    .value,
                )
              }
              placeholder="+91 00000 00000"
            />
          </label>
        </div>

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
                vehicle.name
              }{' '}
              ·{' '}
              {
                tour?.destination
              }{' '}
              ·{' '}
              {days}{' '}
              {days === 1
                ? 'day'
                : 'days'}
            </small>
          </div>

          <button
            className="button button-primary"
            type="button"
            disabled={
              !canBook
            }
            onClick={
              submitBooking
            }
          >
            Book this cab →
          </button>
        </div>
      </section>
    </div>
  )
}

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
          event.target
            .value,
        )
      }
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