import './style.css'
import mySpellSlugs from './my-spells.js'

const LEVELS = ['Cantrip', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th']
const SCHOOLS = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation']

let spells = []
let loading = true
let error = null
let currentRoute = null

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function getSpellSlug(spell) {
  if (spell.slug) return spell.slug
  const key = spell.key || spell.name
  if (typeof key === 'string' && key.includes('-')) return key
  return slugify(spell.name)
}

function getSpellBySlug(slug) {
  return spells.find((s) => getSpellSlug(s) === slug)
}

// Strip document prefix from API keys (e.g. srd_magic-missile -> magic-missile, srd-2024_searing-smite -> searing-smite)
function normalizeSlugForMatch(slug) {
  return slug.replace(/^[\w-]+_/, '')
}

function getMySpells() {
  const slugSet = new Set(mySpellSlugs.map((s) => String(s).toLowerCase().trim()).filter(Boolean))
  const seen = new Set()
  return spells.filter((s) => {
    const slug = getSpellSlug(s)
    const normalized = normalizeSlugForMatch(slug)
    if (!slugSet.has(slug) && !slugSet.has(normalized)) return false
    if (seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}

function getClasses(spell) {
  if (!spell.classes || !Array.isArray(spell.classes)) return []
  return spell.classes.map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean)
}

function getSchool(spell) {
  if (spell.school && typeof spell.school === 'object') return spell.school.name || ''
  return spell.school || ''
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

async function loadSpells() {
  loading = true
  error = null
  try {
    const res = await fetch('./spells.json')
    if (!res.ok) throw new Error(`Failed to load spells: ${res.status}`)
    const data = await res.json()
    spells = Array.isArray(data) ? data : (data.results || data.spells || [])
  } catch (e) {
    error = e.message
    spells = []
  } finally {
    loading = false
  }
}

function applyFilters(list, search, level, school, classFilter) {
  return list.filter((s) => {
    if (search) {
      const q = search.toLowerCase()
      const name = (s.name || '').toLowerCase()
      const desc = (s.desc || '').toLowerCase()
      if (!name.includes(q) && !desc.includes(q)) return false
    }
    if (level && level !== 'any') {
      const lvl = s.level
      const levelLabel = LEVELS[lvl]
      if (levelLabel !== level) return false
    }
    if (school && school !== 'any') {
      if (getSchool(s) !== school) return false
    }
    if (classFilter && classFilter !== 'any') {
      const classes = getClasses(s)
      if (!classes.includes(classFilter)) return false
    }
    return true
  })
}

function getUniqueClasses() {
  const set = new Set()
  spells.forEach((s) => getClasses(s).forEach((c) => set.add(c)))
  return Array.from(set).sort()
}

function renderHeader(active) {
  const nav = (name, hash) =>
    `<a href="${hash}" class="nav-link${active === name ? ' active' : ''}">${name}</a>`
  return `
    <header class="header">
      <h1><a href="#my-spells" class="logo">Spellbook</a></h1>
      <nav class="nav">
        ${nav('My Spells', '#my-spells')}
        ${nav('Spells', '#spells')}
        ${nav('Rules', '#rules')}
        ${nav('Sources', '#sources')}
      </nav>
    </header>
  `
}

function renderSpellList(filtered, search, level, school, classFilter, options = {}) {
  const { title, showFilters = true, backLink } = options
  const classes = getUniqueClasses()
  const back = filtered.length === spells.length && !backLink ? '' : `<p class="filter-summary">${backLink || (filtered.length === spells.length ? '' : `Showing ${filtered.length} of ${spells.length} spells.`)}</p>`
  return `
    <section class="view view-spells">
      ${title ? `<h2 class="view-title">${escapeHtml(title)}</h2>` : ''}
      ${showFilters ? `<div class="filters">
        <input type="search" id="search" class="filter-input" placeholder="Search spells…" value="${escapeHtml(search)}" autocomplete="off" />
        <div class="filter-row">
          <select id="filter-level" class="filter-select" aria-label="Filter by level">
            <option value="any"${level === 'any' || !level ? ' selected' : ''}>Any level</option>
            ${LEVELS.map((l, i) => `<option value="${l}"${level === l ? ' selected' : ''}>${l}</option>`).join('')}
          </select>
          <select id="filter-school" class="filter-select" aria-label="Filter by school">
            <option value="any"${school === 'any' || !school ? ' selected' : ''}>Any school</option>
            ${SCHOOLS.map((s) => `<option value="${s}"${school === s ? ' selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        ${classes.length ? `
        <div class="filter-row">
          <select id="filter-class" class="filter-select" aria-label="Filter by class">
            <option value="any"${classFilter === 'any' || !classFilter ? ' selected' : ''}>Any class</option>
            ${classes.map((c) => `<option value="${escapeHtml(c)}"${classFilter === c ? ' selected' : ''}>${escapeHtml(c)}</option>`).join('')}
          </select>
        </div>
        ` : ''}
      </div>` : ''}
      ${back}
      <ul class="spell-list" role="list">
        ${filtered.length
          ? filtered
              .map(
                (s) =>
                  `<li><a href="#spell/${getSpellSlug(s)}" class="spell-card" data-spell-slug="${escapeHtml(getSpellSlug(s))}">
                    <span class="spell-name">${escapeHtml(s.name)}</span>
                    <span class="spell-meta">${LEVELS[s.level] ?? s.level} · ${escapeHtml(getSchool(s) || '—')}</span>
                  </a></li>`
              )
              .join('')
          : `<li class="empty">${options.emptyMessage || 'No spells match your filters.'}</li>`}
      </ul>
    </section>
  `
}

function renderMySpells() {
  const mySpells = getMySpells()
  return renderSpellList(mySpells, '', 'any', 'any', 'any', {
    title: 'My Spells',
    showFilters: false,
    backLink: mySpells.length ? `${mySpells.length} spell${mySpells.length !== 1 ? 's' : ''} in your list.` : null,
    emptyMessage: 'Edit <code>src/my-spells.js</code> and add spell slugs (e.g. fireball, magic-missile) to see them here.',
  })
}

function renderSpellDetail(spell) {
  if (!spell) return '<section class="view view-detail"><p>Spell not found.</p></section>'
  const school = getSchool(spell)
  const level = LEVELS[spell.level] ?? spell.level
  const classes = getClasses(spell)
  const components = []
  if (spell.verbal) components.push('V')
  if (spell.somatic) components.push('S')
  if (spell.material) components.push('M' + (spell.material_specified ? ` (${spell.material_specified})` : ''))
  const compStr = components.length ? components.join(', ') : '—'
  const desc = (spell.desc || '').replace(/\n/g, '<br>')
  const higher = spell.higher_level ? `<p class="higher-level"><strong>At higher levels.</strong> ${String(spell.higher_level).replace(/\n/g, '<br>')}</p>` : ''
  return `
    <section class="view view-detail">
      <a href="#" class="back-link" data-back>← Back</a>
      <article class="spell-detail">
        <h2 class="spell-detail-name">${escapeHtml(spell.name)}</h2>
        <p class="spell-detail-meta">${escapeHtml(level)} ${escapeHtml(school)}${classes.length ? ' · ' + escapeHtml(classes.join(', ')) : ''}</p>
        <dl class="spell-detail-stats">
          <div><dt>Casting time</dt><dd>${escapeHtml(spell.casting_time || '—')}</dd></div>
          <div><dt>Range</dt><dd>${escapeHtml(spell.range_text || spell.range || '—')}</dd></div>
          <div><dt>Components</dt><dd>${escapeHtml(compStr)}</dd></div>
          <div><dt>Duration</dt><dd>${spell.concentration ? 'Concentration, ' : ''}${escapeHtml(spell.duration || '—')}</dd></div>
          ${spell.ritual ? '<div><dt>Ritual</dt><dd>Yes</dd></div>' : ''}
        </dl>
        <div class="spell-detail-desc">${desc}</div>
        ${higher}
      </article>
    </section>
  `
}

function renderRules() {
  return `
    <section class="view view-rules">
      <h2>Spellcasting Rules</h2>
      <p>How casting works in the game: casting time, concentration, spell slots, and more.</p>
      <ul class="rules-links">
        <li><a href="https://5thsrd.org/spellcasting/" target="_blank" rel="noopener noreferrer">Spellcasting (overview)</a></li>
        <li><a href="https://5thsrd.org/spellcasting/casting_a_spell/" target="_blank" rel="noopener noreferrer">Casting a Spell</a></li>
      </ul>
      <p class="muted">Content on 5thsrd.org is based on the D&D 5e SRD (Open Gaming License).</p>
    </section>
  `
}

function renderSources() {
  return `
    <section class="view view-sources">
      <h2>Sources &amp; Legal</h2>
      <p>This app uses spell data and rules from the <strong>D&D 5e System Reference Document (SRD)</strong>, which is released under the <strong>Open Gaming License Version 1.0a</strong>.</p>
      <p>Spell data is sourced from the <a href="https://open5e.com/" target="_blank" rel="noopener noreferrer">Open5e</a> project. Rules links point to <a href="https://5thsrd.org/" target="_blank" rel="noopener noreferrer">5thsrd.org</a>.</p>
      <p>This project is not affiliated with or endorsed by Wizards of the Coast. Dungeons &amp; Dragons and D&amp;D are trademarks of Wizards of the Coast LLC.</p>
      <p class="muted">You may copy, modify, and distribute SRD content in accordance with the <a href="https://www.opengamingfoundation.org/ogl.html" target="_blank" rel="noopener noreferrer">Open Gaming License</a>.</p>
    </section>
  `
}

function getRoute() {
  const raw = (window.location.hash || '#my-spells').slice(1)
  const [path, qs] = raw.split('?')
  const params = new URLSearchParams(qs || '')
  if (path === 'my-spells') return { view: 'my-spells' }
  if (path === 'rules') return { view: 'rules' }
  if (path === 'sources') return { view: 'sources' }
  if (path.startsWith('spell/')) {
    const slug = path.slice(6)
    return { view: 'spell', slug }
  }
  if (path === 'spells') {
    return {
      view: 'spells',
      search: params.get('q') || '',
      level: params.get('level') || 'any',
      school: params.get('school') || 'any',
      class: params.get('class') || 'any',
    }
  }
  if (path === '' || path === 'my-spells') return { view: 'my-spells' }
  return { view: 'my-spells' }
}

function syncFiltersToHash(search, level, school, classFilter) {
  const p = new URLSearchParams()
  if (search) p.set('q', search)
  if (level && level !== 'any') p.set('level', level)
  if (school && school !== 'any') p.set('school', school)
  if (classFilter && classFilter !== 'any') p.set('class', classFilter)
  const qs = p.toString()
  window.location.hash = 'spells' + (qs ? '?' + qs : '')
}

function updateSpellsViewOnly(route) {
  const filtered = applyFilters(spells, route.search, route.level, route.school, route.class)
  const listHTML =
    filtered.length > 0
      ? filtered
          .map(
            (s) =>
              `<li><a href="#spell/${getSpellSlug(s)}" class="spell-card" data-spell-slug="${escapeHtml(getSpellSlug(s))}">
                    <span class="spell-name">${escapeHtml(s.name)}</span>
                    <span class="spell-meta">${LEVELS[s.level] ?? s.level} · ${escapeHtml(getSchool(s) || '—')}</span>
                  </a></li>`
          )
          .join('')
      : '<li class="empty">No spells match your filters.</li>'
  const summaryText =
    filtered.length === spells.length ? '' : `Showing ${filtered.length} of ${spells.length} spells.`
  const listEl = document.querySelector('.view-spells .spell-list')
  const summaryEl = document.querySelector('.view-spells .filter-summary')
  if (listEl) listEl.innerHTML = listHTML
  if (summaryEl) {
    if (summaryText) summaryEl.textContent = summaryText
    else summaryEl.remove()
  } else if (summaryText) {
    const p = document.createElement('p')
    p.className = 'filter-summary'
    p.textContent = summaryText
    const view = document.querySelector('.view-spells')
    if (view && listEl) view.insertBefore(p, listEl)
  }
  const searchEl = document.getElementById('search')
  const levelEl = document.getElementById('filter-level')
  const schoolEl = document.getElementById('filter-school')
  const classEl = document.getElementById('filter-class')
  if (searchEl && searchEl.value !== route.search) searchEl.value = route.search
  if (levelEl && levelEl.value !== route.level) levelEl.value = route.level
  if (schoolEl && schoolEl.value !== route.school) schoolEl.value = route.school
  if (classEl && classEl.value !== route.class) classEl.value = route.class
}

function render() {
  const route = getRoute()
  const app = document.querySelector('#app')
  if (!app) return

  if (
    !loading &&
    !error &&
    currentRoute?.view === 'spells' &&
    route.view === 'spells'
  ) {
    updateSpellsViewOnly(route)
    currentRoute = route
    return
  }

  let main = ''
  if (loading) {
    main = '<main class="main"><div class="loading">Loading spells…</div></main>'
  } else if (error) {
    main = `<main class="main"><div class="error">${escapeHtml(error)}. Run <code>npm run fetch-spells</code> to populate spell data.</div></main>`
  } else {
    const active = route.view === 'my-spells' ? 'My Spells' : route.view === 'spells' ? 'Spells' : route.view === 'rules' ? 'Rules' : route.view === 'sources' ? 'Sources' : 'My Spells'
    main = `
      ${renderHeader(active)}
      <main id="main" class="main">
        ${route.view === 'my-spells'
          ? renderMySpells()
          : route.view === 'spells'
            ? renderSpellList(
                applyFilters(spells, route.search, route.level, route.school, route.class),
                route.search,
                route.level,
                route.school,
                route.class
              )
            : route.view === 'spell'
              ? renderSpellDetail(getSpellBySlug(route.slug))
              : route.view === 'rules'
                ? renderRules()
                : renderSources()}
      </main>
      <footer class="footer">
        <a href="#sources">OGL 1.0a</a>
      </footer>
    `
  }

  app.innerHTML = main
  currentRoute = route

  const backEl = app.querySelector('[data-back]')
  if (backEl) {
    backEl.addEventListener('click', (e) => {
      e.preventDefault()
      if (window.history.length > 1) window.history.back()
      else window.location.hash = 'my-spells'
    })
  }

  if (!loading && !error && route.view === 'spells') {
    const searchEl = document.getElementById('search')
    const levelEl = document.getElementById('filter-level')
    const schoolEl = document.getElementById('filter-school')
    const classEl = document.getElementById('filter-class')
    const updateRoute = () => {
      syncFiltersToHash(
        searchEl?.value?.trim() || '',
        levelEl?.value || 'any',
        schoolEl?.value || 'any',
        classEl?.value || 'any'
      )
    }
    searchEl?.addEventListener('input', updateRoute)
    searchEl?.addEventListener('search', updateRoute)
    levelEl?.addEventListener('change', updateRoute)
    schoolEl?.addEventListener('change', updateRoute)
    classEl?.addEventListener('change', updateRoute)
  }
}

function init() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {})
  }
  loadSpells().then(() => render())
  window.addEventListener('hashchange', render)
}

init()
