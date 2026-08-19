import { useState } from 'react'

import { places, tours, vehicles } from '../data/vehicles'
import { calculateFare, formatINR } from '../utils/calculateFare'

function makeRoutes(days) {
  return Array.from({ length: days }, () => ({ from: '', to: '' }))
}

export default function BookingDialog({ onClose, onBook, error }) {
  const [vehicle, setVehicle] = useState(vehicles[0])
  const [tour, setTour] = useState(tours[0])
  const [days, setDays] = useState(1)
  const [routes, setRoutes] = useState(makeRoutes(1))
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' })

  const fare = calculateFare({ vehicle, tour, days })
  const completeRoutes = routes.every((route) => route.from && route.to)
  const completeCustomer = Object.values(customer).every((value) => value.trim())
  const canBook = completeRoutes && completeCustomer

  function changeDays(nextDays) {
    const newDays = Math.max(1, Math.min(14, nextDays))
    setDays(newDays)
    setRoutes((oldRoutes) =>
      Array.from(
        { length: newDays },
        (_, index) => oldRoutes[index] || { from: '', to: '' },
      ),
    )
  }

  function updateRoute(index, field, value) {
    setRoutes((oldRoutes) =>
      oldRoutes.map((route, routeIndex) =>
        routeIndex === index ? { ...route, [field]: value } : route,
      ),
    )
  }

  function updateCustomer(field, value) {
    setCustomer((oldCustomer) => ({ ...oldCustomer, [field]: value }))
  }

  function submitBooking() {
    if (!canBook) return

    onBook({
      id: `TRP-${Date.now().toString().slice(-6)}`,
      customer,
      vehicle,
      tour,
      days,
      routes,
      fare,
      paymentStatus: 'Pending',
      customerEmailStatus: 'Pending',
      customerWhatsappStatus: 'Pending',
      companyEmailStatus: 'Pending',
      companyWhatsappStatus: 'Pending',
      createdAt: new Date().toISOString(),
    })
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
        <button className="dialog-close" type="button" onClick={onClose} aria-label="Close booking form">
          ×
        </button>

        <div className="dialog-intro">
          <p className="eyebrow">TRIPMORE CAB SERVICE</p>
          <h2 id="booking-title">Plan your Kashmir ride.</h2>
          <p>Select a tour and vehicle. The fare uses Tripmore's published daily rates.</p>
        </div>

        <StepTitle number="1" title="Choose a vehicle" />
        <div className="vehicle-tabs">
          {vehicles.map((option) => (
            <button
              className={`vehicle-tab ${vehicle.id === option.id ? 'active' : ''}`}
              type="button"
              key={option.id}
              onClick={() => setVehicle(option)}
            >
              <i>{option.icon}</i>
              <strong>{option.name}</strong>
              <small>{option.seats} · {option.luggage}</small>
              <b>{formatINR(option.prices[tour.id])} <em>/ day</em></b>
            </button>
          ))}
        </div>

        <StepTitle number="2" title="Set your journey" />
        <div className="journey-controls">
          <div className="days-control">
            <label>Number of days</label>
            <div className="day-counter">
              <button type="button" onClick={() => changeDays(days - 1)} aria-label="Remove a day">−</button>
              <strong>{days}</strong>
              <button type="button" onClick={() => changeDays(days + 1)} aria-label="Add a day">+</button>
            </div>
          </div>
          <label className="city-select">
            Day tour
            <select value={tour.id} onChange={(event) => setTour(tours.find((item) => item.id === event.target.value))}>
              {tours.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        </div>

        <div className="route-plan">
          <div className="route-heading"><span>Day</span><span>From</span><span>To</span></div>
          {routes.map((route, index) => (
            <div className="route-row" key={index}>
              <strong>Day {index + 1}</strong>
              <PlaceSelect value={route.from} onChange={(value) => updateRoute(index, 'from', value)} />
              <PlaceSelect value={route.to} onChange={(value) => updateRoute(index, 'to', value)} />
            </div>
          ))}
        </div>

        <StepTitle number="3" title="Your details" />
        <div className="customer-fields">
          <label>Full name<input value={customer.name} onChange={(event) => updateCustomer('name', event.target.value)} placeholder="Your name" /></label>
          <label>Email address<input type="email" value={customer.email} onChange={(event) => updateCustomer('email', event.target.value)} placeholder="name@example.com" /></label>
          <label>WhatsApp number<input type="tel" value={customer.phone} onChange={(event) => updateCustomer('phone', event.target.value)} placeholder="+91 00000 00000" /></label>
        </div>

        {error && <p className="booking-error">{error}</p>}

        <div className="fare-panel">
          <div>
            <span>YOUR TRANSPORT FARE</span>
            <strong>{formatINR(fare.total)}</strong>
            <small>{vehicle.name} · {tour.destination} · {days} {days === 1 ? 'day' : 'days'}</small>
          </div>
          <button className="button button-primary" type="button" disabled={!canBook} onClick={submitBooking}>Book this cab →</button>
        </div>
      </section>
    </div>
  )
}

function StepTitle({ number, title }) {
  return <div className="dialog-step"><span>{number}</span><strong>{title}</strong></div>
}

function PlaceSelect({ value, onChange }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Select place</option>
      {places.map((place) => <option key={place} value={place}>{place}</option>)}
    </select>
  )
}
