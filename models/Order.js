import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * A line inside an order. We store BOTH a reference to the menu item
 * AND a snapshot of its name/price, so historical orders stay correct
 * even if the menu item is later edited or deleted.
 */
const orderItemSchema = new Schema(
  {
    item:     { type: Schema.Types.ObjectId, ref: 'MenuItem' }, // item ID
    name:     { type: String, required: true },
    price:    { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

/**
 * Order — a placed order, ready to be pushed to a POS system.
 * Required fields per spec: table_number, items (id + quantity),
 * total_price, status, timestamp.
 */
const orderSchema = new Schema(
  {
    restaurant:   { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },

    order_type:   { type: String, enum: ['dine_in', 'delivery'], default: 'dine_in' },
    table_number: { type: String, default: '' },

    customer: {
      name:    { type: String, default: '' },
      phone:   { type: String, default: '' },
      address: { type: String, default: '' },
    },
    comment: { type: String, default: '' },

    items:       { type: [orderItemSchema], required: true, validate: [(v) => v.length > 0, 'Order has no items'] },
    total_price: { type: Number, required: true, min: 0 },

    // pending      -> just created, not yet pushed to POS
    // sent_to_pos  -> successfully handed off to the POS integration
    // failed       -> POS push failed (retry candidate)
    // completed    -> fulfilled (set by staff / POS callback)
    status: {
      type: String,
      enum: ['pending', 'sent_to_pos', 'failed', 'completed'],
      default: 'pending',
      index: true,
    },

    // ID returned by the external POS once integrated (iiko/r_keeper/Poster)
    pos_reference: { type: String, default: '' },
  },
  // Expose createdAt as `timestamp` to match the required schema.
  { timestamps: { createdAt: 'timestamp', updatedAt: 'updatedAt' } }
);

export default mongoose.model('Order', orderSchema);
