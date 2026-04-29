/**
 * /api/receipts.js
 *
 * GET  /api/receipts         → { receipts: [...] }
 * POST /api/receipts         → { ok: true }   body: receipt object
 *   Receipt is upserted by orderId.
 */

import { getList, upsert, cors, ok, err } from './_kv.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { cors(res); return res.status(200).end(); }

  try {
    if (req.method === 'GET') {
      const receipts = await getList('receipts');
      return ok(res, { receipts });
    }

    if (req.method === 'POST') {
      const receipt = req.body;
      if (!receipt || !receipt.orderId) return err(res, 'Missing orderId');
      receipt.savedAt = receipt.savedAt || new Date().toISOString();
      await upsert('receipts', receipt, 'orderId');
      return ok(res, {});
    }

    cors(res); return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return err(res, e.message);
  }
}
