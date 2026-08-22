/*
|--------------------------------------------------------------------------
| CALCULATE FARE
|--------------------------------------------------------------------------
|
| 1 day:
| Fare depends on From → To.
|
| 2-5 days:
| Fare depends only on number of days.
|
|--------------------------------------------------------------------------
*/

export function calculateFare({
  vehicle,
  days,
  from,
  to,
  catalog,
}) {
  if (
    !vehicle ||
    !catalog
  ) {
    return {
      base: 0,
      total: 0,
    }
  }


  const numberOfDays =
    Number(days || 1)


  const vehicleId =
    vehicle.id


  /*
   * 1 DAY
   */

  if (
    numberOfDays === 1
  ) {
    const price =
      getSingleDayPrice({
        catalog,
        vehicleId,
        from,
        to,
      })


    return {
      base: price,
      total: price,
    }
  }


  /*
   * 2-5 DAYS
   */

  const packagePrice =
    Number(
      catalog.prices?.[
        numberOfDays
      ]?.[
        vehicleId
      ] || 0,
    )


  return {
    base: packagePrice,
    total: packagePrice,
  }
}


/*
|--------------------------------------------------------------------------
| NORMALIZE PLACE
|--------------------------------------------------------------------------
*/

function normalizePlace(
  value,
) {
  return String(
    value || '',
  )
    .trim()
    .toLowerCase()
}


/*
|--------------------------------------------------------------------------
| SINGLE DAY PRICE
|--------------------------------------------------------------------------
*/

function getSingleDayPrice({
  catalog,
  vehicleId,
  from,
  to,
}) {
  const fromPlace =
    normalizePlace(
      from,
    )

  const toPlace =
    normalizePlace(
      to,
    )


  /*
   * Do not calculate anything
   * until both places are selected.
   */

  if (
    !fromPlace ||
    !toPlace
  ) {
    return 0
  }


  /*
   * Srinagar Local Seeing
   */

  if (
    (
      fromPlace ===
        'srinagar' &&
      toPlace ===
        'srinagar local seeing'
    ) ||
    (
      fromPlace ===
        'srinagar local seeing' &&
      toPlace ===
        'srinagar'
    )
  ) {
    return Number(
      catalog.prices?.[1]?.[
        'srinagar-local'
      ]?.[
        vehicleId
      ] || 0,
    )
  }


  /*
   * Airport ↔ Srinagar
   */

  if (
    (
      fromPlace ===
        'airport' &&
      toPlace ===
        'srinagar'
    ) ||
    (
      fromPlace ===
        'srinagar' &&
      toPlace ===
        'airport'
    )
  ) {
    return Number(
      catalog.prices?.[1]?.[
        'airport'
      ]?.[
        vehicleId
      ] || 0,
    )
  }


  /*
   * Srinagar ↔ Gulmarg
   */

  if (
    isRoute(
      fromPlace,
      toPlace,
      'srinagar',
      'gulmarg',
    )
  ) {
    return Number(
      catalog.prices?.[1]?.[
        'gulmarg'
      ]?.[
        vehicleId
      ] || 0,
    )
  }


  /*
   * Srinagar ↔ Pahalgam
   */

  if (
    isRoute(
      fromPlace,
      toPlace,
      'srinagar',
      'pahalgam',
    )
  ) {
    return Number(
      catalog.prices?.[1]?.[
        'pahalgam'
      ]?.[
        vehicleId
      ] || 0,
    )
  }


  /*
   * Srinagar ↔ Sonamarg
   */

  if (
    isRoute(
      fromPlace,
      toPlace,
      'srinagar',
      'sonamarg',
    )
  ) {
    return Number(
      catalog.prices?.[1]?.[
        'sonamarg'
      ]?.[
        vehicleId
      ] || 0,
    )
  }


  /*
   * No matching route.
   */

  return 0
}


/*
|--------------------------------------------------------------------------
| ROUTE HELPER
|--------------------------------------------------------------------------
*/

function isRoute(
  from,
  to,
  placeA,
  placeB,
) {
  return (
    (
      from === placeA &&
      to === placeB
    ) ||
    (
      from === placeB &&
      to === placeA
    )
  )
}


/*
|--------------------------------------------------------------------------
| FORMAT INR
|--------------------------------------------------------------------------
*/

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
  ).format(
    Number(amount || 0),
  )