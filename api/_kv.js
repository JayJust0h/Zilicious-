/**
 * _kv.js — Vercel KV helper (CommonJS)
 */
const { kv } = require('@vercel/kv');

const KEYS = {
  orders:    'zilicious:orders',
  invoices:  'zilicious:invoices',
  contracts: 'zilicious:contracts',
  receipts:  'zilicious:receipts',
  blocked:   'zilicious:blocked',
};

async function getList(name) {
  const raw = await kv.get(KEYS[name]);
  return Array.isArray(raw) ? raw : [];
}

async function setList(name, arr) {
  await kv.set(KEYS[name], arr);
}

async function upsert(name, item, keyField = 'id') {
  const list = await getList(name);
  const idx  = list.findIndex(x => String(x[keyField]) === String(item[keyField]));
  if (idx >= 0) list[idx] = item;
  else list.unshift(item);
  await setList(name, list);
}

async function append(name, item) {
  const list = await getList(name);
  list.unshift(item);
  await setList(name, list);
}

async function removeItem(name, keyField, value) {
  const list = await getList(name);
  await setList(name, list.filter(x => String(x[keyField]) !== String(value)));
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function ok(res, data)  { setCors(res); return res.status(200).json({ ok: true,  ...data }); }
function err(res, msg)  { setCors(res); return res.status(500).json({ ok: false, error: msg }); }

module.exports = { getList, setList, upsert, append, removeItem, setCors, ok, err };
