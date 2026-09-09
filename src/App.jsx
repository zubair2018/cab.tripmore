import { useState } from 'react'

import BookingConfirmation from './components/BookingConfirmation'
import BookingDialog from './components/BookingDialog'
import HomePage from './components/HomePage'
import AdminPage from './components/AdminPage'
import LegalPage from './components/LegalPage'

import { isFirebaseConfigured } from './services/firebase'
import { saveBookingToFirebase } from './services/bookings'
import './styles/global.css'

export default function App() {
  const [booking, setBooking] =
    useState(null)

  const [bookingError, setBookingError] =
    useState('')

  const [dialogOpen, setDialogOpen] =
    useState(false)

  const [initialDestination, setInitialDestination] =
    useState('')

  if (
    window.location.pathname ===
    '/admin'
  ) {
    return (
      <AdminPage
        onBack={() => {
          window.location.href = '/'
        }}
      />
    )
  }

  // Static legal pages, routed by pathname like /admin above.
  // vercel.json rewrites every path to index.html, so these work on
  // direct access and refresh.
  const legalPage = {
    '/terms': 'terms',
    '/disclaimer': 'disclaimer',
    '/refund-policy': 'refund',
  }[window.location.pathname]

  if (legalPage) {
    return <LegalPage page={legalPage} />
  }

  function openBooking(destination) {
    setBooking(null)
    setBookingError('')
    setInitialDestination(
      typeof destination === 'string' ? destination : '',
    )
    setDialogOpen(true)
  }

  async function saveBooking(
    bookingData,
  ) {
    try {
      setBookingError('')

      const savedBooking =
        await saveBookingToFirebase(
          bookingData,
        )

      if (savedBooking) {
        setBooking({
          ...bookingData,

          id: savedBooking.id,

          bookingReference:
            savedBooking.bookingReference,
        })
      } else {
        setBooking(bookingData)
      }

      setDialogOpen(false)
    } catch (error) {
      console.error(
        'Could not save booking.',
        error,
      )

      setBookingError(
        'We could not save your booking. Please try again.',
      )
    }
  }

  if (booking) {
    return (
      <BookingConfirmation
        booking={booking}
        onNewBooking={openBooking}
      />
    )
  }

  return (
    <>
      <HomePage
        onBook={openBooking}
      />

      {dialogOpen && (
        <BookingDialog
          onClose={() => {
            setDialogOpen(false)
            setBookingError('')
          }}
          onBook={saveBooking}
          error={bookingError}
          initialDestination={initialDestination}
        />
      )}

      {!isFirebaseConfigured && (
        <span className="local-mode-note">
          Demo mode: Firebase is not configured.
        </span>
      )}
    </>
  )
}