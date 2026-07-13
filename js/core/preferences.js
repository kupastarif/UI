/**
 * =================================================================================
 * FILE         : /js/core/preferences.js
 * FILE VERSION : 2.0a-rev0
 * APP VERSION  : 2.0a-beta
 */
'use strict';

const F_V = '2.0a-rev0';

import { StorageManager } from './storage.js';
import { StateManager } from './state.js';
import { getDefaultValues, validateCell } from '../helpers/output.js';

function getEngineDefaults() {
    try {
        const defaults = getDefaultValues();
        return {
            mode: defaults.E10,
            role: defaults.E12,
            area: defaults.E20,
            cc: defaults.E22,
            fuel: defaults.E24,
            transmission: defaults.E26,
            contract: defaults.E28
        };
    } catch (e) {
        window.log.error('[Preferences ' + F_V + '] (1) Output.getDefaultValues() gagal, menggunakan fallback');
        return {
            mode: 'Mobil',
            role: 'Driver',
            area: 'Jabodetabek',
            cc: '1000cc',
            fuel: 'Pertalite',
            transmission: 'manual',
            contract: 'individu'
        };
    }
}

function buildDefaultPreferences() {
    return {
        quickOrder: false,
        alwaysGPS: false,
        offlineOrder: false,
        alwaysOperational: false,
        largeText: false,
        hideSafetyReminder: false,
        cacheMaksimal: false,
        defaultVehicle: getEngineDefaults(),
        driverInfo: { name: '', plate: '', phone: '' },
        customCopy: { enabled: false, template: '' }
    };
}

function validateDefaultVehicle(vehicle) {
    if (!vehicle || typeof vehicle !== 'object') {
        window.log.warn('[Preferences ' + F_V + '] (2) Validasi vehicle: input bukan objek, mengembalikan default');
        return getEngineDefaults();
    }

    const validated = {
        mode: vehicle.mode,
        role: vehicle.role,
        area: vehicle.area,
        cc: vehicle.cc,
        fuel: vehicle.fuel,
        transmission: vehicle.transmission,
        contract: vehicle.contract
    };

    try {
        validated.mode         = validateCell('E10', validated.mode);
        validated.role         = validateCell('E12', validated.role);
        validated.area         = validateCell('E20', validated.area);
        validated.cc           = validateCell('E22', validated.cc, { E10: validated.mode });
        validated.fuel         = validateCell('E24', validated.fuel, { E22: validated.cc });
        validated.transmission = validateCell('E26', validated.transmission);
        validated.contract     = validateCell('E28', validated.contract);
    } catch (e) {
        window.log.warn('[Preferences ' + F_V + '] (3) Output.validateCell() gagal, mengembalikan input tanpa validasi');
    }

    return validated;
}

function loadPreferences() {
    window.log.info('[Preferences ' + F_V + '] (4) Memulai loadPreferences()');
    try {
        const stored = StorageManager ? StorageManager.getPreferences() : {};
        const defaults = buildDefaultPreferences();

        const preferences = {
            quickOrder: stored.quickOrder === true,
            alwaysGPS: stored.alwaysGPS === true,
            offlineOrder: stored.offlineOrder === true,
            alwaysOperational: stored.alwaysOperational === true,
            largeText: stored.largeText === true,
            hideSafetyReminder: stored.hideSafetyReminder === true,
            cacheMaksimal: stored.cacheMaksimal === true,
            defaultVehicle: validateDefaultVehicle(stored.defaultVehicle || defaults.defaultVehicle),
            driverInfo: stored.driverInfo || defaults.driverInfo,
            customCopy: stored.customCopy || defaults.customCopy
        };

        if (preferences.largeText) {
            document.documentElement.setAttribute('data-large-text', 'true');
        } else {
            document.documentElement.removeAttribute('data-large-text');
        }

        if (!window.APP_CONFIG?.isDevMode && window.Cache) {
            const newMode = preferences.cacheMaksimal ? 'maksimal' : 'minimal';
            if (window.Cache.getMode() !== newMode) {
                window.Cache.setMode(newMode);
            }
        }

        if (StateManager) {
            StateManager.set('preferences', preferences);
            window.log.info('[Preferences ' + F_V + '] (5) Preferensi dimuat dan disimpan ke StateManager');
        } else {
            window.log.warn('[Preferences ' + F_V + '] (6) StateManager tidak tersedia, preferensi tidak disimpan ke state');
        }

        return preferences;
    } catch (error) {
        window.log.error('[Preferences ' + F_V + '] (7) Gagal memuat preferensi:', error);
        const defaults = buildDefaultPreferences();
        if (StateManager) StateManager.set('preferences', defaults);
        return defaults;
    }
}

function savePreferences(prefs) {
    window.log.info('[Preferences ' + F_V + '] (8) Memulai savePreferences()');
    try {
        const validated = {
            quickOrder: prefs.quickOrder === true,
            alwaysGPS: prefs.alwaysGPS === true,
            offlineOrder: prefs.offlineOrder === true,
            alwaysOperational: prefs.alwaysOperational === true,
            largeText: prefs.largeText === true,
            hideSafetyReminder: prefs.hideSafetyReminder === true,
            cacheMaksimal: prefs.cacheMaksimal === true,
            defaultVehicle: validateDefaultVehicle(prefs.defaultVehicle || {}),
            driverInfo: prefs.driverInfo || { name: '', plate: '', phone: '' },
            customCopy: {
                enabled: prefs.customCopy ? prefs.customCopy.enabled === true : false,
                template: prefs.customCopy ? prefs.customCopy.template || '' : ''
            }
        };

        if (StorageManager) {
            StorageManager.savePreferences(validated);
            window.log.info('[Preferences ' + F_V + '] (9) Preferensi disimpan ke StorageManager');
        } else {
            window.log.warn('[Preferences ' + F_V + '] (10) StorageManager tidak tersedia, gagal menyimpan ke storage');
        }

        if (StateManager) {
            StateManager.set('preferences', validated);
        }

        if (validated.largeText) {
            document.documentElement.setAttribute('data-large-text', 'true');
        } else {
            document.documentElement.removeAttribute('data-large-text');
        }

        if (!window.APP_CONFIG?.isDevMode && window.Cache) {
            const newMode = validated.cacheMaksimal ? 'maksimal' : 'minimal';
            if (window.Cache.getMode() !== newMode) {
                window.Cache.setMode(newMode);
            }
        }

        return true;
    } catch (error) {
        window.log.error('[Preferences ' + F_V + '] (11) Gagal menyimpan preferensi:', error);
        return false;
    }
}

function resetToDefault() {
    window.log.info('[Preferences ' + F_V + '] (12) Memulai resetToDefault()');
    try {
        const defaults = buildDefaultPreferences();
        return savePreferences(defaults);
    } catch (error) {
        window.log.error('[Preferences ' + F_V + '] (13) Gagal reset ke default:', error);
        return false;
    }
}

let saveDebounceTimer = null;

function debouncedSave(prefs) {
    window.log.info('[Preferences ' + F_V + '] (14) debouncedSave dipicu');
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => {
        window.log.info('[Preferences ' + F_V + '] (15) debouncedSave: menjalankan savePreferences');
        savePreferences(prefs);
        saveDebounceTimer = null;
    }, 500);
}

function getDefaultVehicle() {
    const prefs = StateManager ? StateManager.get('preferences') : loadPreferences();
    return prefs.defaultVehicle;
}

function isQuickOrderEnabled() {
    const prefs = StateManager ? StateManager.get('preferences') : loadPreferences();
    return prefs.quickOrder === true;
}

function isAlwaysGPSEnabled() {
    const prefs = StateManager ? StateManager.get('preferences') : loadPreferences();
    return prefs.alwaysGPS === true;
}

function isOfflineOrderEnabled() {
    const prefs = StateManager ? StateManager.get('preferences') : loadPreferences();
    return prefs.offlineOrder === true;
}

function isAlwaysOperationalEnabled() {
    const prefs = StateManager ? StateManager.get('preferences') : loadPreferences();
    return prefs.alwaysOperational === true;
}

function isLargeTextEnabled() {
    const prefs = StateManager ? StateManager.get('preferences') : loadPreferences();
    return prefs.largeText === true;
}

function isSafetyReminderHidden() {
    const prefs = StateManager ? StateManager.get('preferences') : loadPreferences();
    return prefs.hideSafetyReminder === true;
}

function isCacheMaksimalEnabled() {
    const prefs = StateManager ? StateManager.get('preferences') : loadPreferences();
    return prefs.cacheMaksimal === true;
}

setTimeout(() => {
    try {
        getDefaultValues();
        window.log.info('[Preferences ' + F_V + '] (16) Output tersedia, memulai auto-load preferences');
        loadPreferences();
        window.log.info('[Preferences ' + F_V + '] (17) Auto-load preferences selesai');
    } catch (e) {
        window.log.warn('[Preferences ' + F_V + '] (18) Output belum siap, menunda load');
        setTimeout(() => {
            try {
                getDefaultValues();
                window.log.info('[Preferences ' + F_V + '] (19) Output siap setelah penundaan, load preferences');
                loadPreferences();
            } catch (e2) {
                window.log.error('[Preferences ' + F_V + '] (20) Output tetap tidak tersedia setelah penundaan');
            }
        }, 100);
    }
}, 50);

export const PreferencesManager = {
    load: loadPreferences,
    save: savePreferences,
    reset: resetToDefault,
    debouncedSave: debouncedSave,

    getDefaultVehicle,
    getEngineDefaults,
    buildDefaultPreferences,
    validateDefaultVehicle,

    isQuickOrderEnabled,
    isAlwaysGPSEnabled,
    isOfflineOrderEnabled,
    isAlwaysOperationalEnabled,
    isLargeTextEnabled,
    isSafetyReminderHidden,
    isCacheMaksimalEnabled
};

window.log.info('[Preferences ' + F_V + '] (21) PreferencesManager dimuat');

// ================================ End Of File ================================
