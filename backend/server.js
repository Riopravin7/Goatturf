// ══════════════════════════════════════════════════════
//  GOAT – Game On Academy & Turf — Backend Server
// ══════════════════════════════════════════════════════
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const { cleanupPendingBookings } = require('./utils/cleanup');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
];
// Add the deployed frontend URL from env
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, '')); // trim trailing slash
}
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all origins for now; tighten in production
  },
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(express.json());

// ── Request logger (dev) ───────────────────────────────
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// ── Health check ───────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'GOAT Turf Booking API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ─────────────────────────────────────────
app.use('/', bookingRoutes);
app.use('/', paymentRoutes);

// ── 404 handler ────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start server ──────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('══════════════════════════════════════════');
  console.log(`  🏟️  GOAT Turf Backend running`);
  console.log(`  🌐  http://localhost:${PORT}`);
  console.log('══════════════════════════════════════════');
  console.log('');

  // Start periodic cleanup of stale pending bookings (every 2 minutes)
  setInterval(cleanupPendingBookings, 2 * 60 * 1000);
  // Also run once on startup
  cleanupPendingBookings();
});
