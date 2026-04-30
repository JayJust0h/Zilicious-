const { getList, setList, setCors, ok, err } = require('./_kv');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
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
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { return err(res, e.message); }
};
