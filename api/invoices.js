/**
 * /api/invoices.js
 *
 * GET  /api/invoices         → { invoices: [...] }
 * POST /api/invoices         → { ok: true }   body: invoice snapshot
 *   Invoice is upserted by orderId — saving again updates the existing row.
 */

import { getList, upsert, cors, ok, err } from './_kv.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { cors(res); return res.status(200).end(); }

  try {
    if (req.method === 'GET') {
      const invoices = await getList('invoices');
      return ok(res, { invoices });
    }

    if (req.method === 'POST') {
      const inv = req.body;
      if (!inv || !inv.orderId) return err(res, 'Missing orderId');
      inv.exportedAt = inv.exportedAt || new Date().toISOString();
      // Upsert by orderId so re-saving updates, not duplicates
      await upsert('invoices', inv, 'orderId');
      return ok(res, {});
    }

    cors(res); return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return err(res, e.message);
  }
}
