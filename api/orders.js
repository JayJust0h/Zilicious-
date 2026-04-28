// api/orders.js — Vercel Serverless Function
// Persists catering orders to a free Vercel Postgres database.
//
// SETUP (one-time, in Vercel Dashboard):
//   1. Go to your project → Storage → Create Database → Postgres
//   2. Connect it to this project — Vercel auto-injects POSTGRES_URL
//   3. Deploy. The table is created automatically on first request.
//
// Endpoints:
//   POST /api/orders          — save a new order (JSON body = order object)
//   GET  /api/orders          — list all orders, newest first
//   GET  /api/orders?id=ORD-… — fetch a single order by ID

import { sql } from '@vercel/postgres';

// Lazily create the table when the function first runs.
// Using IF NOT EXISTS is safe to call on every cold start.
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id            TEXT PRIMARY KEY,
      timestamp     TIMESTAMPTZ NOT NULL,
      customer_name TEXT        NOT NULL,
      phone         TEXT        NOT NULL,
      event_date    DATE        NOT NULL,
      address       TEXT,
      notes         TEXT,
      items         JSONB       NOT NULL DEFAULT '[]',
      total         NUMERIC(10,2) NOT NULL DEFAULT 0,
      voided        BOOLEAN     NOT NULL DEFAULT FALSE,
      voided_at     TIMESTAMPTZ,
      void_reason   TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
}

export default async function handler(req, res) {
  // CORS — allow the same origin (Vercel) to call the API from the browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    await ensureTable();

    // ── POST /api/orders ─────────────────────────────────────────
    if (req.method === 'POST') {
      const order = req.body;

      if (!order || !order.id || !order.customerName || !order.phone || !order.eventDate) {
        return res.status(400).json({ error: 'Missing required order fields: id, customerName, phone, eventDate' });
      }

      await sql`
        INSERT INTO orders (
          id, timestamp, customer_name, phone, event_date,
          address, notes, items, total
        ) VALUES (
          ${order.id},
          ${order.timestamp || new Date().toISOString()},
          ${order.customerName},
          ${order.phone},
          ${order.eventDate},
          ${order.address || null},
          ${order.notes || null},
          ${JSON.stringify(order.items || [])},
          ${order.total || 0}
        )
        ON CONFLICT (id) DO NOTHING;
      `;

      return res.status(201).json({ ok: true, id: order.id });
    }

    // ── GET /api/orders ──────────────────────────────────────────
    if (req.method === 'GET') {
      const { id } = req.query;

      // Single order lookup
      if (id) {
        const { rows } = await sql`
          SELECT * FROM orders WHERE id = ${id} LIMIT 1;
        `;
        if (!rows.length) return res.status(404).json({ error: 'Order not found' });
        return res.status(200).json({ order: toOrderObject(rows[0]) });
      }

      // List all orders newest first
      const { rows } = await sql`
        SELECT * FROM orders ORDER BY timestamp DESC;
      `;
      return res.status(200).json({ orders: rows.map(toOrderObject) });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('[api/orders] error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}

// Map a database row back to the camelCase shape the front-end expects.
function toOrderObject(row) {
  return {
    id:           row.id,
    timestamp:    row.timestamp instanceof Date ? row.timestamp.toISOString() : row.timestamp,
    customerName: row.customer_name,
    phone:        row.phone,
    eventDate:    row.event_date instanceof Date
                    ? row.event_date.toISOString().slice(0, 10)
                    : String(row.event_date).slice(0, 10),
    address:      row.address || '',
    notes:        row.notes || '',
    items:        Array.isArray(row.items) ? row.items : JSON.parse(row.items || '[]'),
    total:        parseFloat(row.total) || 0,
    voided:       row.voided || false,
    voidedAt:     row.voided_at ? (row.voided_at instanceof Date ? row.voided_at.toISOString() : row.voided_at) : undefined,
    voidReason:   row.void_reason || undefined,
  };
}
