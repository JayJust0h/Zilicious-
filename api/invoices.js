const { getList, upsert, setCors, ok, err } = require('./_kv');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    if (req.method === 'GET') {
      const invoices = await getList('invoices');
      return ok(res, { invoices });
    }
    if (req.method === 'POST') {
      const inv = req.body;
      if (!inv || !inv.orderId) return err(res, 'Missing orderId');
      inv.exportedAt = inv.exportedAt || new Date().toISOString();
      await upsert('invoices', inv, 'orderId');
      return ok(res, {});
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { return err(res, e.message); }
};
