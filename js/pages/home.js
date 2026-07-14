/**
 * =================================================================================
 * FILE         : /js/pages/home.js
 * FILE VERSION : 2.0a-rev3
 * APP VERSION  : 2.0a-beta
 */
'use strict';

const F_V = '2.0a-rev3';

import { StateManager } from '../core/state.js';
import { Router } from '../core/router.js';
import { PreferencesManager } from '../core/preferences.js';
import { StorageManager } from '../core/storage.js';
import { HeaderManager } from '../components/header.js';
import { FooterManager } from '../components/footer.js';
import { ThemeManager } from '../components/theme.js';
import { PopupManager } from '../components/popup.js';
import { DrawerManager } from '../components/drawer.js';
import { Texts } from '../helpers/texts.js';
import { formatRupiah, escapeHtml, calculateBattleStats } from '../helpers/format.js';
import { getDropdownOptions } from '../helpers/output.js';
import { LocationPicker } from '../maps/picker.js';

const ICON = {
    DRIVER: '👤', PENUMPANG: '🧑', FUEL: '⛽', DOWNLOAD: '⬇️',
    MOTOR: '🏍️', MOBIL: '🚗', TROPHY: '🏆', MENU: '☰', RANDOM: '🎲', OFFLINE: '📴'
};

let isDestroyed = false;
let quote = ['Tarif transparan', 'driver sejahtera'];
let battleStats = { driver: { value: 0, percent: 0 }, app: { value: 0, percent: 0 }, totalMatch: 0 };
let preferences = null;
let currentHeader = null;

function loadData() {
    if (StorageManager) {
        const history = StorageManager.getHistory();
        battleStats = calculateBattleStats(history);
    }
    if (Texts?.getRandomQuote) {
        quote = Texts.getRandomQuote({
            driverPercent: battleStats.driver.percent,
            appPercent: battleStats.app.percent,
            totalMatch: battleStats.totalMatch
        });
    }
    preferences = StateManager.get('preferences') || PreferencesManager.load();
    window.log.info('[Home ' + F_V + '] (1) loadData selesai');
}

function prepareOrderData(mode, role, vehicle) {
    StateManager.batchUpdateInput({
        E10: mode, E12: role || 'Driver', E20: vehicle?.area || 'Jabodetabek',
        E22: vehicle?.cc || (mode === 'Mobil' ? '1000cc' : '125cc'),
        E24: vehicle?.fuel || 'Pertalite'
    });
    StateManager.set('calcMode', 'standard');
    if (window.Cache) window.Cache.invalidate('order');
    window.log.info('[Home ' + F_V + '] (2) Data Order disiapkan');
}

function prepareTrackingData(mode, vehicle) {
    StateManager.batchUpdateInput({
        E10: mode, E12: 'Driver', E20: vehicle?.area || 'Jabodetabek',
        E22: vehicle?.cc || (mode === 'Mobil' ? '1000cc' : '125cc'),
        E24: vehicle?.fuel || 'Pertalite'
    });
    StateManager.set('calcMode', 'operational');
    if (window.Cache) window.Cache.invalidate('tracking');
    window.log.info('[Home ' + F_V + '] (3) Data Tracking disiapkan');
}

function handleVehicleClick(vehicleMode) {
    if (isDestroyed) return;
    window.log.info('[Home ' + F_V + '] (4) handleVehicleClick dipanggil: mode=' + vehicleMode);
    const dv = preferences?.defaultVehicle || {};

    if (preferences?.alwaysOperational) {
        prepareTrackingData(vehicleMode, dv);
        Router.navigateTo({ target: 'trackingidle' });
        return;
    }

    if (preferences?.quickOrder) {
        prepareOrderData(vehicleMode, dv.role, dv);
        Router.navigateTo({ target: 'order' });
        return;
    }

    StateManager.set('popupVehicleMode', vehicleMode);
    Router.navigateTo({ target: 'popup11' });
}

function createRolePopupContent(mode) {
    const areaOptions = getDropdownOptions('E20') || ['Jabodetabek', 'SumatraJawa', 'TimurIndonesia'];
    const ccOptions = getDropdownOptions('E22', { E10: mode }) ||
        (mode === 'Mobil' ? ['1000cc', '1500cc', '2000cc'] : ['125cc', '160cc', '200cc']);
    const fuelOptions = getDropdownOptions('E24', { E22: mode === 'Mobil' ? '1000cc' : '125cc' }) || ['Pertalite'];

    const container = document.createElement('div');
    container.innerHTML = `
        <div class="popup-role-content">
            <button class="btn btn-primary btn-block mb-md" data-action="driver">${ICON.DRIVER} SAYA DRIVER</button>
            <button class="btn btn-primary btn-block mb-md" data-action="penumpang">${ICON.PENUMPANG} SAYA PENUMPANG</button>
            <button class="btn btn-outline btn-block mb-md" data-action="operasional">${ICON.FUEL} OPERASIONAL PERJALANAN</button>
            <button class="btn btn-outline btn-block mb-md" data-action="cek-offline">${ICON.OFFLINE} CEK TARIF OFFLINE</button>
            <div class="popup-select-group">
                <select id="popup-area" class="input-select">${areaOptions.map(a => `<option value="${a}">${a}</option>`).join('')}</select>
                <select id="popup-cc" class="input-select">${ccOptions.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
                <select id="popup-fuel" class="input-select">${fuelOptions.map(f => `<option value="${f}">${f}</option>`).join('')}</select>
            </div>
            <div class="popup-save-setting">
                <label><input type="checkbox" id="popup-save"> simpan pengaturan cepat</label>
            </div>
        </div>`;

    container.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            const saveCheck = document.getElementById('popup-save');
            const vehicle = {
                area: document.getElementById('popup-area')?.value || 'Jabodetabek',
                cc: document.getElementById('popup-cc')?.value || (mode === 'Mobil' ? '1000cc' : '125cc'),
                fuel: document.getElementById('popup-fuel')?.value || 'Pertalite'
            };

            if (action === 'cek-offline') {
                StateManager.set('isCheckOffline', true);
                StateManager.updateInput('E36', 'offline');
                prepareOrderData(mode, 'Driver', vehicle);
                Router.navigateTo({ popup: 0 });
                setTimeout(() => Router.navigateTo({ target: 'order' }), 0);
                return;
            }

            if (saveCheck?.checked && PreferencesManager) {
                const prefs = StateManager.get('preferences') || {};
                prefs.quickOrder = true;
                prefs.defaultVehicle = {
                    mode, role: action === 'penumpang' ? 'Penumpang' : 'Driver',
                    area: vehicle.area, cc: vehicle.cc, fuel: vehicle.fuel
                };
                prefs.alwaysOperational = action === 'operasional';
                PreferencesManager.save(prefs);
                window.log.info('[Home ' + F_V + '] (5) Popup role: preferensi disimpan');
            }

            Router.navigateTo({ popup: 0 });
            if (action === 'operasional') {
                prepareTrackingData(mode, vehicle);
                setTimeout(() => Router.navigateTo({ target: 'trackingidle' }), 0);
            } else {
                const role = action === 'penumpang' ? 'Penumpang' : 'Driver';
                prepareOrderData(mode, role, vehicle);
                setTimeout(() => Router.navigateTo({ target: 'order' }), 0);
            }
        });
    });

    const ccSelect = container.querySelector('#popup-cc');
    const fuelSelect = container.querySelector('#popup-fuel');
    if (ccSelect && fuelSelect) {
        ccSelect.addEventListener('change', () => {
            const newFuelOptions = getDropdownOptions('E24', { E22: ccSelect.value });
            fuelSelect.innerHTML = newFuelOptions.map(f => `<option value="${f}">${f}</option>`).join('');
        });
    }

    container._popupOptions = {
        title: 'PILIH PERAN', showActions: false, showCloseButton: true, closeOnOverlay: true
    };
    return container;
}

function createRandomImageContent() {
    const randomIndex = Math.floor(Math.random() * 20) + 1;
    const imageUrl = (window.APP_FULL_BASE || '') + 'assets/img/random/' + randomIndex + '.jpg';
    const container = document.createElement('div');
    container.className = 'popup-random-image';
    container.innerHTML = `
        <div style="text-align: center;">
            <img src="${imageUrl}" alt="Random" style="max-width: 100%; max-height: 60vh; border-radius: 12px;">
            <button class="btn btn-primary mt-md" id="download-random-btn">${ICON.DOWNLOAD} DOWNLOAD</button>
        </div>`;
    container.querySelector('#download-random-btn').addEventListener('click', async () => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl; a.download = 'kupastarif_random_' + randomIndex + '.jpg';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch (e) { ThemeManager?.showToast('Gagal mengunduh gambar', 'error'); }
        Router.navigateTo({ popup: 0 });
    });
    container._popupOptions = { title: 'GAMBAR ACAK', showActions: false, showCloseButton: true, closeOnOverlay: true };
    return container;
}

function createExitSiteContent() {
    const container = document.createElement('div');
    container.innerHTML = '<p>Apakah Anda yakin ingin meninggalkan KupasTarif?</p>';
    const btnContainer = document.createElement('div');
    btnContainer.className = 'popup-footer';
    btnContainer.style.cssText = 'display:flex;gap:8px;padding:12px;border-top:1px solid var(--border);';
    const btnTidak = document.createElement('button');
    btnTidak.className = 'btn btn-outline'; btnTidak.textContent = 'TIDAK';
    btnTidak.addEventListener('click', () => Router.navigateTo({ popup: 0 }));
    const btnYa = document.createElement('button');
    btnYa.className = 'btn btn-danger'; btnYa.textContent = 'YA';
    btnYa.addEventListener('click', () => Router.navigateTo({ popup: 0 }));
    btnContainer.appendChild(btnTidak); btnContainer.appendChild(btnYa);
    container.appendChild(btnContainer);
    container._popupOptions = { title: 'TINGGALKAN SITUS?', showActions: false, showCloseButton: true, closeOnOverlay: true };
    return container;
}

PopupManager.register(11, () => {
    const mode = StateManager.get('popupVehicleMode') || preferences?.defaultVehicle?.mode || 'Mobil';
    return createRolePopupContent(mode);
});
PopupManager.register(12, () => createRandomImageContent());
PopupManager.register(16, () => createExitSiteContent());

DrawerManager.register('home', () => ({
    menuItems: null,
    onItemClick: (page) => { Router.navigateTo({ target: page, closeDrawer: true }); }
}));

function renderQuote() {
    return `<div class="card home-quote-card">
        <p class="home-quote-line1">${escapeHtml(quote[0])}</p>
        <p class="home-quote-line2">${escapeHtml(quote[1])}</p>
    </div>`;
}

function renderVehicleCards() {
    const dv = preferences?.defaultVehicle || {};
    const ao = preferences?.alwaysOperational;
    const qo = preferences?.quickOrder;
    let motorCC, mobilCC;
    if (qo) { motorCC = dv.mode === 'Motor' ? dv.cc : '125cc'; mobilCC = dv.mode === 'Mobil' ? dv.cc : '1000cc'; }
    else { motorCC = '125-200cc'; mobilCC = '1000-2000cc'; }
    const motorDisabled = (ao || qo) && dv.mode !== 'Motor';
    const mobilDisabled = (ao || qo) && dv.mode !== 'Mobil';

    return `<div class="home-vehicle-grid">
        <div class="card home-vehicle-card ${motorDisabled ? 'disabled' : ''}" data-mode="Motor">
            <div class="vehicle-icon">${ICON.MOTOR}</div><div class="vehicle-title">MOTOR</div><div class="vehicle-subtitle">${motorCC}</div>
        </div>
        <div class="card home-vehicle-card ${mobilDisabled ? 'disabled' : ''}" data-mode="Mobil">
            <div class="vehicle-icon">${ICON.MOBIL}</div><div class="vehicle-title">MOBIL</div><div class="vehicle-subtitle">${mobilCC}</div>
        </div>
    </div>`;
}

function renderBattleStats() {
    if (battleStats.totalMatch === 0) {
        return `<div class="card home-battle-card"><p class="text-center text-muted">Belum ada data pertandingan.</p></div>`;
    }
    const dWins = battleStats.driver.value > battleStats.app.value;
    const aWins = battleStats.app.value > battleStats.driver.value;
    return `<div class="card home-battle-card">
        <div class="battle-title">Klasemen Sementara</div>
        <div class="battle-grid">
            <div class="battle-item ${dWins ? 'trophy-glow' : ''}">
                <div class="battle-label">DRIVER${dWins ? `<span class="trophy-icon">${ICON.TROPHY}</span>` : ''}</div>
                <div class="battle-value">${formatRupiah(battleStats.driver.value)}</div>
                <div class="battle-percent">${battleStats.driver.percent.toFixed(1)}%</div>
            </div>
            <div class="battle-vs">VS</div>
            <div class="battle-item ${aWins ? 'trophy-glow' : ''}">
                <div class="battle-label">APLIKASI${aWins ? `<span class="trophy-icon">${ICON.TROPHY}</span>` : ''}</div>
                <div class="battle-value">${formatRupiah(battleStats.app.value)}</div>
                <div class="battle-percent">${battleStats.app.percent.toFixed(1)}%</div>
            </div>
        </div>
        <div class="battle-total" id="total-match">TOTAL MATCH : ${battleStats.totalMatch} pertandingan</div>
    </div>`;
}

function buildHTML() {
    return `<div class="page-container">${renderQuote()}${renderVehicleCards()}${renderBattleStats()}</div>`;
}

function bindEvents() {
    document.querySelectorAll('.home-vehicle-card').forEach(card => {
        card.addEventListener('click', () => {
            if (card.classList.contains('disabled')) { ThemeManager?.showToast('Ubah di Pengaturan', 'warning'); return; }
            handleVehicleClick(card.dataset.mode);
        });
    });
    document.getElementById('total-match')?.addEventListener('click', () => { Router.navigateTo({ target: 'history' }); });
}

function updateHeader() {
    const headerContainer = document.getElementById('app-header');
    if (!headerContainer || !HeaderManager) return;
    if (currentHeader) HeaderManager.destroy(currentHeader);
    const header = HeaderManager.create('default', { title: window.APP_CONFIG?.siteTitle });
    headerContainer.innerHTML = '';
    if (header) { headerContainer.appendChild(header); currentHeader = header; }
    else currentHeader = null;
}

function updateFooter() {
    const footerContainer = document.getElementById('app-footer');
    if (!footerContainer || !FooterManager) return;
    const footer = FooterManager.create('layoutA', {
        frame1: { type: 'icon', content: FooterManager.createIconButton(ICON.MENU, () => { Router.navigateTo({ target: 'drawer1' }); }, 'Menu') },
        frame2: { type: 'flex', content: FooterManager.createFlexContent('RANDOM', ICON.RANDOM, () => { Router.navigateTo({ target: 'popup12' }); }) }
    });
    footerContainer.innerHTML = '';
    if (footer) footerContainer.appendChild(footer);
}

async function render(params, context = {}) {
    const content = document.getElementById('app-content');
    if (!content) return;
    isDestroyed = false;
    if (typeof window.forceStopTracking === 'function') window.forceStopTracking();
    StateManager.resetAppState();
    StateManager.resetInput();
    LocationPicker.clearSavedPolyline();
    loadData();
    content.innerHTML = buildHTML();
    bindEvents();
    updateHeader();
    updateFooter();
    window.log.info('[Home ' + F_V + '] (6) Home dirender dengan pembersihan penuh');
}

function destroy() {
    isDestroyed = true;
    if (currentHeader) { HeaderManager.destroy(currentHeader); currentHeader = null; }
}

export const PageHome = { render, destroy };
window.log.info('[Home ' + F_V + '] (7) PageHome dimuat');

// ================================ End Of File ================================