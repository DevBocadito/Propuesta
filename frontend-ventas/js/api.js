async function apiGet(action, params = {}) {
  const url = new URL(API_URL);
  url.searchParams.append("action", action);
  Object.keys(params).forEach(k => url.searchParams.append(k, params[k]));
  const res = await fetch(url);
  return res.json();
}

async function apiPost(action, data) {
  const url = `${API_URL}?action=${action}`;
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(data)
  });
  return res.json();
}
