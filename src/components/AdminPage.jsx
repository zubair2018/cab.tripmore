import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'

import AdminLogin from './AdminLogin'
import Dashboard from './Dashboard'

import { auth } from '../services/firebase'
import { isAdminUser } from '../services/admin'
import { subscribeToBookings } from '../services/bookings'

export default function AdminPage({
  onBack,
}) {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [bookings, setBookings] = useState([])

  useEffect(() => {
    if (!auth) {
      setChecking(false)
      return
    }

    let unsubscribeBookings = () => {}

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          unsubscribeBookings()

          if (!firebaseUser) {
            setBookings([])
            setUser(null)
            setAuthorized(false)
            setChecking(false)
            return
          }

          const admin =
            await isAdminUser(firebaseUser)

          if (admin) {
            setUser(firebaseUser)
            setAuthorized(true)

            unsubscribeBookings = subscribeToBookings(
              setBookings,
              (error) => {
                console.error(
                  'Could not load bookings from Firebase.',
                  error,
                )
              },
            )
          } else {
            await auth.signOut()
            setUser(null)
            setAuthorized(false)
          }

          setChecking(false)
        }
      )

    return () => {
      unsubscribeBookings()
      unsubscribe()
    }
  }, [])

  if (checking) {
    return (
      <main className="dashboard-login-page">
        <div className="dashboard-login">
          <p className="eyebrow">
            TRIPMORE OPERATIONS
          </p>

          <h1>Checking access...</h1>

          <p>
            Please wait while we verify your
            administrator account.
          </p>
        </div>
      </main>
    )
  }

  if (!auth) {
    return (
      <main className="dashboard-login-page">
        <div className="dashboard-login">
          <p className="eyebrow">
            TRIPMORE OPERATIONS
          </p>

          <h1>Firebase not configured</h1>

          <p>
            Add your Firebase environment
            variables before using the admin
            dashboard.
          </p>
        </div>
      </main>
    )
  }

  if (!user || !authorized) {
    return (
      <AdminLogin
        onLogin={(firebaseUser) => {
          setUser(firebaseUser)
          setAuthorized(true)
        }}
      />
    )
  }

  return (
    <Dashboard
      bookings={bookings}
      onBack={onBack}
    />
  )
}