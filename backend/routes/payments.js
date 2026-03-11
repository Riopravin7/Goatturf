// ══════════════════════════════════════════════════════
//  Payment Routes
//  POST /verify-payment
// ══════════════════════════════════════════════════════
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const supabase = require('../config/supabase');

// ─────────────────────────────────────────────────────
// 4️⃣  POST /verify-payment
//     Verifies Razorpay signature & confirms booking
// ─────────────────────────────────────────────────────
router.post('/verify-payment', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // Validate input
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification fields',
      });
    }

    // ── Step 1: Verify Razorpay signature ──
    // Signature = HMAC_SHA256(order_id + "|" + payment_id, secret)
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.warn('⚠️ Invalid Razorpay signature for order:', razorpay_order_id);
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.',
      });
    }

    // ── Step 2: Update booking status to "paid" ──
    const { data: booking, error: updateError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        razorpay_payment_id,
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('payment_status', 'pending') // only update if still pending
      .select()
      .single();

    if (updateError) {
      console.error('❌ Supabase update error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to confirm booking in database',
      });
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or already confirmed',
      });
    }

    console.log(`✅ Booking confirmed: ${booking.id} | ${booking.sport} | ${booking.booking_date} ${booking.start_time}–${booking.end_time}`);

    return res.json({
      success: true,
      message: 'Payment verified. Booking confirmed!',
      booking: {
        id: booking.id,
        sport: booking.sport,
        players: booking.players,
        date: booking.booking_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        price: booking.price,
        status: booking.payment_status,
      },
    });
  } catch (err) {
    console.error('❌ /verify-payment error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while verifying payment',
    });
  }
});

module.exports = router;
