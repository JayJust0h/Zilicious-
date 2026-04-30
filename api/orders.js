const { getList, upsert, setCors, ok, err } = require('./_kv');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    if (req.method === 'GET') {
      const orders = await getList('orders');
      return ok(res, { orders });
    }
    if (req.method === 'POST') {
      const order = req.body;
      if (!order || !order.id) return err(res, 'Missing order id');
      await upsert('orders', order, 'id');
      return ok(res, {});
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { return err(res, e.message); }
};
