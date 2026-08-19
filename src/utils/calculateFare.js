const JAMMU_LOCAL_CHARGE = 1000

export function calculateFare({
  vehicle,
  days,
  tour,
  routes = [],
}) {
  if (!vehicle || !tour) {
    return {
      base: 0,
      jammuLocalCharge: 0,
      total: 0,
    }
  }

  /*
   * Price comes from the selected Firestore place.
   *
   * Example:
   *
   * Pahalgam + Sedan = ₹3500
   * Gulmarg + Sedan  = ₹3000
   * Jammu + Sedan    = ₹4000
   */

  const selectedPrice =
    Number(
      tour.prices?.[vehicle.id],
    ) || 0

  const base =
    selectedPrice * days

  /*
   * Jammu → Jammu adds ₹1,000 once
   * per booking.
   */

  const hasJammuLocalRoute =
    routes.some(
      (route) =>
        route.from === 'Jammu' &&
        route.to === 'Jammu',
    )

  const jammuLocalCharge =
    hasJammuLocalRoute
      ? JAMMU_LOCAL_CHARGE
      : 0

  const total =
    base + jammuLocalCharge

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
