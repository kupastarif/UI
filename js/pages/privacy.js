/**
 * =================================================================================
 * FILE         : /js/pages/privacy.js
 * FILE VERSION : 2.0a-rev1
 * APP VERSION  : 2.0a-beta
 */
'use strict';

const F_V = '2.0a-rev1';

import { Router } from '../core/router.js';
import { StateManager } from '../core/state.js';
import { HeaderManager } from '../components/header.js';
import { FooterManager } from '../components/footer.js';
import { DrawerManager } from '../components/drawer.js';

const ICON = {
    LOCK: '🔒',
    BACK: '◀',
    MENU: '☰',
    HOME: '🏠'
};

let isDestroyed = false;
let detailHTML = null;
let currentHeader = null;

const OVERVIEW_HTML = `<div class="privacy-overview">
    <div class="text-center mb-lg"><span style="font-size: 3rem;">${ICON.LOCK}</span><h2 class="text-xl font-bold mt-sm">Privasi Anda Penting</h2></div>
    <div class="divider"></div>
    <p class="mb-md"><strong>KupasTarif</strong> dirancang dengan mengutamakan privasi pengguna. Semua data Anda tetap berada di perangkat Anda.</p>
    <p class="mb-md">Aplikasi ini:</p>
    <ul class="mb-lg" style="padding-left: 1.5rem;"><li>✅ <strong>Menyimpan semua data di HP Anda</strong> (LocalStorage)</li><li>✅ <strong>Mengkripsi data sensitif</strong> (nama, plat, telepon)</li><li>✅ <strong>Tidak mengirim data ke server</strong> - 100% offline-first</li><li>✅ <strong>Tidak menggunakan akun atau login</strong></li><li>✅ <strong>Tidak menampilkan iklan</strong></li><li>✅ <strong>Tidak melacak aktivitas Anda</strong> (tidak ada Google Analytics)</li></ul>
    <div class="bg-muted p-md rounded-lg"><p class="text-sm text-center"><span class="text-secondary">${ICON.LOCK} Data driver (nama, plat, telepon) dienkripsi sebelum disimpan. Diem aja di hape situ.</span></p></div>
</div>`;

async function loadDetail() {
    if (detailHTML !== null) return detailHTML;
    try {
        const base = window.APP_FULL_BASE || '';
        const url = window.cacheBust ? window.cacheBust(base + 'docs/privacy.html') : (base + 'docs/privacy.html');
        const response = await fetch(url);
        if (!response.ok) throw new Error('Gagal memuat detail');
        detailHTML = await response.text();
        return detailHTML;
    } catch (error) {
        window.log.error('[Privacy ' + F_V + '] (1) Gagal load detail:', error);
        return '<div class="text-center text-danger"><p>Gagal memuat konten lengkap.</p><p class="text-sm text-muted mt-sm">' + error.message + '</p></div>';
    }
}

function buildHTML(isTldr) {
    if (isTldr) {
        return `<div class="page-container"><div class="card"><div id="privacy-content" class="privacy-content"><div class="text-center p-lg"><div class="spinner"></div><p class="text-muted mt-md">Memuat...</p></div></div></div></div>`;
    }
    return `<div class="page-container"><div class="card"><div id="privacy-content" class="privacy-content">${OVERVIEW_HTML}</div><div class="privacy-footer mt-lg text-center"><button id="tldr-btn" class="btn btn-outline">TLDR yes or no?</button></div></div></div>`;
}

function bindEvents(isTldr) {
    const tldrBtn = document.getElementById('tldr-btn');
    if (tldrBtn && !isTldr) {
        tldrBtn.addEventListener('click', () => {
            if (isDestroyed) return;
            Router.navigateTo({ target: 'privacytldr' });
        });
    }
}

DrawerManager.register('privacy', () => ({
    menuItems: null,
    onItemClick: (page) => {
        Router.navigateTo({ target: page, closeDrawer: true });
    }
}));

function updateHeader() {
    const container = document.getElementById('app-header');
    if (!container || !HeaderManager) return;
    if (currentHeader) HeaderManager.destroy(currentHeader);
    const header = HeaderManager.create('default', { title: window.APP_CONFIG?.siteTitle });
    container.innerHTML = '';
    if (header) { container.appendChild(header); currentHeader = header; }
    else currentHeader = null;
}

function updateFooter(isTldr) {
    const container = document.getElementById('app-footer');
    if (!container || !FooterManager) return;
    
    if (isTldr) {
        const footer = FooterManager.create('layoutA', {
            frame1: { type: 'icon', content: FooterManager.createIconButton(ICON.BACK, () => {
                Router.navigateTo({ target: 'privacy' });
            }, 'Kembali') },
            frame2: { type: 'flex', content: FooterManager.createFlexContent('HOME', ICON.HOME, () => {
                Router.navigateTo({ target: 'home' });
            }) }
        });
        container.innerHTML = '';
        if (footer) container.appendChild(footer);
    } else {
        const footer = FooterManager.create('layoutA', {
            frame1: {
                type: 'icon',
                content: FooterManager.createIconButton(ICON.MENU, () => {
                    Router.navigateTo({ target: 'drawer1' });
                }, 'Menu')
            },
            frame2: {
                type: 'flex',
                content: FooterManager.createFlexContent('HOME', ICON.HOME, () => {
                    Router.navigateTo({ target: 'home' });
                })
            }
        });
        container.innerHTML = '';
        if (footer) container.appendChild(footer);
    }
}

async function render(params, context = {}) {
    const content = document.getElementById('app-content');
    if (!content) return;
    isDestroyed = false;

    const isTldr = params?.tldr === true;

    if (isTldr) {
        content.innerHTML = buildHTML(true);
        bindEvents(true);
        updateHeader();
        updateFooter(true);

        const detail = await loadDetail();
        if (!isDestroyed) {
            const privacyContent = document.getElementById('privacy-content');
            if (privacyContent) privacyContent.innerHTML = detail;
        }
    } else {
        content.innerHTML = buildHTML(false);
        bindEvents(false);
        updateHeader();
        updateFooter(false);
    }

    window.log.info('[Privacy ' + F_V + '] (2) Privacy dirender | tldr=' + isTldr);
}

function destroy() {
    isDestroyed = true;
    if (currentHeader) { HeaderManager.destroy(currentHeader); currentHeader = null; }
}

export const PagePrivacy = {
    render,
    destroy
};

export const PagePrivacytldr = {
    render: (params, context) => render({ ...params, tldr: true }, context),
    destroy
};

window.log.info('[Privacy ' + F_V + '] (3) PagePrivacy & PagePrivacytldr dimuat');

// ================================ End Of File ================================