import '../styles/legal.css'

// -----------------------------------------------------------------------------
// Tripmore legal pages: Terms & Conditions, Disclaimer, Refund Policy.
// Rendered as standalone routes (/terms, /disclaimer, /refund-policy) by App.jsx,
// matching the existing pathname-based routing used for /admin.
// Content is kept as data so all three pages share one consistent layout.
// -----------------------------------------------------------------------------

const LAST_UPDATED = '25 August 2026'

const CONTACT = {
  name: 'Tripmore Tour and Travel',
  email: 'tripmore14@gmail.com',
  location: 'Srinagar, Jammu & Kashmir, India',
}

const DOCUMENTS = {
  terms: {
    slug: 'terms',
    title: 'Terms & Conditions',
    intro:
      'These Terms & Conditions ("Terms") govern your use of the Tripmore Tour and Travel website (tripmore.in) and the transport and cab booking services we provide across Kashmir. By making a booking or using our website, you agree to these Terms, so please read them carefully.',
    sections: [
      {
        heading: '1. About our services',
        body: [
          'Tripmore Tour and Travel ("Tripmore", "we", "us", or "our") provides taxi and cab hire for day tours, sightseeing, airport transfers, and multi-day travel packages across Srinagar and the wider Kashmir region.',
          'We arrange a vehicle and driver for the category and route you select. Unless clearly stated in writing, our fares cover the vehicle and driver only — they do not include entry tickets, permits, parking, tolls, guide charges, accommodation, or meals.',
        ],
      },
      {
        heading: '2. Bookings & confirmation',
        body: [
          'You can request a booking through our website by choosing your destination, travel dates, and vehicle. A booking is confirmed only once we have acknowledged it and, where applicable, received your payment.',
          'The fares shown on the website are estimates based on the information you provide. The final fare may change if your route, distance, number of days, or vehicle changes, and we will tell you before confirming.',
          'Please make sure the contact details, pickup point, dates, and passenger count you give us are correct. We are not responsible for problems caused by inaccurate information.',
        ],
      },
      {
        heading: '3. Pricing & payment',
        body: [
          'All fares are quoted in Indian Rupees (INR). You may pay the full fare online through our secure payment partner Razorpay (UPI, cards, and netbanking), or in cash / UPI to the driver, as agreed at the time of booking.',
          'Online payments are processed by Razorpay; we do not store your card or bank details. Any extra costs incurred during the trip — such as tolls, parking, permits, or route changes you request — are payable separately.',
        ],
      },
      {
        heading: '4. Vehicle allocation',
        body: [
          'We allocate vehicles by category (for example sedan, Innova, Tempo Traveller, or Urbania) rather than by a specific make or model. If your chosen vehicle becomes unavailable, we will provide an equivalent or higher category, or offer a refund as set out in our Refund Policy.',
        ],
      },
      {
        heading: '5. Your responsibilities',
        body: ['As our customer, you agree to:'],
        list: [
          'be ready at the agreed pickup point at the scheduled time;',
          'treat the vehicle, the driver, and other passengers with respect;',
          'not carry any illegal, hazardous, or prohibited items;',
          'not exceed the seating capacity of the vehicle; and',
          "follow the driver's reasonable safety instructions, including wearing seatbelts.",
        ],
        footer:
          'The driver may refuse or end a trip if passengers behave unlawfully or dangerously, or are under the influence in a way that risks safety. No refund is due in these cases.',
      },
      {
        heading: '6. Delays, routes & road conditions',
        body: [
          "Kashmir's mountain roads can be affected by weather, snow, landslides, traffic, security situations, or restrictions imposed by the authorities. Travel times are estimates and cannot be guaranteed. Where a route is unsafe or closed, the driver may take an alternative route or, if travel is not possible, the trip may be rescheduled or refunded under our Refund Policy.",
        ],
      },
      {
        heading: '7. Cancellations & refunds',
        body: [
          'Cancellations and refunds are governed by our Refund Policy, which forms part of these Terms. Please review it before booking.',
        ],
      },
      {
        heading: '8. Limitation of liability',
        body: [
          "We take reasonable care to provide a safe and reliable service. To the extent permitted by law, Tripmore is not liable for indirect or consequential losses, or for delays, missed connections, or losses caused by events beyond our reasonable control. Our total liability for any booking will not exceed the amount you paid for that booking.",
          'Please keep your personal belongings with you. We are not responsible for items lost or left behind in the vehicle, although we will make reasonable efforts to help recover them.',
        ],
      },
      {
        heading: '9. Force majeure',
        body: [
          'We are not responsible for any failure or delay caused by events outside our reasonable control, including weather, snow, floods, landslides, road or airport closures, strikes or bandhs, curfews, government or security restrictions, and natural disasters.',
        ],
      },
      {
        heading: '10. Changes to these Terms',
        body: [
          'We may update these Terms from time to time. The version published on our website at the time of your booking applies to that booking.',
        ],
      },
      {
        heading: '11. Governing law',
        body: [
          'These Terms are governed by the laws of India. Any disputes are subject to the exclusive jurisdiction of the courts at Srinagar, Jammu & Kashmir.',
        ],
      },
    ],
  },

  disclaimer: {
    slug: 'disclaimer',
    title: 'Disclaimer',
    intro:
      'The information on the Tripmore Tour and Travel website (tripmore.in) is provided for general information only. By using our website, you accept this Disclaimer. If you do not agree with it, please do not use the website.',
    sections: [
      {
        heading: '1. Accuracy of information',
        body: [
          'We try to keep the information on our website — including destinations, routes, vehicle details, and fares — accurate and up to date. However, we make no guarantee that it is complete, current, or error-free. Availability and prices are indicative and are confirmed only at the time of booking.',
        ],
      },
      {
        heading: '2. Fare estimates',
        body: [
          'Prices shown on the website are estimates for planning purposes. Your final fare depends on the route, distance, number of travel days, vehicle category, and any additional services, and will be confirmed before your booking is finalised.',
        ],
      },
      {
        heading: '3. Travel in Kashmir',
        body: [
          'Travel in Kashmir involves mountain and high-altitude regions where conditions can change quickly. Weather, snow, road closures, traffic, and local or security restrictions may affect routes, timings, and whether a trip is possible at all. Estimated travel times and itineraries are therefore not guaranteed.',
          'You are responsible for assessing your own fitness to travel and for arranging any personal, health, or travel insurance you may need.',
        ],
      },
      {
        heading: '4. Third-party services',
        body: [
          'Payments are handled by our third-party partner Razorpay and are subject to their terms. Any sightseeing spots, monuments, hotels, shikara rides, or other services not directly provided by us remain the responsibility of those operators. We are not liable for their acts, omissions, pricing, or availability.',
        ],
      },
      {
        heading: '5. External links',
        body: [
          'Our website may contain links to other websites for your convenience. We do not control, and are not responsible for, the content or practices of those websites.',
        ],
      },
      {
        heading: '6. Not professional advice',
        body: [
          'Content on our website does not constitute professional travel, legal, financial, or medical advice. You should verify important details — such as permits, weather, and official travel advisories — with the relevant authorities before you travel.',
        ],
      },
      {
        heading: '7. Limitation of liability',
        body: [
          'To the fullest extent permitted by law, Tripmore Tour and Travel is not liable for any loss or damage arising from reliance on the information on this website or from the use of the website itself. Your use of the website is at your own risk.',
        ],
      },
    ],
  },

  refund: {
    slug: 'refund-policy',
    title: 'Refund Policy',
    intro:
      'This Refund Policy explains when and how you can cancel a booking with Tripmore Tour and Travel, and how refunds are handled. It forms part of our Terms & Conditions.',
    sections: [
      {
        heading: '1. How to cancel',
        body: [
          'To cancel or change a booking, please contact us as early as possible by email at tripmore14@gmail.com, or on the phone / WhatsApp number we used to confirm your booking. Include your booking reference so we can find it quickly.',
          'Cancellation timing is calculated from when we receive your request, measured against your scheduled trip start (pickup) time.',
        ],
      },
      {
        heading: '2. Cancellation charges & refunds',
        body: ['If you cancel a confirmed booking:'],
        list: [
          '48 hours or more before the trip start time — full refund of the amount paid.',
          'Between 24 and 48 hours before the trip start time — 50% of the amount paid is refunded.',
          'Less than 24 hours before the trip start time, or a no-show — no refund.',
        ],
        footer:
          'A "no-show" means the passenger is not available at the agreed pickup point within a reasonable waiting time and cannot be reached.',
      },
      {
        heading: '3. How refunds are paid',
        body: [
          'Refunds for online (Razorpay) payments are returned to your original payment method. If you paid in cash or by UPI to the driver, the refund is made by bank transfer or UPI to an account you provide.',
          'Approved refunds are usually processed within 5–7 business days. How long it then takes to appear in your account depends on your bank or payment provider.',
        ],
      },
      {
        heading: '4. Changes to a booking',
        body: [
          'We will always try to accommodate changes to your date, route, or vehicle. Changes are subject to availability and may affect the fare. Where a change is not possible, the standard cancellation terms above apply.',
        ],
      },
      {
        heading: '5. Cancellations by Tripmore',
        body: [
          'If we cancel a confirmed booking — for example, if a suitable vehicle is genuinely unavailable — you will receive a full refund, or you can choose to reschedule at no extra cost.',
        ],
      },
      {
        heading: '6. Weather, road closures & force majeure',
        body: [
          'If a trip cannot go ahead safely because of weather, snow, landslides, road or airport closures, strikes, curfews, or government / security restrictions, we will first try to reschedule at no extra charge. If rescheduling is not possible, we will refund the amount paid for the part of the service not provided. Any third-party costs already spent on your behalf (such as permits or tickets) may be deducted.',
        ],
      },
      {
        heading: '7. Trips already started',
        body: [
          'Once a trip has started, the fare for the completed portion is non-refundable. If you end a multi-day trip early for personal reasons, any refund for the unused days is at our discretion and after deducting costs already incurred.',
        ],
      },
    ],
  },
}

export default function LegalPage({ page }) {
  const doc = DOCUMENTS[page] || DOCUMENTS.terms

  function goHome() {
    window.location.href = '/'
  }

  return (
    <main className="legal-page">
      <header className="legal-topbar">
        <button
          className="legal-brand"
          type="button"
          onClick={goHome}
          aria-label="Back to Tripmore home"
        >
          <span className="legal-brand-mark">✦</span>
          tripmore<span className="legal-brand-in">.in</span>
        </button>

        <a className="legal-back-link" href="/">
          ← Back to website
        </a>
      </header>

      <article className="legal-shell">
        <p className="eyebrow">LEGAL</p>

        <h1 className="legal-title">{doc.title}</h1>

        <p className="legal-updated">
          Last updated: {LAST_UPDATED}
        </p>

        {doc.intro && (
          <p className="legal-intro">{doc.intro}</p>
        )}

        {doc.sections.map((section, index) => (
          <section className="legal-section" key={index}>
            <h2>{section.heading}</h2>

            {(section.body || []).map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}

            {section.list && (
              <ul className="legal-list">
                {section.list.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}

            {section.footer && (
              <p className="legal-section-note">{section.footer}</p>
            )}
          </section>
        ))}

        <section className="legal-contact">
          <h2>Contact us</h2>

          <p>
            If you have any questions about this {doc.title.toLowerCase()},
            please get in touch:
          </p>

          <p className="legal-contact-lines">
            <strong>{CONTACT.name}</strong>
            <span>{CONTACT.location}</span>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </p>
        </section>

        <div className="legal-actions">
          <button
            className="button button-primary"
            type="button"
            onClick={goHome}
          >
            ← Back to website
          </button>
        </div>
      </article>

      <footer className="legal-footer">
        <span>
          © {new Date().getFullYear()} Tripmore Tour and Travel. All rights
          reserved.
        </span>

        <span className="legal-footer-links">
          <a href="/terms">Terms &amp; Conditions</a>
          <a href="/disclaimer">Disclaimer</a>
          <a href="/refund-policy">Refund Policy</a>
        </span>
      </footer>
    </main>
  )
}
