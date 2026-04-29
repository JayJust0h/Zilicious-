/**
 * _kv.js — thin wrapper around Vercel KV (Redis)
 * Shared by all API routes.
 *
 * Vercel KV stores everything as key-value pairs.
 * We use simple list keys:
 *   zilicious:orders      → JSON array of all orders
 *   zilicious:invoices    → JSON array of all invoices  (upserted by orderId)
 *   zilicious:contracts   → JSON array of all contracts
 *   zilicious:receipts    → JSON array of all receipts  (upserted by orderId)
 *   zilicious:blocked     → JSON array of blocked dates
 */

import { kv } from '@vercel/kv';

const KEYS = {
  orders:    'zilicious:orders',
  invoices:  'zilicious:invoices',
  contracts: 'zilicious:contracts',
  receipts:  'zilicious:receipts',
  blocked:   'zilicious:blocked',
};

export async function getList(name) {
  const raw = await kv.get(KEYS[name]);
  return Array.isArray(raw) ? raw : [];
}

export async function setList(name, arr) {
  await kv.set(KEYS[name], arr);
}

/** Append an item — no duplicate check */
export async function append(name, item) {
  const list = await getList(name);
  list.unshift(item); // newest first
  await setList(name, list);
}

/** Upsert by a key field (e.g. 'id' or 'orderId') */
export async function upsert(name, item, keyField = 'id') {
  const list = await getList(name);
  const idx  = list.findIndex(x => x[keyField] === item[keyField]);
  if (idx >= 0) list[idx] = item;
  else list.unshift(item);
  await setList(name, list);
}

/** Remove by key field value */
export async function remove(name, keyField, value) {
  const list = await getList(name);
  await setList(name, list.filter(x => x[keyField] !== value));
}

/** CORS headers — allow your Vercel domain and localhost */
export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}

export function ok(res, data)  { cors(res); return res.status(200).json({ ok: true,  ...data }); }
export function err(res, msg)  { cors(res); return res.status(500).json({ ok: false, error: msg }); }
