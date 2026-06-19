import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Restaurant — a single tenant on the QR-menu platform.
 * Each MenuItem and Order belongs to one Restaurant, so the
 * same backend can serve many venues (multi-tenant SaaS).
 */
const restaurantSchema = new Schema(
  {
    name:         { type: String, required: true, trim: true },
    // Used in public URLs / API: /api/menu?restaurant=<slug>
    slug:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    address:      { type: String, default: '' },
    phone:        { type: String, default: '' },
    workingHours: { type: String, default: '' },
    currency:     { type: String, default: '₸' },

    // Per-restaurant Telegram bot (optional notifications)
    telegram: {
      botToken: { type: String, default: '' },
      chatId:   { type: String, default: '' },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Restaurant', restaurantSchema);
