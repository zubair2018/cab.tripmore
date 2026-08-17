# Tripmore Cab Booking Prototype

A polished frontend prototype for the Tripmore transport booking flow. It covers local cab bookings only; trip/package booking is intentionally out of scope for this version.

## Run locally

1. Install [Node.js](https://nodejs.org/) (version 18 or newer).
2. Open this folder in VS Code or a terminal.
3. Run `npm install`.
4. Run `npm run dev` and open the local address shown.

For a production build, use `npm run build`.

## Folder structure

- `src/App.jsx` — connects the booking screens and holds the page state.
- `src/components/` — small reusable UI pieces: header, vehicle cards, fare summary, itinerary, and customer form.
- `src/data/vehicles.js` — vehicle details, base prices, and available cities. Change vehicle data here.
- `src/utils/calculateFare.js` — all fare rules and Indian currency formatting. Change fare rules here.
- `src/styles/global.css` — responsive visual styling for the entire site.

## Fare rules included

- Srinagar local daily rate: Sedan ₹2,500; Innova ₹3,000; Tempo Traveller ₹4,500; Urbaina ₹6,000.
- Jammu pickup and drop (Jammu → Jammu): ₹1,000 extra per day.
- Any one-day booking: ₹1,000 flat supplement.

The confirmation screen is a frontend demo only. Connecting real payments, email/SMS confirmation, and saved bookings needs a backend and payment provider before launch.
