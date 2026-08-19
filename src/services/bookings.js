import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'

import { db } from './firebase'

const bookingsCollection = db
  ? collection(db, 'bookings')
  : null

export async function saveBookingToFirebase(booking) {
  if (!bookingsCollection) {
    return null
  }

  const bookingForFirebase = {
    ...booking,

    createdAt: serverTimestamp(),
  }

  const document = await addDoc(
    bookingsCollection,
    bookingForFirebase
  )

  return document.id
}

export function subscribeToBookings(
  onBookings,
  onError
) {
  if (!bookingsCollection) {
    return () => {}
  }

  const bookingsQuery = query(
    bookingsCollection,
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(
    bookingsQuery,
    (snapshot) => {
      const bookings = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }))

      onBookings(bookings)
    },
    onError
  )
}