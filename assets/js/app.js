// Handles: fetch JSON, search, display results, clear button, optional local time

let DATA = null;
let timeIntervals = []; // keep intervals to clear on reset

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const resultsEl = document.getElementById('results');
  const resetBtn = document.getElementById('resetBtn');

  // Only run search logic on the Home page where elements exist
  if (!form || !searchInput || !resultsEl) return;

  // Prefetch JSON once
  fetch('travel_recommendation_api.json')
    .then(r => r.json())
    .then(json => {
      DATA = json;
      console.log('API data loaded:', DATA); // Task 6: check console
    })
    .catch(err => {
      console.error('Failed to load travel_recommendation_api.json', err);
    });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!DATA) { alert('Data not loaded yet. Try again in a moment.'); return; }

    const raw = searchInput.value.trim();
    if (!raw) { return; }

    const key = normalizeKeyword(raw);
    const matches = getMatchesByKeyword(key);
    renderResults(matches, resultsEl);
  });

  resetBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearResults(resultsEl);
  });
});

function normalizeKeyword(s) {
  let k = s.toLowerCase().trim();
  // very small plural handling (“beaches” → “beach”, “temples” → “temple”)
  if (k.endsWith('es')) k = k.slice(0, -2);
  else if (k.endsWith('s')) k = k.slice(0, -1);
  return k; // e.g., 'beach' | 'temple' | 'country name'
}

// Returns an array of display cards: {title, img, desc, timeZone?}
function getMatchesByKeyword(key) {
  const out = [];

  // 1) beach(es)
  if (key.includes('beach')) {
    const beaches = (DATA.beaches || []).slice(0, 2);
    beaches.forEach(b => out.push({
      title: b.name,
      img: b.imageUrl,
      desc: b.description,
      timeZone: b.timeZone || null
    }));
  }

  // 2) temple(s)
  if (key.includes('temple')) {
    const temples = (DATA.temples || []).slice(0, 2);
    temples.forEach(t => out.push({
      title: t.name,
      img: t.imageUrl,
      desc: t.description,
      timeZone: t.timeZone || null
    }));
  }

  // 3) country
  // exact country name match OR substring match
  const countries = DATA.countries || [];
  const country = countries.find(c =>
    c.name.toLowerCase() === key || c.name.toLowerCase().includes(key)
  );

  if (country) {
    // show at least 2 places (cities)
    const cities = (country.cities || []).slice(0, 2);
    cities.forEach(city => out.push({
      title: `${city.name}, ${country.name}`,
      img: city.imageUrl,
      desc: city.description,
      timeZone: country.timeZone || null
    }));
  }

  return out;
}

function renderResults(list, container) {
  clearResults(container);
  if (!list.length) {
    container.innerHTML = `<p class="empty">No results. Try “beach”, “temple”, or a country name.</p>`;
    return;
  }

  const frag = document.createDocumentFragment();
  list.forEach(item => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img src="${item.img}" alt="${escapeHtml(item.title)}" />
      <div class="pad">
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.desc)}</p>
        ${item.timeZone ? `<div class="time" data-tz="${escapeHtml(item.timeZone)}">Local time: <span>—:—:—</span></div>` : ``}
      </div>
    `;
    frag.appendChild(card);
  });
  container.appendChild(frag);

  // Optional Task 10: live local time per card
  const timeEls = container.querySelectorAll('.time');
  timeEls.forEach(el => {
    const tz = el.getAttribute('data-tz');
    const span = el.querySelector('span');
    // immediate tick
    updateTime(span, tz);
    // and every second
    const id = setInterval(() => updateTime(span, tz), 1000);
    timeIntervals.push(id);
  });
}

function updateTime(span, timeZone) {
  try {
    const options = { timeZone, hour12: true, hour: 'numeric', minute: 'numeric', second: 'numeric' };
    span.textContent = new Date().toLocaleTimeString('en-US', options);
  } catch {
    span.textContent = 'N/A';
  }
}

function clearResults(container) {
  // stop intervals
  timeIntervals.forEach(id => clearInterval(id));
  timeIntervals.length = 0;
  container.innerHTML = '';
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[s]));
}
