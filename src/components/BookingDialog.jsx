import { useState } from 'react'
import { tours, vehicles } from '../data/vehicles'
import { calculateFare, formatINR } from '../utils/calculateFare'

const places = [
  'Srinagar', 'Gulmarg', 'Pahalgam', 'Sonamarg', 'Doodhpathri',
  'Yusmarg',
]

function makeEmptyRoutes(days) {
  return Array.from({ length: days }, () => ({ from: '', to: '' }))
}

export default function BookingDialog({ onClose, onBook, error }) {
  // All booking choices live in this component until the user clicks Book.
  const [vehicle, setVehicle] = useState(vehicles[0])
  const [days, setDays] = useState(2)
  const [tour, setTour] = useState(tours[0])
  const [routes, setRoutes] = useState(makeEmptyRoutes(2))

  // This runs again whenever vehicle, days, pickup, or drop changes.
  const fare = calculateFare({ vehicle, days, tour })

  function changeDays(nextDays) {
    const safeDays = Math.min(14, Math.max(1, nextDays))
    setDays(safeDays)

    // Keep the existing routes and only add/remove missing rows.
    setRoutes((oldRoutes) =>
      Array.from(
        { length: safeDays },
        (_, index) => oldRoutes[index] || { from: '', to: '' }
      )
    )
  }

  function changeRoute(dayIndex, field, value) {
    setRoutes((oldRoutes) =>
      oldRoutes.map((route, index) =>
        index === dayIndex ? { ...route, [field]: value } : route
      )
    )
  }

  function confirmBooking() {
    onBook({ vehicle, days, tour, routes, fare })
  }

  return (
    <div className="booking-overlay" onMouseDown={onClose}>
      <section
        className="booking-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="dialog-close" onClick={onClose} aria-label="Close booking dialog">
          ×
        </button>

        <div className="dialog-intro">
          <p className="eyebrow">YOUR TRANSPORT PLAN</p>
          <h2 id="booking-title">Build your perfect ride.</h2>
          <p>Choose a Kashmir day tour, select your vehicle, and see the exact fare upfront.</p>
        </div>

        <StepTitle number="1" title="Choose your vehicle" />
        <VehiclePicker selectedVehicle={vehicle} onSelect={setVehicle} />

        <StepTitle number="2" title="Set your journey" />
        <JourneySettings
          days={days}
          tour={tour}
          onChangeDays={changeDays}
          onChangeTour={setTour}
        />

        <RouteTable routes={routes} onChangeRoute={changeRoute} />
          {error && <p className="booking-error">{error}</p>}
        <FarePanel vehicle={vehicle} days={days} fare={fare} customerCanBook={Boolean(customer.name && customer.email && customer.phone)} onBook={confirmBooking} />
      </section>
    </div>
  )
}

function StepTitle({ number, title }) {
  return <div className="dialog-step"><span>{number}</span><strong>{title}</strong></div>
}

function VehiclePicker({ selectedVehicle, onSelect }) {
  return (
    <div className="vehicle-tabs">
      {vehicles.map((vehicle) => (
        <button
          key={vehicle.id}
          className={`vehicle-tab ${selectedVehicle.id === vehicle.id ? 'active' : ''}`}
          onClick={() => onSelect(vehicle)}
        >
          <i>{vehicle.icon}</i>
          <strong>{vehicle.name}</strong>
          <small>{vehicle.seats}</small>
          <b>{formatINR(vehicle.prices.pahalgam)}<em>/ tour</em></b>
        </button>
      ))}
    </div>
  )
}

function JourneySettings({ days, tour, onChangeDays, onChangeTour }) {
  return (
    <div className="journey-controls">
      <div className="days-control">
        <div>
          <label>Number of days</label>
          <small>Each day uses the selected tour rate.</small>
        </div>

        <div className="day-counter">
          <button onClick={() => onChangeDays(days - 1)} aria-label="Remove a day">−</button>
          <b>{days}</b>
          <button onClick={() => onChangeDays(days + 1)} aria-label="Add a day">+</button>
        </div>
      </div>

      <label className="city-select">Day tour<select value={tour.id} onChange={(event) => onChangeTour(tours.find((item) => item.id === event.target.value))}>{tours.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    </div>
  )
}

function RouteTable({ routes, onChangeRoute }) {
  return (
    <div className="route-plan">
      <div className="route-heading"><span>Day</span><span>From</span><span>To</span></div>

      {routes.map((route, index) => (
        <div className="route-row" key={index}>
          <strong>Day {index + 1}</strong>
          <PlaceSelect value={route.from} onChange={(value) => onChangeRoute(index, 'from', value)} />
          <PlaceSelect value={route.to} onChange={(value) => onChangeRoute(index, 'to', value)} />
        </div>
      ))}
    </div>
  )
}

function PlaceSelect({ value, onChange }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Select place</option>
      {places.map((place) => <option key={place}>{place}</option>)}
    </select>
  )
}

function FarePanel({ vehicle, days, fare, customerCanBook, onBook }) {
  return (
    <div className="fare-panel">
      <div>
        <span>YOUR TRANSPORT FARE</span>
        <strong>{formatINR(fare.total)}</strong>
        <small>{vehicle.name} · {days} {days === 1 ? 'tour day' : 'tour days'}</small>
      </div>

      <button className="button button-primary" onClick={onBook}>
        Book this cab <span>→</span>
      </button>
    </div>
  )
}
