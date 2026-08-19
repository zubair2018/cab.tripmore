const steps = [
  ['01', 'Choose your vehicle', 'Pick a Sedan, Innova, Tempo Traveller or Urbania.'],
  ['02', 'Choose your tour', 'Select Pahalgam, Gulmarg or Sonamarg.'],
  ['03', 'Book with clarity', 'See the exact fare before you confirm.'],
]

export default function HomePage({ onBook }) {
  return (
    <>
      <header className="topbar">
        <button className="logo" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="logo-mark">✦</span> tripmore<span>.in</span>
        </button>
        <nav className="navigation">
          <a href="#why-tripmore">Why Tripmore</a>
          <a href="#fleet">Our fleet</a>
        </nav>
        <button className="topbar-button" type="button" onClick={onBook}>Book a cab</button>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">KASHMIR TAXI SERVICE · SINCE 1990</p>
            <h1>Experience Kashmir with a <em>better ride.</em></h1>
            <p className="hero-description">Reliable local transport from Srinagar for your Kashmir holiday. Choose a day tour, select your vehicle and know the fare upfront.</p>
            <div className="hero-actions">
              <button className="button button-primary" type="button" onClick={onBook}>Plan your cab <span>→</span></button>
              <span>Trusted local drivers · 24/7 assistance</span>
            </div>
          </div>
          <div className="hero-art" aria-label="Stylised Kashmir mountain landscape">
            <div className="sun" />
            <div className="mountain mountain-back" />
            <div className="mountain mountain-front" />
            <div className="road" />
            <div className="car">🚙</div>
            <div className="hero-card"><span>TRIPMORE PROMISE</span><strong>Easy booking.<br />Happy journeys.</strong></div>
          </div>
        </section>

        <section className="trust-strip">
          <span>✓ Srinagar-based team</span>
          <span>✓ Neat and clean cars</span>
          <span>✓ Transparent daily rates</span>
          <span>✓ 24/7 assistance</span>
        </section>

        <section className="how-section" id="why-tripmore">
          <p className="eyebrow">SIMPLE FROM START TO FINISH</p>
          <h2>Your ride in three easy steps.</h2>
          <div className="steps">
            {steps.map(([number, title, text]) => (
              <article className="step-card" key={number}>
                <span>{number}</span><h3>{title}</h3><p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="fleet-callout" id="fleet">
          <div><p className="eyebrow">A RIDE FOR EVERY GROUP</p><h2>From a couple's escape to a full family adventure.</h2></div>
          <button className="button button-outline" type="button" onClick={onBook}>View vehicles <span>→</span></button>
        </section>
      </main>

      <footer><span>© {new Date().getFullYear()} Tripmore Tour and Travel</span><span>Srinagar, Jammu and Kashmir · info@tripmore.in</span></footer>
    </>
  )
}
