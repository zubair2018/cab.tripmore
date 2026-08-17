import { useState } from 'react'
import { vehicles } from '../data/vehicles'
import { calculateFare, formatINR } from '../utils/calculateFare'
import '../styles/booking-dialog.css'

const places = [
  'Srinagar',
  'Gulmarg',
  'Pahalgam',
  'Sonamarg',
  'Doodhpathri',
  'Yusmarg',
  'Jammu',
  'Katra',
  'Patnitop',
  'Airport',
]

const createRouteRows = (days) =>
  Array.from({ length: days }, () => ({
    from: '',
    to: '',
  }))

export default function BookingDialog({ onClose, onBook }) {
  // Selected rental/cab.
  const [selectedVehicle, setSelectedVehicle] = useState(vehicles[0])

  // Number of booking days.
  const [days, setDays] = useState(2)

  // Pickup and drop cities decide whether Jammu charges apply.
  const [pickupCity, setPickupCity] = useState('Srinagar')
  const [dropCity, setDropCity] = useState('Srinagar')

  // Stores every day's From and To places.
  const [routes, setRoutes] = useState(createRouteRows(2))

  // Fare recalculates automatically whenever vehicle, days, or city changes.
  const fare = calculateFare({
    vehicle: selectedVehicle,
    days,
    pickup: pickupCity,
    drop: dropCity,
  })

  function changeDays(newDays) {
    const safeDays = Math.max(1, Math.min(14, newDays))

    setDays(safeDays)

    // Keep old route entries and add/remove rows as needed.
    setRoutes((oldRoutes) =>
      Array.from(
        { length: safeDays },
        (_, index) => oldRoutes[index] || { from: '', to: '' }
      )
    )
  }

  function updateRoute(dayIndex, field, value) {
    setRoutes((oldRoutes) =>
      oldRoutes.map((route, index) =>
        index === dayIndex ? { ...route, [field]: value } : route
      )
    )
  }

  function handleBook() {
    onBook({
      vehicle: selectedVehicle,
      days,
      pickupCity,
      dropCity,
      routes,
      fare,
    })
  }

  return (
    <div className="booking-overlay">
      <section className="booking-dialog">
        <button className="dialog-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <h2 className="dialog-heading">Rentals</h2>

        {/* Vehicle selection, like the top blue rental options in your image */}
        <div className="vehicle-tabs">
          {vehicles.map((vehicle) => (
            <button
              key={vehicle.id}
              className={`vehicle-tab ${
                selectedVehicle.id === vehicle.id ? 'active' : ''
              }`}
              onClick={() => setSelectedVehicle(vehicle)}
            >
              <strong>{vehicle.name}</strong>
              <small>{vehicle.seats}</small>
              <small>{formatINR(vehicle.rate)}/day</small>
            </button>
          ))}
        </div>

        <div className="trip-settings">
          <label>
            Number of days
            <select
              value={days}
              onChange={(event) => changeDays(Number(event.target.value))}
            >
              {Array.from({ length: 14 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {index + 1} {index === 0 ? 'Day' : 'Days'}
                </option>
              ))}
            </select>
          </label>

          <label>
            Pickup city
            <select
              value={pickupCity}
              onChange={(event) => setPickupCity(event.target.value)}
            >
              <option>Srinagar</option>
              <option>Jammu</option>
            </select>
          </label>

          <label>
            Drop city
            <select
              value={dropCity}
              onChange={(event) => setDropCity(event.target.value)}
            >
              <option>Srinagar</option>
              <option>Jammu</option>
            </select>
          </label>
        </div>

        {/* Day-wise From / To table */}
        <div className="route-table">
          <div className="route-table-header">
            <span>Day</span>
            <span>From</span>
            <span>To</span>
          </div>

          {routes.map((route, index) => (
            <div className="route-table-row" key={index}>
              <strong>Day {index + 1}</strong>

              <select
                value={route.from}
                onChange={(event) =>
                  updateRoute(index, 'from', event.target.value)
                }
              >
                <option value="">- Select -</option>
                {places.map((place) => (
                  <option key={place}>{place}</option>
                ))}
              </select>

              <select
                value={route.to}
                onChange={(event) =>
                  updateRoute(index, 'to', event.target.value)
                }
              >
                <option value="">- Select -</option>
                {places.map((place) => (
                  <option key={place}>{place}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Live fare */}
        <div className="fare-box">
          <div>
            <span>Total fare</span>
            <strong>{formatINR(fare.total)}</strong>
          </div>

          <button className="book-button" onClick={handleBook}>
            Book
          </button>
        </div>

        <p className="fare-note">
          {selectedVehicle.name}: {formatINR(fare.base)}
          {fare.jammuCharge > 0 && ` + Jammu charge ${formatINR(fare.jammuCharge)}`}
          {fare.oneDayCharge > 0 && ` + one-day charge ${formatINR(fare.oneDayCharge)}`}
        </p>
      </section>
    </div>
  )
}