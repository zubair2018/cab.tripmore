import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'

import AdminLogin from './AdminLogin'
import Dashboard from './Dashboard'

import { auth } from '../services/firebase'
import { isAdminUser } from '../services/admin'

export default function AdminPage({
  onBack,
}) {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (!auth) {
      setChecking(false)
      return
    }

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          if (!firebaseUser) {
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
          } else {
            await auth.signOut()
            setUser(null)
            setAuthorized(false)
          }

          setChecking(false)
        }
      )

    return unsubscribe
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
    <Dashboard onBack={onBack} />
  )
}