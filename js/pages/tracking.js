/**
 * =================================================================================
 * FILE         : /js/pages/tracking.js
 * FILE VERSION : 2.0a-rev3
 * APP VERSION  : 2.0a-beta
 * DATE         : 1 Juli 2026
 * @author      : gk
 *
 * DESCRIPTION  :
 *   Halaman Tracking – Merekam perjalanan real‑time dengan GPS.
 *   Orkestrator UI yang mengintegrasikan MapManager, Calculate, GPS,
 *   dan komponen UI (Header, Footer, Popup).
 *
 * =================================================================================
 */

'use strict';

// ==================== VERSI FILE ====================
const F_V = '2.0a-rev3';

import { StateManager } from '../core/state.js';
import { Router } from '../core/router.js';
import { PreferencesManager } from '../core/preferences.js';
import { StorageManager } from '../core/storage.js';
import { HeaderManager } from '../components/header.js';
import { FooterManager } from '../components/footer.js';
import { ThemeManager } from '../components/theme.js';
import { PopupManager } from '../components/popup.js';
import { MapManager } from '../maps/map.js';
import { Calculate } from '../maps/calculate.js';
import { GPS } from '../maps/gps.js';
import { LocationPicker } from '../maps/picker.js';
import {
    formatRupiah, formatKm, formatMenit,
    parseNumber
} from '../helpers/format.js';
import { getDriverColorAndBlink, validateCell } from '../helpers/output.js';

// =============================================================================
// 0. IKON LOKAL
// =============================================================================

const ICON = {
    FUEL: '⛽',
    MAINTENANCE: '🔧',
    MONEY: '💰',
    APP: '📱',
    DRIVER: '👤',
    PENUMPANG: '🧑',
    MAP_START: '🚩',
    MAP_FINISH: '🏁',
    CANCEL: '✖',
    SAVE: '💾',
    CLOSE: '❌',
    PAUSE: '⏸',
    PLAY: '▶️',
    STOP: '🟥',
    LOCATION: '📍',
    MAP: '🗺',
    GEAR: '⚙️',
    SOUND_ON: '🔊',
    SOUND_OFF: '🔈',
    EXPAND: '▷',
    COLLAPSE: '▽'
};

// =============================================================================
// 1. STATE INTERNAL
// =============================================================================

let isDestroyed = false;
let calculate = null;
let role = 'Driver';
let calcMode = 'standard';
let vehicleData = {};
let estimateResult = null;

let mapReady = false;
let currentPosition = null;
let currentAccuracy = 0;

let currentHeader = null;

let liveIncome = {
    driver: 0, app: 0, passengerPayment: 0, passengerBill: 0,
    bbm: 0, maintenance: 0, total: 0
};
let updateTimer = null;
let updateScheduled = false;
let lastUpdateDistance = 0;
let lastUpdateTime = 0;
let clockTimer = null;

const DISTANCE_THRESHOLD = 0.01;
const TIME_THRESHOLD = 60;
const UPDATE_DEBOUNCE_MS = 1000;

let maxJemput = { distance: 2, time: 15 };

let snapshotEngineData = null;
let snapshotCompactData = null;

let currentStage = 'idle';
let previousStage = null;

let _trackingModule = null;

let driverExpanded = false;
let appExpanded = false;

let shareCount = 1;
let setLimit = 0;

let isOfflineMode = false;

let offlineAdditionalData = {};

// State suara
let soundEnabled = true;
let beepAudioCtx = null;
let soundTimer = null;
let currentSoundInterval = null;    // ms interval suara saat ini (null jika tidak ada)

// =============================================================================
// 2. HELPER: DEBOUNCE
// =============================================================================

function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// =============================================================================
// 3. STAGE MANAGEMENT
// =============================================================================

function goToStage(newStage) {
    if (isDestroyed) return;

    const allowed = getAllowedStages();
    if (!allowed.includes(newStage)) {
        window.log.error('[Tracking ' + F_V + '] (1) Transisi stage tidak diizinkan: ' + currentStage + ' -> ' + newStage);
        return;
    }

    window.log.info('[Tracking ' + F_V + '] (2) goToStage: ' + currentStage + ' -> ' + newStage);

    if (newStage === 'paused') {
        previousStage = currentStage;
    }

    currentStage = newStage;
    StateManager.set('tracking.currentStage', newStage);

    // Manajemen suara berdasarkan stage baru
    if (newStage === 'idle' || newStage === 'paused') {
        stopSound();
    } else if (soundEnabled && calcMode !== 'operational' && (newStage === 'pickup' || newStage === 'dropoff')) {
        startSoundIfNeeded(currentSoundInterval);
    }

    updateFooter();
    updateDistanceTimeDisplay();
    updateStatusText();

    if (newStage === 'idle') {
        resetToIdle();
    }
}

function getAllowedStages() {
    const isOperational = calcMode === 'operational';
    if (isOperational) {
        return ['idle', 'operational', 'paused'];
    }
    if (role === 'Penumpang') {
        return ['idle', 'dropoff', 'paused'];
    }
    return ['idle', 'pickup', 'dropoff', 'paused'];
}

function resetToIdle() {
    window.log.info('[Tracking ' + F_V + '] (3) resetToIdle()');

    if (calculate) {
        calculate.stop();
        calculate = null;
    }
    GPS.stop();
    stopClockTimer();
    stopSound();

    if (mapReady && MapManager) {
        MapManager.clearPolylines();
        if (isOfflineMode) drawPlannedRoute();
        MapManager.clearMarkers();
    }

    liveIncome = { driver: 0, app: 0, passengerPayment: 0, passengerBill: 0, bbm: 0, maintenance: 0, total: 0 };
    lastUpdateDistance = 0;
    lastUpdateTime = 0;
    snapshotEngineData = null;
    snapshotCompactData = null;
    currentStage = 'idle';
    StateManager.set('tracking.currentStage', 'idle');
    driverExpanded = false;
    appExpanded = false;
    shareCount = 1;
    setLimit = 0;
    StateManager.set('tracking.offlineAdditionalData', null);

    updateFooter();
    updateDistanceTimeDisplay();
    updateStatusText();
    renderLiveIncome();
    renderTripSummaryCard();
}

// =============================================================================
// 4. HANDLER GPS
// =============================================================================

function handleGPSPosition(pos) {
    if (!calculate) return;
    currentPosition = { lat: pos.lat, lng: pos.lng };
    currentAccuracy = pos.accuracy || 0;
    calculate.addPosition(pos.lat, pos.lng, pos.accuracy, pos.timestamp);
    
    // Tambahkan marker start (🚩) hanya sekali di awal fase pickup
    if (currentStage === 'pickup' && !MapManager.getMarker('start')) {
        MapManager.addMarker(pos.lat, pos.lng, 'start', { replace: false });
    }
    
    if (mapReady) updateMap();
    updateDistanceTimeDisplay();
    scheduleLiveIncomeUpdate();
    MapManager.setGPSStatusOverlay(true);
}

function handleGPSError(error) {
    window.log.error('[Tracking ' + F_V + '] (4) GPS error:', error.code, error.message);
    MapManager.setGPSStatusOverlay(false);
    ThemeManager?.showToast(
        error.message || 'GPS tidak tersedia. Tracking tetap berjalan manual.',
        'warning'
    );
}

// =============================================================================
// 5. PETA & GPS AWAL
// =============================================================================

function requestGPSPermission() {
    GPS.getCurrentPosition(
        (pos) => {
            currentPosition = { lat: pos.lat, lng: pos.lng };
            currentAccuracy = pos.accuracy || 0;
            if (mapReady && MapManager) {
                MapManager.updateUserMarker(pos.lat, pos.lng, role, vehicleData.E10);
                MapManager.setView(pos.lat, pos.lng, 15);
            }
            updateDistanceTimeDisplay();
            MapManager.setGPSStatusOverlay(true);
            window.log.info('[Tracking ' + F_V + '] (5) GPS permission granted');
        },
        (error) => {
            MapManager.setGPSStatusOverlay(false);
            window.log.warn('[Tracking ' + F_V + '] (6) GPS permission denied');
            ThemeManager?.showToast('Izin lokasi ditolak. Tracking tetap berjalan manual.', 'info');
        }
    );
}

async function initMap() {
    if (!MapManager) {
        const el = document.getElementById('tracking-map');
        if (el) el.innerHTML = '<div class="map-placeholder"><p>Peta tidak tersedia</p></div>';
        return;
    }
    try {
        const center = currentPosition
            ? [currentPosition.lat, currentPosition.lng]
            : MapManager.getDefaultCenter(vehicleData.E20);

        await MapManager.initForTracking('tracking-map', {
            center,
            zoom: 15,
            role,
            vehicleMode: vehicleData.E10,
            isOperational: calcMode === 'operational'
        });
        mapReady = true;
        window.log.info('[Tracking ' + F_V + '] (7) Peta berhasil diinisialisasi');

        MapManager.setStatusOverlay('Siap memulai!');
        MapManager.setAccuracyOverlay('--m');
        MapManager.setGPSStatusOverlay(false);

        MapManager.addWarningButton(() => {
            Router.navigateTo({ target: 'popup18' });
        });

        if (currentPosition) {
            MapManager.updateUserMarker(currentPosition.lat, currentPosition.lng, role, vehicleData.E10);
        }
        if (calculate) updateMap();
        setTimeout(() => { if (MapManager) MapManager.invalidateSize(); }, 300);

        if (isOfflineMode) drawPlannedRoute();
    } catch (error) {
        window.log.error('[Tracking ' + F_V + '] (8) Gagal inisialisasi peta:', error);
        const el = document.getElementById('tracking-map');
        if (el) el.innerHTML = '<div class="map-placeholder"><p>Peta gagal dimuat</p></div>';
    }
}

// =============================================================================
// 6. UI UPDATE (PLACEHOLDER & OVERLAY MAP)
// =============================================================================

function updateStatusText() {
    const texts = {
        idle: 'Siap memulai!',
        pickup: 'PICKUP',
        dropoff: 'DROPOFF',
        operational: 'OPERASIONAL',
        paused: 'PAUSED'
    };
    MapManager.setStatusOverlay(texts[currentStage] || '');
}

function updateDistanceTimeDisplay() {
    const indicator = calculate?.getLiveIndicatorData();
    const phase = indicator?.phase;
    const isActivePhase = phase && phase.phase !== 'idle';

    const distEl = document.getElementById('tracking-distance');
    if (distEl) {
        if (isActivePhase) {
            distEl.textContent = formatKm(phase.distance, true, 2);
        } else {
            distEl.textContent = '-- km';
        }
    }

    const timeEl = document.getElementById('tracking-time');
    if (timeEl) {
        if (isActivePhase) {
            const sec = phase.elapsedSeconds;
            const h = Math.floor(sec / 3600);
            const m = Math.floor((sec % 3600) / 60);
            const s = Math.floor(sec % 60);
            timeEl.textContent = h > 0
                ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
                : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        } else {
            timeEl.textContent = '--:--';
        }
    }

    if (currentStage !== 'idle' && currentAccuracy > 0) {
        MapManager.setAccuracyOverlay(currentAccuracy.toFixed(0) + 'm');
    } else {
        MapManager.setAccuracyOverlay('--m');
    }
}

function startClockTimer() {
    stopClockTimer();
    clockTimer = setInterval(() => {
        if (!isDestroyed) updateDistanceTimeDisplay();
    }, 1000);
}

function stopClockTimer() {
    if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }
}

function updateMap() {
    if (!mapReady || !MapManager || !calculate) return;

    const poly = calculate.getPolylineData();
    if (poly.pickup.length > 0) MapManager.updatePolylineWithAccuracy(poly.pickup, 'pickup');
    if (poly.dropoff.length > 0) MapManager.updatePolylineWithAccuracy(poly.dropoff, 'dropoff');

    if (currentPosition) {
        MapManager.updateUserMarker(currentPosition.lat, currentPosition.lng, role, vehicleData.E10);
    }

    const allPos = poly.pickup.concat(poly.dropoff);
    if (currentPosition) allPos.push([currentPosition.lat, currentPosition.lng]);
    if (allPos.length > 0) MapManager.fitBounds(allPos);
}

function scheduleLiveIncomeUpdate() {
    if (!calculate || currentStage === 'idle' || currentStage === 'paused') return;
    const summary = calculate.getSummary();
    if (!summary) return;
    const distDiff = Math.abs(summary.totalDistance - lastUpdateDistance);
    const timeDiff = Math.abs(summary.totalTime - lastUpdateTime);
    if ((distDiff >= DISTANCE_THRESHOLD || timeDiff >= TIME_THRESHOLD) && !updateScheduled) {
        updateScheduled = true;
        if (updateTimer) clearTimeout(updateTimer);
        updateTimer = setTimeout(() => {
            updateLiveIncome();
            updateScheduled = false;
            updateTimer = null;
        }, UPDATE_DEBOUNCE_MS);
    }
}

// =============================================================================
// 7. LIVE INCOME & SHARE/LIMIT (OPERASIONAL)
// =============================================================================

function updateLiveIncome(options = {}) {
    if (!calculate) return;

    const opts = {
        shareCount: options.shareCount !== undefined ? options.shareCount : shareCount,
        setLimit: options.setLimit !== undefined ? options.setLimit : setLimit
    };

    const li = calculate.getLiveIncome(vehicleData, estimateResult, opts);
    if (li) {
        liveIncome = li;
        const summary = calculate.getSummary();
        if (summary) {
            lastUpdateDistance = summary.totalDistance;
            lastUpdateTime = summary.totalTime;
        }
    }
    renderLiveIncome();
    renderTripSummaryCard();
    renderShareLimitResult();

    // Perbarui suara berdasarkan kategori terbaru
    const driverInfo = getDriverColorAndBlink(liveIncome.driver, vehicleData.E10);
    currentSoundInterval = driverInfo.soundInterval;
    if (soundEnabled && currentStage === 'pickup' || currentStage === 'dropoff' && calcMode !== 'operational') {
        startSoundIfNeeded(currentSoundInterval);
    } else {
        stopSound();
    }
}

function renderShareLimitResult() {
    const container = document.getElementById('share-limit-result');
    if (!container) return;

    let html = '';
    if (shareCount > 1 && liveIncome.shareCost > 0) {
        html += `<div class="live-income-row"><span>Share per orang</span><span class="live-income-value">${formatRupiah(liveIncome.shareCost)}</span></div>`;
    }
    if (setLimit >= 1000) {
        const limitVal = liveIncome.limitResult || 0;
        const cls = limitVal >= 0 ? 'text-success' : 'text-danger';
        html += `<div class="live-income-row"><span>Sisa Limit</span><span class="live-income-value ${cls}">${formatRupiah(limitVal)}</span></div>`;
    }
    container.innerHTML = html;
}

// =============================================================================
// 8. RENDER LIVE INCOME (KOLAPSIBEL INDEPENDEN) + SPEAKER
// =============================================================================

function renderLiveIncome() {
    const container = document.getElementById('live-income-container');
    if (!container) return;

    if (calcMode === 'operational') {
        container.innerHTML = `
            <div class="live-income-section">
                <div class="live-income-row"><span>${ICON.FUEL} BBM</span><span class="live-income-value">${formatRupiah(liveIncome.bbm)}</span></div>
                <div class="live-income-row"><span>${ICON.MAINTENANCE} Maintenance</span><span class="live-income-value">${formatRupiah(liveIncome.maintenance)}</span></div>
            </div>
            <div class="live-income-section" style="margin-top: var(--space-md);">
                <div class="live-income-row"><span>${ICON.MONEY} Total Biaya</span><span class="live-income-value text-xl">${formatRupiah(liveIncome.total)}</span></div>
            </div>`;
        return;
    }

    const isIdle = currentStage === 'idle';
    const driverInfo = isIdle
        ? { color: '', blink: '', soundInterval: null }
        : getDriverColorAndBlink(liveIncome.driver, vehicleData.E10);
    const billClass = liveIncome.passengerBill > 0 ? 'text-danger' : '';

    // Ikon ekspansi menggunakan ICON
    const driverIcon = driverExpanded ? ICON.COLLAPSE : ICON.EXPAND;
    const appIcon = appExpanded ? ICON.COLLAPSE : ICON.EXPAND;
    const driverChildrenClass = driverExpanded ? 'expanded' : '';
    const appChildrenClass = appExpanded ? 'expanded' : '';

    const loadGoogleMap = (liveIncome._engineResult && typeof liveIncome._engineResult.E807 !== 'undefined')
        ? liveIncome._engineResult.E807
        : 0;

    const appSection = isOfflineMode ? '' : `
        <div class="live-income-section">
            <div class="live-income-row live-income-toggle" id="toggle-app">
                <span class="live-income-toggle-icon ${appChildrenClass}">${appIcon}</span>
                <span>${ICON.APP} APLIKASI</span>
                <span class="live-income-value" style="margin-left: auto;">${formatRupiah(liveIncome.app)}</span>
            </div>
            <div class="live-income-children ${appChildrenClass}" id="children-app">
                <div class="live-income-row live-income-sub">
                    <span>${ICON.MAP} Load Google Map</span>
                    <span class="live-income-value">${formatRupiah(loadGoogleMap)}</span>
                </div>
            </div>
        </div>`;

    // Tombol speaker
    const showSpeaker = calcMode !== 'operational' && currentStage !== 'idle';
    const speakerHtml = showSpeaker
        ? `<span class="sound-toggle-btn" id="sound-toggle-btn" style="cursor:pointer; margin-right:4px;">${soundEnabled ? ICON.SOUND_ON : ICON.SOUND_OFF}</span>`
        : '';

    container.innerHTML = `
        <div class="live-income-section">
            <div class="live-income-row live-income-toggle" id="toggle-driver-app">
                <span class="live-income-toggle-icon ${driverChildrenClass}">${driverIcon}</span>
                <span>${ICON.DRIVER} DRIVER</span>
                <span class="live-income-value driver-value-large ${driverInfo.color} ${driverInfo.blink}" style="margin-left: auto;">
                    ${speakerHtml}${formatRupiah(liveIncome.driver)}
                </span>
            </div>
            <div class="live-income-children ${driverChildrenClass}" id="children-driver">
                <div class="live-income-row live-income-sub">
                    <span>${ICON.FUEL} BBM</span>
                    <span class="live-income-value">${formatRupiah(liveIncome.bbm)}</span>
                </div>
                <div class="live-income-row live-income-sub">
                    <span>${ICON.MAINTENANCE} Kendaraan</span>
                    <span class="live-income-value">${formatRupiah(liveIncome.maintenance)}</span>
                </div>
            </div>
        </div>
        ${appSection}
        <div class="live-income-section" style="margin-top: var(--space-md);">
            <div class="live-income-row">
                <span>${ICON.PENUMPANG} PENUMPANG</span>
            </div>
            <div class="live-income-row live-income-sub">
                <span>Pembayaran</span>
                <span class="live-income-value">${formatRupiah(liveIncome.passengerPayment)}</span>
            </div>
            <div class="live-income-row live-income-sub">
                <span>Tagihan</span>
                <span class="live-income-value ${billClass}">${formatRupiah(liveIncome.passengerBill)}</span>
            </div>
        </div>`;

    bindToggleEvents();
    bindSpeakerEvent();
}

function bindSpeakerEvent() {
    const btn = document.getElementById('sound-toggle-btn');
    if (!btn) return;
    btn.removeEventListener('click', handleSpeakerClick);
    btn.addEventListener('click', handleSpeakerClick);
}

function handleSpeakerClick(e) {
    e.stopPropagation();
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('sound-toggle-btn');
    if (btn) {
        btn.textContent = soundEnabled ? ICON.SOUND_ON : ICON.SOUND_OFF;
    }
    if (soundEnabled) {
        startSoundIfNeeded(currentSoundInterval);
    } else {
        stopSound();
    }
}

function bindToggleEvents() {
    const toggleDriver = document.getElementById('toggle-driver-app');
    const toggleApp = document.getElementById('toggle-app');

    if (toggleDriver) {
        toggleDriver.removeEventListener('click', handleDriverToggle);
        toggleDriver.addEventListener('click', handleDriverToggle);
    }
    if (toggleApp) {
        toggleApp.removeEventListener('click', handleAppToggle);
        toggleApp.addEventListener('click', handleAppToggle);
    }
}

function handleDriverToggle() {
    driverExpanded = !driverExpanded;
    renderLiveIncome();
}

function handleAppToggle() {
    appExpanded = !appExpanded;
    renderLiveIncome();
}

// =============================================================================
// 9. CARD RINGKASAN PERJALANAN
// =============================================================================

function renderTripSummaryCard() {
    const card = document.getElementById('trip-summary-card');
    if (!card) return;

    const summary = calculate ? calculate.getSummary() : null;
    const isPenumpang = role === 'Penumpang';
    const isOperational = calcMode === 'operational';
    const isIdle = !summary || summary.status === 'idle' || currentStage === 'idle';

    const defaultPickupDist = (isPenumpang && isIdle) ? maxJemput.distance : 0;
    const defaultPickupTime = (isPenumpang && isIdle) ? maxJemput.time : 0;

    const pickupDist = isIdle ? defaultPickupDist : (summary?.pickupDistance || 0);
    const pickupTime = isIdle ? defaultPickupTime : (summary?.pickupTime || 0);
    const dropoffDist = isIdle ? 0 : (summary?.dropoffDistance || 0);
    const dropoffTime = isIdle ? 0 : (summary?.dropoffTime || 0);
    const pauseCount = summary?.pauseCount || 0;
    const pauseTimeMin = Math.ceil((summary?.pauseTime || 0) / 60);
    const jumpCount = summary?.jumpCount || 0;
    const jumpTotal = summary?.jumpTotal || 0;

    if (isOperational) {
        card.innerHTML = `
            <div class="trip-summary-row">
                <span>${ICON.PAUSE} Pause</span>
                <span>${pauseCount} kali, ${formatMenit(pauseTimeMin)}</span>
            </div>
            <div class="trip-summary-row">
                <span>${ICON.LOCATION} Lompatan Jarak</span>
                <span>${jumpCount} kali, ${formatKm(jumpTotal)}</span>
            </div>`;
    } else if (role === 'Driver') {
        card.innerHTML = `
            <div class="trip-summary-row">
                <span>${ICON.MAP_START} Penjemputan</span>
                <span>${formatKm(pickupDist)}, ${formatMenit(pickupTime)}</span>
            </div>
            <div class="trip-summary-row">
                <span>${ICON.MAP_FINISH} Pengantaran</span>
                <span>${formatKm(dropoffDist)}, ${formatMenit(dropoffTime)}</span>
            </div>
            <div class="trip-summary-divider"></div>
            <div class="trip-summary-row">
                <span>${ICON.PAUSE} Pause</span>
                <span>${pauseCount} kali, ${formatMenit(pauseTimeMin)}</span>
            </div>
            <div class="trip-summary-row">
                <span>${ICON.LOCATION} Lompatan Jarak</span>
                <span>${jumpCount} kali, ${formatKm(jumpTotal)}</span>
            </div>`;
    } else {
        card.innerHTML = `
            <div class="trip-summary-row">
                <span>${ICON.MAP_START} Penjemputan</span>
                <span>${formatKm(pickupDist)}, ${formatMenit(pickupTime)}</span>
            </div>
            <div class="trip-summary-row">
                <span>${ICON.MAP_FINISH} Pengantaran</span>
                <span>${formatKm(dropoffDist)}, ${formatMenit(dropoffTime)}</span>
            </div>
            <div class="trip-summary-divider"></div>
            <div class="trip-summary-row">
                <span>${ICON.PAUSE} Pause</span>
                <span>${pauseCount} kali, ${formatMenit(pauseTimeMin)}</span>
            </div>
            <div class="trip-summary-row">
                <span>${ICON.LOCATION} Lompatan Jarak</span>
                <span>${jumpCount} kali, ${formatKm(jumpTotal)}</span>
            </div>`;
    }

    const existingBtn = document.getElementById('offline-biaya-btn');
    if (existingBtn) existingBtn.remove();

    if (isOfflineMode && !isOperational) {
        const btn = document.createElement('button');
        btn.id = 'offline-biaya-btn';
        btn.className = 'btn btn-outline btn-sm mt-sm';
        btn.style.width = '100%';
        btn.textContent = '+ BIAYA PERJALANAN';
        btn.addEventListener('click', () => {
            Router.navigateTo({ target: 'popup19' });
        });
        card.appendChild(btn);
    }
}

// =============================================================================
// 10. FUNGSI SUARA (Web Audio API)
// =============================================================================

function getBeepCtx() {
    if (!beepAudioCtx) {
        beepAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (beepAudioCtx.state === 'suspended') {
        beepAudioCtx.resume().catch(() => {});
    }
    return beepAudioCtx;
}

function playNotificationBeep() {
    try {
        const ctx = getBeepCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 2800;
        osc.type = 'sine';
        gain.gain.value = 0.25;
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
        // Abaikan error audio (mis. browser blokir)
    }
}

function stopSound() {
    if (soundTimer) {
        clearInterval(soundTimer);
        soundTimer = null;
    }
    currentSoundInterval = null;
}

function startSoundIfNeeded(intervalMs) {
    stopSound();
    if (!intervalMs || !soundEnabled) return;
    if (calcMode === 'operational') return;
    if (currentStage !== 'pickup' && currentStage !== 'dropoff') return;
    soundTimer = setInterval(playNotificationBeep, intervalMs);
    currentSoundInterval = intervalMs;
}

// =============================================================================
// 11. KONTEN POPUP (dengan perbaikan slide)
// =============================================================================

function createCancelPopupContent() {
    const container = document.createElement('div');
    container.innerHTML = '<p>Data tracking akan dihentikan. Lanjutkan?</p>';

    const btnContainer = document.createElement('div');
    btnContainer.className = 'popup-footer';
    btnContainer.style.cssText = 'display:flex;gap:8px;padding:12px;border-top:1px solid var(--border);';

    const btnTidak = document.createElement('button');
    btnTidak.className = 'btn btn-outline';
    btnTidak.textContent = 'TIDAK';
    btnTidak.addEventListener('click', () => {
        Router.navigateTo({ popup: 0 });
    });

    const btnYa = document.createElement('button');
    btnYa.className = 'btn btn-danger';
    btnYa.textContent = 'YA';
    btnYa.addEventListener('click', async () => {
        window.log.info('[Tracking ' + F_V + '] (9) Batal tracking dikonfirmasi');
        emergencyStop();
        await Router.navigateTo({ popup: 0 });
        Router.navigateTo({ target: 'trackingidle' });
    });

    btnContainer.appendChild(btnTidak);
    btnContainer.appendChild(btnYa);
    container.appendChild(btnContainer);

    container._popupOptions = {
        title: 'BATALKAN TRACKING?',
        showActions: false,
        showCloseButton: true,
        closeOnOverlay: false
    };

    return container;
}

function createSelesaiPopupContent() {
    if (!calculate) {
        const container = document.createElement('div');
        container.innerHTML = '<p>Data tracking tidak tersedia.</p>';
        container._popupOptions = { title: 'SELESAI TRACKING', showActions: false, showCloseButton: true, closeOnOverlay: false };
        return container;
    }

    const snapshot = calculate.takeSnapshot();
    snapshotEngineData = snapshot.engineData;
    snapshotCompactData = snapshot.compactData;
    window.log.info('[Tracking ' + F_V + '] (10) Snapshot tracking diambil');

    const summary = calculate.getSummary();
    const isOnline = calcMode !== 'operational' && !isOfflineMode;
    const isPenumpang = role === 'Penumpang';

    const container = document.createElement('div');
    container.className = 'popup-selesai-container';

    let resumeHtml = '<div class="card card-compact mb-md">';
    if (role === 'Driver') {
        resumeHtml += `<div class="detail-row"><span class="detail-label">${ICON.MAP_START} Penjemputan</span><span class="detail-value">${formatKm(summary.pickupDistance)}, ${formatMenit(summary.pickupTime)}</span></div>`;
    }
    resumeHtml += `<div class="detail-row"><span class="detail-label">${ICON.MAP_FINISH} Pengantaran</span><span class="detail-value">${formatKm(summary.dropoffDistance)}, ${formatMenit(summary.dropoffTime)}</span></div>`;
    resumeHtml += `<div class="detail-row"><span class="detail-label">${ICON.PAUSE} Pause</span><span class="detail-value">${summary.pauseCount} kali, total ${formatMenit(Math.ceil(summary.pauseTime / 60))}</span></div>`;
    resumeHtml += '</div>';

    let formHtml = '';
    if (isOnline) {
        formHtml += `<div class="input-wrapper"><span class="input-label">BIAYA APLIKASI</span><div class="input-field-container"><input type="number" class="input-field" id="popup-E92" placeholder="namanya aja rahasia.." inputmode="numeric"><span class="input-unit">Rp</span></div></div>`;
        if (isPenumpang) {
            formHtml += `<div class="popup-divider"></div><div class="input-section-label">PENJEMPUTAN</div><div class="input-note">* otomatis terisi max jemput, bisa diubah</div>
            <div class="input-dual">
                <div class="input-field-container"><input type="number" class="input-field" id="popup-E78" value="${maxJemput.distance || 2}" placeholder="jarak" inputmode="decimal" step="0.1"><span class="input-unit">km</span></div>
                <div class="input-field-container"><input type="number" class="input-field" id="popup-E80" value="${maxJemput.time || 15}" placeholder="waktu" inputmode="numeric"><span class="input-unit">mnt</span></div>
            </div>`;
        }
    } else if (isOfflineMode) {
        const hasAdditional = offlineAdditionalData.E100 > 0 || offlineAdditionalData.E102 > 0 || offlineAdditionalData.E104 > 0;
        if (hasAdditional) {
            formHtml += '<div class="popup-divider"></div><div class="input-section-label">BIAYA TAMBAHAN</div>';
            if (offlineAdditionalData.E100 > 0) formHtml += `<div class="detail-row"><span>Parkir</span><span>${formatRupiah(offlineAdditionalData.E100)}</span></div>`;
            if (offlineAdditionalData.E102 > 0) formHtml += `<div class="detail-row"><span>Tol</span><span>${formatRupiah(offlineAdditionalData.E102)}</span></div>`;
            if (offlineAdditionalData.E104 > 0) formHtml += `<div class="detail-row"><span>Lainnya</span><span>${formatRupiah(offlineAdditionalData.E104)}</span></div>`;
        }
    }

    container.innerHTML = resumeHtml + formHtml;

    const btnContainer = document.createElement('div');
    btnContainer.className = 'popup-footer';
    btnContainer.style.cssText = 'display:flex;gap:8px;padding:12px;border-top:1px solid var(--border);';

    const btnManual = document.createElement('button');
    btnManual.className = 'btn btn-outline';
    btnManual.textContent = 'UBAH MANUAL';
    btnManual.addEventListener('click', () => {
        goToRealityManual(isPenumpang, isOnline);
    });

    const btnHitung = document.createElement('button');
    btnHitung.className = 'btn btn-primary';
    btnHitung.textContent = 'HITUNG';
    btnHitung.addEventListener('click', () => {
        finalizeTracking(isOnline, isPenumpang);
    });

    btnContainer.appendChild(btnManual);
    btnContainer.appendChild(btnHitung);
    container.appendChild(btnContainer);

    // Opsi popup: reset slide saat ditutup (tanpa aksi)
    container._popupOptions = {
        title: 'SELESAI TRACKING',
        showActions: false,
        showCloseButton: true,
        closeOnOverlay: false,
        onClose: () => {
            // Reset slide ke kiri
            if (typeof updateFooter === 'function') {
                updateFooter();
            }
            if (window.__trackingResetSlide) {
                delete window.__trackingResetSlide;
            }
        }
    };

    return container;
}

function createOfflineBiayaTambahanContent() {
    const isMotor = vehicleData.E10 === 'Motor';

    const container = document.createElement('div');
    container.className = 'popup-biaya-tambahan';

    let tollHTML = '';
    if (!isMotor) {
        tollHTML = `<div class="input-wrapper">
            <span class="input-label">TOLL</span>
            <div class="input-field-container">
                <input type="number" class="input-field" id="popup-offline-E102" value="${offlineAdditionalData.E102 || ''}"
                    placeholder="" inputmode="numeric" autocomplete="off">
                <span class="input-unit">Rp</span>
            </div></div>`;
    }

    container.innerHTML = `
        <div class="input-wrapper">
            <span class="input-label">PARKIR</span>
            <div class="input-field-container">
                <input type="number" class="input-field" id="popup-offline-E100" value="${offlineAdditionalData.E100 || ''}"
                    placeholder="" inputmode="numeric" autocomplete="off">
                <span class="input-unit">Rp</span>
            </div></div>
        ${tollHTML}
        <div class="input-wrapper">
            <span class="input-label">LAINNYA</span>
            <div class="input-field-container">
                <input type="number" class="input-field" id="popup-offline-E104" value="${offlineAdditionalData.E104 || ''}"
                    placeholder="" inputmode="numeric" autocomplete="off">
                <span class="input-unit">Rp</span>
            </div></div>
    `;

    container._popupOptions = {
        title: 'BIAYA TAMBAHAN',
        showCloseButton: true,
        closeOnOverlay: true,
        showActions: true,
        buttons: [
            {
                text: `${ICON.CANCEL} BATAL`,
                type: 'outline',
                onClick: () => {
                    Router.navigateTo({ popup: 0 });
                }
            },
            {
                text: `${ICON.SAVE} SIMPAN`,
                type: 'primary',
                onClick: () => {
                    const e100 = parseNumber(document.getElementById('popup-offline-E100')?.value || '');
                    const e104 = parseNumber(document.getElementById('popup-offline-E104')?.value || '');
                    offlineAdditionalData.E100 = e100 || null;
                    offlineAdditionalData.E104 = e104 || null;
                    StateManager.updateInput('E100', offlineAdditionalData.E100);
                    StateManager.updateInput('E104', offlineAdditionalData.E104);

                    if (!isMotor) {
                        const e102 = parseNumber(document.getElementById('popup-offline-E102')?.value || '');
                        offlineAdditionalData.E102 = e102 || null;
                        StateManager.updateInput('E102', offlineAdditionalData.E102);
                    } else {
                        offlineAdditionalData.E102 = null;
                        StateManager.updateInput('E102', null);
                    }

                    StateManager.set('tracking.offlineAdditionalData', { ...offlineAdditionalData });
                    renderTripSummaryCard();
                    Router.navigateTo({ popup: 0 });
                }
            }
        ]
    };

    return container;
}

function createWarningPopupContent() {
    /**
     * Membersihkan nomor untuk tautan tel:
     * - Hanya mengizinkan digit dan tanda '+' di awal.
     * - Contoh: "+62 812-3456-7890" → "+6281234567890"
     */
    const cleanTel = (num) => {
        if (!num) return '';
        // Cari tanda '+' di awal (opsional), lalu ambil semua digit setelahnya
        const match = num.match(/^(\+?)\D*(\d[\d\s\-\(\)]*)$/);
        if (!match) {
            // Fallback: buang semua karakter non-digit
            return num.replace(/\D/g, '');
        }
        return match[1] + match[2].replace(/\D/g, '');
    };

    /**
     * Membersihkan nomor untuk tautan WhatsApp (format internasional tanpa '+').
     * - Buang semua non-digit.
     * - Jika dimulai dengan '0', ganti dengan '62' (kode Indonesia).
     * - Jika dimulai dengan '+', buang tanda plus.
     */
    const cleanWA = (num) => {
        if (!num) return '';
        let cleaned = num.replace(/\D/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '62' + cleaned.substring(1);
        }
        if (cleaned.startsWith('+')) {
            cleaned = cleaned.substring(1);
        }
        return cleaned;
    };

    const emergencyContacts = StorageManager.getEmergencyContacts();
    const kerabat = emergencyContacts.kerabat || '';
    const darurat = emergencyContacts.darurat || '112';
    const ambulance = emergencyContacts.ambulance || '118';
    const polisi = emergencyContacts.polisi || '110';

    // Bersihkan setiap nomor
    const kerabatClean = cleanWA(kerabat);
    const daruratClean = cleanTel(darurat);
    const ambulanceClean = cleanTel(ambulance);
    const polisiClean = cleanTel(polisi);

    const container = document.createElement('div');
    container.className = 'popup-warning-content';

    // HTML struktur popup
    container.innerHTML = `
        <p style="font-size: var(--text-xs); color: var(--text-secondary); margin-bottom: 16px; line-height: 1.6;">
            Ini adalah cara yg sama dan dilakukan oleh aplikasi untuk melindungi driver/penumpang:
        </p>
        <ol style="padding-left: 1.5em; margin-bottom: 16px; line-height: 1.6; font-size: var(--text-xs); color: var(--text-secondary);">
            <li>Simpan identitas dan kontak darurat di tempat aman tapi mudah ditemukan.</li>
            <li>Beli asuransi.</li>
            <li>Simpan kontak darurat.</li>
            <li>Share live lokasi (WA) anda kepada kerabat terpercaya.</li>
        </ol>
        <div style="display: flex; flex-direction: column; gap: 8px;">
            <!-- Baris WA Kerabat -->
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: var(--text-xs);">WA KERABAT</span>
                ${kerabatClean ? 
                    `<a href="https://wa.me/${kerabatClean}" target="_blank" rel="noopener noreferrer" 
                        class="btn btn-sm btn-success" style="width: 90px; text-align: center; text-decoration: none; font-size: var(--text-xs);">HUBUNGI</a>` :
                    `<button class="btn btn-sm btn-outline" style="width: 90px; font-size: var(--text-xs);" disabled>SIMPAN</button>`
                }
            </div>
            <!-- Baris Kontak Darurat -->
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: var(--text-xs);">KONTAK DARURAT</span>
                <a href="tel:${daruratClean}" class="btn btn-sm btn-danger" style="width: 90px; text-align: center; text-decoration: none; font-size: var(--text-xs);">${darurat}</a>
            </div>
            <!-- Baris Ambulance -->
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: var(--text-xs);">AMBULANCE</span>
                <a href="tel:${ambulanceClean}" class="btn btn-sm btn-info" style="width: 90px; text-align: center; text-decoration: none; font-size: var(--text-xs);">${ambulance}</a>
            </div>
            <!-- Baris Polisi -->
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: var(--text-xs);">POLISI</span>
                <a href="tel:${polisiClean}" class="btn btn-sm" style="width: 90px; text-align: center; text-decoration: none; font-size: var(--text-xs); background-color: #8B7355; color: white; border-color: #8B7355;">${polisi}</a>
            </div>
        </div>
    `;

    if (!kerabat) {
        const simpanBtn = container.querySelector('.btn-outline[disabled]');
        if (simpanBtn) {
            simpanBtn.addEventListener('click', () => {
                ThemeManager?.showToast('Simpan kontak di Pengaturan', 'info');
            });
        }
    }

    container._popupOptions = {
        title: 'Peringatan',
        showActions: false,
        showCloseButton: true,
        closeOnOverlay: true,
        buttons: [
            { text: 'MENGERTI', type: 'primary', action: 'confirm' }
        ]
    };

    return container;
}

// =============================================================================
// 12. FINALISASI & PEMBATALAN
// =============================================================================

function emergencyStop() {
    if (calculate) { calculate.stop(); calculate = null; }
    GPS.stop();
    stopClockTimer();
    stopSound();
    if (beepAudioCtx) {
        beepAudioCtx.close();
        beepAudioCtx = null;
    }
if (window.__nativeBG && typeof window.__nativeBG.stop === 'function') {
    window.__nativeBG.stop();
}
}

async function finalizeTracking(isOnline, isPenumpang) {
    window.log.info('[Tracking ' + F_V + '] (11) finalizeTracking()');

    if (!snapshotEngineData || !calculate) return;

    const additionalData = {};
    if (isOnline) {
        const e92 = parsePopupInput('popup-E92', 'E92');
        if (e92 !== null) additionalData.E92 = e92;
        if (isPenumpang) {
            const e78 = parsePopupInput('popup-E78', 'E78');
            const e80 = parsePopupInput('popup-E80', 'E80');
            if (e78 !== null) additionalData.E78 = e78;
            if (e80 !== null) additionalData.E80 = e80;
        }
    } else if (isOfflineMode) {
        if (offlineAdditionalData.E100) additionalData.E100 = offlineAdditionalData.E100;
        if (offlineAdditionalData.E102) additionalData.E102 = offlineAdditionalData.E102;
        if (offlineAdditionalData.E104) additionalData.E104 = offlineAdditionalData.E104;
    }

    if (calcMode === 'operational') {
        additionalData.shareCount = shareCount;
        additionalData.setLimit = setLimit;
    }

    let realityResult;
    try {
        realityResult = calculate.finalize(vehicleData, additionalData);
    } catch (e) {
        ThemeManager?.showToast('Gagal menghitung hasil', 'error');
        return;
    }

    if (StateManager) {
        const finalInput = {
            ...vehicleData,
            ...snapshotEngineData,
            ...additionalData
        };
        StateManager.set('input', finalInput);
        StateManager.set('realityResult', realityResult);
        StateManager.set('trackingData', snapshotCompactData);
        window.log.info('[Tracking ' + F_V + '] (12) finalizeTracking: hasil disimpan ke state');
    }

    LocationPicker.clearSavedPolyline();

    emergencyStop();
    _trackingModule = null;
    window.trackingModule = null;

    if (window.Cache) {
        window.Cache.invalidate('tracking');
    }

    await Router.navigateTo({ popup: 0 });
    Router.navigateTo({ target: 'result' });
}

async function goToRealityManual(isPenumpang, isOnline) {
    window.log.info('[Tracking ' + F_V + '] (13) goToRealityManual()');

    if (!snapshotEngineData || !calculate) return;

    const data = { ...snapshotEngineData };
    if (isPenumpang && isOnline) {
        const e78 = parsePopupInput('popup-E78', 'E78');
        const e80 = parsePopupInput('popup-E80', 'E80');
        if (e78 !== null) data.E78 = e78;
        if (e80 !== null) data.E80 = e80;
    }

    if (StateManager) {
        StateManager.batchUpdateInput({
            E78: data.E78 ?? data.pickupDistance,
            E80: data.E80 ?? data.pickupTime,
            E82: data.E82 ?? data.dropoffDistance,
            E84: data.E84 ?? data.dropoffTime
        });
        
        if (isOfflineMode) {
            StateManager.updateInput('E100', offlineAdditionalData.E100 ?? null);
            StateManager.updateInput('E102', offlineAdditionalData.E102 ?? null);
            StateManager.updateInput('E104', offlineAdditionalData.E104 ?? null);
        }
        
        StateManager.set('trackingData', null);
        StateManager.set('realityResult', null);
        window.log.info('[Tracking ' + F_V + '] (14) goToRealityManual: data realitas diset ulang');
    }

    emergencyStop();
    _trackingModule = null;
    window.trackingModule = null;

    if (window.Cache) {
        window.Cache.invalidate('tracking');
    }

    const target = calcMode === 'operational' ? 'home' : 'reality';
    await Router.navigateTo({ popup: 0 });
    Router.navigateTo({ target });
}

function parsePopupInput(id, cell) {
    const el = document.getElementById(id);
    if (!el) return null;
    const val = el.value.trim();
    if (!val) return null;
    const num = parseNumber(val);
    if (isNaN(num)) return null;
    return validateCell(cell, num) ?? num;
}

// =============================================================================
// 13. FOOTER & HEADER
// =============================================================================

function updateFooterForIdle() {
    const footerContainer = document.getElementById('app-footer');
    if (!footerContainer || !FooterManager) return;

    const targetBack = calcMode === 'operational' ? 'home' : 'reality';

    const callbacks = {
        onClose: () => Router.navigateTo({ target: targetBack }),
        onStart: () => Router.navigateTo({ target: 'trackingactive' })
    };

    const footer = FooterManager.create('layoutC', {
        frame1: { type: 'icon', content: FooterManager.createIconButton(ICON.CLOSE, callbacks.onClose, 'Tutup') },
        frame2: { type: 'icon', content: FooterManager.createIconButton(ICON.PAUSE, null, 'Pause') },
        frame3: { type: 'flex', content: FooterManager.createSlideContent('MULAI', '', callbacks.onStart) }
    });

    if (footer) {
        const pauseBtn = footer.querySelectorAll('.footer-icon')[1];
        if (pauseBtn) pauseBtn.disabled = true;
    }

    footerContainer.innerHTML = '';
    if (footer) footerContainer.appendChild(footer);
}

function updateFooterForActive() {
    const footerContainer = document.getElementById('app-footer');
    if (!footerContainer || !FooterManager) return;

    const stage = currentStage;

    const callbacks = {
        onStop: () => Router.navigateTo({ target: 'popup14' }),
        onPause: () => {
            if (calculate) {
                calculate.pause();
                GPS.stop();
                stopClockTimer();
                goToStage('paused');
            }
        },
        onResume: () => {
            const resumeStage = previousStage || 'pickup';
            if (calculate) {
                calculate.resume();
                GPS.start(handleGPSPosition, handleGPSError);
                startClockTimer();
            }
            goToStage(resumeStage);
        },
        
onAngkut: () => {
    if (calculate) {
        calculate.switchToDropoff();
        const pos = currentPosition || (calculate.getLastPosition && calculate.getLastPosition());
        if (pos) {
            MapManager?.addMarker(pos.lat, pos.lng, 'pickup', { replace: false });
        } else {
            // Fallback: ambil posisi terakhir dari GPS secara paksa
            GPS.getCurrentPosition((p) => {
                if (p && MapManager) {
                    MapManager.addMarker(p.lat, p.lng, 'pickup', { replace: false });
                }
            });
        }
    }
    goToStage('dropoff');
},

        onSelesai: () => {
            if (currentPosition) {
                MapManager?.addMarker(currentPosition.lat, currentPosition.lng, 'finish', { replace: false });
            }
            // Simpan fungsi reset untuk dipanggil saat popup ditutup
            window.__trackingResetSlide = () => {
                if (typeof updateFooter === 'function') {
                    updateFooter();
                }
            };
            Router.navigateTo({ target: 'popup15' });
        }
    };

    let f1, f2, f3;

    switch (stage) {
        case 'paused':
            f1 = { type: 'icon', content: FooterManager.createIconButton(ICON.STOP, callbacks.onStop, 'Stop') };
            f2 = { type: 'icon', content: FooterManager.createIconButton(ICON.PLAY, callbacks.onResume, 'Lanjutkan') };
            f3 = { type: 'flex', content: FooterManager.createSlideContent('LANJUT', '', callbacks.onResume) };
            break;
        case 'pickup':
            f1 = { type: 'icon', content: FooterManager.createIconButton(ICON.STOP, callbacks.onStop, 'Stop') };
            f2 = { type: 'icon', content: FooterManager.createIconButton(ICON.PAUSE, callbacks.onPause, 'Pause') };
            f3 = { type: 'flex', content: FooterManager.createSlideContent('ANGKUT', '', callbacks.onAngkut) };
            break;
        case 'dropoff':
        case 'operational':
            f1 = { type: 'icon', content: FooterManager.createIconButton(ICON.STOP, callbacks.onStop, 'Stop') };
            f2 = { type: 'icon', content: FooterManager.createIconButton(ICON.PAUSE, callbacks.onPause, 'Pause') };
            f3 = { type: 'flex', content: FooterManager.createSlideContent('SELESAI', '', callbacks.onSelesai) };
            break;
        default:
            f1 = { type: 'icon', content: FooterManager.createIconButton(ICON.STOP, callbacks.onStop, 'Stop') };
            f2 = { type: 'icon', content: FooterManager.createIconButton(ICON.PAUSE, callbacks.onPause, 'Pause') };
            f3 = { type: 'flex', content: FooterManager.createSlideContent('SELESAI', '', callbacks.onSelesai) };
    }

    const footer = FooterManager.create('layoutC', { frame1: f1, frame2: f2, frame3: f3 });
    footerContainer.innerHTML = '';
    if (footer) footerContainer.appendChild(footer);
}

function updateFooter() {
    updateFooterForActive();
}

function updateHeader() {
    const headerContainer = document.getElementById('app-header');
    if (!headerContainer || !HeaderManager) return;
    if (currentHeader) { HeaderManager.destroy(currentHeader); }
    const landingText = window.APP_CONFIG?.landingLink || 'linktr.ee/KUPASTARIF';
    const header = HeaderManager.create('landing', { landingText });
    headerContainer.innerHTML = '';
    if (header) { headerContainer.appendChild(header); currentHeader = header; }
    else { currentHeader = null; }
}

// =============================================================================
// 14. BUILD HTML
// =============================================================================

function buildHTML() {
    return `
    <div class="page-container tracking-page">
        <div class="tracking-map-section">
            <div class="tracking-map-wrapper">
                <div id="tracking-map" class="tracking-map" style="height: 100%;"></div>
            </div>
            <div class="tracking-stats">
                <div class="tracking-stat-item"><span id="tracking-distance">-- km</span><span class="stat-label">JARAK</span></div>
                <div class="tracking-stat-item"><span id="tracking-time">--:--</span><span class="stat-label">WAKTU</span></div>
            </div>
        </div>
        <div class="tracking-live-income card">
            <div id="live-income-container" class="live-income-content"></div>
        </div>
        <div id="operational-extra-card" class="card" style="display: none;">
            <div class="card-header"><span class="card-title">${ICON.GEAR} SHARE & LIMIT</span></div>
            <div class="card-content">
                <div class="input-wrapper">
                    <span class="input-label">Share Cost</span>
                    <div class="input-field-container" style="padding: 0;">
                        <div style="width: 100%; max-width: 200px; margin: 0 auto; padding: var(--space-sm);">
                            <input type="range" id="share-slider" min="1" max="6" value="1" step="1" style="width: 100%;">
                            <div class="text-muted text-xs text-center" id="share-value">1 orang</div>
                        </div>
                    </div>
                </div>
                <div class="input-wrapper">
                    <span class="input-label">Set Limit</span>
                    <div class="input-field-container">
                        <input type="number" class="input-field" id="limit-input" min="0" placeholder="0" value="0" inputmode="numeric">
                        <span class="input-unit">Rp</span>
                    </div>
                </div>
                <div id="share-limit-result" class="mt-sm"></div>
            </div>
        </div>
        <div class="card trip-summary-card" id="trip-summary-card"></div>
    </div>`;
}

// =============================================================================
// 15. RENDER IDLE
// =============================================================================

async function renderIdle(params, context = {}) {
    const content = document.getElementById('app-content');
    if (!content) return;

    isDestroyed = false;
    snapshotEngineData = null;
    driverExpanded = false;
    appExpanded = false;
    shareCount = 1;
    setLimit = 0;
    offlineAdditionalData = {};
    soundEnabled = true;
    stopSound();
    
    StateManager.updateInput('E100', null);
    StateManager.updateInput('E102', null);
    StateManager.updateInput('E104', null);
    StateManager.set('tracking.offlineAdditionalData', null);
    offlineAdditionalData = { E100: null, E102: null, E104: null };

    liveIncome = { driver: 0, app: 0, passengerPayment: 0, passengerBill: 0, bbm: 0, maintenance: 0, total: 0 };
    lastUpdateDistance = 0;
    lastUpdateTime = 0;
    updateScheduled = false;
    if (updateTimer) { clearTimeout(updateTimer); updateTimer = null; }

    const input = StateManager.get('input') || {};
    vehicleData = { ...input };
    role = vehicleData.E12 || 'Driver';
    calcMode = StateManager.get('calcMode') || 'standard';
    estimateResult = StateManager.get('estimateResult');

    isOfflineMode = calcMode === 'standard' && vehicleData.E36 === 'offline';

    const savedOfflineData = StateManager.get('tracking.offlineAdditionalData');
    if (savedOfflineData) {
        offlineAdditionalData = { ...savedOfflineData };
    }

    if (calculate) {
        maxJemput.distance = calculate.getMaxPickupDistance();
        maxJemput.time = calculate.getMaxPickupTime();
    } else {
        maxJemput.distance = 2;
        maxJemput.time = 15;
    }

    currentStage = 'idle';
    previousStage = null;

    window.log.info('[Tracking ' + F_V + '] (15) renderIdle() - mode: ' + calcMode + ', role: ' + role + ', offline: ' + isOfflineMode);

    if (calculate) {
        calculate.stop();
        calculate = null;
    }
    GPS.stop();
    stopClockTimer();
    stopSound();

    content.innerHTML = buildHTML();
    updateHeader();
    updateFooterForIdle();
    renderLiveIncome();
    renderTripSummaryCard();

    const extraCard = document.getElementById('operational-extra-card');
    if (extraCard) {
        extraCard.style.display = calcMode === 'operational' ? '' : 'none';
    }

    if (!mapReady) {
        calculate = new Calculate({ role, trackingMode: calcMode, vehicleData, estimateResult });
        window.__trackingCalculate = calculate;   // <-- TAMBAHKAN
        calculate.setCallbacks({
            onStatusChange: () => {},
            onJump: (data) => {
                ThemeManager?.showToast('Loncatan jarak terdeteksi', 'warning', 5000);
            }
        });
        setTimeout(() => {
            requestGPSPermission();
            initMap();
        }, 100);
    } else {
        requestGPSPermission();
        if (isOfflineMode) drawPlannedRoute();
    }

    if (calcMode === 'operational') {
        initShareLimitUI();
    }

    _trackingModule = { emergencyStop };
    window.trackingModule = _trackingModule;

    window.log.info('[Tracking ' + F_V + '] (16) renderIdle() selesai');
}

// =============================================================================
// 16. RENDER ACTIVE
// =============================================================================

async function renderActive(params, context = {}) {
    const content = document.getElementById('app-content');
    if (!content) return;

    isDestroyed = false;
    snapshotEngineData = null;
    driverExpanded = false;
    appExpanded = false;
    shareCount = 1;
    setLimit = 0;
    offlineAdditionalData = {};
    soundEnabled = true;
    stopSound();

    liveIncome = { driver: 0, app: 0, passengerPayment: 0, passengerBill: 0, bbm: 0, maintenance: 0, total: 0 };
    lastUpdateDistance = 0;
    lastUpdateTime = 0;
    updateScheduled = false;
    if (updateTimer) { clearTimeout(updateTimer); updateTimer = null; }

    const input = StateManager.get('input') || {};
    vehicleData = { ...input };
    role = vehicleData.E12 || 'Driver';
    calcMode = StateManager.get('calcMode') || 'standard';
    estimateResult = StateManager.get('estimateResult');

    isOfflineMode = calcMode === 'standard' && vehicleData.E36 === 'offline';

    const savedOfflineData = StateManager.get('tracking.offlineAdditionalData');
    if (savedOfflineData) {
        offlineAdditionalData = { ...savedOfflineData };
    }

    if (calculate) {
        maxJemput.distance = calculate.getMaxPickupDistance();
        maxJemput.time = calculate.getMaxPickupTime();
    } else {
        maxJemput.distance = 2;
        maxJemput.time = 15;
    }

    let targetStage;
    if (calcMode === 'operational') targetStage = 'operational';
    else if (role === 'Penumpang') targetStage = 'dropoff';
    else targetStage = 'pickup';

    currentStage = targetStage;
    previousStage = null;

    window.log.info('[Tracking ' + F_V + '] (17) renderActive() - mode: ' + calcMode + ', role: ' + role + ', stage: ' + targetStage + ', offline: ' + isOfflineMode);

    if (calculate) {
        calculate.stop();
        calculate = null;
    }
    GPS.stop();
    stopClockTimer();
    stopSound();

    calculate = new Calculate({ role, trackingMode: calcMode, vehicleData, estimateResult });
    window.__trackingCalculate = calculate;   // <-- TAMBAHKAN
    calculate.setCallbacks({
        onStatusChange: () => {
            updateFooterForActive();
            updateDistanceTimeDisplay();
            updateStatusText();
        },
        onJump: (data) => {
            ThemeManager?.showToast('Loncatan jarak terdeteksi', 'warning', 5000);
        }
    });

    calculate.start();
if (window.__nativeBG && typeof window.__nativeBG.start === 'function') {
    window.__nativeBG.start();
}
    GPS.start(handleGPSPosition, handleGPSError);
    startClockTimer();

    content.innerHTML = buildHTML();
    updateHeader();
    updateFooterForActive();
    renderLiveIncome();
    renderTripSummaryCard();

    const extraCard = document.getElementById('operational-extra-card');
    if (extraCard) {
        extraCard.style.display = calcMode === 'operational' ? '' : 'none';
    }

    setTimeout(() => {
        requestGPSPermission();
        initMap();
    }, 100);

    StateManager.set('tracking.currentStage', currentStage);

    updateLiveIncome();

    if (calcMode === 'operational') {
        initShareLimitUI();
    }

    _trackingModule = { emergencyStop };
    window.trackingModule = _trackingModule;

    window.log.info('[Tracking ' + F_V + '] (18) renderActive() selesai');
}

// =============================================================================
// 17. POLYLINE RENCANA (PICKER)
// =============================================================================

function drawPlannedRoute() {
    if (!isOfflineMode) {
        window.log.info('[Tracking ' + F_V + '] (19) drawPlannedRoute: bukan mode offline, lewati');
        return;
    }

    const polylineData = LocationPicker.getSavedPolyline();
    if (!polylineData || !Array.isArray(polylineData.coordinates) || polylineData.coordinates.length < 2) {
        window.log.info('[Tracking ' + F_V + '] (20) drawPlannedRoute: tidak ada polyline valid');
        return;
    }

    MapManager.addPolyline(polylineData.coordinates, 'planned', {
        color: '#9CA3AF',
        weight: 2,
        opacity: 0.6
    });

    window.log.info('[Tracking ' + F_V + '] (21) drawPlannedRoute: polyline rencana ditambahkan ke peta');
}

// =============================================================================
// 18. INISIALISASI SHARE COST & SET LIMIT UI
// =============================================================================

function initShareLimitUI() {
    const slider = document.getElementById('share-slider');
    const limitInput = document.getElementById('limit-input');
    if (!slider || !limitInput) return;

    slider.max = vehicleData.E10 === 'Mobil' ? 6 : 2;
    slider.value = shareCount;
    limitInput.value = setLimit;

    document.getElementById('share-value').textContent = shareCount + ' orang';

    const debouncedUpdate = debounce(() => {
        shareCount = parseInt(slider.value) || 1;
        setLimit = parseInt(limitInput.value) || 0;
        document.getElementById('share-value').textContent = shareCount + ' orang';
        updateLiveIncome({ shareCount, setLimit });
    }, 500);

    slider.addEventListener('input', () => {
        document.getElementById('share-value').textContent = slider.value + ' orang';
        debouncedUpdate();
    });

    limitInput.addEventListener('input', debouncedUpdate);

    renderShareLimitResult();
}

// =============================================================================
// 19. DESTROY
// =============================================================================

function destroy() {
    window.log.info('[Tracking ' + F_V + '] (22) destroy()');
    isDestroyed = true;
    _trackingModule = null;
    window.trackingModule = null;
    if (updateTimer) { clearTimeout(updateTimer); updateTimer = null; }
    updateScheduled = false;
    stopClockTimer();
    GPS.stop();
    calculate?.stop();
    calculate = null;
    stopSound();
    if (beepAudioCtx) {
        beepAudioCtx.close();
        beepAudioCtx = null;
    }
    if (MapManager) MapManager.destroy();
    mapReady = false;
    if (window.Cache) {
        window.Cache.invalidate('tracking');
    }
    
if (window.__nativeBG && typeof window.__nativeBG.stop === 'function') {
    window.__nativeBG.stop();
}
    currentPosition = null;
    isOfflineMode = false;
    offlineAdditionalData = {};
    StateManager.set('tracking.offlineAdditionalData', null);

    if (currentHeader) { HeaderManager.destroy(currentHeader); currentHeader = null; }
}

// =============================================================================
// 20. FORCE STOP TRACKING
// =============================================================================

window.forceStopTracking = function() {
    window.log.info('[Tracking ' + F_V + '] (23) forceStopTracking() dipanggil');
    if (typeof GPS !== 'undefined') GPS.stop();

    const tm = window.trackingModule || _trackingModule;
    if (tm && typeof tm.emergencyStop === 'function') {
        tm.emergencyStop();
    }

    if (typeof MapManager !== 'undefined' && MapManager.isReady()) {
        MapManager.destroy();
    }

    _trackingModule = null;
    window.trackingModule = null;
};

// =============================================================================
// 21. REGISTRASI POPUP CUSTOM
// =============================================================================

PopupManager.register(14, () => createCancelPopupContent());
PopupManager.register(15, () => createSelesaiPopupContent());
PopupManager.register(18, () => createWarningPopupContent());
PopupManager.register(19, () => createOfflineBiayaTambahanContent());

// =============================================================================
// 22. EKSPOR
// =============================================================================

export const PageTrackingidle = {
    render: renderIdle,
    destroy
};

export const PageTrackingactive = {
    render: renderActive,
    destroy
};

window.log.info('[Tracking ' + F_V + '] (24) PageTrackingidle & PageTrackingactive dimuat (rev3: speaker & perbaikan slide)');

// ================================= CHANGELOG =================================
// 2.0a-rev0 : Inisiasi awal.
// 2.0a-rev1 : Hapus getIcon, ikon lokal.
// 2.0a-rev2 : Ikon inline dihapus, tambah LOCATION, MAP, GEAR.
// 2.0a-rev3 : Tambah speaker notifikasi suara (2800 Hz, 250 ms), perbaikan
//             slide selesai (reset saat popup ditutup), manajemen suara
//             berdasarkan kategori driver, ikon speaker lokal.
//
// ================================ End Of File ================================