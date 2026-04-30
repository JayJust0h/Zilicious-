const { getList, upsert, setCors, ok, err } = require('./_kv');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
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
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { return err(res, e.message); }
};
