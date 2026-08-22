import {
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore'

import { db } from './firebase'

import {
  places as defaultPlaces,
  tours as defaultTours,
  vehicles as defaultVehicles,
} from '../data/vehicles'


// ============================================================================
// DEFAULT PRICES
// ============================================================================

const defaultPrices = {
  1: {
    gulmarg: {
      sedan: 3500,
      innova: 4000,
    },

    pahalgam: {
      sedan: 3500,
      innova: 4000,
    },

    sonamarg: {
      sedan: 3500,
      innova: 4000,
    },

    'srinagar-local': {
      sedan: 3000,
      innova: 3500,
    },

    airport: {
      sedan: 1500,
      innova: 2000,
    },
  },

  2: {
    sedan: 6000,
    innova: 7000,
  },

  3: {
    sedan: 9000,
    innova: 10500,
  },

  4: {
    sedan: 12000,
    innova: 14000,
  },

  5: {
    sedan: 15000,
    innova: 17000,
  },
}


// ============================================================================
// DEFAULT CATALOG
// ============================================================================

export const defaultCatalog = {
  places: defaultPlaces,

  vehicles: defaultVehicles,

  prices: defaultPrices,

  tours: defaultTours.map((tour) => ({
    ...tour,
    origin: 'Srinagar',
    days: 1,
  })),
}


// ============================================================================
// FIREBASE REFERENCE
// ============================================================================

const catalogRef = db
  ? doc(db, 'settings', 'catalog')
  : null


// ============================================================================
// MERGE PRICES
// ============================================================================

function mergePrices(defaults, saved) {
  const result = {
    ...defaults,
  }

  Object.keys(saved || {}).forEach((day) => {
    const savedDay = saved[day]

    if (
      !savedDay ||
      typeof savedDay !== 'object'
    ) {
      return
    }

    result[day] = {
      ...(result[day] || {}),
      ...savedDay,
    }

    Object.keys(savedDay).forEach((key) => {
      const savedValue = savedDay[key]

      if (
        savedValue &&
        typeof savedValue === 'object' &&
        !Array.isArray(savedValue)
      ) {
        result[day][key] = {
          ...(result[day]?.[key] || {}),
          ...savedValue,
        }
      }
    })
  })

  return result
}


// ============================================================================
// NORMALIZE PLACES
// ============================================================================
//
// IMPORTANT:
//
// DO NOT add defaultPlaces here.
//
// Firebase places are the source of truth once the catalog exists.
//
// This is what allows the dashboard to:
//
// ADD a place
// REMOVE a place
//
// and have that change reflected in BookingDialog.
//
// ============================================================================

function normalizePlaces(savedPlaces) {
  if (!Array.isArray(savedPlaces)) {
    return defaultPlaces
  }

  const seen = new Set()

  return savedPlaces.filter((place) => {
    if (
      place === null ||
      place === undefined
    ) {
      return false
    }

    const cleanPlace = String(place).trim()

    if (!cleanPlace) {
      return false
    }

    const key = cleanPlace.toLowerCase()

    if (seen.has(key)) {
      return false
    }

    seen.add(key)

    return true
  })
}


// ============================================================================
// NORMALIZE VEHICLES
// ============================================================================

function normalizeVehicles(savedVehicles) {
  if (
    Array.isArray(savedVehicles) &&
    savedVehicles.length > 0
  ) {
    return savedVehicles
  }

  return defaultVehicles
}


// ============================================================================
// NORMALIZE TOURS
// ============================================================================

function normalizeTours(savedTours) {
  if (
    Array.isArray(savedTours) &&
    savedTours.length > 0
  ) {
    return savedTours
  }

  return defaultCatalog.tours
}


// ============================================================================
// NORMALIZE CATALOG
// ============================================================================

function normalizeCatalog(data) {
  const source = data || {}

  // ----------------------------------------------------------
  // Places
  // ----------------------------------------------------------
  //
  // Firebase places are used exactly as saved.
  //
  // We DO NOT append defaultPlaces.
  //
  // ----------------------------------------------------------

  const places = normalizePlaces(
    source.places,
  )


  // ----------------------------------------------------------
  // Vehicles
  // ----------------------------------------------------------

  const vehicles = normalizeVehicles(
    source.vehicles,
  )


  // ----------------------------------------------------------
  // Prices
  // ----------------------------------------------------------

  const prices =
    source.prices &&
    typeof source.prices === 'object'
      ? mergePrices(
          defaultCatalog.prices,
          source.prices,
        )
      : defaultCatalog.prices


  // ----------------------------------------------------------
  // Tours
  // ----------------------------------------------------------

  const tours = normalizeTours(
    source.tours,
  )


  return {
    places,
    vehicles,
    prices,
    tours,
  }
}


// ============================================================================
// SUBSCRIBE TO CATALOG
// ============================================================================

export function subscribeToCatalog(
  onCatalog,
  onError,
) {
  // ----------------------------------------------------------
  // Firebase unavailable
  // ----------------------------------------------------------

  if (!catalogRef) {
    onCatalog(defaultCatalog)

    return () => {}
  }


  // ----------------------------------------------------------
  // Listen to Firebase
  // ----------------------------------------------------------

  return onSnapshot(
    catalogRef,

    (snapshot) => {
      // ------------------------------------------------------
      // IMPORTANT:
      //
      // If the catalog document doesn't exist,
      // use the six default places.
      //
      // Once the document exists, Firebase becomes
      // the source of truth.
      // ------------------------------------------------------

      if (!snapshot.exists()) {
        onCatalog(defaultCatalog)

        return
      }


      // ------------------------------------------------------
      // Load Firebase catalog
      // ------------------------------------------------------

      const catalog = normalizeCatalog(
        snapshot.data(),
      )

      onCatalog(catalog)
    },

    (error) => {
      console.error(
        'Could not load TripMore catalog.',
        error,
      )

      // Fall back to defaults if Firebase fails.

      onCatalog(defaultCatalog)

      if (onError) {
        onError(error)
      }
    },
  )
}


// ============================================================================
// SAVE CATALOG
// ============================================================================
//
// The Admin Dashboard should call this whenever the administrator
// adds/removes/edits places, vehicles, prices or tours.
//
// ============================================================================

export async function saveCatalog(
  catalog,
) {
  if (!catalogRef) {
    throw new Error(
      'Firebase is not configured.',
    )
  }

  const normalized =
    normalizeCatalog(catalog)


  await setDoc(
    catalogRef,

    {
      places: normalized.places,

      vehicles: normalized.vehicles,

      prices: normalized.prices,

      tours: normalized.tours,

      updatedAt:
        new Date().toISOString(),
    },

    {
      merge: true,
    },
  )
}


// ============================================================================
// EXPORT DEFAULT PRICES
// ============================================================================

export {
  defaultPrices,
}