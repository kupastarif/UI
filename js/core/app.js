/**
 * =================================================================================
 * FILE         : /js/core/app.js
 * FILE VERSION : 2.0a-rev0
 * APP VERSION  : 2.0a-beta
 */
'use strict';

const F_V = '2.0a-rev0';

import { StateManager, StateEvents } from './state.js';
import { StorageManager } from './storage.js';
import { PreferencesManager } from './preferences.js';

if (!window.log) {
    window.log = {
        info: function() {},
        warn: function() {},
        error: function() { console.error.apply(console, arguments); }
    };
}

const CONFIG = window.APP_CONFIG || {
    timeout: 10000,
    minLoadingTime: 3000
};

const MIN_ENGINE_VERSION = '1.0.0-beta';

const loadingScreen = document.getElementById('loading-screen');
const progressBar = document.getElementById('loading-progress-bar');
const loadingText = document.getElementById('loading-text');
const reloadButton = document.getElementById('loading-reload-button');
const appContainer = document.getElementById('app');
const loadingOverlay = document.getElementById('loading-overlay');

let isInitialized = false;
let loadingStartTime = 0;
let progressAnimationFrame = null;
let timeoutTimer = null;
let minLoadingTimer = null;

function startLoading() {
    window.log.info('[App ' + F_V + '] (1) startLoading() dipanggil');
    loadingStartTime = Date.now();

    if (loadingScreen) loadingScreen.classList.remove('hidden');
    if (appContainer) appContainer.classList.add('hidden');
    if (reloadButton) reloadButton.classList.add('hidden');

    startProgressBar();
    startTimeout();

    window.log.info('[App ' + F_V + '] (2) Loading screen dimulai');
}

function startProgressBar() {
    if (!progressBar) {
        window.log.warn('[App ' + F_V + '] (3) progressBar tidak ditemukan');
        return;
    }

    progressBar.style.width = '0%';
    progressBar.classList.remove('error');

    const startTime = Date.now();
    const duration = CONFIG.minLoadingTime || 3000;
    const targetProgress = 90;

    function updateProgress() {
        const elapsed = Date.now() - startTime;
        const progress = (elapsed / duration) * targetProgress;

        if (progress >= targetProgress) {
            progressBar.style.width = targetProgress + '%';
            progressAnimationFrame = null;
            return;
        }

        progressBar.style.width = progress + '%';
        progressAnimationFrame = requestAnimationFrame(updateProgress);
    }

    if (progressAnimationFrame) {
        cancelAnimationFrame(progressAnimationFrame);
        progressAnimationFrame = null;
    }

    progressAnimationFrame = requestAnimationFrame(updateProgress);
}

function startTimeout() {
    const timeoutDuration = CONFIG.timeout || 10000;

    timeoutTimer = setTimeout(function() {
        window.log.error('[App ' + F_V + '] (4) Loading timeout setelah ' + timeoutDuration + 'ms');

        if (progressAnimationFrame) {
            cancelAnimationFrame(progressAnimationFrame);
            progressAnimationFrame = null;
        }

        showErrorScreen('Waktu loading terlalu lama. Periksa koneksi internet Anda.', true);
    }, timeoutDuration);
}

function finishLoading() {
    const elapsed = Date.now() - loadingStartTime;
    const minTime = CONFIG.minLoadingTime || 3000;

    function completeLoading() {
        if (timeoutTimer) { clearTimeout(timeoutTimer); timeoutTimer = null; }
        if (progressAnimationFrame) { cancelAnimationFrame(progressAnimationFrame); progressAnimationFrame = null; }
        if (minLoadingTimer) { clearTimeout(minLoadingTimer); minLoadingTimer = null; }

        if (progressBar) progressBar.style.width = '100%';

        if (loadingScreen) {
            loadingScreen.classList.add('loading-fade-out');
            setTimeout(function() {
                loadingScreen.classList.add('hidden');
            }, 300);
        }

        if (appContainer) appContainer.classList.remove('hidden');

        if (StateManager) {
            StateManager.set('isAppReady', true);
            StateManager.set('isLoading', false);
        }

        window.log.info('[App ' + F_V + '] (5) Loading selesai dalam ' + elapsed + 'ms');
    }

    if (elapsed < minTime) {
        minLoadingTimer = setTimeout(completeLoading, minTime - elapsed);
    } else {
        completeLoading();
    }
}

function showErrorScreen(message, canReload) {
    if (canReload === undefined) canReload = true;

    window.log.error('[App ' + F_V + '] (6) Error screen ditampilkan: ' + message);

    if (timeoutTimer) { clearTimeout(timeoutTimer); timeoutTimer = null; }
    if (progressAnimationFrame) { cancelAnimationFrame(progressAnimationFrame); progressAnimationFrame = null; }
    if (minLoadingTimer) { clearTimeout(minLoadingTimer); minLoadingTimer = null; }

    if (progressBar) { progressBar.style.width = '0%'; progressBar.classList.add('error'); }
    if (loadingText) { loadingText.textContent = message; loadingText.classList.add('loading-text-error'); }
    if (reloadButton && canReload) reloadButton.classList.remove('hidden');
}

function reloadApp() {
    window.log.info('[App ' + F_V + '] (7) Reload aplikasi');
    if (window.Cache && typeof window.Cache.clear === 'function') {
        window.Cache.clear();
    }
    window.location.reload(true);
}

function checkEngine() {
    const engineRef = (window.Cache && window.Cache.Engine) ? window.Cache.Engine : window.Engine;

    if (!engineRef) {
        window.log.error('[App ' + F_V + '] (8) Engine tidak tersedia!');
        showErrorScreen('Engine tidak tersedia. Aplikasi tidak dapat berjalan.', true);
        return false;
    }

    const engineVersion = engineRef.ENGINE_VERSION || engineRef.VERSION;
    window.log.info('[App ' + F_V + '] (9) Engine ' + engineVersion + ' tersedia');

    if (!isVersionCompatible(engineVersion, MIN_ENGINE_VERSION)) {
        window.log.error('[App ' + F_V + '] (10) Engine version tidak kompatibel! Required: v' + MIN_ENGINE_VERSION + ', Found: ' + engineVersion);
        showErrorScreen('Engine ' + engineVersion + ' tidak kompatibel. Diperlukan v' + MIN_ENGINE_VERSION + '.', true);
        return false;
    }

    return true;
}

function isVersionCompatible(current, minimum) {
    function parseVersion(v) {
        const match = v.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9]+))?$/);
        if (!match) return null;
        return {
            major: parseInt(match[1], 10),
            minor: parseInt(match[2], 10),
            patch: parseInt(match[3], 10),
            tag: match[4] || ''
        };
    }

    const cur = parseVersion(current);
    const min = parseVersion(minimum);

    if (!cur || !min) {
        return current >= minimum;
    }

    if (cur.major !== min.major) return cur.major > min.major;
    if (cur.minor !== min.minor) return cur.minor > min.minor;
    if (cur.patch !== min.patch) return cur.patch > min.patch;
    return true;
}

function setupLoadingOverlayListener() {
    if (!StateEvents || !loadingOverlay) return;

    StateEvents.on('state:change', function(data) {
        if (data.key === 'isLoading') {
            if (data.value === true) {
                loadingOverlay.classList.remove('hidden');
            } else {
                loadingOverlay.classList.add('hidden');
            }
        }
    });

    window.log.info('[App ' + F_V + '] (11) Loading overlay listener siap');
}

async function initializeApp() {
    if (isInitialized) {
        window.log.warn('[App ' + F_V + '] (12) Aplikasi sudah diinisialisasi');
        return;
    }

    window.log.info('[App ' + F_V + '] (13) Memulai inisialisasi aplikasi v' + (window.APP_CONFIG?.version || '2.0a-beta'));
    startLoading();

    if (!checkEngine()) return;

    try {
        if (!StateManager) throw new Error('StateManager tidak tersedia');
        window.log.info('[App ' + F_V + '] (14) StateManager siap');

        setupLoadingOverlayListener();

        window.log.info('[App ' + F_V + '] (15) Preferensi akan dimuat oleh preferences.js');

        if (StorageManager) {
            const driverInfo = StorageManager.getDriverInfo();
            if (StateManager) {
                const prefs = StateManager.get('preferences') || {};
                prefs.driverInfo = driverInfo;
                StateManager.set('preferences', prefs);
            }
            window.log.info('[App ' + F_V + '] (16) Driver info disinkronkan');
        } else {
            window.log.warn('[App ' + F_V + '] (17) StorageManager tidak tersedia, driver info tidak disinkronkan');
        }

        window.log.info('[App ' + F_V + '] (18) Memuat Router...');
        const { Router } = await import('./router.js');
        await Router.init();

        finishLoading();
        isInitialized = true;

        window.log.info('[App ' + F_V + '] (19) Aplikasi v' + (window.APP_CONFIG?.version || '2.0a-beta') + ' siap digunakan! Engine ' + (window.Engine.ENGINE_VERSION || window.Engine.VERSION));

    } catch (error) {
        window.log.error('[App ' + F_V + '] (20) Gagal inisialisasi:', error);
        console.error(error);
        showErrorScreen('Gagal memulai aplikasi: ' + error.message, true);
    }
}

function handleGlobalError(event) {
    const error = event.error || event.reason || event;
    window.log.error('[App ' + F_V + '] (21) Global error:', error);

    if (isInitialized) {
        if (StateManager) {
            StateManager.addToast({
                message: 'Terjadi kesalahan: ' + (error.message || 'Unknown error'),
                type: 'error',
                duration: 5000
            });
        }
    } else {
        showErrorScreen('Terjadi kesalahan: ' + (error.message || 'Unknown error'), true);
    }
}

window.addEventListener('error', handleGlobalError);
window.addEventListener('unhandledrejection', handleGlobalError);

if (reloadButton) {
    reloadButton.addEventListener('click', function(e) {
        e.preventDefault();
        reloadApp();
    });
}

initializeApp();

export const App = {
    reload: reloadApp,
    version: (window.APP_CONFIG && window.APP_CONFIG.version) || '2.0a-beta',
    isReady: function() { return isInitialized; }
};

if (typeof window !== 'undefined') {
    window.App = App;
}

window.log.info('[App ' + F_V + '] (22) App core dimuat');

// ================================ End Of File ================================
