/**
 * /api/blocked.js
 *
 * GET    /api/blocked              → { blocked: [...] }
 * POST   /api/blocked              → { ok: true }   body: { date, note }
 * DELETE /api/blocked?date=YYYY-MM-DD → { ok: true }
 */

import { getList, setList, cors, ok, err } from './_kv.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { cors(res); return res.status(200).end(); }

  try {
    if (req.method === 'GET') {
      const blocked = await getList('blocked');
      return ok(res, { blocked });
    }

    if (req.method === 'POST') {
      const { date, note } = req.body || {};
      if (!date) return err(res, 'Missing date');
      const blocked = await getList('blocked');
      if (!blocked.find(b => b.date === date)) {
        blocked.push({ date, note: note||'' });
        blocked.sort((a,b) => a.date.localeCompare(b.date));
        await setList('blocked', blocked);
      }
      return ok(res, {});
    }

    if (req.method === 'DELETE') {
      const date = req.query.date;
      if (!date) return err(res, 'Missing date');
      const blocked = await getList('blocked');
      await setList('blocked', blocked.filter(b => b.date !== date));
      return ok(res, {});
    }

    cors(res); return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return err(res, e.message);
  }
}
