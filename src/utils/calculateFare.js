// One place for all fare rules. Update this file when pricing changes.
export function calculateFare({ vehicle, days, tour }) {
  if (!vehicle || !tour) return { base: 0, total: 0 }
  const base = vehicle.prices[tour.id] * days
  return { base, total: base }
}

export const formatINR = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
