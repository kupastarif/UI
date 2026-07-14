/**
 * =================================================================================
 * FILE         : /js/maps/picker.js
 * FILE VERSION : 2.0a-rev1
 * APP VERSION  : 2.0a-beta
 */
'use strict';

const F_V = '2.0a-rev1';

import { StateManager } from '../core/state.js';
import { Router } from '../core/router.js';
import { PopupManager } from '../components/popup.js';
import { ThemeManager } from '../components/theme.js';
import { MapManager } from '../maps/map.js';
import { GPS } from '../maps/gps.js';

const ICON = {
    SAVE: '💾', GPS: '📍', SHOW_MAP: '🗺️', BACK: '◀', DETAIL: '🔍',
    SPINNER: '⏳', CHECK: '✓'
};

const CORRECTION = {
    Motor: { distFactor: 1.00, distAdd: 0.2, timeFactor: 1.10, timeAdd: 5, peakMult: 1.025 },
    Mobil: { distFactor: 1.00, distAdd: 0.5, timeFactor: 1.05, timeAdd: 5, peakMult: 1.10 }
};

const PEAK_HOURS = {
    pagi: { days: [1, 2, 3, 4, 5], start: 6, end: 8 },
    sore: { days: [1, 2, 3, 4, 5, 6], start: 16, end: 18 }
};

const COOLDOWN_SEC = 120;
const CACHE_MAX_AGE_MS = 3600000;
const COOLDOWN_CLEANUP_MS = 600000;
const SEARCH_DEBOUNCE_MS = 2000;
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OSRM_BASE = 'https://router.project-osrm.org/route/v1';
const MIN_SEARCH_CHARS = 3;
const MAX_RECENT_SAVED = 3;
const COORD_DECIMALS = 5;
const RECENT_SAVED_KEY = 'lp_recent_saved';
const ROUTE_POLYLINE_KEY = 'lp_route_polyline';

let state = {
    page: 1, pickup: null, destination: null, vehicle: 'Motor',
    role: 'Driver', area: 'Jabodetabek', cooldownActive: false,
    cooldownRemaining: 0, timer: null, abortController: null,
    mapActive: false, _mapCoords: null, _debounceTimer: null,
    routeResult: null, cooldownBtnTimer: null
};

function roundCoord(val) { return Number(val.toFixed(COORD_DECIMALS)); }
function getCache(key) { const raw = sessionStorage.getItem(key); if (!raw) return {}; try { return JSON.parse(raw); } catch (e) { return {}; } }
function setCache(key, obj) { sessionStorage.setItem(key, JSON.stringify(obj)); }

function cleanExpiredCache() {
    const now = Date.now();
    const geoCache = getCache('lp_geocoding');
    for (const q in geoCache) { if (now - geoCache[q].timestamp > CACHE_MAX_AGE_MS) delete geoCache[q]; }
    setCache('lp_geocoding', geoCache);
    const routeCache = getCache('lp_route');
    for (const k in routeCache) { if (now - routeCache[k].timestamp > CACHE_MAX_AGE_MS) delete routeCache[k]; }
    setCache('lp_route', routeCache);
    const lastCalc = sessionStorage.getItem('picker_last_calc_utc');
    if (lastCalc && now - parseInt(lastCalc) > COOLDOWN_CLEANUP_MS) sessionStorage.removeItem('picker_last_calc_utc');
}

function getRecentSaved() {
    const raw = sessionStorage.getItem(RECENT_SAVED_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch (e) { return []; }
}

function saveRecentLocation(loc) {
    const items = getRecentSaved();
    const existingIdx = items.findIndex(item => roundCoord(item.lat) === roundCoord(loc.lat) && roundCoord(item.lng) === roundCoord(loc.lng));
    if (existingIdx !== -1) items.splice(existingIdx, 1);
    items.push({ label: loc.label, lat: roundCoord(loc.lat), lng: roundCoord(loc.lng) });
    while (items.length > MAX_RECENT_SAVED) items.shift();
    sessionStorage.setItem(RECENT_SAVED_KEY, JSON.stringify(items));
}

function getSavedPolyline() {
    const raw = sessionStorage.getItem(ROUTE_POLYLINE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
}

function savePolyline(coordinates) {
    if (!Array.isArray(coordinates) || coordinates.length === 0) return;
    sessionStorage.setItem(ROUTE_POLYLINE_KEY, JSON.stringify({ coordinates, timestamp: Date.now() }));
}

function clearSavedPolyline() { sessionStorage.removeItem(ROUTE_POLYLINE_KEY); }

function cleanup() {
    window.log.info('[picker ' + F_V + '] (1) cleanup() dipanggil');
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    if (state.cooldownBtnTimer) { clearInterval(state.cooldownBtnTimer); state.cooldownBtnTimer = null; }
    if (state._debounceTimer) { clearTimeout(state._debounceTimer); state._debounceTimer = null; }
    if (state.mapActive) { MapManager.destroy(); state.mapActive = false; }
    if (state.abortController) { state.abortController.abort(); state.abortController = null; }
    state.page = 1; state.pickup = null; state.destination = null;
    state.cooldownActive = false; state.cooldownRemaining = 0;
    state.vehicle = 'Motor'; state.role = 'Driver'; state.area = 'Jabodetabek';
    state._mapCoords = null; state.routeResult = null;
    cleanExpiredCache();
}

function goToPage(page) {
    if (state._debounceTimer) { clearTimeout(state._debounceTimer); state._debounceTimer = null; }
    if (state.cooldownBtnTimer) { clearInterval(state.cooldownBtnTimer); state.cooldownBtnTimer = null; }
    if (state.mapActive) { MapManager.destroy(); state.mapActive = false; }
    state._mapCoords = null;
    state.page = page;
    renderPage();
}

function renderPage() {
    const body = document.getElementById('lp-body');
    if (!body) return;
    const titleEl = document.getElementById('lp-title');
    const backBtn = document.getElementById('lp-back');
    if (titleEl) titleEl.textContent = getPageTitle(state.page);
    if (backBtn) backBtn.style.visibility = state.page > 1 ? 'visible' : 'hidden';
    switch (state.page) {
        case 1: body.innerHTML = renderPage1(); bindPage1(); break;
        case 2: body.innerHTML = renderPage2(); bindPage2(); break;
        case 3: body.innerHTML = renderPage3(); bindPage3(); break;
        case 4: body.innerHTML = renderPage4(); initMapPage('pickup'); break;
        case 5: body.innerHTML = renderPage5(); bindPage5(); break;
        case 6: body.innerHTML = renderPage6(); initMapPage('destination'); break;
        case 7: body.innerHTML = renderPage7(); initResultPage(); break;
    }
}

function getPageTitle(page) {
    const titles = { 1: 'Izin & Cooldown', 2: 'Info Fitur', 3: 'Titik Jemput', 4: 'Peta Jemput', 5: 'Titik Antar', 6: 'Peta Antar', 7: 'Hasil Rute' };
    return titles[page] || '';
}

function createPickerContainer() {
    const container = document.createElement('div');
    container.innerHTML = `<div class="lp-header" style="display:none;"><h3 id="lp-title" class="lp-page-title"></h3></div><div id="lp-body" class="lp-body"></div>`;
    container._popupOptions = { title: 'Cari Lokasi', showCloseButton: true, closeOnOverlay: true, showActions: false };
    return container;
}

function renderPage1() {
    return `<div class="lp-page"><h4>Izin & Cooldown</h4><div id="lp-status-text"></div><div id="lp-countdown" style="display:none; text-align:center; font-size:2rem; margin:1rem 0;"></div><button id="lp-skip-btn" class="btn btn-outline btn-block mt-md" style="display:none;">LEWATI</button></div>`;
}

function bindPage1() {
    const statusEl = document.getElementById('lp-status-text');
    const countdownEl = document.getElementById('lp-countdown');
    const skipBtn = document.getElementById('lp-skip-btn');
    const lastCalcUtc = sessionStorage.getItem('picker_last_calc_utc');
    const nowUtc = GPS.getCurrentUTCTime().utc;

    if (lastCalcUtc) {
        const elapsed = (nowUtc - parseInt(lastCalcUtc)) / 1000;
        if (elapsed < COOLDOWN_SEC) {
            state.cooldownActive = true;
            state.cooldownRemaining = Math.ceil(COOLDOWN_SEC - elapsed);
            statusEl.textContent = 'Nunggu antrian limit gratisan.';
            countdownEl.style.display = 'block';
            countdownEl.textContent = formatCountdown(state.cooldownRemaining);
            skipBtn.style.display = 'none';
            state.timer = setInterval(() => {
                state.cooldownRemaining--;
                countdownEl.textContent = formatCountdown(state.cooldownRemaining);
                if (state.cooldownRemaining <= 0) { clearInterval(state.timer); state.timer = null; state.cooldownActive = false; goToPage(2); }
            }, 1000);
            return;
        }
    }

    statusEl.textContent = 'Meminta izin lokasi...';
    skipBtn.style.display = 'block';
    GPS.getCurrentPosition(
        (pos) => { window.log.info('[picker ' + F_V + '] Izin lokasi granted'); statusEl.textContent = 'Lokasi ditemukan. Anda dapat melanjutkan.'; },
        (err) => { window.log.warn('[picker ' + F_V + '] GPS error:', err.code); if (err.code === GPS.ERROR_CODES.PERMISSION_DENIED) { statusEl.textContent = 'Izin lokasi ditolak. Anda tetap dapat melanjutkan tanpa lokasi.'; } else { statusEl.textContent = 'Gagal mengakses lokasi. Lanjutkan tanpa lokasi?'; } }
    );
    skipBtn.addEventListener('click', () => { if (state.timer) { clearInterval(state.timer); state.timer = null; } goToPage(2); });

    function formatCountdown(sec) { const m = Math.floor(sec / 60); const s = sec % 60; return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; }
}

function renderPage2() {
    return `<div class="lp-page"><h4>Info Fitur</h4><p>Aplikasi ini menggunakan fasilitas gratisan, jangan banyak ngarep.</p><p>• Motor gak bisa diatur rutenya, mungkin lewat tol.</p><p>• Mobil tidak memiliki opsi tol/non-tol.</p><p>• Waktu tempuh setara dengan aplikasi ijo.</p><p>Gunakan Google Maps untuk data lebih akurat, meskipun gak dipake juga ama aplikasi ijo.</p><button id="lp-next2" class="btn btn-primary btn-block mt-md">LANJUT</button></div>`;
}

function bindPage2() { document.getElementById('lp-next2').addEventListener('click', () => goToPage(3)); }

function renderPage3() {
    return `<div class="lp-page"><h4>Titik Jemput</h4><div id="lp-pickup-saved-btns" class="lp-saved-btns"></div><div class="lp-input-box"><input type="text" id="lp-search-pickup" placeholder="Cari lokasi penjemputan..."></div><div id="lp-pickup-results" class="lp-results"></div><div id="lp-pickup-selected" class="lp-selected-info" style="display:none;"><div class="lp-info-label"></div><div class="lp-info-coords"></div><button class="btn btn-outline btn-sm btn-block lp-save-btn">${ICON.SAVE} Simpan Lokasi</button></div><div class="flex justify-between gap-sm mt-sm"><button class="btn btn-outline flex-1" id="lp-gps-btn">${ICON.GPS} Lokasi Saat Ini</button><button class="btn btn-outline flex-1" id="lp-map-btn">${ICON.SHOW_MAP} Cari di Peta</button></div><button class="btn btn-primary btn-block mt-sm" id="lp-next3" disabled>LANJUT</button></div>`;
}

function bindPage3() {
    const searchInput = document.getElementById('lp-search-pickup');
    const resultsDiv = document.getElementById('lp-pickup-results');
    const nextBtn = document.getElementById('lp-next3');
    const savedBtnsDiv = document.getElementById('lp-pickup-saved-btns');
    renderRecentSavedButtons('pickup', savedBtnsDiv, searchInput, nextBtn);
    if (state.pickup) { setLocationAndUpdateUI('pickup', state.pickup); nextBtn.disabled = false; searchInput.value = state.pickup.label || ''; }
    searchInput.addEventListener('input', () => {
        clearTimeout(state._debounceTimer);
        const query = searchInput.value.trim();
        if (query.length < MIN_SEARCH_CHARS) { resultsDiv.innerHTML = ''; return; }
        state._debounceTimer = setTimeout(() => searchLocation(query, resultsDiv, (item) => { state.pickup = item; setLocationAndUpdateUI('pickup', item); searchInput.value = item.label; resultsDiv.innerHTML = ''; nextBtn.disabled = false; }), SEARCH_DEBOUNCE_MS);
    });
    document.getElementById('lp-gps-btn').addEventListener('click', () => { GPS.getCurrentPosition((pos) => { const loc = { label: `GPS (${roundCoord(pos.lat)}, ${roundCoord(pos.lng)})`, lat: roundCoord(pos.lat), lng: roundCoord(pos.lng) }; state.pickup = loc; setLocationAndUpdateUI('pickup', loc); searchInput.value = loc.label; nextBtn.disabled = false; ThemeManager.showToast('Lokasi GPS digunakan', 'success'); }, (err) => { ThemeManager.showToast('Gagal mendapatkan lokasi GPS', 'error'); }); });
    document.getElementById('lp-map-btn').addEventListener('click', () => goToPage(4));
    nextBtn.addEventListener('click', () => goToPage(5));
}

function renderPage4() { return `<div class="lp-page"><h4>Peta Jemput</h4><div id="lp-map" style="height:300px;"></div><button class="btn btn-primary btn-block mt-md" id="lp-use-map-pickup" disabled>Gunakan Lokasi Ini</button><button class="btn btn-outline btn-block" id="lp-cancel-map">KEMBALI</button></div>`; }
function renderPage6() { return `<div class="lp-page"><h4>Peta Antar</h4><div id="lp-map" style="height:300px;"></div><button class="btn btn-primary btn-block mt-md" id="lp-use-map-destination" disabled>Gunakan Lokasi Ini</button><button class="btn btn-outline btn-block" id="lp-cancel-map">KEMBALI</button></div>`; }

function initMapPage(type) {
    const mapDiv = document.getElementById('lp-map');
    if (!mapDiv) return;
    GPS.getCurrentPosition(
        (pos) => { const userCenter = [roundCoord(pos.lat), roundCoord(pos.lng)]; initMapWithCenter(type, userCenter); },
        () => { const fallbackCenter = (type === 'pickup' && state.pickup) ? [state.pickup.lat, state.pickup.lng] : (state.destination ? [state.destination.lat, state.destination.lng] : MapManager.DEFAULT_CENTER); initMapWithCenter(type, fallbackCenter); }
    );
}

function initMapWithCenter(type, center) {
    state._mapCoords = null;
    MapManager.init('lp-map', { center, zoom: 15, role: state.role, vehicleMode: state.vehicle }).then(() => {
        state.mapActive = true;
        const map = MapManager.getMap();
        if (!map) return;
        const currentCoord = type === 'pickup' ? state.pickup : state.destination;
        const markerType = type === 'pickup' ? 'pickup' : 'finish';
        if (currentCoord) MapManager.addMarker(currentCoord.lat, currentCoord.lng, markerType, { replace: true });
        map.on('click', (e) => { const lat = roundCoord(e.latlng.lat); const lng = roundCoord(e.latlng.lng); MapManager.addMarker(lat, lng, markerType, { replace: true }); state._mapCoords = { lat, lng }; const useBtnId = type === 'pickup' ? 'lp-use-map-pickup' : 'lp-use-map-destination'; const useBtn = document.getElementById(useBtnId); if (useBtn) useBtn.disabled = false; });
    });
    const useBtnId = type === 'pickup' ? 'lp-use-map-pickup' : 'lp-use-map-destination';
    document.getElementById(useBtnId).addEventListener('click', () => {
        if (!state._mapCoords) { ThemeManager.showToast('Ketuk peta untuk memilih lokasi', 'warning'); return; }
        const label = `Peta (${state._mapCoords.lat.toFixed(COORD_DECIMALS)}, ${state._mapCoords.lng.toFixed(COORD_DECIMALS)})`;
        const obj = { label, lat: state._mapCoords.lat, lng: state._mapCoords.lng };
        if (type === 'pickup') state.pickup = obj; else state.destination = obj;
        MapManager.destroy(); state.mapActive = false; goToPage(type === 'pickup' ? 3 : 5);
    });
    document.getElementById('lp-cancel-map').addEventListener('click', () => { MapManager.destroy(); state.mapActive = false; goToPage(type === 'pickup' ? 3 : 5); });
}

function renderPage5() {
    return `<div class="lp-page"><h4>Titik Antar</h4><div id="lp-dest-saved-btns" class="lp-saved-btns"></div><div class="lp-input-box"><input type="text" id="lp-search-dest" placeholder="Cari lokasi pengantaran..."></div><div id="lp-dest-results" class="lp-results"></div><div id="lp-dest-selected" class="lp-selected-info" style="display:none;"><div class="lp-info-label"></div><div class="lp-info-coords"></div><button class="btn btn-outline btn-sm btn-block lp-save-btn">${ICON.SAVE} Simpan Lokasi</button></div><div class="flex justify-between gap-sm mt-sm"><button class="btn btn-outline flex-1" id="lp-back5">${ICON.BACK} Kembali</button><button class="btn btn-outline flex-1" id="lp-map-dest-btn">${ICON.SHOW_MAP} Cari di Peta</button></div><button class="btn btn-primary btn-block mt-sm" id="lp-calc-btn" disabled>Hitung Jarak & Waktu</button></div>`;
}

function bindPage5() {
    const searchInput = document.getElementById('lp-search-dest');
    const resultsDiv = document.getElementById('lp-dest-results');
    const calcBtn = document.getElementById('lp-calc-btn');
    const savedBtnsDiv = document.getElementById('lp-dest-saved-btns');
    renderRecentSavedButtons('destination', savedBtnsDiv, searchInput, calcBtn);
    if (state.destination) { setLocationAndUpdateUI('destination', state.destination); calcBtn.disabled = false; searchInput.value = state.destination.label || ''; }
    searchInput.addEventListener('input', () => {
        clearTimeout(state._debounceTimer);
        const query = searchInput.value.trim();
        if (query.length < MIN_SEARCH_CHARS) { resultsDiv.innerHTML = ''; return; }
        state._debounceTimer = setTimeout(() => searchLocation(query, resultsDiv, (item) => { state.destination = item; setLocationAndUpdateUI('destination', item); searchInput.value = item.label; resultsDiv.innerHTML = ''; calcBtn.disabled = false; }), SEARCH_DEBOUNCE_MS);
    });
    document.getElementById('lp-map-dest-btn').addEventListener('click', () => goToPage(6));
    document.getElementById('lp-back5').addEventListener('click', () => goToPage(3));
    calcBtn.addEventListener('click', () => handleCalculateClick(calcBtn));
    checkCooldownForButton(calcBtn);
}

function renderPage7() {
    const r = state.routeResult;
    const dist = r ? r.distanceKm.toFixed(1) : '?';
    const dur = r ? Math.round(r.durationMin) : '?';
    return `<div class="lp-page"><h4>Hasil Rute</h4><div class="lp-result-map" id="lp-result-map"></div><div class="lp-result-stats"><span>${ICON.DETAIL} ${dist} km</span><span>${ICON.SPINNER} ${dur} mnt</span></div><div id="lp-route-error" style="display:none; color:var(--danger); margin-bottom: var(--space-sm);"></div><div class="lp-result-actions"><button class="btn btn-outline" id="lp-result-back">${ICON.BACK} Kembali</button><button class="btn btn-primary" id="lp-result-use">${ICON.CHECK} Gunakan</button></div></div>`;
}

function initResultPage() {
    const result = state.routeResult;
    if (!result) { ThemeManager.showToast('Hasil rute tidak tersedia', 'error'); goToPage(5); return; }
    const mapDiv = document.getElementById('lp-result-map');
    if (!mapDiv) return;
    const pickup = state.pickup;
    const destination = state.destination;
    if (!pickup || !destination) return;
    MapManager.init('lp-result-map', { center: [pickup.lat, pickup.lng], zoom: 13, role: state.role, vehicleMode: state.vehicle }).then(() => {
        state.mapActive = true;
        MapManager.addMarker(pickup.lat, pickup.lng, 'pickup', { replace: false });
        MapManager.addMarker(destination.lat, destination.lng, 'finish', { replace: false });
        if (result.geometry && Array.isArray(result.geometry) && result.geometry.length >= 2) { MapManager.addPolyline(result.geometry, 'pickup'); MapManager.fitBounds(result.geometry, { padding: [30, 30], maxZoom: 16 }); }
    });
    document.getElementById('lp-result-back').addEventListener('click', () => { MapManager.destroy(); state.mapActive = false; goToPage(5); });
    document.getElementById('lp-result-use').addEventListener('click', () => {
        if (result.geometry && Array.isArray(result.geometry)) savePolyline(result.geometry);
        if (typeof LocationPicker.onComplete === 'function') LocationPicker.onComplete({ distanceKm: result.distanceKm, durationMin: result.durationMin });
        MapManager.destroy(); state.mapActive = false; cleanup(); Router.navigateTo({ popup: 0 });
    });
}

function renderRecentSavedButtons(type, container, searchInput, nextOrCalcBtn) {
    const items = getRecentSaved();
    container.innerHTML = '';
    for (let i = 0; i < MAX_RECENT_SAVED; i++) {
        const btn = document.createElement('button');
        btn.className = 'lp-saved-btn';
        btn.textContent = `Lokasi ${i + 1}`;
        if (i < items.length) {
            const loc = items[i];
            btn.disabled = false;
            btn.addEventListener('click', () => {
                const obj = { label: loc.label, lat: loc.lat, lng: loc.lng, savedLabel: `Lokasi ${i + 1}` };
                if (type === 'pickup') state.pickup = obj; else state.destination = obj;
                setLocationAndUpdateUI(type, obj); searchInput.value = obj.label; nextOrCalcBtn.disabled = false;
            });
        } else { btn.disabled = true; }
        container.appendChild(btn);
    }
}

function setLocationAndUpdateUI(type, loc) {
    const prefix = type === 'pickup' ? 'lp-pickup-selected' : 'lp-dest-selected';
    const div = document.getElementById(prefix);
    if (!div) return;
    div.style.display = 'block';
    const labelEl = div.querySelector('.lp-info-label');
    const coordsEl = div.querySelector('.lp-info-coords');
    const saveBtn = div.querySelector('.lp-save-btn');
    if (loc.savedLabel) labelEl.textContent = `${loc.savedLabel} - ${loc.label}`; else labelEl.textContent = loc.label;
    coordsEl.textContent = `${roundCoord(loc.lat).toFixed(COORD_DECIMALS)}, ${roundCoord(loc.lng).toFixed(COORD_DECIMALS)}`;
    saveBtn.onclick = () => { saveRecentLocation({ label: loc.label, lat: loc.lat, lng: loc.lng }); const savedBtnsDiv = document.getElementById(type === 'pickup' ? 'lp-pickup-saved-btns' : 'lp-dest-saved-btns'); const searchInput = document.getElementById(type === 'pickup' ? 'lp-search-pickup' : 'lp-search-dest'); const nextOrCalcBtn = document.getElementById(type === 'pickup' ? 'lp-next3' : 'lp-calc-btn'); renderRecentSavedButtons(type, savedBtnsDiv, searchInput, nextOrCalcBtn); ThemeManager.showToast('Lokasi disimpan', 'success'); };
}

function checkCooldownForButton(btn) {
    const lastCalcUtc = sessionStorage.getItem('picker_last_calc_utc');
    const nowUtc = GPS.getCurrentUTCTime().utc;
    if (lastCalcUtc) { const elapsed = (nowUtc - parseInt(lastCalcUtc)) / 1000; if (elapsed < COOLDOWN_SEC) { state.cooldownRemaining = Math.ceil(COOLDOWN_SEC - elapsed); startButtonCooldown(btn); } }
}

function startButtonCooldown(btn) {
    btn.disabled = true;
    const originalText = 'Hitung Jarak & Waktu';
    const updateDisplay = () => { const m = Math.floor(state.cooldownRemaining / 60); const s = state.cooldownRemaining % 60; btn.textContent = `Tunggu ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; };
    updateDisplay();
    state.cooldownBtnTimer = setInterval(() => {
        state.cooldownRemaining--;
        if (state.cooldownRemaining <= 0) { clearInterval(state.cooldownBtnTimer); state.cooldownBtnTimer = null; btn.disabled = false; btn.textContent = originalText; state.cooldownActive = false; }
        else updateDisplay();
    }, 1000);
}

async function handleCalculateClick(btn) {
    const lastCalcUtc = sessionStorage.getItem('picker_last_calc_utc');
    const nowUtc = GPS.getCurrentUTCTime().utc;
    if (lastCalcUtc) { const elapsed = (nowUtc - parseInt(lastCalcUtc)) / 1000; if (elapsed < COOLDOWN_SEC) { state.cooldownRemaining = Math.ceil(COOLDOWN_SEC - elapsed); startButtonCooldown(btn); return; } }
    btn.disabled = true; btn.textContent = 'Menghitung...';
    const errorDiv = document.getElementById('lp-route-error');
    if (errorDiv) errorDiv.style.display = 'none';
    try {
        window.log.info('[picker ' + F_V + '] Menghitung rute dengan vehicle = ' + state.vehicle);
        const { distance, duration, geometry } = await fetchOSRMRouteWithGeometry();
        const correction = CORRECTION[state.vehicle] || CORRECTION.Mobil;
        let distKm = (distance / 1000) * correction.distFactor + correction.distAdd;
        distKm = Math.round(distKm * 10) / 10;
        let durMenit = (duration / 60) * correction.timeFactor + correction.timeAdd;
        if (isPeakHour(state.pickup?.lng || 106.8)) durMenit *= correction.peakMult;
        durMenit = Math.ceil(durMenit);
        sessionStorage.setItem('picker_last_calc_utc', String(GPS.getCurrentUTCTime().utc));
        state.routeResult = { distanceKm: distKm, durationMin: durMenit, geometry };
        goToPage(7);
    } catch (err) {
        window.log.error('[picker ' + F_V + '] Gagal hitung rute:', err);
        if (errorDiv) { errorDiv.style.display = 'block'; errorDiv.textContent = `Gagal menghitung rute: ${err.message || 'Periksa koneksi atau coba lagi.'}`; }
        btn.disabled = false; btn.textContent = 'Hitung Jarak & Waktu';
    }
}

async function searchLocation(query, resultsDiv, onSelect) {
    const cache = getCache('lp_geocoding');
    if (cache[query] && (Date.now() - cache[query].timestamp < CACHE_MAX_AGE_MS)) { displayResults(cache[query].results, resultsDiv, onSelect); return; }
    if (state.abortController) state.abortController.abort();
    state.abortController = new AbortController();
    try {
        const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=id&countrycodes=id`;
        const res = await fetch(url, { signal: state.abortController.signal });
        const data = await res.json();
        const results = data.map(item => ({ label: item.display_name, lat: roundCoord(parseFloat(item.lat)), lng: roundCoord(parseFloat(item.lon)) }));
        cache[query] = { results, timestamp: Date.now() }; setCache('lp_geocoding', cache);
        displayResults(results, resultsDiv, onSelect);
    } catch (err) { if (err.name !== 'AbortError') resultsDiv.innerHTML = '<div class="text-danger">Gagal mencari. Coba lagi nanti.</div>'; }
}

function displayResults(results, container, onSelect) {
    container.innerHTML = '';
    results.forEach(r => {
        const div = document.createElement('div');
        div.className = 'lp-result-item';
        div.dataset.lat = r.lat; div.dataset.lng = r.lng;
        div.textContent = r.label;
        div.addEventListener('click', () => { onSelect({ label: r.label, lat: roundCoord(parseFloat(r.lat)), lng: roundCoord(parseFloat(r.lng)) }); });
        container.appendChild(div);
    });
}

async function fetchOSRMRouteWithGeometry() {
    const profile = state.vehicle === 'Motor' ? 'bike' : 'car';
    window.log.info('[picker ' + F_V + '] OSRM profile = ' + profile);
    const { pickup, destination } = state;
    if (!pickup || !destination) throw new Error('Lokasi jemput atau antar belum dipilih');
    if (!pickup.lat || !pickup.lng || !destination.lat || !destination.lng) throw new Error('Koordinat tidak valid');
    const url = `${OSRM_BASE}/${profile}/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    window.log.info('[picker ' + F_V + '] OSRM request: ' + url);
    const cacheKey = `${profile}_${pickup.lat}_${pickup.lng}_${destination.lat}_${destination.lng}`;
    const routeCache = getCache('lp_route');
    if (routeCache[cacheKey] && (Date.now() - routeCache[cacheKey].timestamp < CACHE_MAX_AGE_MS)) { window.log.info('[picker ' + F_V + '] OSRM menggunakan cache'); return routeCache[cacheKey].data; }
    const res = await fetch(url);
    const json = await res.json();
    if (json.code !== 'Ok') throw new Error('OSRM error: ' + (json.message || 'Rute tidak ditemukan'));
    const route = json.routes[0];
    const leg = route.legs[0];
    const geometryCoords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
    const data = { distance: leg.distance, duration: leg.duration, geometry: geometryCoords };
    routeCache[cacheKey] = { data, timestamp: Date.now() }; setCache('lp_route', routeCache);
    return data;
}

function isPeakHour(lng) {
    const timeObj = GPS.getCurrentUTCTime(lng);
    const local = new Date(timeObj.utc + timeObj.offset * 3600 * 1000);
    const day = local.getUTCDay(); const hour = local.getUTCHours();
    if (PEAK_HOURS.pagi.days.includes(day) && hour >= PEAK_HOURS.pagi.start && hour <= PEAK_HOURS.pagi.end) return true;
    if (PEAK_HOURS.sore.days.includes(day) && hour >= PEAK_HOURS.sore.start && hour <= PEAK_HOURS.sore.end) return true;
    return false;
}

function open() {
    window.log.info('[picker ' + F_V + '] (2) open() dipanggil');
    clearSavedPolyline();
    const input = StateManager.get('input') || {};
    state.vehicle = input.E10 || 'Motor'; state.role = input.E12 || 'Driver'; state.area = input.E20 || 'Jabodetabek';
    state.page = 1; state.pickup = null; state.destination = null;
    state.cooldownActive = false; state.cooldownRemaining = 0;
    state.mapActive = false; state.routeResult = null;
    if (state.abortController) { state.abortController.abort(); state.abortController = null; }
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    if (state.cooldownBtnTimer) { clearInterval(state.cooldownBtnTimer); state.cooldownBtnTimer = null; }
    if (state._debounceTimer) { clearTimeout(state._debounceTimer); state._debounceTimer = null; }
    window.log.info('[picker ' + F_V + '] (2a) input.E10 = ' + input.E10 + ', state.vehicle = ' + state.vehicle);
    cleanExpiredCache();
    Router.navigateTo({ target: 'popup21' });
    renderPage();
}

PopupManager.register(21, () => createPickerContainer());

export const LocationPicker = { open, cleanup, onComplete: null, getSavedPolyline, clearSavedPolyline };

window.log.info('[picker ' + F_V + '] (3) LocationPicker dimuat');

// ================================ End Of File ================================