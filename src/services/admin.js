import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

export async function isAdminUser(user) {
  if (!user || !db) {
    return false
  }

  try {
    const adminRef = doc(db, 'admins', user.uid)
    const adminSnapshot = await getDoc(adminRef)

    if (!adminSnapshot.exists()) {
      return false
    }

    const adminData = adminSnapshot.data()

    return (
      adminData.role === 'admin' &&
      adminData.active === true
    )
  } catch (error) {
    console.error('Could not verify admin user:', error)
    return false
  }
}