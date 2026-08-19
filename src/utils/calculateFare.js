// One place for all fare rules. Update this file when pricing changes.

const JAMMU_LOCAL_CHARGE = 1000

export function calculateFare({ vehicle, days, tour, routes = [] }) {
  if (!vehicle || !tour) {
    return {
      base: 0,
      jammuLocalCharge: 0,
      total: 0,
    }
  }

  const base = vehicle.prices[tour.id] * days

  // Add ₹1,000 when the customer selects Jammu as both
  // the pickup and drop location. This is applied once
  // per booking if at least one route matches Jammu → Jammu.
  const hasJammuLocalRoute = routes.some(
    (route) => route.from === 'Jammu' && route.to === 'Jammu'
  )

  const jammuLocalCharge = hasJammuLocalRoute
    ? JAMMU_LOCAL_CHARGE
    : 0

  const total = base + jammuLocalCharge

  return {
    base,
    jammuLocalCharge,
    total,
  }
}

export const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
