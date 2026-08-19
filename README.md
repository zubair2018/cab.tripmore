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
- `src/data/vehicles.js` — tour names and all vehicle prices. Change the price table here.
- `src/utils/calculateFare.js` — all fare rules and Indian currency formatting. Change fare rules here.
- `src/services/firebase.js` — Firebase project configuration from environment variables.
- `src/services/bookings.js` — Firestore booking creation and live dashboard subscription.
- `src/styles/global.css` — responsive visual styling for the entire site.

## Fare rules included

| Tour | Sedan | Innova | Tempo Traveller | Urbania |
| --- | ---: | ---: | ---: | ---: |
| Srinagar to Pahalgam | ₹3,500 | ₹4,000 | ₹5,500 | ₹7,000 |
| Srinagar to Gulmarg | ₹3,000 | ₹3,500 | ₹5,000 | ₹6,000 |
| Srinagar to Sonamarg | ₹3,500 | ₹4,000 | ₹5,500 | ₹7,000 |

The total is the selected tour price multiplied by the number of tour days. There are no extra Jammu or one-day supplements.

## Firebase setup

1. Create a Firebase project and a Firestore database in the Firebase Console.
2. Copy `.env.example` to `.env`.
3. Copy the Web App configuration values from Firebase into `.env`.
4. In Firestore, create rules that allow only authenticated company staff to read the `bookings` collection. Customer booking creation should be protected with App Check or moved behind a Cloud Function before production.
5. Run `npm run dev` and confirm that the dashboard says `Connected to Firebase Firestore`.

Bookings are saved in the `bookings` collection. Payment gateway webhooks should update `paymentStatus`, `paymentId`, and `paidAt`. A Firebase Cloud Function should then send the customer and company email/WhatsApp messages and update the four notification status fields.
