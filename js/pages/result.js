/**
 * =================================================================================
 * FILE         : /js/pages/result.js
 * FILE VERSION : 2.0a-rev2
 * APP VERSION  : 2.0a-beta
 */
'use strict';

const F_V = '2.0a-rev2';

import { StateManager } from '../core/state.js';
import { Router } from '../core/router.js';
import { StorageManager } from '../core/storage.js';
import { HeaderManager } from '../components/header.js';
import { FooterManager } from '../components/footer.js';
import { ThemeManager } from '../components/theme.js';
import {
    formatRupiah, formatKm, formatMenit, formatTanggal, formatJam,
    escapeHtml
} from '../helpers/format.js';
import {
    encodeRouteData, formatCopyHasil,
    getMaxPickupDistance, getMaxPickupTime
} from '../helpers/output.js';

const ICON = {
    MOTOR: '🏍️', MOBIL: '🚗', COPY: '📋', GEAR: '⚙️', MONEY: '💰',
    RECEIPT_TRIP: '🛣️', BACK: '◀', CAPTURE: '📸', REPORT: '📊'
};

let isDestroyed = false;
let isSubmitting = false;
let realityResult = null;
let vehicleData = {};
let driverInfo = { name: '', plate: '', phone: '' };
let role = 'Driver';
let mode = 'online';
let operationalMode = false;
let refId = '';
let hasTracking = false;
let trackingData = null;
let timestamp = Date.now();
let hasSaved = false;
let currentHeader = null;
let html2canvasLoaded = false;
let html2canvasLoading = false;
let html2canvasPromise = null;

function normalizeInput(input) {
    const sortedKeys = Object.keys(input).sort();
    const normalized = {};
    for (const key of sortedKeys) {
        normalized[key] = input[key];
    }
    return normalized;
}

function loadData() {
    window.log.info('[Result ' + F_V + '] (1) loadData dipanggil');
    if (StateManager) {
        realityResult = StateManager.get('realityResult');
        const input = StateManager.get('input') || {};
        vehicleData = {
            E10: input.E10 || 'Motor',
            E12: input.E12 || 'Driver',
            E20: input.E20 || 'Jabodetabek',
            E22: input.E22 || '125cc',
            E24: input.E24 || 'Pertalite',
            E26: input.E26 || 'manual',
            E28: input.E28 || 'individu',
            E36: input.E36 || 'online',
            E38: input.E38 || 'wajar',
            E46: input.E46 || 'Standar'
        };
        role = vehicleData.E12;
        mode = vehicleData.E36;
        operationalMode = (mode === 'operational') || (StateManager.get('calcMode') === 'operational');
        trackingData = StateManager.get('trackingData');
        hasTracking = !!trackingData;
    }
    if (StorageManager) {
        driverInfo = StorageManager.getDriverInfo();
    }
    timestamp = Date.now();
    window.log.info('[Result ' + F_V + '] (2) Data dimuat | refId=' + refId + ' | operationalMode=' + operationalMode);
}

function saveToHistory() {
    window.log.info('[Result ' + F_V + '] (3) saveToHistory dipanggil');
    if (!realityResult || hasSaved) return;
    const input = StateManager.get('input');
    if (!input) return;
    const normalizedInput = normalizeInput(input);
    const now = new Date();
    const timeKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}`;
    const currentFingerprint = JSON.stringify(normalizedInput) + '|' + timeKey;
    const savedFingerprint = StateManager.get('lastSavedFingerprint');
    const lastInput = StateManager.get('lastInput');

    if (savedFingerprint === currentFingerprint) {
        refId = StateManager.get('lastRefId') || StorageManager.generateRefId();
        timestamp = StateManager.get('lastTimestamp') || Date.now();
        window.log.info('[Result ' + F_V + '] (4) Fingerprint sama, gunakan refId ' + refId + ' (tanpa simpan ulang)');
        hasSaved = true;
        return;
    }
    if (lastInput && JSON.stringify(normalizedInput) === JSON.stringify(normalizeInput(lastInput))) {
        const lastTs = StateManager.get('lastTimestamp') || 0;
        const diffMinutes = (Date.now() - lastTs) / 60000;
        if (diffMinutes < 60) {
            refId = StateManager.get('lastRefId') || StorageManager.generateRefId();
            timestamp = lastTs;
            window.log.info('[Result ' + F_V + '] (5) Input sama dalam 60 menit, gunakan refId ' + refId + ' (tanpa simpan ulang)');
            hasSaved = true;
            return;
        }
    }

    refId = StorageManager.generateRefId();
    timestamp = Date.now();
    const completeResult = realityResult;
    const currentDriverInfo = StorageManager?.getDriverInfo() || { name: '', plate: '', phone: '' };

    const historyItem = {
        refId,
        timestamp,
        input: input,
        result: completeResult,
        hasTracking,
        type: operationalMode ? 'operational' : 'standard',
        driverInfo: currentDriverInfo
    };
    if (hasTracking && trackingData) {
        historyItem.trackingData = trackingData;
    }

    const success = StorageManager.saveHistoryItem(historyItem);
    if (success) {
        hasSaved = true;
        StateManager.set('lastSavedFingerprint', currentFingerprint);
        StateManager.set('lastRefId', refId);
        StateManager.set('lastTimestamp', timestamp);
        StateManager.set('lastInput', normalizedInput);
        window.log.info('[Result ' + F_V + '] (7) History disimpan: refId=' + refId);
    } else {
        window.log.error('[Result ' + F_V + '] (8) Gagal menyimpan history');
        ThemeManager?.showToast('Gagal menyimpan riwayat', 'error');
    }
}

function preloadHtml2Canvas() {
    if (html2canvasLoaded || html2canvasLoading) return;
    html2canvasLoading = true;
    html2canvasPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const url = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.src = window.cacheBust ? window.cacheBust(url) : url;
        script.onload = () => { 
            html2canvasLoaded = true; 
            html2canvasLoading = false; 
            window.log.info('[Result ' + F_V + '] (9) html2canvas berhasil dimuat');
            resolve(); 
        };
        script.onerror = () => { 
            html2canvasLoading = false; 
            html2canvasPromise = null; 
            window.log.error('[Result ' + F_V + '] (10) Gagal memuat html2canvas');
            reject(new Error('Gagal memuat html2canvas')); 
        };
        document.head.appendChild(script);
    });
}

async function doCapture() {
    window.log.info('[Result ' + F_V + '] (11) doCapture dipanggil');
    const receiptEl = document.getElementById('receipt-card');
    if (!receiptEl) return;
    if (!html2canvasLoaded) {
        ThemeManager?.showToast('Menyiapkan capture...', 'info');
        if (!html2canvasPromise) preloadHtml2Canvas();
        try { await html2canvasPromise; }
        catch (e) { ThemeManager?.showToast('Gagal memuat modul capture', 'error'); return; }
    }
    try {
        const canvas = await window.html2canvas(receiptEl, {
            scale: 2,
            backgroundColor: getComputedStyle(receiptEl).backgroundColor,
            logging: false
        });
        const link = document.createElement('a');
        link.download = 'KupasTarif_' + refId + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        ThemeManager?.showToast('Struk berhasil didownload', 'success');
        window.log.info('[Result ' + F_V + '] (12) Capture berhasil, file: ' + link.download);
    } catch (error) {
        window.log.error('[Result ' + F_V + '] (13) Capture error:', error);
        ThemeManager?.showToast('Gagal membuat struk', 'error');
    }
}

function handleCopyRute() {
    window.log.info('[Result ' + F_V + '] (14) handleCopyRute dipanggil');
    if (!hasTracking || !trackingData) {
        ThemeManager?.showToast('Tidak ada data rute', 'warning');
        return;
    }
    const r = realityResult;
    const payment = r?.E697 || 0;
    const bill = r?.E746 || 0;
    const text = encodeRouteData(trackingData, refId, payment, bill, driverInfo);
    navigator.clipboard.writeText(text).then(() => ThemeManager?.showToast('Rute disalin', 'success'))
        .catch(() => ThemeManager?.showToast('Gagal menyalin', 'error'));
}

function handleCopyHasil() {
    window.log.info('[Result ' + F_V + '] (15) handleCopyHasil dipanggil');
    if (!realityResult) return;
    const text = formatCopyHasil(realityResult, mode, role);
    navigator.clipboard.writeText(text).then(() => ThemeManager?.showToast('Hasil disalin', 'success'))
        .catch(() => ThemeManager?.showToast('Gagal menyalin', 'error'));
}

function handleReport() {
    window.log.info('[Result ' + F_V + '] (16) handleReport dipanggil, refId=' + refId);
    if (isSubmitting || !refId) return;
    isSubmitting = true;
    Router.navigateTo({ target: 'report', refid: refId });
}

function renderReceiptHeader() {
    const modeIcon = vehicleData.E10 === 'Motor' ? ICON.MOTOR : ICON.MOBIL;
    const cc = vehicleData.E22 || (vehicleData.E10 === 'Motor' ? '125cc' : '1000cc');
    const area = vehicleData.E20 || 'Jabodetabek';
    const service = vehicleData.E46 || 'Standar';
    let driverInfoText = '';
    if (role === 'Driver' && driverInfo.name) {
        driverInfoText = `<div class="receipt-driver">${escapeHtml(driverInfo.name)} · ${escapeHtml(driverInfo.plate)} · ${escapeHtml(driverInfo.phone)}</div>`;
    }
    return `<div class="receipt-header">
        <div class="receipt-title">NOTA PERJALANAN</div>
        <div class="receipt-date">${formatTanggal(timestamp)} ${formatJam(timestamp)}</div>
        ${driverInfoText}
        <div class="receipt-vehicle"><span>${modeIcon} ${cc}</span><span>·</span><span>${area}</span><span>·</span><span>${service}</span></div>
        <div class="receipt-ref">ref: ${refId}</div>
    </div>`;
}

function renderOnlineReceipt(r) {
    const billTotal = r.E746 || 0;
    const passengerPayment = r.E697 || 0;
    const totalPaymentAndBill = passengerPayment + billTotal;
    const maxJemputJarak = getMaxPickupDistance();
    const maxJemputWaktu = getMaxPickupTime();
    let html = '';
    if (billTotal > 0) {
        html += `<div class="bill-box">
            <div class="bill-box-header"><span class="bill-box-title">TAGIHAN</span><span class="bill-box-value">${formatRupiah(billTotal)}</span></div>
            <div class="bill-box-detail">penjemputan: ${formatKm(r.E78 || 0)}, ${formatMenit(r.E80 || 0)}</div>
            <div class="bill-box-detail">pengantaran: ${formatKm(r.E82 || 0)}, ${formatMenit(r.E84 || 0)}</div>
        </div>`;
    }
    html += `<div class="receipt-section">
        <div class="receipt-section-title"><span>${ICON.COPY}</span> PESANAN APLIKASI</div>
        <div class="receipt-row"><span class="receipt-label">Max Jemput</span><span class="receipt-value">${formatKm(maxJemputJarak)}, ${formatMenit(maxJemputWaktu)}</span></div>
        <div class="receipt-row"><span class="receipt-label">Max Antar</span><span class="receipt-value">${formatKm(r.E707 || 0)}, ${formatMenit(r.E715 || 0)}</span></div>
        <div class="receipt-row"><span class="receipt-label">Tarif</span><span class="receipt-value">${formatRupiah(r.E713 || 0)}/km</span></div>
    </div>
    <div class="receipt-section">
        <div class="receipt-section-title"><span>${ICON.GEAR}</span> OPERASIONAL</div>
        <div class="receipt-row"><span class="receipt-label">BBM</span><span class="receipt-value">${formatRupiah(r.E911 || 0)}</span></div>
        <div class="receipt-row"><span class="receipt-label">Kendaraan</span><span class="receipt-value">${formatRupiah((r.E963 || 0) - (r.E807 || 0))}</span></div>
        <div class="receipt-row"><span class="receipt-label">Load Google Map</span><span class="receipt-value">${formatRupiah(r.E807 || 0)}</span></div>
    </div>
    <div class="receipt-section">
        <div class="receipt-section-title"><span>${ICON.MONEY}</span> PENDAPATAN</div>
        <div class="receipt-row"><span class="receipt-label">Driver</span><span class="receipt-value ${(r.E981 || 0) < 0 ? 'text-danger' : ''}">${formatRupiah(r.E981 || 0)}</span></div>
        <div class="receipt-row"><span class="receipt-label">Aplikasi</span><span class="receipt-value">${formatRupiah(r.E982 || 0)}</span></div>
        <div class="receipt-row"><span class="receipt-label">Pembayaran Penumpang</span><span class="receipt-value">${formatRupiah(passengerPayment)}</span></div>
        <div class="receipt-row receipt-total"><span class="receipt-label">TOTAL PEMBAYARAN & TAGIHAN</span><span class="receipt-value-large">${formatRupiah(totalPaymentAndBill)}</span></div>
    </div>`;
    return html;
}

function renderOfflineReceipt(r) {
    const passengerPayment = r.E697 || 0;
    const billTotal = r.E746 || 0;
    const totalPaymentAndBill = passengerPayment + billTotal;
    let additionalHtml = '';
    const parking = r.E100 || 0;
    const toll = r.E102 || 0;
    const other = r.E104 || 0;
    const hasAdditional = parking > 0 || toll > 0 || other > 0;
    if (hasAdditional) {
        additionalHtml += `<div class="receipt-row"><span class="receipt-label">Parkir</span><span class="receipt-value">${formatRupiah(parking)}</span></div>`;
        if (toll > 0) additionalHtml += `<div class="receipt-row"><span class="receipt-label">Toll</span><span class="receipt-value">${formatRupiah(toll)}</span></div>`;
        if (other > 0) additionalHtml += `<div class="receipt-row"><span class="receipt-label">Lainnya</span><span class="receipt-value">${formatRupiah(other)}</span></div>`;
    }
    let html = `<div class="receipt-section">
        <div class="receipt-section-title"><span>${ICON.COPY}</span> TAGIHAN</div>
        <div class="receipt-row"><span class="receipt-label">Dibayarkan Penumpang</span><span class="receipt-value">${formatRupiah(passengerPayment)}</span></div>
        <div class="receipt-row"><span class="receipt-label">Total Tagihan</span><span class="receipt-value ${billTotal > 0 ? 'text-danger' : ''}">${formatRupiah(billTotal)}</span></div>
        ${additionalHtml}
        <div class="receipt-row receipt-total"><span class="receipt-label">TOTAL PEMBAYARAN & TAGIHAN</span><span class="receipt-value-large">${formatRupiah(totalPaymentAndBill)}</span></div>
    </div>
    <div class="receipt-section">
        <div class="receipt-section-title"><span>${ICON.COPY}</span> PESANAN</div>
        <div class="receipt-row"><span class="receipt-label">Jarak</span><span class="receipt-value">${formatKm(r.E707 || 0)}</span></div>
        <div class="receipt-row"><span class="receipt-label">Waktu</span><span class="receipt-value">${formatMenit(r.E715 || 0)}</span></div>
        <div class="receipt-row"><span class="receipt-label">Tarif</span><span class="receipt-value">${formatRupiah(r.E679 || 0)}/km, ${formatRupiah(r.E680 || 0)}/mnt</span></div>
    </div>`;
    html += `<div class="receipt-section">
        <div class="receipt-section-title"><span>${ICON.RECEIPT_TRIP}</span> PERJALANAN</div>
        <div class="receipt-row"><span class="receipt-label">BBM</span><span class="receipt-value">${formatRupiah(r.E911 || 0)}</span></div>
        <div class="receipt-row"><span class="receipt-label">Kendaraan</span><span class="receipt-value">${formatRupiah(r.E963 || 0)}</span></div>
        <div class="receipt-row"><span class="receipt-label">Driver</span><span class="receipt-value ${(r.E981 || 0) < 0 ? 'text-danger' : ''}">${formatRupiah(r.E981 || 0)}</span></div>
    </div>`;
    return html;
}

function renderOperationalReceipt(r) {
    const totalOperasional = (r.E960 || 0) - (r.E807 || 0);
    let shareLimitHtml = '';
    const shareCount = r.shareCount || 1;
    const setLimit = r.setLimit || 0;
    const shareResult = r.shareResult || 0;
    const limitResult = r.limitResult || 0;
    
    if (shareCount > 1 || setLimit >= 1000) {
        shareLimitHtml += `<div class="receipt-section"><div class="receipt-section-title"><span>${ICON.GEAR}</span> SHARE & LIMIT</div></div>`;
        if (shareCount > 1 && shareResult > 0) {
            shareLimitHtml += `<div class="receipt-row"><span class="receipt-label">Share per orang (${shareCount} orang)</span><span class="receipt-value">${formatRupiah(shareResult)}</span></div>`;
        }
        if (setLimit >= 1000) {
            const sisa = limitResult >= 0 ? formatRupiah(limitResult) : '-' + formatRupiah(Math.abs(limitResult));
            const sisaClass = limitResult >= 0 ? '' : 'text-danger';
            shareLimitHtml += `<div class="receipt-row"><span class="receipt-label">Sisa Limit (limit: ${formatRupiah(setLimit)})</span><span class="receipt-value ${sisaClass}">${sisa}</span></div>`;
        }
    }

    return `<div class="receipt-section">
        <div class="receipt-section-title"><span>${ICON.RECEIPT_TRIP}</span> PERJALANAN</div>
        <div class="receipt-row"><span class="receipt-label">Jarak</span><span class="receipt-value">${formatKm(r.E752 || 0)}</span></div>
        <div class="receipt-row"><span class="receipt-label">Waktu</span><span class="receipt-value">${formatMenit(r.E753 || 0)}</span></div>
    </div>
    <div class="receipt-section">
        <div class="receipt-section-title"><span>${ICON.GEAR}</span> BIAYA OPERASIONAL</div>
        <div class="receipt-row"><span class="receipt-label">BBM</span><span class="receipt-value">${formatRupiah(r.E911 || 0)}</span></div>
        <div class="receipt-row"><span class="receipt-label">Perawatan</span><span class="receipt-value">${formatRupiah(r.E935 || 0)}</span></div>
        <div class="receipt-row"><span class="receipt-label">Penyusutan</span><span class="receipt-value">${formatRupiah(r.E825 || 0)}</span></div>
        <div class="receipt-row"><span class="receipt-label">Pajak</span><span class="receipt-value">${formatRupiah(r.E841 || 0)}</span></div>
        <div class="receipt-row receipt-total"><span class="receipt-label">TOTAL</span><span class="receipt-value-large">${formatRupiah(totalOperasional)}</span></div>
    </div>
    ${shareLimitHtml}`;
}

function renderReceipt() {
    if (!realityResult) {
        return '<div class="card text-center p-lg"><p>Data tidak tersedia</p></div>';
    }
    const r = realityResult;
    let body = '';
    if (operationalMode) body = renderOperationalReceipt(r);
    else if (mode === 'online') body = renderOnlineReceipt(r);
    else body = renderOfflineReceipt(r);
    return `<div class="card receipt-card" id="receipt-card">${renderReceiptHeader()}${body}</div>`;
}

function buildHTML() {
    return `<div class="page-container">
        <div id="receipt-container">${renderReceipt()}</div>
        <div class="result-actions">
            <button class="btn btn-outline" id="copy-rute-btn" ${hasTracking ? '' : 'disabled'}>${ICON.COPY} COPY RUTE</button>
            <button class="btn btn-outline" id="copy-hasil-btn">${ICON.COPY} COPY HASIL</button>
        </div>
    </div>`;
}

function bindEvents() {
    document.getElementById('copy-rute-btn')?.addEventListener('click', handleCopyRute);
    document.getElementById('copy-hasil-btn')?.addEventListener('click', handleCopyHasil);
}

function updateHeader() {
    const headerContainer = document.getElementById('app-header');
    if (!headerContainer || !HeaderManager) return;
    if (currentHeader) { HeaderManager.destroy(currentHeader); }
    const header = HeaderManager.create('step3');
    headerContainer.innerHTML = '';
    if (header) { headerContainer.appendChild(header); currentHeader = header; }
    else { currentHeader = null; }
}

function updateFooter() {
    const footerContainer = document.getElementById('app-footer');
    if (!footerContainer || !FooterManager) return;
    const backTarget = operationalMode ? 'home' : 'reality';
    const footer = FooterManager.create('layoutB', {
        frame1: { type: 'icon', content: FooterManager.createIconButton(ICON.BACK, () => {
            Router.navigateTo({ target: backTarget });
        }, 'Kembali') },
        frame2: { type: 'flex', content: FooterManager.createFlexContent('CAPTURE', ICON.CAPTURE, doCapture) },
        frame3: { type: 'flex', content: FooterManager.createFlexContent('REPORT', ICON.REPORT, handleReport) }
    });
    footerContainer.innerHTML = '';
    if (footer) footerContainer.appendChild(footer);
}

async function render(params, context = {}) {
    window.log.info('[Result ' + F_V + '] (17) render dipanggil');
    const content = document.getElementById('app-content');
    if (!content) return;
    isDestroyed = false;
    isSubmitting = false;
    const direction = context.direction || 'forward';
    loadData();
    if (typeof window.forceStopTracking === 'function') window.forceStopTracking();
    if (direction === 'forward') saveToHistory();
    preloadHtml2Canvas();
    content.innerHTML = buildHTML();
    bindEvents();
    updateHeader();
    updateFooter();
    if (window.Cache) window.Cache.invalidate('tracking');
    window.log.info('[Result ' + F_V + '] (18) Result dirender, refId=' + refId);
}

function destroy() {
    window.log.info('[Result ' + F_V + '] (19) destroy dipanggil');
    isDestroyed = true;
    isSubmitting = false;
    html2canvasPromise = null;
    if (currentHeader) { HeaderManager.destroy(currentHeader); currentHeader = null; }
}

export const PageResult = { render, destroy };
window.log.info('[Result ' + F_V + '] (20) PageResult dimuat (tanpa complete, invalidasi Cache)');

// ================================ End Of File ================================