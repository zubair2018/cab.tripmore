import { useEffect, useState } from 'react'

import { vehicles } from '../data/vehicles'
import { defaultCatalog, subscribeToCatalog } from '../services/catalog'

const steps = [
  {
    number: '01',
    title: 'Choose your vehicle',
    text: 'Select the vehicle that suits your family, group or travel plan.',
  },
  {
    number: '02',
    title: 'Choose your destination',
    text: 'Pick from Kashmir destinations and available day-tour routes.',
  },
  {
    number: '03',
    title: 'See your fare',
    text: 'Know the complete transport fare before you confirm your booking.',
  },
]

const benefits = [
  {
    icon: '01',
    title: 'Local Kashmir service',
    text: 'Plan your journey with a Srinagar-based travel team that understands Kashmir.',
  },
  {
    icon: '02',
    title: 'Transparent pricing',
    text: 'Get clear vehicle and route pricing before confirming your ride.',
  },
  {
    icon: '03',
    title: 'Comfortable vehicles',
    text: 'Choose from cars and larger vehicles depending on the size of your group.',
  },
  {
    icon: '04',
    title: 'Travel with confidence',
    text: 'From airport transfers to sightseeing, keep your Kashmir transport simple.',
  },
]

export default function HomePage({ onBook }) {
  const [catalog, setCatalog] = useState(defaultCatalog)

  useEffect(() => {
    return subscribeToCatalog(
      (nextCatalog) => {
        setCatalog(nextCatalog)
      },
      (error) => {
        console.error('Could not load homepage catalog.', error)
      }
    )
  }, [])

  const places = catalog?.places || defaultCatalog.places || []
  const tours = catalog?.tours || defaultCatalog.tours || []

  return (
    <>
      {/* =========================
          NAVBAR
      ========================== */}
      <header className="topbar">
        <div className="topbar-inner">
          <button
            className="logo"
            type="button"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: 'smooth',
              })
            }
          >
            <span className="logo-mark">✦</span>

            <span className="logo-text">
              tripmore<span>.in</span>
            </span>
          </button>

          <nav className="navigation">
            <a href="#destinations">Destinations</a>
            <a href="#fleet">Our fleet</a>
            <a href="#why-tripmore">Why Tripmore</a>
            <a href="#how-it-works">How it works</a>
          </nav>

          <button
            className="topbar-button"
            type="button"
            onClick={onBook}
          >
            Book a cab
          </button>
        </div>
      </header>

      <main>
        {/* =========================
            HERO
        ========================== */}
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">
              KASHMIR TAXI & TRANSPORT SERVICE
            </p>

            <h1>
              Your Kashmir journey,
              <em> made easier.</em>
            </h1>

            <p className="hero-description">
              Comfortable and reliable transport for your Kashmir
              holiday. Choose your destination, select your vehicle
              and see your fare before you book.
            </p>

            <div className="hero-actions">
              <button
                className="button button-primary"
                type="button"
                onClick={onBook}
              >
                Plan your cab
                <span>→</span>
              </button>

              <a href="#destinations" className="hero-secondary-link">
                Explore Kashmir
                <span>↓</span>
              </a>
            </div>

            <div className="hero-trust">
              <span>✓ Local service</span>
              <span>✓ Clear pricing</span>
              <span>✓ Multiple vehicles</span>
            </div>
          </div>

          <div
            className="hero-art"
            aria-label="Kashmir mountain landscape"
          >
            <div className="hero-art-overlay" />

            <div className="sun" />

            <div className="mountain mountain-back" />
            <div className="mountain mountain-middle" />
            <div className="mountain mountain-front" />

            <div className="hero-road" />

            <div className="hero-car">
              🚙
            </div>

            <div className="hero-location-card">
              <span>DISCOVER KASHMIR</span>

              <strong>
                Srinagar · Gulmarg
                <br />
                Pahalgam · Sonamarg
              </strong>
            </div>

            <div className="hero-rating-card">
              <strong>✦</strong>

              <div>
                <span>TRIPMORE</span>
                <small>Your journey, our care.</small>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            TRUST STRIP
        ========================== */}
        <section className="trust-strip">
          <div>
            <strong>Local expertise</strong>
            <span>Built around Kashmir travel</span>
          </div>

          <div>
            <strong>Transparent fares</strong>
            <span>Know your price upfront</span>
          </div>

          <div>
            <strong>Flexible fleet</strong>
            <span>Vehicles for every group</span>
          </div>

          <div>
            <strong>Easy booking</strong>
            <span>Simple from start to finish</span>
          </div>
        </section>

        {/* =========================
            DESTINATIONS
        ========================== */}
        <section
          className="destinations-section"
          id="destinations"
        >
          <div className="section-heading-large">
            <div>
              <p className="eyebrow">EXPLORE KASHMIR</p>

              <h2>
                Go where Kashmir
                <br />
                takes you.
              </h2>
            </div>

            <p>
              Choose a destination and let Tripmore take care
              of the road.
            </p>
          </div>

          <div className="destination-grid">
            {places.slice(0, 6).map((place, index) => (
              <button
                className="destination-card"
                key={place}
                type="button"
                onClick={onBook}
              >
                <div className={`destination-image destination-${index + 1}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </div>

                <div className="destination-content">
                  <h3>{place}</h3>

                  <span>
                    Plan your ride
                    <strong> →</strong>
                  </span>
                </div>
              </button>
            ))}
          </div>

          {places.length === 0 && (
            <div className="homepage-empty">
              <p>Destinations will appear here.</p>
            </div>
          )}
        </section>

        {/* =========================
            WHY TRIPMORE
        ========================== */}
        <section
          className="why-section"
          id="why-tripmore"
        >
          <div className="why-intro">
            <p className="eyebrow">WHY TRIPMORE</p>

            <h2>
              More than a cab.
              <br />
              It's your Kashmir journey.
            </h2>

            <p>
              Your transport should be one less thing to worry
              about while exploring Kashmir. Tripmore keeps the
              booking process simple and the journey comfortable.
            </p>

            <button
              className="button button-primary"
              type="button"
              onClick={onBook}
            >
              Book your ride
              <span>→</span>
            </button>
          </div>

          <div className="benefits-grid">
            {benefits.map((benefit) => (
              <article
                className="benefit-card"
                key={benefit.icon}
              >
                <span className="benefit-number">
                  {benefit.icon}
                </span>

                <h3>{benefit.title}</h3>

                <p>{benefit.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* =========================
            FLEET
        ========================== */}
        <section
          className="fleet-section"
          id="fleet"
        >
          <div className="section-heading-large fleet-heading">
            <div>
              <p className="eyebrow">OUR FLEET</p>

              <h2>
                The right vehicle
                <br />
                for your group.
              </h2>
            </div>

            <p>
              Whether you're travelling as a couple, family or
              larger group, choose the vehicle that fits your
              journey.
            </p>
          </div>

          <div className="fleet-grid">
            {vehicles.map((vehicle) => (
              <article
                className="fleet-card"
                key={vehicle.id}
              >
                <div className="fleet-card-top">
                  <span className="fleet-number">
                    {vehicle.id}
                  </span>

                  <span className="fleet-arrow">↗</span>
                </div>

                <div className="fleet-icon">
                  🚗
                </div>

                <h3>{vehicle.name}</h3>

                <p>
                  {getVehicleDescription(vehicle.id)}
                </p>

                <button
                  type="button"
                  onClick={onBook}
                >
                  Choose {vehicle.name}
                  <span>→</span>
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* =========================
            HOW IT WORKS
        ========================== */}
        <section
          className="how-section"
          id="how-it-works"
        >
          <div className="section-heading-large">
            <div>
              <p className="eyebrow">
                SIMPLE FROM START TO FINISH
              </p>

              <h2>
                Your ride in
                <br />
                three easy steps.
              </h2>
            </div>

            <p>
              No complicated process. Select your route,
              vehicle and travel details, then see your fare.
            </p>
          </div>

          <div className="steps">
            {steps.map((step) => (
              <article
                className="step-card"
                key={step.number}
              >
                <span>{step.number}</span>

                <h3>{step.title}</h3>

                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* =========================
            TOUR ROUTES
        ========================== */}
        {tours.length > 0 && (
          <section className="tour-section">
            <div className="tour-section-inner">
              <div>
                <p className="eyebrow">
                  POPULAR DAY TOURS
                </p>

                <h2>
                  Ready to explore?
                </h2>

                <p>
                  Browse the routes currently available through
                  Tripmore.
                </p>
              </div>

              <div className="tour-route-list">
                {tours.slice(0, 4).map((tour) => (
                  <button
                    key={tour.id}
                    type="button"
                    onClick={onBook}
                    className="tour-route"
                  >
                    <span>
                      {tour.origin || 'Srinagar'}
                    </span>

                    <strong>→</strong>

                    <span>{tour.destination}</span>

                    <small>Book</small>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* =========================
            FINAL CTA
        ========================== */}
        <section className="fleet-callout">
          <div>
            <p className="eyebrow">
              READY FOR THE ROAD?
            </p>

            <h2>
              Let's make your Kashmir journey memorable.
            </h2>

            <p>
              Choose your vehicle, select your route and get
              started with Tripmore.
            </p>
          </div>

          <button
            className="button button-outline"
            type="button"
            onClick={onBook}
          >
            Book a cab
            <span>→</span>
          </button>
        </section>
      </main>

      {/* =========================
          FOOTER
      ========================== */}
      <footer>
        <div className="footer-brand">
          <strong>
            <span className="footer-mark">✦</span>
            tripmore<span>.in</span>
          </strong>

          <p>
            Kashmir travel, made simpler.
          </p>
        </div>

        <div className="footer-links">
          <a href="#destinations">Destinations</a>
          <a href="#fleet">Fleet</a>
          <a href="#why-tripmore">Why Tripmore</a>
          <a href="#how-it-works">How it works</a>
        </div>

        <div className="footer-contact">
          <span>Srinagar, Jammu & Kashmir</span>
          <span>info@tripmore.in</span>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Tripmore Tour and Travel
          </span>

          <span>
            Kashmir · India
          </span>
        </div>
      </footer>
    </>
  )
}

function getVehicleDescription(vehicleId) {
  const descriptions = {
    sedan:
      'Comfortable and practical for couples and small families.',
    innova:
      'Spacious SUV comfort for families and longer journeys.',
    tempo:
      'A convenient choice for medium-sized groups travelling together.',
    urbania:
      'Premium group travel with extra space and comfort.',
  }

  return (
    descriptions[vehicleId] ||
    'Comfortable transport for your Kashmir journey.'
  )
}