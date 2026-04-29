/**
 * /api/orders.js
 *
 * GET  /api/orders          → { orders: [...] }
 * POST /api/orders          → { ok: true }   body: order object
 */

import { getList, upsert, cors, ok, err } from './_kv.js';

export default async function handler(req, res) {
  // Preflight
  if (req.method === 'OPTIONS') { cors(res); return res.status(200).end(); }

  try {
    if (req.method === 'GET') {
      const orders = await getList('orders');
      return ok(res, { orders });
    }

    if (req.method === 'POST') {
      const order = req.body;
      if (!order || !order.id) return err(res, 'Missing order id');
      // Upsert by id — prevents duplicates if customer submits twice
      await upsert('orders', order, 'id');
      return ok(res, {});
    }

    cors(res); return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return err(res, e.message);
  }
}
