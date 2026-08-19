export function calculateFare({
  vehicle,
  days,
  tour,
}) {
  if (!vehicle || !tour) {
    return { base: 0, total: 0 }
  }

  const price = Number(vehicle.prices?.[tour.id]) || 0
  const base = price * Number(days || 0)

  return {
    base,
    total: base,
  }
}

export const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
