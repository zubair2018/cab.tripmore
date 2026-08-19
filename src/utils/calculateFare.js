export function calculateFare({
  vehicle,
  days,
  tour,
}) {
  if (!vehicle || !tour) {
    return {
      base: 0,
      total: 0,
    }
  }

  // The dashboard stores the price directly
  // inside the selected tour:
  //
  // tour.prices = {
  //   sedan: 3500,
  //   innova: 4000,
  //   tempo: 5500,
  //   urbania: 7000
  // }
  //
  // Therefore, the tour is the source of truth
  // for the current transport price.

  const price = Number(
    tour.prices?.[vehicle.id] || 0,
  )

  const base =
    price * Number(days || 0)

  return {
    base,
    total: base,
  }
}

export const formatINR = (
  amount,
) =>
  new Intl.NumberFormat(
    'en-IN',
    {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    },
  ).format(amount)