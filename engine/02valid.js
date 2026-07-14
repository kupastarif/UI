/**
 * =============================================================================
 * FILE        : /engine/02valid.js
 * VERSI FILE  : 1.0.0-rev3
 * ENGINE      : 1.0.0-beta
 * DATA SOURCE : Excel "v9.7j masterapp.xlsx" — Sheet "v9.7j-All"
 */
const Valid = (function() {
    'use strict';

    const F_V = '1.0.0-rev3';

    const DEFAULT_E10 = 'Mobil';
    const DEFAULT_E12 = 'Driver';
    const DEFAULT_E20 = 'Jabodetabek';
    const DEFAULT_E26 = 'manual';
    const DEFAULT_E28 = 'individu';
    const DEFAULT_E36 = 'online';
    const DEFAULT_E38 = 'wajar';
    const DEFAULT_E46 = 'Standar';

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

    const RANGE_E40_MOBIL = { min: 0.4, max: 3, default: 0.4 };
    const RANGE_E40_MOTOR = { min: 0.2, max: 3, default: 0.2 };
    const RANGE_E54 = { min: 10000, max: 10000000, default: 11111 };
    const RANGE_E56 = { min: 10000, max: 10000000, default: 11111 };
    const RANGE_E58 = { min: 0, max: 500, default: 0 };
    const RANGE_E60 = { min: 0, max: 1000, default: 0 };
    const RANGE_E68 = { min: 0.01, max: 500, default: 0.01 };
    const RANGE_E70 = { min: 1, max: 1000, default: 1 };
    const RANGE_E78 = { min: 0.01, max: 500, default: 0.01 };
    const RANGE_E80 = { min: 1, max: 1000, default: 1 };
    const RANGE_E82 = { min: 0.01, max: 500, default: 0.01 };
    const RANGE_E84 = { min: 1, max: 1000, default: 1 };
    const RANGE_E92 = { min: 0, max: 100000, default: 0 };
    const RANGE_E100 = { min: 0, max: 100000, default: 0 };
    const RANGE_E102 = { min: 0, max: 500000, default: 0 };
    const RANGE_E104 = { min: 0, max: 500000, default: 0 };

    function E10(value) {
        if (typeof value === 'string' && VALID_E10.includes(value)) return value;
        return DEFAULT_E10;
    }

    function E12(value) {
        if (typeof value === 'string' && VALID_E12.includes(value)) return value;
        return DEFAULT_E12;
    }

    function E20(value) {
        if (typeof value === 'string' && VALID_E20.includes(value)) return value;
        return DEFAULT_E20;
    }

    function E22(value, context) {
        const mode = (context && context.E10) ? context.E10 : DEFAULT_E10;
        const validList = mode === 'Mobil' ? VALID_CC_MOBIL : VALID_CC_MOTOR;
        if (typeof value === 'string' && validList.includes(value)) return value;
        return mode === 'Mobil' ? '1000cc' : '125cc';
    }

    function E24(value, context) {
        const mode = (context && context.E10) ? context.E10 : DEFAULT_E10;
        const cc = (context && context.E22) ? context.E22 : E22(undefined, { E10: mode });
        if (cc === 'Listrik') {
            if (mode === 'Motor') {
                return (value === 'Swap Battery') ? value : 'Swap Battery';
            } else {
                return (value === 'SPKLU+') ? value : 'SPKLU+';
            }
        }
        if (mode === 'Motor') {
            return (value === 'Pertalite') ? value : 'Pertalite';
        }
        if (cc === '1000cc' || cc === '1500cc') {
            return (value === 'Pertalite') ? value : 'Pertalite';
        }
        if (value === 'Pertamax' || value === 'Bio Solar') return value;
        return 'Pertamax';
    }

    function E26(value) {
        if (typeof value === 'string' && VALID_E26.includes(value)) return value;
        return DEFAULT_E26;
    }

    function E28(value) {
        if (typeof value === 'string' && VALID_E28.includes(value)) return value;
        return DEFAULT_E28;
    }

    function E36(value) {
        if (typeof value === 'string' && VALID_E36.includes(value)) return value;
        return DEFAULT_E36;
    }

    function E38(value) {
        if (typeof value === 'string' && VALID_E38.includes(value)) return value;
        return DEFAULT_E38;
    }

    function E40(value, context) {
        const mode = (context && context.E10) ? context.E10 : DEFAULT_E10;
        const range = mode === 'Mobil' ? RANGE_E40_MOBIL : RANGE_E40_MOTOR;
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= range.min && num <= range.max) return num;
        return range.default;
    }

    function E46(value, context) {
        const mode = (context && context.E10) ? context.E10 : DEFAULT_E10;
        const cc = (context && context.E22) ? context.E22 : E22(undefined, { E10: mode });
        const options = getServiceOptions(mode, cc);
        if (typeof value === 'string' && options.includes(value)) return value;
        return DEFAULT_E46;
    }

    function E54(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E54.min && num <= RANGE_E54.max) return num;
        return RANGE_E54.default;
    }

    function E56(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E56.min && num <= RANGE_E56.max) return num;
        return RANGE_E56.default;
    }

    function E58(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E58.min && num <= RANGE_E58.max) return num;
        return RANGE_E58.default;
    }

    function E60(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E60.min && num <= RANGE_E60.max) return num;
        return RANGE_E60.default;
    }

    function E68(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E68.min && num <= RANGE_E68.max) return num;
        return RANGE_E68.default;
    }

    function E70(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E70.min && num <= RANGE_E70.max) return num;
        return RANGE_E70.default;
    }

    function E78(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E78.min && num <= RANGE_E78.max) return num;
        return RANGE_E78.default;
    }

    function E80(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E80.min && num <= RANGE_E80.max) return num;
        return RANGE_E80.default;
    }

    function E82(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E82.min && num <= RANGE_E82.max) return num;
        return RANGE_E82.default;
    }

    function E84(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E84.min && num <= RANGE_E84.max) return num;
        return RANGE_E84.default;
    }

    function E92(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E92.min && num <= RANGE_E92.max) return num;
        return RANGE_E92.default;
    }

    function E100(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E100.min && num <= RANGE_E100.max) return num;
        return RANGE_E100.default;
    }

    function E102(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E102.min && num <= RANGE_E102.max) return num;
        return RANGE_E102.default;
    }

    function E104(value) {
        const num = Number(value);
        if (typeof value !== 'undefined' && !isNaN(num) && num >= RANGE_E104.min && num <= RANGE_E104.max) return num;
        return RANGE_E104.default;
    }

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

    function validateEstimate(input, home) {
        const validHome = home || validateHome(input);
        const validOrder = validateOrder(input, validHome);
        return Object.assign({}, validHome, validOrder);
    }

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

    function validate(input) {
        const home = validateHome(input);
        const order = validateOrder(input, home);
        const reality = validateReality(input);
        return Object.assign({}, home, order, reality);
    }

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

    function getServiceOptions(mode, cc) {
        if (mode === 'Mobil') {
            return (cc === '1000cc') ? VALID_E46_MOBIL_1000cc.slice() : VALID_E46_MOBIL_NOT_1000cc.slice();
        } else {
            return (cc === '125cc') ? VALID_E46_MOTOR_125cc.slice() : VALID_E46_MOTOR_NOT_125cc.slice();
        }
    }

    function getValidationRange(cell, context) {
        if (cell === 'E40') {
            const mode = (context && context.E10) ? context.E10 : DEFAULT_E10;
            return mode === 'Mobil' ? RANGE_E40_MOBIL : RANGE_E40_MOTOR;
        }
        const map = {
            E54: RANGE_E54, E56: RANGE_E56, E58: RANGE_E58, E60: RANGE_E60,
            E68: RANGE_E68, E70: RANGE_E70,
            E78: RANGE_E78, E80: RANGE_E80, E82: RANGE_E82, E84: RANGE_E84,
            E92: RANGE_E92, E100: RANGE_E100, E102: RANGE_E102, E104: RANGE_E104
        };
        return map[cell] || null;
    }

    function getDefaultValues() {
        const defaultHome = validateHome({});
        const defaultOrder = validateOrder({}, defaultHome);
        const defaultReality = validateReality({});
        return Object.assign({}, defaultHome, defaultOrder, defaultReality);
    }

    return {
        F_V,
        E10, E12, E20, E22, E24, E26, E28,
        E36, E38, E40, E46,
        E54, E56, E58, E60,
        E68, E70,
        E78, E80, E82, E84,
        E92, E100, E102, E104,
        validateHome,
        validateOrder,
        validateEstimate,
        validateReality,
        validate,
        validateCell,
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

// ================================ End Of File ================================
