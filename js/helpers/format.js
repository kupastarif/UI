/**
 * =================================================================================
 * FILE         : /js/helpers/format.js
 * FILE VERSION : 2.0a-rev0
 * APP VERSION  : 2.0a-beta
 */
'use strict';

const F_V = '2.0a-rev0';

const THOUSAND_SEP = '.';
const DECIMAL_SEP = ',';

export function parseNumber(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;

    let str = String(value).trim();
    if (str === '') return 0;

    str = str.replace(/^Rp\s*/i, '');
    str = str.replace(/^IDR\s*/i, '');
    str = str.replace(/^\$\s*/i, '');
    str = str.replace(/\s*(km|mnt|menit|jam|hari|minggu|bulan|tahun|%|km\/jam|L)\s*$/i, '');

    const hasComma = str.indexOf(',') !== -1;
    const hasDot = str.indexOf('.') !== -1;

    if (hasComma && hasDot) {
        str = str.replace(/\./g, '').replace(',', '.');
    } else if (hasComma && !hasDot) {
        const parts = str.split(',');
        if (parts.length === 2 && parts[1].length === 3 && parts[0].indexOf(' ') === -1) {
            str = str.replace(',', '');
        } else if (parts.length === 2 && parts[1].length <= 2) {
            str = str.replace(',', '.');
        } else {
            str = str.replace(/,/g, '');
        }
    }

    str = str.replace(/[^\d.-]/g, '');

    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

export function formatNumber(value, options = {}) {
    const {
        decimals = 0,
        thousandsSeparator = THOUSAND_SEP,
        decimalSeparator = DECIMAL_SEP,
        prefix = '',
        suffix = ''
    } = options;

    const num = parseNumber(value);

    if (!isFinite(num)) return prefix + '0' + suffix;

    const fixed = num.toFixed(decimals);
    const parts = fixed.split('.');

    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);

    return prefix + parts.join(decimalSeparator) + suffix;
}

export function formatRupiah(value, withSymbol = true) {
    const num = parseNumber(value);
    const isNegative = num < 0;
    const absNum = Math.abs(num);

    const formatted = formatNumber(absNum, {
        decimals: 0,
        prefix: withSymbol ? 'Rp ' : '',
        thousandsSeparator: THOUSAND_SEP,
        decimalSeparator: DECIMAL_SEP
    });

    return isNegative ? '-' + formatted : formatted;
}

export function formatKm(value, withUnit = true, decimals = 1) {
    return formatNumber(value, {
        decimals,
        suffix: withUnit ? ' km' : '',
        thousandsSeparator: THOUSAND_SEP,
        decimalSeparator: DECIMAL_SEP
    });
}

export function formatMenit(value, withUnit = true) {
    return formatNumber(value, {
        decimals: 0,
        suffix: withUnit ? ' mnt' : '',
        thousandsSeparator: THOUSAND_SEP,
        decimalSeparator: DECIMAL_SEP
    });
}

export function formatJamMenit(menit) {
    const m = parseNumber(menit);
    if (m < 60) return m + ' mnt';

    const jam = Math.floor(m / 60);
    const sisaMenit = m % 60;

    if (sisaMenit === 0) return jam + ' jam';
    return jam + ' jam ' + sisaMenit + ' mnt';
}

export function formatMenitPanjang(value) {
    const menit = parseNumber(value);
    if (menit < 60) return menit + ' mnt';

    const jam = Math.floor(menit / 60);
    const sisaMenit = menit % 60;

    if (sisaMenit === 0) return jam + ' jam';
    return jam + ' jam ' + sisaMenit + ' mnt';
}

export function formatPersen(value, withSymbol = true, decimals = 0) {
    let num = parseNumber(value);

    if (num <= 1 && num > 0 && String(value).indexOf('%') === -1) {
        num = num * 100;
    }

    return formatNumber(num, {
        decimals,
        suffix: withSymbol ? '%' : '',
        thousandsSeparator: THOUSAND_SEP,
        decimalSeparator: DECIMAL_SEP
    });
}

export function formatKmPerJam(value) {
    return formatNumber(value, {
        decimals: 1,
        suffix: ' km/jam',
        thousandsSeparator: THOUSAND_SEP,
        decimalSeparator: DECIMAL_SEP
    });
}

export function formatDurasi(detik) {
    const d = parseNumber(detik);
    const hours = Math.floor(d / 3600);
    const minutes = Math.floor((d % 3600) / 60);
    const seconds = d % 60;
    return padNumber(hours, 2) + ':' + padNumber(minutes, 2) + ':' + padNumber(seconds, 2);
}

export function formatTanggal(timestamp) {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return padNumber(date.getDate(), 2) + '/' + padNumber(date.getMonth() + 1, 2) + '/' + date.getFullYear();
}

export function formatJam(timestamp) {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return padNumber(date.getHours(), 2) + ':' + padNumber(date.getMinutes(), 2);
}

export function formatTanggalJam(timestamp) {
    return formatTanggal(timestamp) + ' ' + formatJam(timestamp);
}

export function formatRelativeTime(timestamp) {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'baru saja';
    if (diffHour < 1) return diffMin + ' mnt lalu';
    if (diffDay < 1) return diffHour + ' jam lalu';
    if (diffDay === 1) return 'kemarin';
    if (diffDay < 7) return diffDay + ' hr lalu';
    if (diffDay < 30) return Math.floor(diffDay / 7) + ' mgg lalu';
    if (diffDay < 365) return Math.floor(diffDay / 30) + ' bln lalu';
    return Math.floor(diffDay / 365) + ' thn lalu';
}

export function detikToMenitCeil(detik) {
    if (detik <= 0) return 0;
    return Math.ceil(detik / 60);
}

export function calculateBattleStats(historyItems) {
    let driver = 0, app = 0;
    for (let i = 0; i < historyItems.length; i++) {
        const r = historyItems[i].result || {};
        driver += r.E981 || 0;
        app += r.E982 || 0;
    }
    const total = driver + app;
    return {
        driver: { value: driver, percent: total > 0 ? (driver / total) * 100 : 0 },
        app: { value: app, percent: total > 0 ? (app / total) * 100 : 0 },
        totalMatch: historyItems.length
    };
}

export function calculateHistoryStats(filteredItems) {
    let driver = 0, app = 0, bbm = 0, kendaraan = 0, passenger = 0;
    for (let i = 0; i < filteredItems.length; i++) {
        const r = filteredItems[i].result || {};
        driver += r.E981 || 0;
        app += r.E982 || 0;
        bbm += r.E911 || 0;
        kendaraan += r.E963 || 0;
        passenger += r.E697 || 0;
    }
    const total = driver + app + bbm + kendaraan;
    return {
        driver: { value: driver, percent: total > 0 ? (driver / total) * 100 : 0 },
        app: { value: app, percent: total > 0 ? (app / total) * 100 : 0 },
        bbm: { value: bbm, percent: total > 0 ? (bbm / total) * 100 : 0 },
        kendaraan: { value: kendaraan, percent: total > 0 ? (kendaraan / total) * 100 : 0 },
        passenger: { value: passenger, percent: 100 }
    };
}

export function getTrophyWinner(data) {
    const driver = data.driver?.value || 0;
    const app = data.app?.value || 0;

    if (driver > app) return 'driver';
    if (app > driver) return 'app';
    return null;
}

export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function escapeXml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export function padNumber(num, size) {
    let s = String(num);
    while (s.length < size) s = '0' + s;
    return s;
}

export function capitalize(str) {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function truncate(str, maxLength) {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
}

export function getAreaLabel(area) {
    const labels = {
        'Jabodetabek': 'Jabodetabek',
        'SumatraJawa': 'Sumatra & Jawa',
        'TimurIndonesia': 'Timur Indonesia'
    };
    return labels[area] || area;
}

// ================================ End Of File ================================