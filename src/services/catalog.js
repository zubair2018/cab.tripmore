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

// Single-day fares are keyed by the DESTINATION place slug (the non-Srinagar
// endpoint). Pricing is bidirectional. Multi-day entries (2+) are packages
// keyed by number of days. These are starting values — the admin dashboard
// is the source of truth and overrides them. All four vehicles are priced so
// every vehicle is bookable out of the box (review these in the dashboard).
const defaultPrices = {
  1: {
    gulmarg: {
      sedan: 3500,
      innova: 4000,
      tempo: 6000,
      urbania: 7500,
    },

    pahalgam: {
      sedan: 3500,
      innova: 4000,
      tempo: 6000,
      urbania: 7500,
    },

    sonamarg: {
      sedan: 3500,
      innova: 4000,
      tempo: 6000,
      urbania: 7500,
    },

    'srinagar-local-sightseeing': {
      sedan: 3000,
      innova: 3500,
      tempo: 5000,
      urbania: 6500,
    },

    airport: {
      sedan: 1500,
      innova: 2000,
      tempo: 3000,
      urbania: 4000,
    },
  },

  2: {
    sedan: 6000,
    innova: 7000,
    tempo: 10000,
    urbania: 13000,
  },

  3: {
    sedan: 9000,
    innova: 10500,
    tempo: 15000,
    urbania: 19000,
  },

  4: {
    sedan: 12000,
    innova: 14000,
    tempo: 20000,
    urbania: 25000,
  },

  5: {
    sedan: 15000,
    innova: 17000,
    tempo: 25000,
    urbania: 31000,
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
  //
  // Once a catalog document exists, its saved prices are the
  // source of truth (same model as places). We DO NOT merge
  // defaults over them, so removing a package day or a
  // destination in the dashboard actually sticks. Defaults are
  // only the fallback when no prices have ever been saved.
  // ----------------------------------------------------------

  const prices =
    source.prices &&
    typeof source.prices === 'object' &&
    Object.keys(source.prices).length > 0
      ? source.prices
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