async function apiGet(action, params = {}) {
  const url = new URL(API_URL);
  url.searchParams.append("action", action);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

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