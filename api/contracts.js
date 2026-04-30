const { getList, append, removeItem, setCors, ok, err } = require('./_kv');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    if (req.method === 'GET') {
      const contracts = await getList('contracts');
      return ok(res, { contracts });
    }
    if (req.method === 'POST') {
      const contract = req.body;
      if (!contract || !contract.id) return err(res, 'Missing contract id');
      contract.signedAt = contract.signedAt || new Date().toISOString();
      await append('contracts', contract);
      return ok(res, {});
    }
    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return err(res, 'Missing id');
      await removeItem('contracts', 'id', id);
      return ok(res, {});
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { return err(res, e.message); }
};
