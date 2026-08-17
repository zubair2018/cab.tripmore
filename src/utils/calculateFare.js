export function calculateFare({ vehicle, days, pickup, drop }) {
  if (!vehicle) {
    return {
      base: 0,
      jammuCharge: 0,
      oneDayCharge: 0,
      total: 0,
    }
  }

  // Vehicle daily rate × selected number of days.
  const base = vehicle.rate * days

  // Jammu → Jammu bookings cost ₹1,000 extra per day.
  const jammuCharge =
    pickup === 'Jammu' && drop === 'Jammu' ? 1000 * days : 0

  // Every one-day booking costs ₹1,000 extra.
  const oneDayCharge = days === 1 ? 1000 : 0

  return {
    base,
    jammuCharge,
    oneDayCharge,
    total: base + jammuCharge + oneDayCharge,
  }
}

export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}