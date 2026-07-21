/**
 * =============================================================================
 * FILE        : /engine/02valid.js
 * VERSI FILE  : 1.0.1-rev0
 * ENGINE      : 1.0.1-beta
 * DATE        : 16 Juli 2026
 * AUTHOR      : gk
 *
 * DATA SOURCE : Excel "v9.7k masterapp.xlsx" — Sheet "v9.7k-All"
 *
 * DESKRIPSI   :
 *   Modul validasi dan normalisasi input pengguna setelah validasi UI.
 *   Setiap sel validasi dari Excel (E10, E12, E20, …) diimplementasikan
 *   sebagai fungsi murni (pure function) yang menerima nilai mentah dan
 *   konteks (jika diperlukan), lalu mengembalikan nilai yang sudah
 *   divalidasi atau nilai fallback sesuai aturan di Excel v9.7k.
 *
 * =============================================================================
 */

const Valid = (function() {
    'use strict';

    // ==================== VERSI FILE ====================
    const F_V = '1.0.1-rev0';

    // ==================== DEFAULT VALUES (untuk validasi) ====================
    const DEFAULT_E10 = 'Mobil';
    const DEFAULT_E12 = 'Driver';
    const DEFAULT_E20 = 'Jabodetabek';
    const DEFAULT_E26 = 'manual';
    const DEFAULT_E28 = 'individu';
    const DEFAULT_E36 = 'online';
    const DEFAULT_E38 = 'wajar';
    const DEFAULT_E46 = 'Standar';

    // ==================== VALID STRING VALUES ====================
    const VALID_E10 = ['Mobil', 'Motor'];
    const VALID_E12 = ['Driver', 'Penumpang'];
    const VALID_E20 = ['Jabodetabek', 'SumatraJawa', 'TimurIndonesia'];
    const VALID_E26 = ['manual', 'matic'];
    const VALID_E28 = ['individu', 'vendor'];
    const VALID_E36 = ['online', 'offline'];
    const VALID_E38 = ['wajar', 'minimal', 'abnormal', 'app'];

    const VALID_CC_MOBIL = ['1000cc', '1500cc', '2000cc', 'Listrik'];
    const VALID_CC_MOTOR = ['125cc', '160cc', '200cc', 'Listrik'];

    const VALID_BBM_MOBIL_1000_1500 = ['Pertalite'];
    const VALID_BBM_MOBIL_2000 = ['Pertamax', 'Bio Solar'];
    const VALID_BBM_MOTOR = ['Pertalite'];
    const VALID_BBM_LISTRIK_MOBIL = ['SPKLU+'];
    const VALID_BBM_LISTRIK_MOTOR = ['Swap Battery'];

    const VALID_E46_MOBIL_1000cc = ['Hemat', 'Standar', 'XL', 'Prioritas'];
    const VALID_E46_MOBIL_NOT_1000cc = ['Hemat', 'Standar', 'XL', 'Prioritas', 'Premium', 'Premium XL'];
    const VALID_E46_MOTOR_125cc = ['Hemat', 'Standar', 'Prioritas'];
    const VALID_E46_MOTOR_NOT_125cc = ['Hemat', 'Standar', 'Prioritas', 'Premium'];

    // ==================== RANGE NUMERIK ====================
    // fallback = nilai yang digunakan jika input tidak valid (bukan placeholder)
    const RANGE_E40_MOBIL  = { min: 0.4, max: 3, fallback: 0.4 };
    const RANGE_E40_MOTOR  = { min: 0.2, max: 3, fallback: 0.2 };
    const RANGE_E54 = { min: 10000, max: 10000000, fallback: 11111 }; // 11111 sebagai penanda kesalahan
    const RANGE_E56 = { min: 10000, max: 10000000, fallback: 11111 };
    const RANGE_E58 = { min: 0,     max: 500,      fallback: 0 };
    const RANGE_E60 = { min: 0,     max: 1000,     fallback: 0 };
    const RANGE_E68 = { min: 0.01,  max: 500,      fallback: 0.01 };
    const RANGE_E70 = { min: 1,     max: 1000,     fallback: 1 };
    const RANGE_E78 = { min: 0.01,  max: 500,      fallback: 0.01 };
    const RANGE_E80 = { min: 1,     max: 1000,     fallback: 1 };
    const RANGE_E82 = { min: 0.01,  max: 500,      fallback: 0.01 };
    const RANGE_E84 = { min: 1,     max: 1000,     fallback: 1 };
    const RANGE_E92 = { min: 0,     max: 100000,   fallback: 0 };
    const RANGE_E100 = { min: 0,    max: 100000,   fallback: 0 };
    const RANGE_E102 = { min: 0,    max: 500000,   fallback: 0 };
    const RANGE_E104 = { min: 0,    max: 500000,   fallback: 0 };

    // ==================== FUNGSI CELL ====================

    /**
     * E10 - Pilihan Mode Kendaraan
     * @param {string} [value] - "Mobil" atau "Motor" (default "Mobil")
     * @returns {string}
     */
    function E10(value) {
        if (typeof value === 'string' && VALID_E10.includes(value)) return value;
        return DEFAULT_E10;
    }

    /**
     * E12 - Peran Sebagai
     * @param {string} [value] - "Driver" atau "Penumpang" (default "Driver")
     * @returns {string}
     */
    function E12(value) {
        if (typeof value === 'string' && VALID_E12.includes(value)) return value;
        return DEFAULT_E12;
    }

    /**
     * E20 - Area
     * @param {string} [value] - Jabodetabek, SumatraJawa, TimurIndonesia
     * @returns {string}
     */
    function E20(value) {
        if (typeof value === 'string' && VALID_E20.includes(value)) return value;
        return DEFAULT_E20;
    }

    /**
     * E22 - CC (Kapasitas Mesin)
     * Bergantung pada E10 (mode kendaraan).
     * @param {string} [value]
     * @param {Object} [context] - { E10: 'Mobil' | 'Motor' }
     * @returns {string} CC yang valid (default 1000cc untuk Mobil, 125cc untuk Motor)
     */
    function E22(value, context) {
        const mode = (context && context.E10) ? context.E10 : DEFAULT_E10;
        const validList = mode === 'Mobil' ? VALID_CC_MOBIL : VALID_CC_MOTOR;
        if (typeof value === 'string' && validList.includes(value)) return value;
        return mode === 'Mobil' ? '1000cc' : '125cc';
    }

    /**
     * E24 - Tipe BBM / Energi
     * Bergantung pada E10 dan E22.
     * @param {string} [value]
     * @param {Object} [context] - { E10, E22 }
     * @returns {string}
     */
    function E24(value, context) {
        const mode = (context && context.E10) ? context.E10 : DEFAULT_E10;
        const cc = (context && context.E22) ? context.E22 : E22(undefined, { E10: mode });

        if (cc === 'Listrik') {
            return mode === 'Motor' ? (value === 'Swap Battery' ? value : 'Swap Battery')
                                    : (value === 'SPKLU+' ? value : 'SPKLU+');
        }

        if (mode === 'Motor') return (value === 'Pertalite') ? value : 'Pertalite';

        if (cc === '1000cc' || cc === '1500cc') return (value === 'Pertalite') ? value : 'Pertalite';
        // 2000cc
        if (value === 'Pertamax' || value === 'Bio Solar') return value;
        return 'Pertamax';
    }

    /**
     * E26 - Jenis Transmisi
     * @param {string} [value] - "manual" atau "matic" (default "manual")
     * @returns {string}
     */
    function E26(value) {
        if (typeof value === 'string' && VALID_E26.includes(value)) return value;
        return DEFAULT_E26;
    }

    /**
     * E28 - Tipe Kontrak Kemitraan
     * @param {string} [value] - "individu" atau "vendor" (default "individu")
     * @returns {string}
     */
    function E28(value) {
        if (typeof value === 'string' && VALID_E28.includes(value)) return value;
        return DEFAULT_E28;
    }

    /**
     * E36 - Tipe Order
     * @param {string} [value] - "online" atau "offline" (default "online")
     * @returns {string}
     */
    function E36(value) {
        if (typeof value === 'string' && VALID_E36.includes(value)) return value;
        return DEFAULT_E36;
    }

    /**
     * E38 - Tipe Tarif Offline
     * @param {string} [value] - "wajar", "minimal", "abnormal", "app" (default "wajar")
     * @returns {string}
     */
    function E38(value) {
        if (typeof value === 'string' && VALID_E38.includes(value)) return value;
        return DEFAULT_E38;
    }

    /**
     * E40 - Persentase Kenaikan Tarif Wajar
     * Range: Mobil 0.4-3, Motor 0.2-3.
     * @param {number|string} [value]
     * @param {Object} [context] - { E10 }
     * @returns {number} fallback 0.4 (Mobil) / 0.2 (Motor)
     */
    function E40(value, context) {
        const mode = (context && context.E10) ? context.E10 : DEFAULT_E10;
        const range = mode === 'Mobil' ? RANGE_E40_MOBIL : RANGE_E40_MOTOR;
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= range.min && num <= range.max) return num;
        return range.fallback;
    }

    /**
     * E46 - Tipe Layanan Driver
     * Bergantung pada E10 dan E22.
     * @param {string} [value]
     * @param {Object} [context] - { E10, E22 }
     * @returns {string} Layanan yang valid (default "Standar")
     */
    function E46(value, context) {
        const mode = (context && context.E10) ? context.E10 : DEFAULT_E10;
        const cc = (context && context.E22) ? context.E22 : E22(undefined, { E10: mode });
        const options = getServiceOptions(mode, cc);
        if (typeof value === 'string' && options.includes(value)) return value;
        return DEFAULT_E46;
    }

    /**
     * E54 - Harga Penumpang (Online)
     * Range: 10000 - 10000000
     * @param {number|string} [value]
     * @returns {number}
     */
    function E54(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E54.min && num <= RANGE_E54.max) return num;
        return RANGE_E54.fallback;
    }

    /**
     * E56 - Pendapatan Diterima Driver / Omset (Online)
     * Range: 10000 - 10000000
     * @param {number|string} [value]
     * @returns {number}
     */
    function E56(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E56.min && num <= RANGE_E56.max) return num;
        return RANGE_E56.fallback;
    }

    /**
     * E58 - Jarak Antar Rute Aplikasi (Online)
     * Range: 0 - 500 km
     * @param {number|string} [value]
     * @returns {number}
     */
    function E58(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E58.min && num <= RANGE_E58.max) return num;
        return RANGE_E58.fallback;
    }

    /**
     * E60 - Kenaikan Tarif Jika Jarak Disembunyikan (Persentase)
     * Range: 0 - 1000
     * @param {number|string} [value]
     * @returns {number}
     */
    function E60(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E60.min && num <= RANGE_E60.max) return num;
        return RANGE_E60.fallback;
    }

    /**
     * E68 - Jarak Offline Est (km)
     * Range: 0.01 - 500
     * @param {number|string} [value]
     * @returns {number}
     */
    function E68(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E68.min && num <= RANGE_E68.max) return num;
        return RANGE_E68.fallback;
    }

    /**
     * E70 - Waktu Offline Est (menit)
     * Range: 1 - 1000
     * @param {number|string} [value]
     * @returns {number}
     */
    function E70(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E70.min && num <= RANGE_E70.max) return num;
        return RANGE_E70.fallback;
    }

    /**
     * E78 - Jarak Penjemputan Sesungguhnya (km)
     * Range: 0.01 - 500
     * @param {number|string} [value]
     * @returns {number}
     */
    function E78(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E78.min && num <= RANGE_E78.max) return num;
        return RANGE_E78.fallback;
    }

    /**
     * E80 - Waktu Penjemputan Sesungguhnya (menit)
     * Range: 1 - 1000
     * @param {number|string} [value]
     * @returns {number}
     */
    function E80(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E80.min && num <= RANGE_E80.max) return num;
        return RANGE_E80.fallback;
    }

    /**
     * E82 - Jarak Pengantaran Sesungguhnya (km)
     * Range: 0.01 - 500
     * @param {number|string} [value]
     * @returns {number}
     */
    function E82(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E82.min && num <= RANGE_E82.max) return num;
        return RANGE_E82.fallback;
    }

    /**
     * E84 - Waktu Pengantaran Sesungguhnya (menit)
     * Range: 1 - 1000
     * @param {number|string} [value]
     * @returns {number}
     */
    function E84(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E84.min && num <= RANGE_E84.max) return num;
        return RANGE_E84.fallback;
    }

    /**
     * E92 - Biaya Aplikasi Penumpang (Reality)
     * Range: 0 - 100000
     * @param {number|string} [value]
     * @returns {number}
     */
    function E92(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E92.min && num <= RANGE_E92.max) return num;
        return RANGE_E92.fallback;
    }

    /**
     * E100 - Biaya Tambahan Parkir (Reality Offline)
     * Range: 0 - 100000
     * @param {number|string} [value]
     * @returns {number}
     */
    function E100(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E100.min && num <= RANGE_E100.max) return num;
        return RANGE_E100.fallback;
    }

    /**
     * E102 - Biaya Tambahan Tol (Reality Offline)
     * Range: 0 - 500000
     * @param {number|string} [value]
     * @returns {number}
     */
    function E102(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E102.min && num <= RANGE_E102.max) return num;
        return RANGE_E102.fallback;
    }

    /**
     * E104 - Biaya Tambahan Lainnya (Reality Offline)
     * Range: 0 - 500000
     * @param {number|string} [value]
     * @returns {number}
     */
    function E104(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E104.min && num <= RANGE_E104.max) return num;
        return RANGE_E104.fallback;
    }

    // ==================== PEMBUNGKUS BERTAHAP ====================

    /**
     * validateHome(input)
     * Halaman 1 – Data Kendaraan.
     * @param {Object} input - { E10, E12, E20, E22, E24, E26, E28 }
     * @returns {Object} hasil validasi home
     */
    function validateHome(input) {
        const home = {};
        home.E10 = E10(input.E10);
        home.E12 = E12(input.E12);
        home.E20 = E20(input.E20);
        home.E26 = E26(input.E26);
        home.E28 = E28(input.E28);

        home.E22 = E22(input.E22, { E10: home.E10 });
        home.E24 = E24(input.E24, { E10: home.E10, E22: home.E22 });

        return home;
    }

    /**
     * validateOrder(input, home)
     * Halaman 2 – Data Order.
     * @param {Object} input - order mentah
     * @param {Object} home - hasil validateHome
     * @returns {Object} hasil validasi order
     */
    function validateOrder(input, home) {
        const safeHome = home || validateHome({});
        const order = {};
        order.E36 = E36(input.E36);
        order.E38 = E38(input.E38);
        order.E40 = E40(input.E40, { E10: safeHome.E10 });
        order.E46 = E46(input.E46, { E10: safeHome.E10, E22: safeHome.E22 });

        order.E54 = E54(input.E54);
        order.E56 = E56(input.E56);
        order.E58 = E58(input.E58);
        order.E60 = E60(input.E60);
        order.E68 = E68(input.E68);
        order.E70 = E70(input.E70);

        return order;
    }

    /**
     * validateEstimate(input, home?)
     * Gabungan Home + Order.
     * @param {Object} input
     * @param {Object} [home] - opsional
     * @returns {Object}
     */
    function validateEstimate(input, home) {
        const validHome = home || validateHome(input);
        const validOrder = validateOrder(input, validHome);
        return Object.assign({}, validHome, validOrder);
    }

    /**
     * validateReality(input)
     * Halaman Reality/Tracking.
     * @param {Object} input
     * @returns {Object}
     */
    function validateReality(input) {
        return {
            E78: E78(input.E78),
            E80: E80(input.E80),
            E82: E82(input.E82),
            E84: E84(input.E84),
            E92: E92(input.E92),
            E100: E100(input.E100),
            E102: E102(input.E102),
            E104: E104(input.E104)
        };
    }

    /**
     * validate(input)
     * Validasi penuh semua field.
     * @param {Object} input
     * @returns {Object}
     */
    function validate(input) {
        const home = validateHome(input);
        const order = validateOrder(input, home);
        const reality = validateReality(input);
        return Object.assign({}, home, order, reality);
    }

    /**
     * validateCell(cell, value, context?)
     * @param {string} cell
     * @param {*} value
     * @param {Object} [context]
     * @returns {*}
     */
    function validateCell(cell, value, context) {
        const fnMap = {
            E10, E12, E20, E22, E24, E26, E28,
            E36, E38, E40, E46,
            E54, E56, E58, E60,
            E68, E70,
            E78, E80, E82, E84,
            E92, E100, E102, E104
        };
        const fn = fnMap[cell];
        if (typeof fn === 'function') {
            if (['E22', 'E24', 'E40', 'E46'].includes(cell)) return fn(value, context);
            return fn(value);
        }
        return undefined;
    }

    // ==================== FUNGSI BANTUAN UI ====================

    /**
     * getDropdownOptions(cell, context?)
     * Opsi dropdown untuk sel tertentu.
     * @param {string} cell
     * @param {Object} [context]
     * @returns {string[]}
     */
    function getDropdownOptions(cell, context) {
        switch (cell) {
            case 'E10': return VALID_E10.slice();
            case 'E12': return VALID_E12.slice();
            case 'E20': return VALID_E20.slice();
            case 'E26': return VALID_E26.slice();
            case 'E28': return VALID_E28.slice();
            case 'E36': return VALID_E36.slice();
            case 'E38': return VALID_E38.slice();
            case 'E22': {
                const mode = (context && context.E10) ? context.E10 : DEFAULT_E10;
                return (mode === 'Mobil' ? VALID_CC_MOBIL : VALID_CC_MOTOR).slice();
            }
            case 'E24': {
                const mode = (context && context.E10) ? context.E10 : DEFAULT_E10;
                const cc = (context && context.E22) ? context.E22 : E22(undefined, { E10: mode });
                if (cc === 'Listrik') {
                    return (mode === 'Mobil' ? VALID_BBM_LISTRIK_MOBIL : VALID_BBM_LISTRIK_MOTOR).slice();
                }
                if (mode === 'Motor') return VALID_BBM_MOTOR.slice();
                if (cc === '1000cc' || cc === '1500cc') return VALID_BBM_MOBIL_1000_1500.slice();
                return VALID_BBM_MOBIL_2000.slice();
            }
            case 'E46': {
                const mode = (context && context.E10) ? context.E10 : DEFAULT_E10;
                const cc = (context && context.E22) ? context.E22 : E22(undefined, { E10: mode });
                return getServiceOptions(mode, cc);
            }
            default: return [];
        }
    }

    /**
     * getServiceOptions(mode, cc)
     * @param {string} mode - 'Mobil' / 'Motor'
     * @param {string} cc
     * @returns {string[]}
     */
    function getServiceOptions(mode, cc) {
        if (mode === 'Mobil') {
            return (cc === '1000cc') ? VALID_E46_MOBIL_1000cc.slice() : VALID_E46_MOBIL_NOT_1000cc.slice();
        } else {
            return (cc === '125cc') ? VALID_E46_MOTOR_125cc.slice() : VALID_E46_MOTOR_NOT_125cc.slice();
        }
    }

    /**
     * getValidationRange(cell, context?)
     * Mengembalikan { min, max, fallback } untuk input numerik.
     * @param {string} cell
     * @param {Object} [context]
     * @returns {{ min: number, max: number, fallback: number } | null}
     */
    function getValidationRange(cell, context) {
        if (cell === 'E40') {
            const mode = (context && context.E10) ? context.E10 : DEFAULT_E10;
            const r = mode === 'Mobil' ? RANGE_E40_MOBIL : RANGE_E40_MOTOR;
            return { min: r.min, max: r.max, fallback: r.fallback };
        }
        const map = {
            E54: RANGE_E54, E56: RANGE_E56, E58: RANGE_E58, E60: RANGE_E60,
            E68: RANGE_E68, E70: RANGE_E70,
            E78: RANGE_E78, E80: RANGE_E80, E82: RANGE_E82, E84: RANGE_E84,
            E92: RANGE_E92, E100: RANGE_E100, E102: RANGE_E102, E104: RANGE_E104
        };
        const r = map[cell];
        return r ? { min: r.min, max: r.max, fallback: r.fallback } : null;
    }

    /**
     * getDefaultValues()
     * Nilai default untuk tampilan pertama UI.
     * - Non‑numerik diambil dari hasil validasi kosong.
     * - Semua input numerik independen = null (placeholder kosong).
     * - Input dependen (E40) dihitung dari default E10. Jika E10 tidak diketahui
     *   (tidak mungkin terjadi), diisi null.
     *
     * @returns {Object}
     */
    function getDefaultValues() {
        const defaultHome = validateHome({});
        const defaultOrder = validateOrder({}, defaultHome);

        return {
            // non‑numerik – dari hasil validasi kosong
            E10: defaultHome.E10,
            E12: defaultHome.E12,
            E20: defaultHome.E20,
            E22: defaultHome.E22,
            E24: defaultHome.E24,
            E26: defaultHome.E26,
            E28: defaultHome.E28,
            E36: defaultOrder.E36,
            E38: defaultOrder.E38,
            E46: defaultOrder.E46,
            // numerik dependen – dihitung dari dependensi yang tersedia
            E40: defaultHome.E10 ? E40(undefined, { E10: defaultHome.E10 }) : null,
            // numerik independen – null sebagai placeholder
            E54: null, E56: null, E58: null, E60: null,
            E68: null, E70: null, E78: null, E80: null,
            E82: null, E84: null, E92: null,
            E100: null, E102: null, E104: null
        };
    }

    // ==================== EKSPOR ====================
    return {
        F_V,

        // Fungsi cell satuan
        E10, E12, E20, E22, E24, E26, E28,
        E36, E38, E40, E46,
        E54, E56, E58, E60,
        E68, E70,
        E78, E80, E82, E84,
        E92, E100, E102, E104,

        // Pembungkus bertahap
        validateHome,
        validateOrder,
        validateEstimate,
        validateReality,
        validate,

        // Validasi cell tunggal
        validateCell,

        // Bantuan UI
        getDropdownOptions,
        getServiceOptions,
        getValidationRange,
        getDefaultValues
    };
})();

if (typeof window !== 'undefined') {
    window.Valid = Valid;
    console.log('[VALID] v' + Valid.F_V + ' dimuat');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Valid };
}

// ================================= CHANGELOG =================================
// 1.0.1-rev0 : Perubahan default value numerik menjadi null, pemisahan konsep
//              fallback (range) dengan default UI. Input dependen (E40) dihitung
//              dari dependensi saat menentukan default. Properti range menggunakan
//              "fallback". getValidationRange mengembalikan fallback.
//              getDefaultValues menyediakan null untuk numerik independen
//              dan nilai hasil perhitungan untuk E40.
// ================================ End Of File ================================