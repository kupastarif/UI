/**
 * =============================================================================
 * FILE        : /engine/07cache.js
 * VERSI FILE  : 0.5.1-rev0
 * CACHE       : 0.5.1-beta
 * DATE        : 16 Juli 2026
 * AUTHOR      : gk
 *
 * DESKRIPSI   :
 *   Wrapper cache untuk Engine v1.0.1‑beta.
 *   Aplikasi tidak mengakses engine langsung, melainkan melalui cache.
 *   Cache menyediakan tiga mode: off, minimal, maksimal.
 *   Pada mode "maksimal", cache melakukan prekomputasi tabel AFC dan faktor
 *   kecepatan, lalu menginjeksikannya ke Engine.Cost melalui
 *   `Engine.Cost.setLookupCache()` – TANPA monkey‑patching.
 *   Cache memeriksa kompatibilitas versi Engine saat inisialisasi.
 *
 * =============================================================================
 */

const Cache = (function() {
    'use strict';

    // ==================== VERSI CACHE & FILE ====================
    const CACHE_VERSION = '0.5.1-beta';
    const F_V = '0.5.1-rev0';

    // ==================== KOMPATIBILITAS ====================
    const SUPPORTED_ENGINE_VERSIONS = ['1.0.1-beta'];

    // ==================== STATE INTERNAL ====================
    let _mode = 'minimal';                     // off | minimal | maksimal
    let _engine = null;                        // referensi ke Engine (global)
    const _store = new Map();                  // penyimpanan utama
    let _stats = { hits: 0, misses: 0, sets: 0 };

    // Pre‑komputasi (hanya dibangun jika mode "maksimal")
    let _afcTable = null;
    let _maintSpeedTable = null;

    const TTL_REALITY = 2000;                  // 2 detik untuk realitas pickup/dropoff

    // ==================== PEMETAAN TAG INVALIDASI ====================
    const TAG_PREFIXES = {
        'home':           ['estPickup_'],
        'order':          ['estPickup_', 'estDropoff_'],
        'order-dynamic':  ['estDropoff_'],
        'tracking':       ['realPickup_', 'realDropoff_'],
        'all':            null
    };

    // ==================== INISIALISASI ====================
    function _init() {
        if (typeof Engine === 'undefined') {
            console.warn('[Cache v' + F_V + '] Engine tidak ditemukan. Cache OFF.');
            _mode = 'off';
            return false;
        }
        if (!SUPPORTED_ENGINE_VERSIONS.includes(Engine.ENGINE_VERSION)) {
            console.warn('[Cache v' + F_V + '] Versi Engine ' + Engine.ENGINE_VERSION +
                ' tidak didukung. Cache OFF.');
            _mode = 'off';
            return false;
        }
        _engine = Engine;
        console.log('[Cache v' + F_V + '] Terhubung ke Engine v' + Engine.ENGINE_VERSION +
            '. Mode default: ' + _mode);
        return true;
    }

    // ==================== PRE‑KOMPUTASI & INJEKSI ====================
    function _precompute() {
        if (_afcTable && _maintSpeedTable) return;
        if (!_engine) return;

        _afcTable = new Map();
        const modes = ['Mobil', 'Motor'];
        const energies = ['Bensin', 'Listrik'];
        for (const mode of modes) {
            for (const energi of energies) {
                for (let v = 0; v <= 180; v++) {
                    const speed = v * 0.5;
                    const key = mode + '_' + energi + '_' + speed.toFixed(1);
                    const value = _engine.Cost.getAFC(speed, mode, energi);
                    _afcTable.set(key, value);
                }
            }
        }

        _maintSpeedTable = new Map();
        for (let v = 0; v <= 120; v++) {
            const factor = _engine.Cost.getPerawatanSpeedFactor(v);
            _maintSpeedTable.set(v, factor);
        }

        console.log('[Cache v' + F_V + '] Pre‑komputasi selesai (' +
            _afcTable.size + ' AFC entries, ' + _maintSpeedTable.size + ' speed entries)');
    }

    /**
     * Menginjeksi tabel prekomputasi ke Engine.Cost.
     * Hanya dipanggil saat masuk mode maksimal.
     */
    function _injectLookupCache() {
        if (!_engine || typeof _engine.Cost.setLookupCache !== 'function') return;
        _engine.Cost.setLookupCache(_afcTable, _maintSpeedTable);
        console.log('[Cache v' + F_V + '] Tabel prekomputasi diinjeksikan ke Engine.Cost.');
    }

    /**
     * Membersihkan cache lookup di Engine.Cost saat meninggalkan mode maksimal.
     */
    function _clearLookupCache() {
        if (!_engine || typeof _engine.Cost.setLookupCache !== 'function') return;
        _engine.Cost.setLookupCache(null, null);
        console.log('[Cache v' + F_V + '] Tabel prekomputasi dihapus dari Engine.Cost.');
    }

    // ==================== UTILITAS KEY & STORE ====================
    function _makeKey(prefix, obj) {
        const sorted = Object.keys(obj).sort().reduce((acc, k) => {
            acc[k] = obj[k];
            return acc;
        }, {});
        return prefix + JSON.stringify(sorted);
    }

    function _set(key, value, ttl) {
        _store.set(key, { value, timestamp: Date.now(), ttl: ttl || 0 });
        _stats.sets++;
    }

    function _get(key) {
        const entry = _store.get(key);
        if (!entry) { _stats.misses++; return undefined; }
        if (entry.ttl > 0 && (Date.now() - entry.timestamp) > entry.ttl) {
            _store.delete(key);
            _stats.misses++;
            return undefined;
        }
        _stats.hits++;
        return entry.value;
    }

    function _deleteByPrefixes(prefixes) {
        for (const key of _store.keys()) {
            for (const prefix of prefixes) {
                if (key.startsWith(prefix)) { _store.delete(key); break; }
            }
        }
    }

    // ==================== WRAPPER ORKESTRASI ====================

    function estimatePickup(valid, uiStateE71) {
        if (_mode === 'off') return _engine.estimatePickup(valid, uiStateE71);
        const key = _makeKey('estPickup_', {
            E10: valid.E10, E12: valid.E12, E20: valid.E20, E22: valid.E22,
            E24: valid.E24, E26: valid.E26, E28: valid.E28,
            E36: valid.E36, E38: valid.E38, E40: valid.E40, E46: valid.E46,
            uiStateE71: typeof uiStateE71 === 'number' ? uiStateE71 : '__undefined__'
        });
        let result = _get(key);
        if (result === undefined) {
            result = _engine.estimatePickup(valid, uiStateE71);
            _set(key, result);
        }
        return result;
    }

    function estimateDropoff(valid, pickupEst) {
        if (_mode !== 'maksimal') return _engine.estimateDropoff(valid, pickupEst);
        const key = _makeKey('estDropoff_', {
            E10: valid.E10, E12: valid.E12, E20: valid.E20, E22: valid.E22,
            E24: valid.E24, E26: valid.E26, E28: valid.E28,
            E36: valid.E36, E38: valid.E38, E40: valid.E40, E46: valid.E46,
            E54: valid.E54, E56: valid.E56, E58: valid.E58, E60: valid.E60,
            E68: valid.E68, E70: valid.E70,
            _pE657: pickupEst.E657, _pE659: pickupEst.E659,
            _pE660: pickupEst.E660, _pE669: pickupEst.E669,
            _pE671: pickupEst.E671, _pE677: pickupEst.E677,
            _pE678: pickupEst.E678, _pE679: pickupEst.E679,
            _cE791: pickupEst.E791, _cE792: pickupEst.E792,
            _cE798: pickupEst.E798, _cE800: pickupEst.E800,
            _cE801: pickupEst.E801, _cE802: pickupEst.E802,
            _cE803: pickupEst.E803, _cE808: pickupEst.E808,
            _cE809: pickupEst.E809
        });
        let result = _get(key);
        if (result === undefined) {
            result = _engine.estimateDropoff(valid, pickupEst);
            _set(key, result);
        }
        return result;
    }

    function realityPickup(valid, est) {
        if (_mode !== 'maksimal') return _engine.realityPickup(valid, est);
        const key = _makeKey('realPickup_', {
            E78: valid.E78, E80: valid.E80,
            _f657: est.E657, _f659: est.E659, _f660: est.E660, _f663: est.E663,
            _f669: est.E669, _f671: est.E671, _f677: est.E677, _f679: est.E679,
            _f713: est.E713, _f714: est.E714, _f715: est.E715, _f707: est.E707,
            _f700: est.E700, _f692: est.E692, _f693: est.E693, _f699: est.E699,
            _f684: est.E684, _f697: est.E697, _f698: est.E698,
            _c791: est.E791, _c792: est.E792, _c798: est.E798, _c800: est.E800,
            _c801: est.E801, _c802: est.E802, _c803: est.E803, _c808: est.E808,
            _c809: est.E809
        });
        let result = _get(key);
        if (result === undefined) {
            result = _engine.realityPickup(valid, est);
            _set(key, result, TTL_REALITY);
        }
        return result;
    }

    function realityDropoff(valid, est, pickupReal) {
        if (_mode !== 'maksimal') return _engine.realityDropoff(valid, est, pickupReal);
        const key = _makeKey('realDropoff_', {
            E82: valid.E82, E84: valid.E84,
            E92: valid.E92, E100: valid.E100, E102: valid.E102, E104: valid.E104,
            _f657: est.E657, _f659: est.E659, _f660: est.E660, _f663: est.E663,
            _f669: est.E669, _f671: est.E671, _f677: est.E677, _f679: est.E679,
            _f713: est.E713, _f714: est.E714, _f715: est.E715, _f707: est.E707,
            _f700: est.E700, _f692: est.E692, _f693: est.E693, _f699: est.E699,
            _f684: est.E684, _f697: est.E697, _f698: est.E698,
            _c791: est.E791, _c792: est.E792, _c798: est.E798, _c800: est.E800,
            _c801: est.E801, _c802: est.E802, _c803: est.E803, _c808: est.E808,
            _c809: est.E809
        });
        let result = _get(key);
        if (result === undefined) {
            result = _engine.realityDropoff(valid, est, pickupReal);
            _set(key, result, TTL_REALITY);
        }
        return result;
    }

    function reality(valid, est, uiStateE71) {
        return _engine.reality(valid, est, uiStateE71);
    }

    function complete(valid, uiStateE71) {
        return _engine.complete(valid, uiStateE71);
    }

    function getOperationalCost(valid, distance, time) {
        if (_mode === 'off') return _engine.getOperationalCost(valid, distance, time);
        const roundedDist = Math.round(distance * 100) / 100;
        const roundedTime = Math.round(time);
        const key = _makeKey('opCost_', {
            E10: valid.E10, E22: valid.E22, E26: valid.E26, E24: valid.E24,
            distance: roundedDist, time: roundedTime
        });
        let result = _get(key);
        if (result === undefined) {
            result = _engine.getOperationalCost(valid, distance, time);
            _set(key, result);
        }
        return result;
    }

    function getMaxPickupDistance() {
        return _engine.getMaxPickupDistance();
    }

    function getMaxPickupTime() {
        return _engine.getMaxPickupTime();
    }

    // ==================== INVALIDASI ====================
    function invalidate(tag) {
        const prefixes = TAG_PREFIXES[tag];
        if (prefixes === null) {
            _store.clear();
            console.log('[Cache v' + F_V + '] Cache dihapus semua (tag: ' + tag + ')');
        } else if (prefixes) {
            _deleteByPrefixes(prefixes);
            console.log('[Cache v' + F_V + '] Cache dihapus untuk tag: ' + tag);
        } else {
            console.warn('[Cache v' + F_V + '] Tag invalidasi tidak dikenal: ' + tag);
        }
    }

    // ==================== MODE ====================
    function setMode(mode) {
        if (!['off', 'minimal', 'maksimal'].includes(mode)) {
            console.warn('[Cache v' + F_V + '] Mode tidak valid: ' + mode + '. Mengabaikan.');
            return;
        }
        if (_mode === mode) return;

        if (_mode === 'maksimal') _clearLookupCache();
        _store.clear();
        _stats = { hits: 0, misses: 0, sets: 0 };

        console.log('[Cache v' + F_V + '] Mode berubah: ' + _mode + ' -> ' + mode);
        _mode = mode;

        if (mode === 'maksimal') {
            _precompute();
            _injectLookupCache();
        }
    }

    function getMode() { return _mode; }

    function getStats() {
        return {
            hits: _stats.hits,
            misses: _stats.misses,
            sets: _stats.sets,
            size: _store.size,
            mode: _mode
        };
    }

    function clear() {
        _store.clear();
        _stats = { hits: 0, misses: 0, sets: 0 };
        console.log('[Cache v' + F_V + '] Cache dihapus manual. Statistik direset.');
    }

    // ==================== INISIALISASI ====================
    const _initialized = _init();

    // ==================== EKSPOR ====================
    return {
        CACHE_VERSION,
        F_V,

        setMode,
        getMode,
        invalidate,
        clear,
        getStats,

        estimatePickup,
        estimateDropoff,
        realityPickup,
        realityDropoff,
        reality,
        complete,
        getOperationalCost,
        getMaxPickupDistance,
        getMaxPickupTime,

        Engine: _engine || Engine,

        get initialized() { return _initialized; }
    };
})();

if (typeof window !== 'undefined') {
    window.Cache = Cache;
    console.log('[Cache v' + Cache.F_V + '] dimuat. Mode: ' + Cache.getMode());
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Cache };
}

// ================================= CHANGELOG =================================
// 0.5.1-rev0 : Penghapusan monkey‑patching. Prekomputasi diinjeksikan melalui
//              Engine.Cost.setLookupCache(). Dukungan Engine v1.0.1‑beta.
//              Wrapper menyesuaikan API orkestrasi baru.
// ================================ End Of File ================================