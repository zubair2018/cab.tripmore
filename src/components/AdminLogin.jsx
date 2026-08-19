import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'

import { auth } from '../services/firebase'
import { isAdminUser } from '../services/admin'

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setLoading(true)

    try {
      if (!auth) {
        throw new Error('Firebase is not configured.')
      }

      const result = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )

      const admin = await isAdminUser(result.user)

      if (!admin) {
        setError('You do not have administrator access.')

        await auth.signOut()

        return
      }

      onLogin(result.user)
    } catch (error) {
      console.error(error)

      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found'
      ) {
        setError('Invalid email or password.')
      } else {
        setError(
          error.message ||
          'Login failed. Please try again.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="dashboard-login-page">
      <form
        className="dashboard-login"
        onSubmit={handleSubmit}
      >
        <p className="eyebrow">
          TRIPMORE OPERATIONS
        </p>

        <h1>Admin login</h1>

        <p>
          Sign in with your authorized Tripmore
          Firebase account.
        </p>

        <label>
          Email address

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="admin@tripmore.in"
            required
          />
        </label>

        <label>
          Password

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Enter password"
            required
          />
        </label>

        {error && (
          <p className="login-error">
            {error}
          </p>
        )}

        <button
          className="button button-primary"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Checking access...' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}