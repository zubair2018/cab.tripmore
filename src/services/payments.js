/**
 * TripMore Cabs — client-side payment flow (Razorpay).
 *
 * Talks to the Firebase Cloud Functions in /functions. The key secret stays on
 * the server; the browser only ever sees the public key_id and the order id.
 */

import { getFunctions, httpsCallable } from 'firebase/functions'

import app, { isFirebaseConfigured } from './firebase'

// Must match setGlobalOptions({ region }) in functions/index.js.
const REGION = 'asia-south1'

const functions = app ? getFunctions(app, REGION) : null

const RAZORPAY_CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

// Load the Razorpay Checkout script once, then reuse it.
let checkoutScriptPromise = null

function loadRazorpayCheckout() {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve(true)
  }

  if (checkoutScriptPromise) {
    return checkoutScriptPromise
  }

  checkoutScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = RAZORPAY_CHECKOUT_SRC
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => {
      checkoutScriptPromise = null
      reject(new Error('Could not load the payment window. Check your connection.'))
    }
    document.body.appendChild(script)
  })

  return checkoutScriptPromise
}

/**
 * Run the full payment for a saved booking.
 *
 * Resolves with:
 *   { status: 'PAID' }       once the payment is verified server-side
 *   { status: 'DISMISSED' }  if the customer closes the payment window
 *
 * Rejects with a friendly Error on any real failure.
 */
export async function payForBooking(booking) {
  if (!isFirebaseConfigured || !functions) {
    throw new Error('Online payment is not available in demo mode.')
  }

  const bookingId = booking?.id
  if (!bookingId) {
    throw new Error('This booking cannot be paid yet. Please try again.')
  }

  const createOrder = httpsCallable(functions, 'createRazorpayOrder')
  const verifyPayment = httpsCallable(functions, 'verifyRazorpayPayment')

  await loadRazorpayCheckout()

  const { data: order } = await createOrder({ bookingId })

  return new Promise((resolve, reject) => {
    const options = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'TripMore Cabs',
      description: `Booking ${order.bookingReference}`,
      order_id: order.orderId,
      prefill: {
        name: order.customer?.name || '',
        email: order.customer?.email || '',
        contact: order.customer?.phone || '',
      },
      theme: { color: '#19734f' },
      handler: async (response) => {
        try {
          await verifyPayment({
            bookingId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
          resolve({ status: 'PAID' })
        } catch (error) {
          console.error('Payment verification failed.', error)
          reject(
            new Error(
              'We received your payment but could not confirm it yet. Our team will follow up.',
            ),
          )
        }
      },
      modal: {
        // Customer closed the window without paying.
        ondismiss: () => resolve({ status: 'DISMISSED' }),
      },
    }

    const checkout = new window.Razorpay(options)

    checkout.on('payment.failed', (response) => {
      console.error('Razorpay payment failed.', response?.error)
      reject(
        new Error(
          response?.error?.description ||
            'The payment did not go through. Please try again.',
        ),
      )
    })

    checkout.open()
  })
}