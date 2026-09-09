/*
|--------------------------------------------------------------------------
| TRIPMORE PRICING — single source of truth
|--------------------------------------------------------------------------
|
| The booking flow and the admin dashboard both use the helpers in this
| file, so prices set in the dashboard are exactly what customers pay.
|
| Price store shape (catalog.prices):
|
|   {
|     1: {                          // single-day fares, keyed by DESTINATION slug
|       gulmarg:  { sedan, innova, tempo, urbania },
|       pahalgam: { sedan, innova, tempo, urbania },
|       airport:  { sedan, innova, tempo, urbania },
|       ...
|     },
|     2: { sedan, innova, tempo, urbania },   // multi-day packages, keyed by day count
|     3: { sedan, innova, tempo, urbania },
|     ...
|   }
|
| RULES
| - 1 day: fare depends on the DESTINATION (the non-hub endpoint of the
|   route). Pricing is bidirectional — Srinagar → Gulmarg and
|   Gulmarg → Srinagar both use prices[1].gulmarg.
| - 2+ days: fare depends only on the number of days + vehicle (a package),
|   independent of the route.
| - A price of 0 (or missing) means "not available" for that combination.
|
|--------------------------------------------------------------------------
*/

// Trips originate from the hub; the hub itself is never a priced destination.
export const HUB = 'srinagar'


/*
|--------------------------------------------------------------------------
| placeKey — turn a place name into a stable slug used as a price key
|--------------------------------------------------------------------------
|
| "Gulmarg"                    -> "gulmarg"
| "Srinagar Local Sightseeing" -> "srinagar-local-sightseeing"
| "Airport"                    -> "airport"
|
*/
export function placeKey(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}


/*
|--------------------------------------------------------------------------
| destinationPlaces — priceable single-day destinations (excludes the hub)
|--------------------------------------------------------------------------
*/
export function destinationPlaces(places) {
  return (places || []).filter(
    (place) => placeKey(place) !== HUB,
  )
}


/*
|--------------------------------------------------------------------------
| maxPackageDays — highest configured multi-day package (>= 2)
|--------------------------------------------------------------------------
|
| Used to cap the day counter so customers can never pick a day count that
| has no price. Returns 1 when only single-day pricing exists.
*/
export function maxPackageDays(prices) {
  const days = Object.keys(prices || {})
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= 2)

  return days.length ? Math.max(...days) : 1
}


/*
|--------------------------------------------------------------------------
| getSingleDayPrice — price for a one-day route
|--------------------------------------------------------------------------
|
| Looks up the non-hub endpoint (destination). Tries the "to" place first,
| then the "from" place, so reverse journeys are priced the same.
*/
export function getSingleDayPrice(prices, from, to, vehicleId) {
  if (!prices || !vehicleId) {
    return 0
  }

  const dayOne = prices[1] || {}

  const fromKey = placeKey(from)
  const toKey = placeKey(to)

  if (!fromKey || !toKey) {
    return 0
  }

  // The priced endpoint is whichever side is NOT the hub.
  const candidates = []

  if (toKey && toKey !== HUB) {
    candidates.push(toKey)
  }

  if (fromKey && fromKey !== HUB) {
    candidates.push(fromKey)
  }

  for (const key of candidates) {
    const entry = dayOne[key]

    if (entry && typeof entry === 'object') {
      const price = Number(entry[vehicleId] || 0)

      if (price > 0) {
        return price
      }
    }
  }

  return 0
}


/*
|--------------------------------------------------------------------------
| getPackagePrice — price for a multi-day package
|--------------------------------------------------------------------------
*/
export function getPackagePrice(prices, days, vehicleId) {
  if (!prices || !vehicleId) {
    return 0
  }

  return Number(
    prices?.[Number(days)]?.[vehicleId] || 0,
  )
}


/*
|--------------------------------------------------------------------------
| getFare — unified fare for a booking
|--------------------------------------------------------------------------
*/
export function getFare({ prices, days, from, to, vehicleId }) {
  const numberOfDays = Number(days || 1)

  const price =
    numberOfDays === 1
      ? getSingleDayPrice(prices, from, to, vehicleId)
      : getPackagePrice(prices, numberOfDays, vehicleId)

  return {
    base: price,
    total: price,
  }
}


/*
|--------------------------------------------------------------------------
| formatINR
|--------------------------------------------------------------------------
*/
export const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))
