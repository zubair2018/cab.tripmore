/**
 * TripMore Cabs — notifications & receipts.
 *
 *   Email    : SMTP via nodemailer. Works with any provider (Gmail, Zoho,
 *              Brevo, SendGrid, Mailgun, ...). Configure with SMTP_* env vars.
 *   WhatsApp : Meta WhatsApp Cloud API (template messages). Configure with
 *              WHATSAPP_* env vars and create the two documented templates.
 *
 * Everything here is OPTIONAL and NON-FATAL. If a channel's keys are missing,
 * that channel simply returns 'SKIPPED' and the booking flow is unaffected.
 * Add the keys to functions/.env and redeploy to switch notifications on — no
 * code changes required. This is why "only the keys need adding".
 */

const nodemailer = require('nodemailer')
const { logger } = require('firebase-functions')

const BRAND = process.env.BUSINESS_NAME || 'TripMore Cabs'
const BRAND_GREEN = '#19734f'

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                 */
/* ------------------------------------------------------------------ */

function formatINR(amount) {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount || 0))
  } catch (_) {
    return `₹${Math.round(Number(amount || 0))}`
  }
}

function routeSummaryHtml(booking) {
  const routes = Array.isArray(booking?.routes) ? booking.routes : []
  if (!routes.length) return 'Journey details to be confirmed'
  return routes
    .map(
      (r, i) =>
        `Day ${i + 1}: ${escapeHtml(r?.from || '—')} → ${escapeHtml(
          r?.to || '—',
        )}`,
    )
    .join('<br>')
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Meta wants digits only, including the country code and no leading "+".
function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 10) return `91${digits}` // bare 10-digit Indian mobile
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`
  return digits
}

/* ------------------------------------------------------------------ */
/* Email (SMTP via nodemailer)                                        */
/* ------------------------------------------------------------------ */

function emailEnabled() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.MAIL_FROM,
  )
}

let transporter = null

function getTransporter() {
  if (transporter) return transporter

  const port = Number(process.env.SMTP_PORT || 587)

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  return transporter
}

// Returns 'SENT' | 'FAILED' | 'SKIPPED'. Never throws.
async function sendEmail({ to, subject, html }) {
  if (!emailEnabled()) return 'SKIPPED'
  if (!to) return 'SKIPPED'

  try {
    await getTransporter().sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      html,
    })
    return 'SENT'
  } catch (error) {
    logger.error('Email send failed', error)
    return 'FAILED'
  }
}

/* ------------------------------------------------------------------ */
/* WhatsApp (Meta Cloud API — template messages)                      */
/* ------------------------------------------------------------------ */

function whatsappEnabled() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID)
}

// Returns 'SENT' | 'FAILED' | 'SKIPPED'. Never throws.
async function sendWhatsAppTemplate({ to, template, params }) {
  if (!whatsappEnabled()) return 'SKIPPED'

  const recipient = normalizePhone(to)
  if (!recipient || !template) return 'SKIPPED'

  try {
    const url = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`

    const body = {
      messaging_product: 'whatsapp',
      to: recipient,
      type: 'template',
      template: {
        name: template,
        language: { code: process.env.WHATSAPP_LANG || 'en' },
        components: [
          {
            type: 'body',
            parameters: (params || []).map((p) => ({
              type: 'text',
              text: String(p == null ? '' : p),
            })),
          },
        ],
      },
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      logger.error('WhatsApp send failed', { status: response.status, detail })
      return 'FAILED'
    }

    return 'SENT'
  } catch (error) {
    logger.error('WhatsApp error', error)
    return 'FAILED'
  }
}

/* ------------------------------------------------------------------ */
/* Email content builders                                             */
/* ------------------------------------------------------------------ */

function shell(title, innerHtml) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f7f6f1;font-family:Arial,Helvetica,sans-serif;color:#082032;">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
      <div style="background:#ffffff;border:1px solid #e5e8e4;border-radius:16px;padding:32px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND_GREEN};">${escapeHtml(
    BRAND,
  )}</p>
        <h1 style="margin:0 0 20px;font-size:24px;line-height:1.25;color:#082032;">${escapeHtml(
          title,
        )}</h1>
        ${innerHtml}
      </div>
      <p style="text-align:center;color:#94a1a8;font-size:12px;margin:18px 0 0;">This is an automated message from ${escapeHtml(
        BRAND,
      )}.</p>
    </div>
  </body>
</html>`
}

function detailRow(label, value) {
  return `<tr>
    <td style="padding:8px 0;color:#71808a;font-size:13px;">${escapeHtml(label)}</td>
    <td style="padding:8px 0;text-align:right;font-weight:700;color:#082032;font-size:14px;">${value}</td>
  </tr>`
}

// Customer: payment confirmed + receipt.
function customerConfirmationEmail(booking, receiptNumber) {
  const amount = formatINR(booking?.fare?.total ?? booking?.payment?.amount)
  const name = booking?.customer?.name || 'traveller'

  const inner = `
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#52616b;">
      Hi ${escapeHtml(name)}, your payment is confirmed and your booking is secured.
      Here is your receipt.
    </p>

    <div style="background:#f3f7f4;border:1px solid #dce9e2;border-radius:12px;padding:18px 20px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;">
        ${detailRow('Receipt no.', escapeHtml(receiptNumber))}
        ${detailRow('Booking ref.', escapeHtml(booking?.bookingReference || ''))}
        ${detailRow('Vehicle', escapeHtml(booking?.vehicle?.name || 'Vehicle'))}
        ${detailRow('Duration', `${escapeHtml(String(booking?.days || 1))} day(s)`)}
      </table>
    </div>

    <p style="margin:0 0 6px;font-weight:700;color:#082032;">Journey</p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#52616b;">${routeSummaryHtml(
      booking,
    )}</p>

    <div style="background:${BRAND_GREEN};border-radius:12px;padding:18px 20px;color:#ffffff;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="font-size:13px;color:rgba(255,255,255,0.75);text-transform:uppercase;letter-spacing:0.06em;">Amount paid</td>
          <td style="text-align:right;font-size:22px;font-weight:800;">${amount}</td>
        </tr>
      </table>
    </div>

    <p style="margin:22px 0 0;font-size:14px;line-height:1.6;color:#52616b;">
      Our team will reach out with your pickup time and driver details. Thank you for choosing ${escapeHtml(
        BRAND,
      )}!
    </p>`

  return {
    subject: `Payment received — booking ${booking?.bookingReference || ''} confirmed`,
    html: shell('Payment received', inner),
  }
}

// Admin: a new booking has come in.
function adminNewBookingEmail(booking) {
  const amount = formatINR(booking?.fare?.total)
  const created = 'just now'

  const inner = `
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#52616b;">
      A new booking has been submitted (${escapeHtml(created)}).
    </p>

    <div style="background:#f3f7f4;border:1px solid #dce9e2;border-radius:12px;padding:18px 20px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;">
        ${detailRow('Booking ref.', escapeHtml(booking?.bookingReference || ''))}
        ${detailRow('Customer', escapeHtml(booking?.customer?.name || 'Unknown'))}
        ${detailRow('Phone', escapeHtml(booking?.customer?.phone || '—'))}
        ${detailRow('Email', escapeHtml(booking?.customer?.email || '—'))}
        ${detailRow('Vehicle', escapeHtml(booking?.vehicle?.name || 'Vehicle'))}
        ${detailRow('Duration', `${escapeHtml(String(booking?.days || 1))} day(s)`)}
        ${detailRow('Fare', amount)}
      </table>
    </div>

    <p style="margin:0 0 6px;font-weight:700;color:#082032;">Journey</p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#52616b;">${routeSummaryHtml(
      booking,
    )}</p>

    <p style="margin:18px 0 0;font-size:14px;color:#52616b;">Open the admin dashboard to manage this booking.</p>`

  return {
    subject: `New booking ${booking?.bookingReference || ''} — ${
      booking?.customer?.name || 'customer'
    }`,
    html: shell('New booking received', inner),
  }
}

/* ------------------------------------------------------------------ */
/* High-level orchestration (called by the Firestore triggers)        */
/* ------------------------------------------------------------------ */

/**
 * Notify the operations team that a new booking arrived.
 * Returns { adminEmail, adminWhatsapp } each 'SENT' | 'FAILED' | 'SKIPPED'.
 */
async function notifyAdminNewBooking(booking) {
  const mail = adminNewBookingEmail(booking)

  const [adminEmail, adminWhatsapp] = await Promise.all([
    sendEmail({ to: process.env.ADMIN_EMAIL, subject: mail.subject, html: mail.html }),
    sendWhatsAppTemplate({
      to: process.env.ADMIN_WHATSAPP,
      template: process.env.WHATSAPP_ADMIN_TEMPLATE || 'new_booking_admin',
      params: [
        booking?.bookingReference || '',
        booking?.customer?.name || 'Customer',
        booking?.customer?.phone || '',
        formatINR(booking?.fare?.total),
      ],
    }),
  ])

  return { adminEmail, adminWhatsapp }
}

/**
 * Send the customer their payment confirmation + receipt.
 * Returns { customerEmail, customerWhatsapp } each 'SENT' | 'FAILED' | 'SKIPPED'.
 */
async function notifyCustomerPaid(booking, receiptNumber) {
  const mail = customerConfirmationEmail(booking, receiptNumber)

  const [customerEmail, customerWhatsapp] = await Promise.all([
    sendEmail({ to: booking?.customer?.email, subject: mail.subject, html: mail.html }),
    sendWhatsAppTemplate({
      to: booking?.customer?.phone,
      template: process.env.WHATSAPP_CUSTOMER_TEMPLATE || 'booking_confirmed',
      params: [
        booking?.customer?.name || 'traveller',
        booking?.bookingReference || '',
        formatINR(booking?.fare?.total ?? booking?.payment?.amount),
      ],
    }),
  ])

  return { customerEmail, customerWhatsapp }
}

module.exports = {
  notifyAdminNewBooking,
  notifyCustomerPaid,
  // exported for completeness / testing
  formatINR,
  normalizePhone,
  emailEnabled,
  whatsappEnabled,
}
