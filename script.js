const form = document.querySelector('#lookupForm');
const input = document.querySelector('#ipInput');
const lookupBtn = document.querySelector('#lookupBtn');
const myIpBtn = document.querySelector('#myIpBtn');
const status = document.querySelector('#status');
const result = document.querySelector('#result');

const fields = {
  ip: document.querySelector('#ipValue'),
  city: document.querySelector('#city'),
  region: document.querySelector('#region'),
  country: document.querySelector('#country'),
  postal: document.querySelector('#postal'),
  timezone: document.querySelector('#timezone'),
  coords: document.querySelector('#coords'),
  asn: document.querySelector('#asn'),
  org: document.querySelector('#org'),
  pill: document.querySelector('#countryPill'),
  map: document.querySelector('#map')
};

const esc = value => String(value ?? '—');

function setBusy(busy) {
  lookupBtn.disabled = busy;
  myIpBtn.disabled = busy;
  lookupBtn.textContent = busy ? 'Looking up…' : 'Track IP';
}

function validIp(ip) {
  // Accept IPv4 and common IPv6 forms; the API performs the final validation.
  return /^[0-9a-f:.]+$/i.test(ip) && ip.length >= 3 && ip.length <= 45;
}

function render(data) {
  const lat = Number(data.latitude);
  const lon = Number(data.longitude);

  fields.ip.textContent = esc(data.ip);
  fields.city.textContent = esc(data.city);
  fields.region.textContent = esc(data.region);
  fields.country.textContent = esc(data.country_name || data.country);
  fields.postal.textContent = esc(data.postal);
  fields.timezone.textContent = esc(data.timezone);
  fields.coords.textContent = Number.isFinite(lat) && Number.isFinite(lon) ? `${lat.toFixed(4)}, ${lon.toFixed(4)}` : '—';
  fields.asn.textContent = esc(data.asn);
  fields.org.textContent = esc(data.org);
  fields.pill.textContent = [data.country_code, data.country_name].filter(Boolean).join(' · ') || 'Unknown';

  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    const delta = 0.12;
    const bbox = `${lon - delta}%2C${lat - delta}%2C${lon + delta}%2C${lat + delta}`;
    fields.map.src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
  } else {
    fields.map.removeAttribute('src');
  }

  result.classList.remove('hidden');
}

async function lookup(ip = '') {
  const clean = ip.trim();
  status.textContent = '';
  setBusy(true);

  try {
    const url = clean ? `https://ipapi.co/${encodeURIComponent(clean)}/json/` : 'https://ipapi.co/json/';
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Lookup failed (${response.status})`);
    const data = await response.json();
    if (data.error) throw new Error(data.reason || 'The IP address could not be found.');
    render(data);
  } catch (error) {
    result.classList.add('hidden');
    status.textContent = error.message || 'Something went wrong. Please try again.';
  } finally {
    setBusy(false);
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const ip = input.value.trim();
  if (!ip) return lookup();
  if (!validIp(ip)) {
    status.textContent = 'Enter a valid IPv4 or IPv6 address.';
    return;
  }
  lookup(ip);
});

myIpBtn.addEventListener('click', () => {
  input.value = '';
  lookup();
});

lookup();
