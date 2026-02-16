export default async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (err) {
      data = null;
    }
    return {
      ok: res.ok,
      status: res.status,
      data,
      text,
      error: res.ok ? null : (data?.error || data?.message || text || `HTTP ${res.status}`)
    };
  } catch (err) {
    return { ok: false, status: null, data: null, text: null, error: err.message };
  }
}
