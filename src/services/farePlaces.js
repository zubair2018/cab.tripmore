import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore'

import { tours, vehicles } from '../data/vehicles'
import { db } from './firebase'

const farePlacesCollection = db
  ? collection(db, 'farePlaces')
  : null

const defaultFarePlaces = tours.map((tour) => ({
  id: tour.id,
  name: tour.destination,
  prices: vehicles.reduce(
    (prices, vehicle) => ({
      ...prices,
      [vehicle.id]: vehicle.prices[tour.id],
    }),
    {},
  ),
  active: true,
}))

export function subscribeToFarePlaces(
  onPlaces,
  onError,
) {
  if (!farePlacesCollection) {
    onPlaces(defaultFarePlaces)
    return () => {}
  }

  const placesQuery = query(
    farePlacesCollection,
    orderBy('name'),
  )

  return onSnapshot(
    placesQuery,
    (snapshot) => {
      onPlaces(
        snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        })),
      )
    },
    onError,
  )
}

export async function seedDefaultFarePlaces() {
  if (!farePlacesCollection) {
    return
  }

  await Promise.all(
    defaultFarePlaces.map((place) =>
      setDoc(
        doc(farePlacesCollection, place.id),
        place,
        { merge: true },
      ),
    ),
  )
}

export async function addFarePlace(place) {
  if (!farePlacesCollection) {
    throw new Error('Firebase is not configured.')
  }

  const document = await addDoc(
    farePlacesCollection,
    {
      name: place.name.trim(),
      prices: normalizePrices(place.prices),
      active: true,
    },
  )

  return document.id
}

export async function updateFarePlace(id, changes) {
  if (!farePlacesCollection) {
    throw new Error('Firebase is not configured.')
  }

  await updateDoc(
    doc(farePlacesCollection, id),
    {
      ...(changes.name !== undefined && {
        name: changes.name.trim(),
      }),
      ...(changes.prices !== undefined && {
        prices: normalizePrices(changes.prices),
      }),
      ...(changes.active !== undefined && {
        active: Boolean(changes.active),
      }),
    },
  )
}

export async function toggleFarePlace(id, active) {
  return updateFarePlace(id, { active })
}

export async function deleteFarePlace(id) {
  if (!farePlacesCollection) {
    throw new Error('Firebase is not configured.')
  }

  await deleteDoc(doc(farePlacesCollection, id))
}

function normalizePrices(prices = {}) {
  return Object.fromEntries(
    vehicles.map((vehicle) => [
      vehicle.id,
      Math.max(0, Number(prices[vehicle.id]) || 0),
    ]),
  )
}