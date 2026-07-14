/**
 * =============================================================================
 * FILE        : /engine/07cache.js
 * VERSI FILE  : 0.5.0-rev3
 * CACHE       : 0.5.0-beta
 * DATA SOURCE : Excel "v9.7j masterapp.xlsx" — Sheet "v9.7j-All"
 */
const Cache = (function() {
    'use strict';

    const CACHE_VERSION = '0.5.0-beta';
    const F_V = '0.5.0-rev3';
    const SUPPORTED_ENGINE_VERSIONS = ['1.0.0-beta'];

    let _mode = 'minimal';
    let _engine = null;
    const _store = new Map();
    let _stats = { hits: 0, misses: 0, sets: 0 };

    let _afcTable = null;
    let _maintSpeedTable = null;
    let _originalGetAFC = null;
    let _originalGetPerawatanSpeedFactor = null;
    let _isPatched = false;

    const TTL_REALITY = 2000;

    const TAG_PREFIXES = {
        'home':           ['fp_', 'cp_', 'estPickup_'],
        'order':          ['estPickup_', 'estDropoff_'],
        'order-dynamic':  ['estDropoff_'],
        'tracking':       ['realPickup_', 'realDropoff_'],
        'all':            null
    };

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
        _originalGetAFC = _engine.Cost.getAFC;
        _originalGetPerawatanSpeedFactor = _engine.Cost.getPerawatanSpeedFactor;
        console.log('[Cache v' + F_V + '] Terhubung ke Engine v' + Engine.ENGINE_VERSION +
            '. Mode default: ' + _mode);
        return true;
    }

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
                    const value = _originalGetAFC.call(_engine.Cost, speed, mode, energi);
                    _afcTable.set(key, value);
                }
            }
        }

        _maintSpeedTable = new Map();
        for (let v = 0; v <= 120; v++) {
            const speed = v;
            const factor = _originalGetPerawatanSpeedFactor.call(_engine.Cost, speed);
            _maintSpeedTable.set(speed, factor);
        }

        console.log('[Cache v' + F_V + '] Pre‑komputasi selesai (' +
            _afcTable.size + ' AFC entries, ' + _maintSpeedTable.size + ' speed entries)');
    }

    function _fastGetAFC(speed, mode, energi) {
        if (speed < 0 || speed > 80) {
            return _originalGetAFC.call(_engine.Cost, speed, mode, energi);
        }
        const roundedSpeed = Math.round(speed * 2) / 2;
        const key = mode + '_' + energi + '_' + roundedSpeed.toFixed(1);
        if (_afcTable && _afcTable.has(key)) {
            return _afcTable.get(key);
        }
        return _originalGetAFC.call(_engine.Cost, speed, mode, energi);
    }

    function _fastGetPerawatanSpeedFactor(speed) {
        const rounded = Math.round(speed);
        if (_maintSpeedTable && _maintSpeedTable.has(rounded)) {
            return _maintSpeedTable.get(rounded);
        }
        return _originalGetPerawatanSpeedFactor.call(_engine.Cost, speed);
    }

    function _patchEngineFunctions() {
        if (!_engine || _isPatched) return;
        _engine.Cost.getAFC = _fastGetAFC;
        _engine.Cost.getPerawatanSpeedFactor = _fastGetPerawatanSpeedFactor;
        _isPatched = true;
        console.log('[Cache v' + F_V + '] Engine.Cost telah di‑patch untuk mode maksimal.');
    }

    function _unpatchEngineFunctions() {
        if (!_engine || !_isPatched) return;
        _engine.Cost.getAFC = _originalGetAFC;
        _engine.Cost.getPerawatanSpeedFactor = _originalGetPerawatanSpeedFactor;
        _isPatched = false;
        console.log('[Cache v' + F_V + '] Engine.Cost dikembalikan ke fungsi asli.');
    }

    function _makeKey(prefix, obj) {
        const sorted = Object.keys(obj).sort().reduce((acc, k) => {
            acc[k] = obj[k];
            return acc;
        }, {});
        return prefix + JSON.stringify(sorted);
    }

    function _summarizeEst(est) {
        if (!est) return {};
        return {
            f_E657: est.E657, f_E659: est.E659, f_E660: est.E660, f_E663: est.E663,
            f_E669: est.E669, f_E671: est.E671, f_E677: est.E677, f_E679: est.E679,
            f_E713: est.E713, f_E714: est.E714, f_E715: est.E715, f_E707: est.E707,
            f_E700: est.E700, f_E692: est.E692, f_E693: est.E693, f_E699: est.E699,
            f_E684: est.E684, f_E697: est.E697, f_E698: est.E698,
            c_E791: est.E791, c_E792: est.E792, c_E798: est.E798, c_E800: est.E800,
            c_E801: est.E801, c_E802: est.E802, c_E803: est.E803, c_E808: est.E808,
            c_E809: est.E809
        };
    }

    function _set(key, value, ttl) {
        _store.set(key, {
            value,
            timestamp: Date.now(),
            ttl: ttl || 0
        });
        _stats.sets++;
    }

    function _get(key) {
        const entry = _store.get(key);
        if (!entry) {
            _stats.misses++;
            return undefined;
        }
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
                if (key.startsWith(prefix)) {
                    _store.delete(key);
                    break;
                }
            }
        }
    }

    function _getFareParams(valid) {
        if (_mode === 'off') return _engine.Fare.getFareParams(valid);
        const key = _makeKey('fp_', {
            E10: valid.E10, E20: valid.E20, E22: valid.E22, E24: valid.E24,
            E36: valid.E36, E38: valid.E38, E40: valid.E40, E46: valid.E46
        });
        let result = _get(key);
        if (result === undefined) {
            result = _engine.Fare.getFareParams(valid);
            _set(key, result);
        }
        return result;
    }

    function _getCostParams(valid, seatType) {
        if (_mode === 'off') return _engine.Cost.getCostParams(valid, seatType);
        const key = _makeKey('cp_', {
            E10: valid.E10, E22: valid.E22, E26: valid.E26, E24: valid.E24,
            E36: valid.E36, E46: valid.E46,
            seatType: seatType
        });
        let result = _get(key);
        if (result === undefined) {
            result = _engine.Cost.getCostParams(valid, seatType);
            _set(key, result);
        }
        return result;
    }

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
            _fpE657: pickupEst.E657, _fpE659: pickupEst.E659,
            _fpE660: pickupEst.E660, _fpE669: pickupEst.E669,
            _fpE671: pickupEst.E671, _fpE677: pickupEst.E677,
            _fpE678: pickupEst.E678, _fpE679: pickupEst.E679,
            _cpE791: pickupEst.E791, _cpE792: pickupEst.E792,
            _cpE798: pickupEst.E798, _cpE800: pickupEst.E800,
            _cpE801: pickupEst.E801, _cpE802: pickupEst.E802,
            _cpE803: pickupEst.E803, _cpE808: pickupEst.E808,
            _cpE809: pickupEst.E809
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
        const key = _makeKey('realPickup_', Object.assign(
            { E78: valid.E78, E80: valid.E80 },
            _summarizeEst(est)
        ));
        let result = _get(key);
        if (result === undefined) {
            result = _engine.realityPickup(valid, est);
            _set(key, result, TTL_REALITY);
        }
        return result;
    }

    function realityDropoff(valid, est, pickupReal) {
        if (_mode !== 'maksimal') return _engine.realityDropoff(valid, est, pickupReal);
        const key = _makeKey('realDropoff_', Object.assign(
            {
                E82: valid.E82, E84: valid.E84,
                E92: valid.E92, E100: valid.E100, E102: valid.E102, E104: valid.E104
            },
            _summarizeEst(est)
        ));
        let result = _get(key);
        if (result === undefined) {
            result = _engine.realityDropoff(valid, est, pickupReal);
            _set(key, result, TTL_REALITY);
        }
        return result;
    }

    function reality(valid, est) {
        return _engine.reality(valid, est);
    }

    function complete(valid) {
        return _engine.complete(valid);
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

    function setMode(mode) {
        if (['off', 'minimal', 'maksimal'].includes(mode)) {
            if (_mode !== mode) {
                if (_mode === 'maksimal') {
                    _unpatchEngineFunctions();
                }
                _store.clear();
                _stats = { hits: 0, misses: 0, sets: 0 };
                console.log('[Cache v' + F_V + '] Mode berubah: ' + _mode + ' -> ' + mode);
                _mode = mode;
                if (mode === 'maksimal') {
                    _precompute();
                    _patchEngineFunctions();
                }
            }
        } else {
            console.warn('[Cache v' + F_V + '] Mode tidak valid: ' + mode + '. Mengabaikan.');
        }
    }

    function getMode() {
        return _mode;
    }

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

    const _initialized = _init();

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

// ================================ End Of File ================================
