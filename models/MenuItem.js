import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * MenuItem — a single dish/drink shown on the menu.
 * Replaces the old hardcoded array in menu-data.js.
 * The admin panel performs full CRUD against this collection.
 */
const menuItemSchema = new Schema(
  {
    restaurant:  { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name:        { type: String, required: true, trim: true },
    price:       { type: Number, required: true, min: 0 },
    category:    { type: String, required: true, trim: true, index: true },
    image:       { type: String, default: '' },
    description: { type: String, default: '' },
    badge:       { type: String, default: '' },   // e.g. "Хит", "Premium", "Новинка"
    available:   { type: Boolean, default: true }, // hide item without deleting it
    sortOrder:   { type: Number, default: 0 },      // manual ordering inside a category
  },
  { timestamps: true }
);

// Public API returns a clean, frontend-friendly shape (keeps the
// `id` field your existing app.js / cards already expect).
menuItemSchema.methods.toPublic = function toPublic() {
  return {
    id:          this._id.toString(),
    name:        this.name,
    price:       this.price,
    category:    this.category,
    image:       this.image,
    description: this.description,
    badge:       this.badge || undefined,
  };
};

export default mongoose.model('MenuItem', menuItemSchema);
