/**
 * =================================================================================
 * FILE         : /js/maps/gps.js
 * FILE VERSION : 2.0a-rev0
 * APP VERSION  : 2.0a-beta
 */
'use strict';

const F_V = '2.0a-rev0';

import { StateEvents } from '../core/state.js';

const HIGH_ACCURACY = true;
const TIMEOUT = 10000;
const MAXIMUM_AGE = 0;
const RETRY_COUNT = 3;
const RETRY_DELAY = 5000;

const ERROR_CODES = {
    UNSUPPORTED: 'E-GPS-001',
    PERMISSION_DENIED: 'E-GPS-002',
    POSITION_UNAVAILABLE: 'E-GPS-003',
    TIMEOUT: 'E-GPS-004'
};

const ZONE_BOUNDARIES = [
    { zone: 'WIB', offset: 7, longMin: 95, longMax: 115 },
    { zone: 'WITA', offset: 8, longMin: 115, longMax: 130 },
    { zone: 'WIT', offset: 9, longMin: 130, longMax: 145 }
];

let watchId = null;
let isTracking = false;
let retryAttempts = 0;
let retryTimer = null;
let callbacks = { onPosition: null, onError: null };
let pageChangeHandler = null;

function start(onPosition, onError) {
    if (!isSupported()) {
        console.error('[GPS] Geolocation tidak didukung');
        if (onError) onError({ code: ERROR_CODES.UNSUPPORTED, message: 'Geolocation tidak didukung' });
        return;
    }

    if (isTracking) stop();

    callbacks = { onPosition, onError };
    retryAttempts = 0;
    _startWatching();
    _setupPageChangeGuard();
    isTracking = true;
    window.log.info('[GPS ' + F_V + '] (1) Tracking dimulai');
}

function stop() {
    if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; }
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
    _removePageChangeGuard();
    isTracking = false;
    retryAttempts = 0;
    callbacks = { onPosition: null, onError: null };
    window.log.info('[GPS ' + F_V + '] (2) Tracking dihentikan');
}

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

function isSupported() { return 'geolocation' in navigator; }
function isActive() { return isTracking; }

function _detectZoneByLongitude(lng) {
    for (const entry of ZONE_BOUNDARIES) {
        if (lng >= entry.longMin && lng < entry.longMax) {
            return { offset: entry.offset, zone: entry.zone };
        }
    }
    window.log.warn('[GPS ' + F_V + '] (3) Longitude di luar zona dikenal: ' + lng + ', fallback WIB');
    return { offset: 7, zone: 'WIB' };
}

function _formatLocalTime(date, offsetHours) {
    const local = new Date(date.getTime() + offsetHours * 3600 * 1000);
    const hh = String(local.getUTCHours()).padStart(2, '0');
    const mm = String(local.getUTCMinutes()).padStart(2, '0');
    const ss = String(local.getUTCSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}

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

function _startWatching() {
    const options = { enableHighAccuracy: HIGH_ACCURACY, timeout: TIMEOUT, maximumAge: MAXIMUM_AGE };
    watchId = navigator.geolocation.watchPosition(_handlePosition, _handleError, options);
}

function _handlePosition(position) {
    retryAttempts = 0;
    const pos = _parsePosition(position);
    if (callbacks.onPosition) callbacks.onPosition(pos);
}

function _handleError(error) {
    const err = _parseError(error);
    window.log.warn('[GPS ' + F_V + '] (5) Error: ' + err.code + ' - ' + err.message);
    if (retryAttempts < RETRY_COUNT) {
        retryAttempts++;
        window.log.info('[GPS ' + F_V + '] (6) Retry ' + retryAttempts + '/' + RETRY_COUNT);
        retryTimer = setTimeout(() => {
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
            _startWatching();
            retryTimer = null;
        }, RETRY_DELAY);
    } else {
        window.log.error('[GPS ' + F_V + '] (7) Retry gagal setelah ' + RETRY_COUNT + ' kali');

        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }

        if (callbacks.onError) callbacks.onError(err);
    }
}

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

function _setupPageChangeGuard() {
    if (!StateEvents) return;
    pageChangeHandler = () => {
        const currentPage = window.Router?.getCurrentPage();
        if (!currentPage || !currentPage.startsWith('tracking')) {
            window.log.info('[GPS ' + F_V + '] (8) Berpindah halaman, menghentikan GPS');
            stop();
        }
    };
    StateEvents.on('page:change', pageChangeHandler);
}

function _removePageChangeGuard() {
    if (pageChangeHandler && StateEvents) {
        StateEvents.off('page:change', pageChangeHandler);
        pageChangeHandler = null;
    }
}

export const GPS = {
    start,
    stop,
    getCurrentPosition,
    isSupported,
    isActive,
    getCurrentUTCTime,
    ERROR_CODES
};

window.log.info('[GPS ' + F_V + '] (9) GPS dimuat');

// ================================ End Of File ================================