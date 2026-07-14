/**
 * =================================================================================
 * FILE         : /js/pages/report.js
 * FILE VERSION : 2.0a-rev2
 * APP VERSION  : 2.0a-beta
 */
'use strict';

const F_V = '2.0a-rev2';

import { Router } from '../core/router.js';
import { StateManager } from '../core/state.js';
import { StorageManager } from '../core/storage.js';
import { HeaderManager } from '../components/header.js';
import { FooterManager } from '../components/footer.js';
import { Texts } from '../helpers/texts.js';
import {
    formatRupiah, formatKm, formatMenit, formatPersen, escapeHtml
} from '../helpers/format.js';

const ICON = {
    REPORT: '📊', MOTOR: '🏍️', MOBIL: '🚗', GEAR: '⚙️', MONEY: '💰',
    INFO: 'ⓘ', TROPHY: '🏆', TARGET: '🎯', CHART: '📈', COPY: '📋',
    DETAIL: '🔍', SHOW_MAP: '🗺️', FUEL: '⛽', MAINTENANCE: '🔧',
    BACK: '◀', HOME: '🏠', SPEED: '⚡', DEPRECIATION: '📉', TAX: '📄'
};

let isDestroyed = false;
let refId = null;
let historyItem = null;
let result = null;
let vehicleData = {};
let driverInfo = { name: '', plate: '', phone: '' };
let role = 'Driver';
let mode = 'online';
let isOffline = false;
let isOperational = false;
let hasTracking = false;
let source = 'result';
let currentHeader = null;

function loadData(refIdParam, sourceParam) {
    if (!refIdParam) return false;
    refId = refIdParam;
    source = sourceParam || 'result';
    historyItem = StorageManager ? StorageManager.getHistoryByRefId(refIdParam) : null;
    if (!historyItem) return false;
    result = historyItem.result || {};
    vehicleData = historyItem.input || {};
    role = vehicleData.E12 || 'Driver';
    mode = vehicleData.E36 || 'online';
    isOffline = mode === 'offline';
    isOperational = historyItem.type === 'operational' || mode === 'operational';
    hasTracking = historyItem.hasTracking || false;
    driverInfo = historyItem.driverInfo || (StorageManager ? StorageManager.getDriverInfo() : { name: '', plate: '', phone: '' });
    return true;
}

function getSarcasm() {
    const driver = result.E981 || 0;
    const app = result.E982 || 0;
    if (isOperational) return 'Perjalanan operasional tercatat!';
    if (Texts?.getSarcasm) return Texts.getSarcasm(driver, app);
    if (driver < 0) return 'Driver bayar aplikasi?';
    if (app > driver * 2) return 'Aplikasi terbang...';
    if (app > driver) return 'Aplikasi lebih untung';
    if (driver > app * 1.5) return 'Driver juaranya!';
    if (driver > app) return 'Driver unggul, lumayan';
    return 'Imbang, bagi rata';
}

function formatPlain(value) { return String(Math.round(value || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

function formatJamBulat(jam) {
    const value = Math.round(jam || 0);
    return value > 24 ? `<span class="driver-kritis">${value} jam</span>` : (value > 12 ? `<span class="driver-rendah">${value} jam</span>` : `${value} jam`);
}

function createPrimaryCardHeader(icon, title, helpKey, buttonHTML) {
    const helpIcon = helpKey ? `<span class="input-info" data-help="${helpKey}">${ICON.INFO}</span>` : '';
    return `<div class="report-primary-header"><div class="report-primary-title"><span>${icon}</span><span>${title}</span>${helpIcon}</div><div class="report-primary-actions">${buttonHTML}</div></div>`;
}

function renderKartu1() {
    const sarcasm = getSarcasm();
    const vehicleMode = vehicleData.E10 || 'Mobil';
    const modeIcon = vehicleMode === 'Motor' ? ICON.MOTOR : ICON.MOBIL;
    const cc = vehicleData.E22 || (vehicleMode === 'Motor' ? '125cc' : '1000cc');
    const service = vehicleData.E46 || 'Standar';
    const speed = result.E873 || 0;
    const driverInfoText = (role === 'Driver' && driverInfo.name) ? `<div class="report-driver">${escapeHtml(driverInfo.name)} . ${escapeHtml(driverInfo.plate)} . ${escapeHtml(driverInfo.phone)}</div>` : '';
    const headerTitle = isOperational ? 'LAPORAN OPERASIONAL' : 'LAPORAN PERJALANAN';
    return `<div class="card"><div class="report-header text-center"><div class="report-title">${ICON.REPORT} ${headerTitle}</div><div class="report-sarcasm">"${sarcasm}"</div><div class="report-vehicle">${modeIcon} ${cc} . ${service} . ${ICON.SPEED} ${speed.toFixed(1)} km/jam</div>${driverInfoText}<div class="report-ref">ref: ${refId}</div></div></div>`;
}

function renderKartu2() {
    if (isOperational) {
        const operational = (result.E960 || 0) - (result.E807 || 0);
        const bbm = result.E911 || 0, maintenance = result.E935 || 0, depreciation = result.E825 || 0, tax = result.E841 || 0;
        return `<div class="card"><div class="card-header"><span class="card-title">${ICON.GEAR} BIAYA OPERASIONAL</span></div><div class="report-keuangan-grid"><div class="keuangan-item"><div class="keuangan-label">${ICON.FUEL} BBM</div><div class="keuangan-value">${formatRupiah(bbm)}</div></div><div class="keuangan-item"><div class="keuangan-label">${ICON.MAINTENANCE} Perawatan</div><div class="keuangan-value">${formatRupiah(maintenance)}</div></div><div class="keuangan-item"><div class="keuangan-label">${ICON.DEPRECIATION} Penyusutan</div><div class="keuangan-value">${formatRupiah(depreciation)}</div></div><div class="keuangan-item"><div class="keuangan-label">${ICON.TAX} Pajak</div><div class="keuangan-value">${formatRupiah(tax)}</div></div></div><div class="pendapatan-group" style="margin-top: var(--space-md);"><div class="pendapatan-row total"><span>Total Biaya</span><span>${formatRupiah(operational)}</span></div></div></div>`;
    }
    const driver = result.E981 || 0, app = result.E982 || 0, operational = result.E960 || 0, passenger = result.E697 || 0;
    const driverPct = (result.E984 || 0) * 100, appPct = (result.E983 || 0) * 100, opPct = (result.E985 || 0) * 100;
    const winner = driver > app ? 'driver' : (app > driver ? 'app' : null);
    const driverGlow = winner === 'driver' ? 'trophy-glow' : '', appGlow = winner === 'app' ? 'trophy-glow' : '';
    return `<div class="card"><div class="card-header"><span class="card-title">${ICON.MONEY} PEMBAGIAN KEUANGAN <span class="input-info" data-help="report-keuangan">${ICON.INFO}</span></span></div><div class="report-keuangan-grid"><div class="keuangan-item ${driverGlow}"><div class="keuangan-label">${winner === 'driver' ? ICON.TROPHY + ' ' : ''}DRIVER</div><div class="keuangan-value">${formatRupiah(driver)}</div><div class="keuangan-percent">${formatPersen(driverPct)}</div></div><div class="keuangan-item ${appGlow}"><div class="keuangan-label">${winner === 'app' ? ICON.TROPHY + ' ' : ''}APLIKASI</div><div class="keuangan-value">${formatRupiah(app)}</div><div class="keuangan-percent">${formatPersen(appPct)}</div></div><div class="keuangan-item"><div class="keuangan-label">OPERASIONAL</div><div class="keuangan-value">${formatRupiah(operational)}</div><div class="keuangan-percent">${formatPersen(opPct)}</div></div><div class="keuangan-item"><div class="keuangan-label">PENUMPANG</div><div class="keuangan-value">${formatRupiah(passenger)}</div><div class="keuangan-percent">100%</div></div></div></div>`;
}

function renderKartu3() {
    if (isOperational) return '';
    const target = result.E1002 || 0, driverJam = result.E1061 || 0, appJam = result.E1066 || 0;
    return `<div class="card">${createPrimaryCardHeader(ICON.TARGET, 'TARGET BULANAN', 'report-target', '')}<div class="report-sub-card"><div class="report-row"><span class="report-label">Target per Bulan</span><span class="report-value font-bold">${formatRupiah(target)}</span></div><div class="report-row"><span class="report-label">Driver per Order <span class="text-muted">(Jam Kerja Sehari)</span></span><span class="report-value">${formatJamBulat(driverJam)}</span></div><div class="report-row"><span class="report-label">Aplikasi per Driver <span class="text-muted">(Jam Kerja Sehari)</span></span><span class="report-value">${formatJamBulat(appJam)}</span></div></div></div>`;
}

function renderKartu4() {
    if (isOperational) return '';
    const driver4h = result.E1062 || 0, driver8h = result.E1063 || 0, driver12h = result.E1064 || 0;
    const app4h = result.E1067 || 0, app8h = result.E1068 || 0, app12h = result.E1069 || 0;
    const individu4h = result.E1088 || 0, individu8h = result.E1089 || 0, individu12h = result.E1090 || 0;
    const vendor4h = result.E1094 || 0, vendor8h = result.E1095 || 0, vendor12h = result.E1096 || 0;
    return `<div class="card">${createPrimaryCardHeader(ICON.CHART, 'PROYEKSI', 'report-proyeksi', '')}<div class="report-sub-card"><div class="proyeksi-title">PROYEKSI MIMPI</div><table class="proyeksi-table"><thead><tr><th style="text-align: left;">Jam</th><th style="text-align: right;">DRIVER</th>${mode === 'online' ? '<th style="text-align: right;">APLIKASI</th>' : ''}</tr></thead><tbody><tr><td style="text-align: left;">4 jam</td><td style="text-align: right;">${formatPlain(driver4h)}</td>${mode === 'online' ? `<td style="text-align: right;">${formatPlain(app4h)}</td>` : ''}</tr><tr><td style="text-align: left;">8 jam</td><td style="text-align: right;">${formatPlain(driver8h)}</td>${mode === 'online' ? `<td style="text-align: right;">${formatPlain(app8h)}</td>` : ''}</tr><tr><td style="text-align: left;">12 jam</td><td style="text-align: right;">${formatPlain(driver12h)}</td>${mode === 'online' ? `<td style="text-align: right;">${formatPlain(app12h)}</td>` : ''}</tr></tbody></table><p class="proyeksi-note">* berdasarkan claim aplikasi, gacor tanpa jeda</p></div><div class="report-sub-card"><div class="proyeksi-title">PROYEKSI REALISTIS</div><table class="proyeksi-table"><thead><tr><th style="text-align: left;">Jam</th><th style="text-align: right;">INDIVIDU</th><th style="text-align: right;">VENDOR</th></tr></thead><tbody><tr><td style="text-align: left;">4 jam</td><td style="text-align: right;">${formatPlain(individu4h)}</td><td style="text-align: right;">${formatPlain(vendor4h)}</td></tr><tr><td style="text-align: left;">8 jam</td><td style="text-align: right;">${formatPlain(individu8h)}</td><td style="text-align: right;">${formatPlain(vendor8h)}</td></tr><tr><td style="text-align: left;">12 jam</td><td style="text-align: right;">${formatPlain(individu12h)}</td><td style="text-align: right;">${formatPlain(vendor12h)}</td></tr></tbody></table><p class="proyeksi-note">* berdasarkan UMR, dengan jeda dan ongkos ngider</p></div></div>`;
}

function renderKartu5() {
    if (isOperational) return '';
    const appFee = result.E693 || 0, appCommission = result.E699 || 0, mapLoad = result.E807 || 0;
    const totalApp = result.E982 || 0, passengerPayment = result.E697 || 0, additionalFees = result.E744 || 0;
    const operational = result.E960 || 0, totalDriver = result.E981 || 0, welfareDriver = result.E701 || 0;
    const langgananHemat = result.E805 || 0;
    const isMotorHematOnline = !isOperational && mode === 'online' && vehicleData.E10 === 'Motor' && vehicleData.E46 === 'Hemat';
    const formatPengurang = v => `<span class="text-danger">-${formatRupiah(v)}</span>`;
    return `<div class="card">${createPrimaryCardHeader(ICON.MONEY, 'INFO PENDAPATAN', 'report-pendapatan', '')}<div class="report-sub-card"><div class="group-title">APLIKASI</div><div class="report-row"><span class="report-label">Jasa Aplikasi Penumpang</span><span class="report-value">${formatRupiah(appFee)}</span></div>${isMotorHematOnline ? `<div class="report-row"><span class="report-label">Biaya Langganan Hemat</span><span class="report-value">${formatRupiah(langgananHemat)}</span></div>` : ''}<div class="report-row"><span class="report-label">Komisi Driver</span><span class="report-value">${formatRupiah(appCommission)}</span></div><div class="pendapatan-sub-row text-muted italic"><span>Kesejahteraan Driver Tapi Aplikasi</span><span>${formatRupiah(welfareDriver)}</span></div><div class="report-row"><span class="report-label">Biaya Load Google Map</span><span class="report-value">${formatPengurang(mapLoad)}</span></div><div class="report-row report-total"><span>Total Aplikasi</span><span class="report-value font-bold">${formatRupiah(totalApp)}</span></div></div><div class="report-sub-card"><div class="group-title">DRIVER</div><div class="report-row"><span class="report-label">Pembayaran Penumpang</span><span class="report-value">${formatRupiah(passengerPayment)}</span></div><div class="report-row"><span class="report-label">Jasa Aplikasi Penumpang</span><span class="report-value">${formatPengurang(appFee)}</span></div>${isMotorHematOnline ? `<div class="report-row"><span class="report-label">Biaya Langganan Hemat</span><span class="report-value">${formatPengurang(langgananHemat)}</span></div>` : ''}<div class="report-row"><span class="report-label">Komisi Driver</span><span class="report-value">${formatPengurang(appCommission)}</span></div><div class="report-row"><span class="report-label">Operasional</span><span class="report-value">${formatPengurang(operational)}</span></div>${mode === 'offline' && additionalFees > 0 ? `<div class="report-row"><span class="report-label">Biaya Tambahan</span><span class="report-value">${formatPengurang(additionalFees)}</span></div>` : ''}<div class="report-row report-total"><span>Total Driver</span><span class="report-value font-bold">${formatRupiah(totalDriver)}</span></div></div></div>`;
}

function renderKartu6() {
    if (isOperational) return '';
    const pickupDist = result.E78 || 0, pickupTime = result.E80 || 0, dropoffDist = result.E82 || 0, dropoffTime = result.E84 || 0;
    return `<div class="card">${createPrimaryCardHeader(ICON.COPY, 'INFO PESANAN', 'report-pesanan', '')}<div class="report-sub-card"><div class="report-row"><span class="report-label">Jemput</span><span class="report-value">${formatKm(pickupDist)}, ${formatMenit(pickupTime)}</span></div><div class="report-row"><span class="report-label">Antar</span><span class="report-value">${formatKm(dropoffDist)}, ${formatMenit(dropoffTime)}</span></div>${mode === 'offline' ? `<div class="report-row"><span class="report-label">Tarif per Km</span><span class="report-value">${formatRupiah(result.E679 || 0)}/km</span></div><div class="report-row"><span class="report-label">Tarif per Menit</span><span class="report-value">${formatRupiah(result.E680 || 0)}/mnt</span></div>` : `<div class="report-row"><span class="report-label">Tarif per Km</span><span class="report-value">${formatRupiah(result.E713 || 0)}/km</span></div><div class="report-row"><span class="report-label">Tarif per Menit</span><span class="report-value">${formatRupiah(result.E714 || 0)}/mnt</span></div>`}</div></div>`;
}

function renderKartu7() {
    const r = result;
    const showMapDisabled = hasTracking ? '' : 'disabled';
    const buttonHTML = `<button class="btn btn-sm btn-outline" id="show-map-btn" ${showMapDisabled}>${ICON.SHOW_MAP} SHOW MAP</button>`;
    const headerHTML = createPrimaryCardHeader(ICON.DETAIL, 'RINCIAN PER SEGMEN', 'report-segmen', buttonHTML);
    let html = `<div class="card">${headerHTML}<div class="report-sub-card"><div class="segmen-title">PENJEMPUTAN</div><div class="report-row"><span class="report-label">Jarak</span><span class="report-value">${formatKm(r.E78 || 0)}</span></div><div class="report-row"><span class="report-label">Waktu</span><span class="report-value">${formatMenit(r.E80 || 0)}</span></div><div class="report-row"><span class="report-label">Kecepatan</span><span class="report-value">${(r.E871 || 0).toFixed(1)} km/jam</span></div><div class="segmen-divider"></div><div class="report-row"><span class="report-label">BBM</span><span class="report-value">${formatRupiah(r.E909 || 0)}</span></div><div class="report-row"><span class="report-label">Perawatan</span><span class="report-value">${formatRupiah(r.E933 || 0)}</span></div><div class="report-row"><span class="report-label">Penyusutan</span><span class="report-value">${formatRupiah(r.E823 || 0)}</span></div><div class="report-row"><span class="report-label">Pajak</span><span class="report-value">${formatRupiah(r.E839 || 0)}</span></div><div class="report-row"><span class="report-label">KESP/Atribut</span><span class="report-value">${formatRupiah(r.E855 || 0)}</span></div><div class="segmen-divider"></div><div class="report-row"><span class="report-label">Load Google Map</span><span class="report-value">${formatRupiah(r.E806 || 0)}</span></div><div class="report-row report-total"><span>Total Penjemputan</span><span class="report-value font-bold">${formatRupiah(r.E958 || 0)}</span></div></div><div class="report-sub-card"><div class="segmen-title">PENGANTARAN</div><div class="report-row"><span class="report-label">Jarak</span><span class="report-value">${formatKm(r.E82 || 0)}</span></div><div class="report-row"><span class="report-label">Waktu</span><span class="report-value">${formatMenit(r.E84 || 0)}</span></div><div class="report-row"><span class="report-label">Kecepatan</span><span class="report-value">${(r.E872 || 0).toFixed(1)} km/jam</span></div><div class="segmen-divider"></div><div class="report-row"><span class="report-label">BBM</span><span class="report-value">${formatRupiah(r.E910 || 0)}</span></div><div class="report-row"><span class="report-label">Perawatan</span><span class="report-value">${formatRupiah(r.E934 || 0)}</span></div><div class="report-row"><span class="report-label">Penyusutan</span><span class="report-value">${formatRupiah(r.E824 || 0)}</span></div><div class="report-row"><span class="report-label">Pajak</span><span class="report-value">${formatRupiah(r.E840 || 0)}</span></div><div class="report-row"><span class="report-label">KESP/Atribut</span><span class="report-value">${formatRupiah(r.E856 || 0)}</span></div><div class="segmen-divider"></div><div class="report-row"><span class="report-label">Load Google Map</span><span class="report-value">${formatRupiah(r.E806 || 0)}</span></div>`;
    const parking = r.E100 || 0, toll = r.E102 || 0, other = r.E104 || 0;
    const hasAdditional = (parking > 0 || toll > 0 || other > 0) && !isOperational && mode === 'offline';
    if (hasAdditional) {
        html += `<div class="segmen-divider"></div><div class="report-row"><span class="report-label">Biaya tambahan:</span><span class="report-value"></span></div>`;
        if (parking > 0) html += `<div class="report-row"><span class="report-label text-muted">Parkir</span><span class="report-value text-muted">${formatRupiah(parking)}</span></div>`;
        if (toll > 0) html += `<div class="report-row"><span class="report-label text-muted">Tol</span><span class="report-value text-muted">${formatRupiah(toll)}</span></div>`;
        if (other > 0) html += `<div class="report-row"><span class="report-label text-muted">Lainnya</span><span class="report-value text-muted">${formatRupiah(other)}</span></div>`;
    }
    html += `<div class="report-row report-total"><span>Total Pengantaran</span><span class="report-value font-bold">${formatRupiah(r.E959 || 0)}</span></div></div></div>`;
    return html;
}

function renderKartu8() {
    if (!isOperational) return '';
    const shareCount = result.shareCount || 1, setLimit = result.setLimit || 0;
    const shareResult = result.shareResult || 0, limitResult = result.limitResult || 0;
    const hasShare = shareCount > 1 && shareResult > 0;
    const hasLimit = setLimit >= 1000;
    if (!hasShare && !hasLimit) {
        return `<div class="card">${createPrimaryCardHeader(ICON.FUEL, 'SHARE COST & LIMIT', null, '')}<div class="report-sub-card"><div class="report-row"><span class="report-label text-muted italic">Data share/limit belum tersimpan di history.</span></div></div></div>`;
    }
    let html = `<div class="card">${createPrimaryCardHeader(ICON.FUEL, 'SHARE COST & LIMIT', null, '')}<div class="report-sub-card">`;
    if (hasShare) html += `<div class="report-row"><span class="report-label">Share Cost (${shareCount} orang)</span><span class="report-value">${formatRupiah(shareResult)}</span></div>`;
    if (hasLimit) {
        const sisaClass = limitResult >= 0 ? 'text-success' : 'text-danger';
        html += `<div class="report-row"><span class="report-label">Set Limit</span><span class="report-value">${formatRupiah(setLimit)}</span></div><div class="report-row"><span class="report-label">Sisa Limit</span><span class="report-value ${sisaClass}">${formatRupiah(limitResult)}</span></div>`;
    }
    html += `</div></div>`;
    return html;
}

function renderCatatanCard() {
    if (!Texts?.REPORT_NOTES) return '';
    const filtered = Texts.REPORT_NOTES.filter(item => {
        const t = item.type;
        if (t === 'umum') return true;
        if (t.startsWith('mobil') || t.startsWith('motor')) {
            if (t.includes('listrik') && vehicleData.E22 !== 'Listrik') return false;
            if (!t.includes('listrik') && vehicleData.E22 === 'Listrik') return false;
            if (t.includes('mobil') && vehicleData.E10 !== 'Mobil') return false;
            if (t.includes('motor') && vehicleData.E10 !== 'Motor') return false;
            return true;
        }
        return false;
    });
    if (!filtered.length) return '';
    const itemsHtml = filtered.map(item => `<div class="report-row"><span class="report-label text-muted italic">${item.text}</span></div>`).join('');
    return `<div class="card"><div class="report-sub-card"><div class="report-row"><span class="report-label text-muted italic font-bold">Catatan</span></div>${itemsHtml}</div></div>`;
}

function buildHTML() {
    if (!result) {
        return `<div class="page-container text-center p-lg"><div class="card"><p class="text-danger">Data tidak ditemukan</p><button class="btn btn-primary mt-md" id="back-btn">Kembali</button></div></div>`;
    }
    return `<div class="page-container">${renderKartu1()}${renderKartu2()}${renderKartu3()}${renderKartu4()}${renderKartu5()}${renderKartu6()}${renderKartu7()}${renderKartu8()}${renderCatatanCard()}</div>`;
}

function bindEvents() {
    document.getElementById('show-map-btn')?.addEventListener('click', () => {
        if (hasTracking && refId) Router.navigateTo({ target: 'showmapdetail', refid: refId });
    });
    document.getElementById('back-btn')?.addEventListener('click', () => Router.navigateTo({ target: source === 'history' ? 'history' : 'result' }));
    document.querySelectorAll('[data-help]').forEach(el => el.addEventListener('click', (e) => {
        e.stopPropagation();
        Router.navigateTo({ target: 'popup2', helpKey: el.dataset.help });
    }));
}

function updateHeader() {
    const container = document.getElementById('app-header');
    if (!container || !HeaderManager) return;
    if (currentHeader) HeaderManager.destroy(currentHeader);
    const header = HeaderManager.create('default', { title: window.APP_CONFIG?.siteTitle });
    container.innerHTML = '';
    if (header) { container.appendChild(header); currentHeader = header; }
    else currentHeader = null;
}

function updateFooter() {
    const container = document.getElementById('app-footer');
    if (!container || !FooterManager) return;
    const backTarget = source === 'history' ? 'history' : 'result';
    const footer = FooterManager.create('layoutA', {
        frame1: { type: 'icon', content: FooterManager.createIconButton(ICON.BACK, () => Router.navigateTo({ target: backTarget }), 'Kembali') },
        frame2: { type: 'flex', content: FooterManager.createFlexContent('HOME', ICON.HOME, () => Router.navigateTo({ target: 'home' })) }
    });
    container.innerHTML = '';
    if (footer) container.appendChild(footer);
}

async function render(params, context = {}) {
    const content = document.getElementById('app-content');
    if (!content) return;
    isDestroyed = false;
    if (context.direction !== 'back' && !loadData(params.refid, params.source)) {
        content.innerHTML = `<div class="page-container text-center p-lg"><div class="card"><p class="text-danger">Data tidak ditemukan</p><button class="btn btn-primary mt-md" id="back-btn">Kembali</button></div></div>`;
        updateHeader(); updateFooter(); bindEvents();
        return;
    }
    content.innerHTML = buildHTML();
    bindEvents();
    updateHeader();
    updateFooter();
}

function destroy() {
    isDestroyed = true;
    refId = null; historyItem = null; result = null;
    if (currentHeader) { HeaderManager.destroy(currentHeader); currentHeader = null; }
}

export const PageReport = { render, destroy };
window.log.info('[Report ' + F_V + '] (10) PageReport dimuat (sel v1.0.0‑beta)');
// ================================ End Of File ================================