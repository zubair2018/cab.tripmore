import {
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore'

import { db } from './firebase'
import {
  places as defaultPlaces,
  tours as defaultTours,
} from '../data/vehicles'

export const defaultCatalog = {
  places: defaultPlaces,

  tours: defaultTours.map((tour) => ({
    ...tour,

    origin: 'Srinagar',

    prices: {
      sedan: 3500,
      innova: 4000,
      tempo: 5500,
      urbania: 7000,
    },
  })),
}

const catalogRef = db
  ? doc(db, 'settings', 'catalog')
  : null

export function subscribeToCatalog(
  onCatalog,
  onError,
) {
  if (!catalogRef) {
    onCatalog(defaultCatalog)
    return () => {}
  }

  return onSnapshot(
    catalogRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onCatalog(defaultCatalog)
        return
      }

      const data = snapshot.data()

      onCatalog({
        places: Array.isArray(data.places)
          ? data.places
          : defaultCatalog.places,

        tours: Array.isArray(data.tours)
          ? data.tours
          : defaultCatalog.tours,
      })
    },
    onError,
  )
}

export async function saveCatalog(
  catalog,
) {
  if (!catalogRef) {
    throw new Error(
      'Firebase is not configured.',
    )
  }

  await setDoc(
    catalogRef,
    {
      places: catalog.places,
      tours: catalog.tours,
      updatedAt:
        new Date().toISOString(),
    },
    {
      merge: true,
    },
  )
}