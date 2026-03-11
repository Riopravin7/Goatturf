// ══════════════════════════════════════════════════════
//  Razorpay Client Singleton
// ══════════════════════════════════════════════════════
const Razorpay = require('razorpay');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error('❌ Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in .env');
  process.exit(1);
}

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

module.exports = razorpay;
