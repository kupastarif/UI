/**
 * =================================================================================
 * FILE         : /js/maps/gps.js
 * FILE VERSION : 2.0.0-rev4
 * APP VERSION  : 2.0.0
 * DATE         : 20 Juli 2026
 * @author      : gk
 *
 * DESCRIPTION  :
 *   Single Source of Truth (SSOT) untuk semua kebutuhan lokasi dan waktu.
 *   Mendukung web (navigator.geolocation) dan Android native
 *   (@capacitor-community/background-geolocation) dengan API yang sama.
 *   Menyediakan data posisi mentah, otoritas waktu UTC, deteksi zona waktu
 *   Indonesia (WIB/WITA/WIT), serta notifikasi background untuk Android.
 *
 *   [UPDATE] rev4: - Menghapus semua dynamic import.
 *                  - Mengakses plugin Capacitor langsung dari window.Capacitor.Plugins.
 *                  - Menggunakan window.__platform.isNative dari init.js.
 *                  - Menghapus fallback ke web di _startNative().
 *
 * =================================================================================
 */

'use strict';

// ==================== VERSI FILE ====================
const F_V = '2.0.0-rev4';

import { StateEvents } from '../core/state.js';

// =============================================================================
// KONSTANTA
// =============================================================================

const HIGH_ACCURACY = true;
const TIMEOUT = 10000;
const MAXIMUM_AGE = 0;
const RETRY_COUNT = 3;
const RETRY_DELAY = 5000;

const ERROR_CODES = {
    UNSUPPORTED: 'E-GPS-001',
    PERMISSION_DENIED: 'E-GPS-002',
    POSITION_UNAVAILABLE: 'E-GPS-003',
    TIMEOUT: 'E-GPS-004',
    NATIVE_INIT_FAIL: 'E-GPS-005',
    NATIVE_ERROR: 'E-GPS-006',
    KEEP_AWAKE_FAIL: 'E-GPS-007'
};

// Zona waktu Indonesia berdasarkan rentang longitude (perkiraan)
const ZONE_BOUNDARIES = [
    { zone: 'WIB', offset: 7, longMin: 95, longMax: 115 },
    { zone: 'WITA', offset: 8, longMin: 115, longMax: 130 },
    { zone: 'WIT', offset: 9, longMin: 130, longMax: 145 }
];

// =============================================================================
// STATE INTERNAL
// =============================================================================

// Helper untuk deteksi native menggunakan window.__platform yang diset di init.js
function _isNative() {
    return window.__platform ? window.__platform.isNative : false;
}

// State untuk web (navigator.geolocation)
let _watchId = null;
let _isTrackingWeb = false;
let _retryAttempts = 0;
let _retryTimer = null;
let _pageChangeHandler = null;

// State untuk native (Capacitor BackgroundGeolocation)
let _nativeWatcherId = null;
let _isNativeStarted = false;

// State untuk Wake Lock (SSOT)
let _keepAwakeActive = false;
let _wakeLockWeb = null;           // referensi ke navigator.wakeLock (Web)
let _keepAwakePluginActive = false; // true jika plugin keep-awake aktif (Android)

// Callbacks bersama
let _callbacks = { onPosition: null, onError: null };

// =============================================================================
// FUNGSI UTAMA YANG DIEKSPOR
// =============================================================================

/**
 * Memulai tracking lokasi.
 * @param {Function} onPosition - Callback menerima {lat, lng, accuracy, timestamp}
 * @param {Function} onError - Callback menerima {code, message}
 */
function start(onPosition, onError) {
    // Hentikan yang sedang berjalan untuk mencegah watcher ganda
    stop();

    _callbacks.onPosition = onPosition;
    _callbacks.onError = onError;

    // Aktifkan Wake Lock sebelum memulai GPS
    _activateKeepAwake();

    if (_isNative()) {
        _startNative();
    } else {
        _startWeb();
    }
}

/**
 * Menghentikan tracking lokasi dan menghapus watcher (notifikasi hilang di Android).
 * Juga menonaktifkan Wake Lock.
 */
function stop() {
    if (_isNative()) {
        _stopNative();
    } else {
        _stopWeb();
    }
    _callbacks.onPosition = null;
    _callbacks.onError = null;

    // Nonaktifkan Wake Lock setelah GPS berhenti
    _deactivateKeepAwake();
}

/**
 * Mendapatkan posisi sekali (tanpa watcher).
 * @param {Function} callback - (position|null, error|null)
 */
function getCurrentPosition(callback) {
    if (!isSupported()) {
        callback(null, { code: ERROR_CODES.UNSUPPORTED, message: 'Geolocation tidak didukung' });
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (position) => callback(_parsePosition(position), null),
        (error) => callback(null, _parseError(error)),
        { enableHighAccuracy: HIGH_ACCURACY, timeout: TIMEOUT, maximumAge: MAXIMUM_AGE }
    );
}

/**
 * Mengecek apakah geolocation didukung (web) atau native plugin tersedia.
 */
function isSupported() {
    if (_isNative()) {
        return true;
    }
    return 'geolocation' in navigator;
}

/**
 * Mengecek apakah tracking sedang aktif.
 */
function isActive() {
    if (_isNative()) {
        return _isNativeStarted;
    }
    return _isTrackingWeb;
}

/**
 * Mendapatkan waktu UTC dan zona waktu berdasarkan longitude (opsional).
 * @param {number} [referenceLng] - Longitude untuk deteksi zona (opsional)
 * @returns {{ utc: number, offset: number, zone: string, iso: string, localTimeString: string }}
 */
function getCurrentUTCTime(referenceLng) {
    const now = new Date();
    const utc = now.getTime();
    let offset, zone;

    if (referenceLng !== undefined) {
        ({ offset, zone } = _detectZoneByLongitude(referenceLng));
    } else {
        offset = -now.getTimezoneOffset() / 60;
        zone = offset === 7 ? 'WIB' : offset === 8 ? 'WITA' : offset === 9 ? 'WIT' : 'WIB';
        window.log.warn('[GPS ' + F_V + '] (4) Tidak ada longitude, zona dari browser: ' + zone);
    }

    return {
        utc,
        offset,
        zone,
        iso: now.toISOString(),
        localTimeString: _formatLocalTime(now, offset)
    };
}

// =============================================================================
// WAKE LOCK MANAGEMENT (SSOT)
// =============================================================================

/**
 * Mengaktifkan Wake Lock untuk menjaga layar tetap menyala.
 * Mendukung Capacitor KeepAwake plugin (Android) dan fallback Web API.
 */
async function _activateKeepAwake() {
    if (_keepAwakeActive) {
        window.log.info('[GPS ' + F_V + '] (19) Wake Lock sudah aktif');
        return;
    }

    window.log.info('[GPS ' + F_V + '] (20) Mengaktifkan Wake Lock...');

    // Coba Capacitor KeepAwake plugin (untuk Android native)
    if (_isNative()) {
        try {
            const KeepAwake = window.Capacitor?.Plugins?.KeepAwake;
            if (KeepAwake) {
                await KeepAwake.keepAwake();
                _keepAwakePluginActive = true;
                _keepAwakeActive = true;
                window.log.info('[GPS ' + F_V + '] (21) KeepAwake plugin diaktifkan');
                return;
            } else {
                window.log.warn('[GPS ' + F_V + '] (22) KeepAwake plugin tidak tersedia di window.Capacitor.Plugins');
            }
        } catch (err) {
            window.log.warn('[GPS ' + F_V + '] (23) KeepAwake plugin gagal:', err);
            // Lanjut ke fallback Web API
        }
    }

    // Fallback: Web Wake Lock API
    if ('wakeLock' in navigator) {
        try {
            _wakeLockWeb = await navigator.wakeLock.request('screen');
            _keepAwakeActive = true;
            window.log.info('[GPS ' + F_V + '] (24) Wake Lock Web diaktifkan');

            // Listener untuk me-release jika halaman di-visibility change
            document.addEventListener('visibilitychange', _handleVisibilityChange);
        } catch (err) {
            window.log.warn('[GPS ' + F_V + '] (25) Wake Lock Web gagal:', err);
            // Wake lock tidak kritis, lanjutkan tanpa error ke callback
            if (_callbacks.onError) {
                _callbacks.onError({
                    code: ERROR_CODES.KEEP_AWAKE_FAIL,
                    message: 'Wake Lock tidak tersedia: ' + (err.message || 'unknown error')
                });
            }
        }
    } else {
        window.log.warn('[GPS ' + F_V + '] (26) Wake Lock tidak didukung di browser ini');
    }
}

/**
 * Menonaktifkan Wake Lock.
 */
async function _deactivateKeepAwake() {
    if (!_keepAwakeActive) {
        window.log.info('[GPS ' + F_V + '] (27) Wake Lock sudah tidak aktif');
        return;
    }

    window.log.info('[GPS ' + F_V + '] (28) Menonaktifkan Wake Lock...');

    // Nonaktifkan Capacitor KeepAwake plugin
    if (_keepAwakePluginActive) {
        try {
            const KeepAwake = window.Capacitor?.Plugins?.KeepAwake;
            if (KeepAwake) {
                await KeepAwake.allowSleep();
                _keepAwakePluginActive = false;
                window.log.info('[GPS ' + F_V + '] (29) KeepAwake plugin dinonaktifkan');
            } else {
                window.log.warn('[GPS ' + F_V + '] (30) KeepAwake plugin tidak tersedia saat dinonaktifkan');
            }
        } catch (err) {
            window.log.warn('[GPS ' + F_V + '] (31) Gagal menonaktifkan KeepAwake plugin:', err);
        }
    }

    // Nonaktifkan Web Wake Lock
    if (_wakeLockWeb) {
        try {
            await _wakeLockWeb.release();
            _wakeLockWeb = null;
            window.log.info('[GPS ' + F_V + '] (32) Wake Lock Web dinonaktifkan');
        } catch (err) {
            window.log.warn('[GPS ' + F_V + '] (33) Gagal melepas Wake Lock Web:', err);
        }
        document.removeEventListener('visibilitychange', _handleVisibilityChange);
    }

    _keepAwakeActive = false;
}

/**
 * Handler untuk visibility change (web) - me-reacquire wake lock jika halaman kembali aktif.
 */
function _handleVisibilityChange() {
    if (document.visibilityState === 'visible' && _isTrackingWeb && !_keepAwakeActive) {
        window.log.info('[GPS ' + F_V + '] (34) Halaman aktif kembali, reacquire Wake Lock...');
        _activateKeepAwake();
    }
}

// =============================================================================
// IMPLEMENTASI WEB (navigator.geolocation)
// =============================================================================

function _startWeb() {
    if (!isSupported()) {
        if (_callbacks.onError) {
            _callbacks.onError({ code: ERROR_CODES.UNSUPPORTED, message: 'Geolocation tidak didukung' });
        }
        return;
    }

    if (_isTrackingWeb) return;

    _retryAttempts = 0;
    _doStartWatching();
    _setupPageChangeGuard();
    _isTrackingWeb = true;
    window.log.info('[GPS ' + F_V + '] (1) Tracking web dimulai');
}

function _stopWeb() {
    if (_watchId !== null) {
        navigator.geolocation.clearWatch(_watchId);
        _watchId = null;
    }
    if (_retryTimer) {
        clearTimeout(_retryTimer);
        _retryTimer = null;
    }
    _removePageChangeGuard();
    _isTrackingWeb = false;
    _retryAttempts = 0;
    window.log.info('[GPS ' + F_V + '] (2) Tracking web dihentikan');
}

function _doStartWatching() {
    const options = { enableHighAccuracy: HIGH_ACCURACY, timeout: TIMEOUT, maximumAge: MAXIMUM_AGE };
    _watchId = navigator.geolocation.watchPosition(_handlePosition, _handleError, options);
}

function _handlePosition(position) {
    _retryAttempts = 0;
    const pos = _parsePosition(position);
    if (_callbacks.onPosition) _callbacks.onPosition(pos);
}

function _handleError(error) {
    const err = _parseError(error);
    window.log.warn('[GPS ' + F_V + '] (5) Error web: ' + err.code + ' - ' + err.message);
    if (_retryAttempts < RETRY_COUNT) {
        _retryAttempts++;
        window.log.info('[GPS ' + F_V + '] (6) Retry ' + _retryAttempts + '/' + RETRY_COUNT);
        _retryTimer = setTimeout(() => {
            if (_watchId !== null) navigator.geolocation.clearWatch(_watchId);
            _doStartWatching();
            _retryTimer = null;
        }, RETRY_DELAY);
    } else {
        window.log.error('[GPS ' + F_V + '] (7) Retry gagal setelah ' + RETRY_COUNT + ' kali');
        if (_watchId !== null) {
            navigator.geolocation.clearWatch(_watchId);
            _watchId = null;
        }
        _isTrackingWeb = false;
        if (_callbacks.onError) _callbacks.onError(err);
    }
}

// =============================================================================
// IMPLEMENTASI NATIVE (Capacitor BackgroundGeolocation)
// =============================================================================

async function _startNative() {
    if (_isNativeStarted) return;

    // Minta izin notifikasi (diperlukan untuk background service)
    try {
        const LocalNotifications = window.Capacitor?.Plugins?.LocalNotifications;
        if (LocalNotifications && typeof LocalNotifications.requestPermissions === 'function') {
            await LocalNotifications.requestPermissions();
            window.log.info('[GPS ' + F_V + '] (8) Izin notifikasi diminta');
        } else {
            window.log.warn('[GPS ' + F_V + '] (9) LocalNotifications plugin tidak tersedia');
        }
    } catch (e) {
        window.log.warn('[GPS ' + F_V + '] (10) Gagal meminta izin notifikasi:', e);
    }

    try {
        const BackgroundGeolocation = window.Capacitor?.Plugins?.BackgroundGeolocation;
        if (!BackgroundGeolocation) {
            throw new Error('Plugin BackgroundGeolocation tidak tersedia');
        }

        _nativeWatcherId = await BackgroundGeolocation.addWatcher(
            {
                desiredAccuracy: 0,
                distanceFilter: 10,
                stopOnTerminate: false,
                startOnBoot: true,
                backgroundMessage: "Merekam perjalanan akurasi tinggi...",
                backgroundTitle: "⚡ KupasTarif",
                backgroundIcon: "ic_notification",
                backgroundIconColor: "#0d7c4a",
                requestPermissions: true,
                stale: false,
                activityType: 'automotiveNavigation',
                minimumActivityRecognitionConfidence: 70
            },
            (location, error) => {
                if (error) {
                    window.log.error('[GPS ' + F_V + '] (11) Error native:', error);
                    if (_callbacks.onError) {
                        _callbacks.onError({
                            code: ERROR_CODES.NATIVE_ERROR,
                            message: error.message || 'Native GPS error'
                        });
                    }
                    return;
                }
                if (location) {
                    const pos = {
                        lat: location.latitude ?? location.coords?.latitude,
                        lng: location.longitude ?? location.coords?.longitude,
                        accuracy: location.accuracy ?? location.coords?.accuracy ?? 10,
                        timestamp: location.timestamp ?? Date.now()
                    };
                    if (_callbacks.onPosition) _callbacks.onPosition(pos);
                }
            }
        );
        _isNativeStarted = true;
        // Notifikasi otomatis muncul
        window.log.info('[GPS ' + F_V + '] (12) Native watcher berhasil dengan id:', _nativeWatcherId);
    } catch (err) {
        window.log.error('[GPS ' + F_V + '] (13) Gagal inisialisasi native:', err);
        if (_callbacks.onError) {
            _callbacks.onError({
                code: ERROR_CODES.NATIVE_INIT_FAIL,
                message: err.message || 'Gagal memulai GPS native'
            });
        }
        // Tidak ada fallback ke web agar tidak membingungkan user di production.
        // Jika ingin fallback untuk debugging, aktifkan baris di bawah ini:
        // _startWeb();
    }
}

function _stopNative() {
    if (_nativeWatcherId !== null) {
        const BackgroundGeolocation = window.Capacitor?.Plugins?.BackgroundGeolocation;
        if (BackgroundGeolocation) {
            BackgroundGeolocation.removeWatcher(_nativeWatcherId)
                .then(() => {
                    window.log.info('[GPS ' + F_V + '] (14) Native watcher dihapus');
                })
                .catch((err) => {
                    window.log.warn('[GPS ' + F_V + '] (15) Gagal hapus native watcher:', err);
                });
        } else {
            window.log.warn('[GPS ' + F_V + '] (16) BackgroundGeolocation plugin tidak tersedia saat stop');
        }
        _nativeWatcherId = null;
    }
    _isNativeStarted = false;
    // Notifikasi otomatis hilang
    window.log.info('[GPS ' + F_V + '] (17) Native tracking dihentikan');
}

// =============================================================================
// PAGE CHANGE GUARD (hanya untuk web)
// =============================================================================

function _setupPageChangeGuard() {
    if (!StateEvents) return;
    _pageChangeHandler = () => {
        const currentPage = window.Router?.getCurrentPage();
        if (!currentPage || !currentPage.startsWith('tracking')) {
            window.log.info('[GPS ' + F_V + '] (18) Berpindah halaman, menghentikan GPS web');
            _stopWeb();
        }
    };
    StateEvents.on('page:change', _pageChangeHandler);
}

function _removePageChangeGuard() {
    if (_pageChangeHandler && StateEvents) {
        StateEvents.off('page:change', _pageChangeHandler);
        _pageChangeHandler = null;
    }
}

// =============================================================================
// ZONA WAKTU & FORMAT WAKTU (umum)
// =============================================================================

function _detectZoneByLongitude(lng) {
    for (const entry of ZONE_BOUNDARIES) {
        if (lng >= entry.longMin && lng < entry.longMax) {
            return { offset: entry.offset, zone: entry.zone };
        }
    }
    window.log.warn('[GPS ' + F_V + '] (19) Longitude di luar zona dikenal: ' + lng + ', fallback WIB');
    return { offset: 7, zone: 'WIB' };
}

function _formatLocalTime(date, offsetHours) {
    const local = new Date(date.getTime() + offsetHours * 3600 * 1000);
    const hh = String(local.getUTCHours()).padStart(2, '0');
    const mm = String(local.getUTCMinutes()).padStart(2, '0');
    const ss = String(local.getUTCSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}

// =============================================================================
// PARSING POSISI & ERROR
// =============================================================================

function _parsePosition(position) {
    return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp || Date.now()
    };
}

function _parseError(error) {
    let code = ERROR_CODES.POSITION_UNAVAILABLE;
    let message = error.message;
    switch (error.code) {
        case 1: code = ERROR_CODES.PERMISSION_DENIED; message = 'Izin lokasi ditolak'; break;
        case 2: code = ERROR_CODES.POSITION_UNAVAILABLE; message = 'Posisi tidak tersedia'; break;
        case 3: code = ERROR_CODES.TIMEOUT; message = 'Timeout permintaan lokasi'; break;
    }
    return { code, message, originalError: error };
}

// =============================================================================
// EKSPOR
// =============================================================================

export const GPS = {
    start,
    stop,
    getCurrentPosition,
    isSupported,
    isActive,
    getCurrentUTCTime,
    ERROR_CODES
};

window.log.info('[GPS ' + F_V + '] (35) GPS dimuat (native via window.Capacitor.Plugins, web via navigator.geolocation)');

// ================================= CHANGELOG =================================
// 2.0.0-rev4 : - Menghapus semua dynamic import.
//              - Mengakses plugin Capacitor langsung dari window.Capacitor.Plugins.
//              - Menggunakan window.__platform.isNative dari init.js.
//              - Menghapus fallback ke web di _startNative().
//              - Memperbarui log dan nomor referensi.
// 2.0.0-rev3 : - Menghilangkan import statis Capacitor & BackgroundGeolocation.
//              - Menggunakan dynamic import dan global window.Capacitor.
// 2.0.0-rev2 : - Manajemen Wake Lock dipindahkan dari tracking.js ke gps.js.
// 2.0.0-rev1 : - Integrasi native Capacitor BackgroundGeolocation.
// 2.0.0-rev0 : - Inisiasi awal (web only).
//
// =============================== FUTURE UPDATE ===============================
// - Tidak ada
//
// ================================ End Of File ================================