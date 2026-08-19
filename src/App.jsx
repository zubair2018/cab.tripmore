import { useState } from 'react'

import BookingConfirmation from './components/BookingConfirmation'
import BookingDialog from './components/BookingDialog'
import HomePage from './components/HomePage'
import AdminPage from './components/AdminPage'
import { isFirebaseConfigured } from './services/firebase'
import { saveBookingToFirebase } from './services/bookings'

export default function App() {
  const [booking, setBooking] = useState(null)
  const [bookingError, setBookingError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  if (window.location.pathname === '/admin') {
    return <AdminPage onBack={() => { window.location.href = '/' }} />
  }

  function openBooking() {
    setBooking(null)
    setBookingError('')
    setDialogOpen(true)
  }

  async function saveBooking(bookingData) {
    try {
      setBookingError('')
      const firebaseId = await saveBookingToFirebase(bookingData)
      setBooking(firebaseId ? { ...bookingData, id: firebaseId } : bookingData)
      setDialogOpen(false)
    } catch (error) {
      console.error('Could not save booking.', error)
      setBookingError('We could not save your booking. Please try again.')
    }
  }

  if (booking) {
    return <BookingConfirmation booking={booking} onNewBooking={openBooking} />
  }

  return (
    <>
      <HomePage onBook={openBooking} />
      {dialogOpen && (
        <BookingDialog
          onClose={() => { setDialogOpen(false); setBookingError('') }}
          onBook={saveBooking}
          error={bookingError}
        />
      )}
      {!isFirebaseConfigured && <span className="local-mode-note">Demo mode: Firebase is not configured.</span>}
    </>
  )
}
