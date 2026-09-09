/**
 * TripMore Cabs — payment backend
 * Razorpay integration on Firebase Cloud Functions (2nd gen).
 *
 * Three entry points:
 *   createRazorpayOrder   (callable) — create a Razorpay order for a booking
 *   verifyRazorpayPayment (callable) — verify the checkout signature, mark paid
 *   razorpayWebhook       (HTTP)     — server-to-server confirmation (source of truth)
 *
 * The Razorpay key secret never reaches the browser. The amount charged is read
 * from the booking document in Firestore, so the client cannot change the price.
 */

const crypto = require('crypto')

const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https')
const {
  onDocumentCreated,
  onDocumentUpdated,
} = require('firebase-functions/v2/firestore')
const { setGlobalOptions } = require('firebase-functions/v2')
const { defineSecret } = require('firebase-functions/params')
const { logger } = require('firebase-functions')

const admin = require('firebase-admin')

const {
  notifyAdminNewBooking,
  notifyCustomerPaid,
} = require('./notifications')

admin.initializeApp()

const db = admin.firestore()
const FieldValue = admin.firestore.FieldValue

// Deploy region. Keep this in sync with getFunctions(app, REGION) on the client.
// asia-south1 = Mumbai (lowest latency for India).
setGlobalOptions({ region: 'asia-south1', maxInstances: 10 })

// Secrets live in Google Secret Manager. Set them once with the Firebase CLI:
//   firebase functions:secrets:set RAZORPAY_KEY_ID
//   firebase functions:secrets:set RAZORPAY_KEY_SECRET
//   firebase functions:secrets:set RAZORPAY_WEBHOOK_SECRET
const RAZORPAY_KEY_ID = defineSecret('RAZORPAY_KEY_ID')
const RAZORPAY_KEY_SECRET = defineSecret('RAZORPAY_KEY_SECRET')
const RAZORPAY_WEBHOOK_SECRET = defineSecret('RAZORPAY_WEBHOOK_SECRET')

const RAZORPAY_API = 'https://api.razorpay.com/v1'

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function basicAuthHeader(keyId, keySecret) {
  const token = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
  return `Basic ${token}`
}

// Whole rupees -> integer paise, the unit Razorpay expects.
function toPaise(amount) {
  return Math.round(Number(amount || 0) * 100)
}

async function razorpayCreateOrder({ keyId, keySecret, amountPaise, receipt, notes }) {
  const response = await fetch(`${RAZORPAY_API}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: basicAuthHeader(keyId, keySecret),
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    logger.error('Razorpay order creation failed', data)
    throw new HttpsError(
      'internal',
      data?.error?.description || 'Could not create the payment order.',
    )
  }

  return data
}

// True when HMAC-SHA256(payload, secret) matches the given signature.
function signatureIsValid(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  const a = Buffer.from(expected)
  const b = Buffer.from(String(signature || ''))

  // Length check first so timingSafeEqual never throws on a mismatch.
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// Fields written when a booking becomes paid. Defined once so the callable and
// the webhook write exactly the same thing — the second writer is a no-op.
function paidUpdate(paymentId, orderId) {
  return {
    'payment.status': 'PAID',
    'payment.gateway': 'RAZORPAY',
    'payment.paymentId': paymentId,
    'payment.orderId': orderId,
    'payment.paidAt': admin.firestore.FieldValue.serverTimestamp(),
    bookingStatus: 'CONFIRMED',
  }
}

/* ------------------------------------------------------------------ */
/* 1. Create order                                                    */
/* ------------------------------------------------------------------ */

exports.createRazorpayOrder = onCall(
  { cors: true, secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET] },
  async (request) => {
    const bookingId = String(request.data?.bookingId || '').trim()

    if (!bookingId) {
      throw new HttpsError('invalid-argument', 'A bookingId is required.')
    }

    const bookingRef = db.collection('bookings').doc(bookingId)
    const snapshot = await bookingRef.get()

    if (!snapshot.exists) {
      throw new HttpsError('not-found', 'That booking does not exist.')
    }

    const booking = snapshot.data()

    if ((booking.payment?.status || '').toUpperCase() === 'PAID') {
      throw new HttpsError('failed-precondition', 'This booking is already paid.')
    }

    const amountPaise = toPaise(booking.fare?.total)

    if (amountPaise <= 0) {
      throw new HttpsError('failed-precondition', 'This booking has no payable amount.')
    }

    const order = await razorpayCreateOrder({
      keyId: RAZORPAY_KEY_ID.value(),
      keySecret: RAZORPAY_KEY_SECRET.value(),
      amountPaise,
      receipt: booking.bookingReference || bookingId,
      notes: {
        bookingId,
        bookingReference: booking.bookingReference || bookingId,
        customer: booking.customer?.name || '',
      },
    })

    // Store the order id so the webhook can correlate it back to this booking.
    await bookingRef.update({
      'payment.orderId': order.id,
      'payment.amount': Number(booking.fare?.total || 0),
    })

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID.value(),
      bookingReference: booking.bookingReference || bookingId,
      customer: {
        name: booking.customer?.name || '',
        email: booking.customer?.email || '',
        phone: booking.customer?.phone || '',
      },
    }
  },
)

/* ------------------------------------------------------------------ */
/* 2. Verify payment (called from the browser right after checkout)   */
/* ------------------------------------------------------------------ */

exports.verifyRazorpayPayment = onCall(
  { cors: true, secrets: [RAZORPAY_KEY_SECRET] },
  async (request) => {
    const {
      bookingId,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = request.data || {}

    if (!bookingId || !orderId || !paymentId || !signature) {
      throw new HttpsError('invalid-argument', 'Missing payment details.')
    }

    const valid = signatureIsValid(
      `${orderId}|${paymentId}`,
      signature,
      RAZORPAY_KEY_SECRET.value(),
    )

    if (!valid) {
      throw new HttpsError('permission-denied', 'Payment signature check failed.')
    }

    const bookingRef = db.collection('bookings').doc(String(bookingId))
    const snapshot = await bookingRef.get()

    if (!snapshot.exists) {
      throw new HttpsError('not-found', 'That booking does not exist.')
    }

    await bookingRef.update(paidUpdate(paymentId, orderId))

    return { success: true, bookingStatus: 'CONFIRMED', paymentStatus: 'PAID' }
  },
)

/* ------------------------------------------------------------------ */
/* 3. Webhook (Razorpay -> server; reliable even if the tab closes)   */
/* ------------------------------------------------------------------ */

exports.razorpayWebhook = onRequest(
  { secrets: [RAZORPAY_WEBHOOK_SECRET] },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed')
      return
    }

    const signature = req.headers['x-razorpay-signature']

    // Verify against the exact bytes Razorpay signed (req.rawBody), not the
    // re-serialized JSON, or the signature will never match.
    const valid = signatureIsValid(
      req.rawBody,
      signature,
      RAZORPAY_WEBHOOK_SECRET.value(),
    )

    if (!valid) {
      logger.warn('Rejected webhook with bad signature')
      res.status(400).send('Invalid signature')
      return
    }

    const event = req.body?.event
    const entity =
      req.body?.payload?.payment?.entity ||
      req.body?.payload?.order?.entity ||
      {}

    const orderId = entity.order_id || entity.id
    const paymentId = entity.id

    // Act only on a successful capture / paid order.
    const isPaid = event === 'payment.captured' || event === 'order.paid'

    if (isPaid && orderId) {
      const query = await db
        .collection('bookings')
        .where('payment.orderId', '==', orderId)
        .limit(1)
        .get()

      if (!query.empty) {
        await query.docs[0].ref.update(paidUpdate(paymentId, orderId))
        logger.info('Booking marked paid from webhook', { orderId })
      } else {
        logger.warn('Webhook order did not match any booking', { orderId })
      }
    }

    // Always 200 on a valid event so Razorpay stops retrying.
    res.status(200).json({ received: true })
  },
)

/* ------------------------------------------------------------------ */
/* 4. Notifications & receipts (Step 6)                               */
/* ------------------------------------------------------------------ */
/*
 * These are Firestore triggers, not HTTP endpoints. They deploy to the same
 * region as everything else (asia-south1).
 *
 * IMPORTANT: a Firestore trigger's region must match your Firestore database's
 * location. If your database is NOT in asia-south1, change setGlobalOptions
 * above (and the client REGION) to match, or these two triggers won't deploy.
 *
 * Both read their credentials from functions/.env (see functions/.env.example).
 * If the email / WhatsApp keys are absent, that channel is skipped and nothing
 * else is affected — add the keys and redeploy to switch notifications on.
 */

// serverTimestamp() when a channel actually sent; otherwise null.
function stampIf(status) {
  return status === 'SENT' ? FieldValue.serverTimestamp() : null
}

function buildReceiptNumber(booking, bookingId) {
  const now = new Date()
  const ymd =
    `${now.getFullYear()}` +
    `${String(now.getMonth() + 1).padStart(2, '0')}` +
    `${String(now.getDate()).padStart(2, '0')}`
  const base = booking?.bookingReference || bookingId || `${Date.now()}`
  return `RCPT-${ymd}-${String(base).replace(/[^A-Za-z0-9]/g, '').toUpperCase()}`
}

// New booking created -> alert the operations team (email + WhatsApp).
exports.onBookingCreated = onDocumentCreated(
  'bookings/{bookingId}',
  async (event) => {
    const snap = event.data
    if (!snap) return

    const booking = snap.data()

    try {
      const result = await notifyAdminNewBooking(booking)

      await snap.ref.update({
        'notifications.adminEmail.status': result.adminEmail,
        'notifications.adminEmail.sentAt': stampIf(result.adminEmail),
        'notifications.adminWhatsapp.status': result.adminWhatsapp,
        'notifications.adminWhatsapp.sentAt': stampIf(result.adminWhatsapp),
      })
    } catch (error) {
      logger.error('onBookingCreated notification failed', error)
    }
  },
)

// Payment just became PAID -> send the customer their confirmation + receipt.
exports.onBookingPaid = onDocumentUpdated(
  'bookings/{bookingId}',
  async (event) => {
    const before = event.data?.before?.data() || {}
    const after = event.data?.after?.data() || {}

    const wasPaid = (before.payment?.status || '').toUpperCase() === 'PAID'
    const isPaid = (after.payment?.status || '').toUpperCase() === 'PAID'

    // Only act on the PENDING -> PAID transition. This also prevents an
    // infinite loop: our own write below leaves the status PAID, so the
    // re-triggered event sees wasPaid === true and exits here.
    if (wasPaid || !isPaid) return

    // Idempotency guard: if a receipt was already generated, do nothing.
    if ((after.receipt?.status || '').toUpperCase() === 'GENERATED') return

    const receiptNumber = buildReceiptNumber(after, event.params.bookingId)

    try {
      const result = await notifyCustomerPaid(after, receiptNumber)

      await event.data.after.ref.update({
        'receipt.status': 'GENERATED',
        'receipt.receiptNumber': receiptNumber,
        'receipt.generatedAt': FieldValue.serverTimestamp(),
        'notifications.customerEmail.status': result.customerEmail,
        'notifications.customerEmail.sentAt': stampIf(result.customerEmail),
        'notifications.customerWhatsapp.status': result.customerWhatsapp,
        'notifications.customerWhatsapp.sentAt': stampIf(result.customerWhatsapp),
      })
    } catch (error) {
      logger.error('onBookingPaid notification failed', error)
    }
  },
)