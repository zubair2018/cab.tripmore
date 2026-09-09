import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'

import { db } from './firebase'

const bookingsCollection = db
  ? collection(db, 'bookings')
  : null

/*
 * ==========================================
 * CREATE BOOKING
 * ==========================================
 *
 * The fare passed into this function comes
 * from the current TripMore catalog.
 *
 * Dashboard price
 *       ↓
 * Firebase catalog
 *       ↓
 * Booking Dialog
 *       ↓
 * fare.total
 *       ↓
 * payment.amount
 *
 * This means changing a price in the
 * dashboard automatically affects future
 * bookings.
 */
export async function saveBookingToFirebase(
  booking,
) {
  if (!bookingsCollection) {
    return null
  }

  const bookingReference =
    booking.id ||
    `TRP-${Date.now()
      .toString()
      .slice(-6)}`

  const bookingForFirebase = {
    /*
     * ======================================
     * BOOKING REFERENCE
     * ======================================
     */

    bookingReference,

    /*
     * ======================================
     * CUSTOMER
     * ======================================
     */

    customer:
      booking.customer || {
        name: '',
        email: '',
        phone: '',
      },

    /*
     * ======================================
     * JOURNEY
     * ======================================
     */

    tour:
      booking.tour || null,

    vehicle:
      booking.vehicle || null,

    days:
      Number(
        booking.days || 1,
      ),

    routes:
      booking.routes || [],

    /*
     * ======================================
     * CURRENT FARE
     * ======================================
     *
     * This is NOT a hard-coded price.
     *
     * It comes from the current dashboard
     * price through the BookingDialog.
     */

    fare:
      booking.fare || {
        base: 0,
        total: 0,
      },

    /*
     * ======================================
     * BOOKING STATUS
     * ======================================
     */

    bookingStatus:
      'PENDING_PAYMENT',

    /*
     * ======================================
     * PAYMENT
     * ======================================
     *
     * Gateway-independent structure.
     *
     * Later the payment gateway will update:
     *
     * status
     * gateway
     * orderId
     * paymentId
     * paidAt
     */

    payment: {
      status: 'PENDING',

      gateway: null,

      orderId: null,

      paymentId: null,

      /*
       * The amount comes from the current
       * fare calculated for this booking.
       */
      amount:
        Number(
          booking.fare?.total ||
            0,
        ),

      paidAt: null,
    },

    /*
     * ======================================
     * NOTIFICATIONS
     * ======================================
     *
     * These start as PENDING.
     *
     * Later:
     *
     * PENDING
     * SENT
     * FAILED
     */

    notifications: {
      customerEmail: {
        status: 'PENDING',
        sentAt: null,
      },

      customerWhatsapp: {
        status: 'PENDING',
        sentAt: null,
      },

      adminEmail: {
        status: 'PENDING',
        sentAt: null,
      },

      adminWhatsapp: {
        status: 'PENDING',
        sentAt: null,
      },
    },

    /*
     * ======================================
     * RECEIPT
     * ======================================
     *
     * Later this will be used to generate
     * the customer's booking/payment receipt.
     */

    receipt: {
      status: 'PENDING',

      receiptNumber: null,

      generatedAt: null,
    },

    /*
     * ======================================
     * CREATED TIME
     * ======================================
     */

    createdAt:
      serverTimestamp(),
  }

  const document =
    await addDoc(
      bookingsCollection,
      bookingForFirebase,
    )

  return {
    id: document.id,

    bookingReference,
  }
}


/*
 * ==========================================
 * REAL-TIME BOOKINGS
 * ==========================================
 *
 * Used by the TripMore admin dashboard.
 */
export function subscribeToBookings(
  onBookings,
  onError,
) {
  if (!bookingsCollection) {
    return () => {}
  }

  const bookingsQuery =
    query(
      bookingsCollection,
      orderBy(
        'createdAt',
        'desc',
      ),
    )

  return onSnapshot(
    bookingsQuery,
    (snapshot) => {
      const bookings =
        snapshot.docs.map(
          (document) => ({
            id:
              document.id,

            ...document.data(),
          }),
        )

      onBookings(
        bookings,
      )
    },
    onError,
  )
}


/*
 * ==========================================
 * ADMIN BOOKING ACTIONS
 * ==========================================
 *
 * Update or remove a booking from the dashboard. The dashboard listens to
 * bookings in real time (subscribeToBookings), so these changes appear
 * immediately without a manual refresh.
 */

function bookingDoc(bookingId) {
  return db && bookingId
    ? doc(db, 'bookings', bookingId)
    : null
}

async function updateBooking(bookingId, updates) {
  const reference = bookingDoc(bookingId)

  if (!reference) {
    return
  }

  await updateDoc(reference, updates)
}

/*
 * Mark a booking paid, or undo it. Paying implies the booking is confirmed;
 * undoing returns it to pending payment. gateway = 'MANUAL' flags a payment
 * the admin recorded by hand (versus the online gateway added later).
 */
export async function setBookingPaid(bookingId, paid) {
  return updateBooking(
    bookingId,
    paid
      ? {
          'payment.status': 'PAID',
          'payment.gateway': 'MANUAL',
          'payment.paidAt': serverTimestamp(),
          bookingStatus: 'CONFIRMED',
        }
      : {
          'payment.status': 'PENDING',
          'payment.gateway': null,
          'payment.paidAt': null,
          bookingStatus: 'PENDING_PAYMENT',
        },
  )
}

/*
 * Cancel a booking, or reopen it. Reopening restores CONFIRMED when the
 * booking is already paid, otherwise PENDING_PAYMENT.
 */
export async function setBookingCancelled(bookingId, cancelled, paid) {
  return updateBooking(bookingId, {
    bookingStatus: cancelled
      ? 'CANCELLED'
      : paid
        ? 'CONFIRMED'
        : 'PENDING_PAYMENT',
  })
}

/*
 * Permanently remove a booking (for spam or test entries).
 */
export async function deleteBooking(bookingId) {
  const reference = bookingDoc(bookingId)

  if (!reference) {
    return
  }

  await deleteDoc(reference)
}