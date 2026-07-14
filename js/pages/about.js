/**
 * =================================================================================
 * FILE         : /js/pages/about.js
 * FILE VERSION : 2.0a-rev2
 * APP VERSION  : 2.0a-beta
 */
'use strict';

const F_V = '2.0a-rev2';

import { Router } from '../core/router.js';
import { StateManager } from '../core/state.js';
import { HeaderManager } from '../components/header.js';
import { FooterManager } from '../components/footer.js';
import { DrawerManager } from '../components/drawer.js';

const ICON = {
    BACK: '◀',
    MENU: '☰',
    HOME: '🏠',
    ELECTRIC: '⚡'
};

let isDestroyed = false;
let detailHTML = null;
let currentHeader = null;

const OVERVIEW_HTML = `<div class="about-overview">
    <div class="text-center mb-lg"><div class="logo" style="font-size: 2.5rem;">${window.APP_CONFIG?.siteIcon || ICON.ELECTRIC}</div><h2 class="text-xl font-bold mt-sm">KupasTarif</h2><p class="text-secondary">Kalkulator tarif ojek online yang transparan</p></div>
    <div class="divider"></div>
    <p class="mb-md"><strong>KupasTarif</strong> adalah aplikasi kalkulator tarif ojek online yang membantu driver dan penumpang memahami rincian biaya perjalanan secara transparan.</p>
    <p class="mb-md">Aplikasi ini membantu:</p>
    <ul class="mb-lg" style="padding-left: 1.5rem;"><li><strong>Driver:</strong> Mengetahui pendapatan bersih setelah dipotong komisi dan biaya operasional.</li><li><strong>Penumpang:</strong> Melihat rincian tarif yang dibayarkan.</li></ul>
    <div class="bg-muted p-md rounded-lg mb-lg"><div class="flex justify-between"><span class="text-secondary">Versi App</span><span class="font-medium">${window.APP_CONFIG?.version || '2.0a-beta'}</span></div><div class="flex justify-between mt-sm"><span class="text-secondary">Versi Engine</span><span class="font-medium">v${window.Engine?.ENGINE_VERSION || '1.0.0-beta'}</span></div></div>
    <p class="text-muted text-sm text-center">Dibuat dengan ${ICON.ELECTRIC} oleh tim KupasTarif</p>
</div>`;

async function loadDetail() {
    if (detailHTML !== null) return detailHTML;
    try {
        const base = window.APP_FULL_BASE || '';
        const url = window.cacheBust ? window.cacheBust(base + 'docs/about.html') : (base + 'docs/about.html');
        const response = await fetch(url);
        if (!response.ok) throw new Error('Gagal memuat detail');
        detailHTML = await response.text();
        return detailHTML;
    } catch (error) {
        window.log.error('[About ' + F_V + '] (1) Gagal load detail:', error);
        return '<div class="text-center text-danger"><p>Gagal memuat konten lengkap.</p><p class="text-sm text-muted mt-sm">' + error.message + '</p></div>';
    }
}

function buildHTML(isTldr) {
    if (isTldr) {
        return `<div class="page-container"><div class="card"><div id="about-content" class="about-content"><div class="text-center p-lg"><div class="spinner"></div><p class="text-muted mt-md">Memuat...</p></div></div></div></div>`;
    }
    return `<div class="page-container"><div class="card"><div id="about-content" class="about-content">${OVERVIEW_HTML}</div><div class="about-footer mt-lg text-center"><button id="tldr-btn" class="btn btn-outline">TLDR yes or no?</button></div></div></div>`;
}

function bindEvents(isTldr) {
    const tldrBtn = document.getElementById('tldr-btn');
    if (tldrBtn && !isTldr) {
        tldrBtn.addEventListener('click', () => {
            if (isDestroyed) return;
            Router.navigateTo({ target: 'abouttldr' });
        });
    }
}

DrawerManager.register('about', () => ({
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
                Router.navigateTo({ target: 'about' });
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
            const aboutContent = document.getElementById('about-content');
            if (aboutContent) aboutContent.innerHTML = detail;
        }
    } else {
        content.innerHTML = buildHTML(false);
        bindEvents(false);
        updateHeader();
        updateFooter(false);
    }

    window.log.info('[About ' + F_V + '] (2) About dirender | tldr=' + isTldr);
}

function destroy() {
    isDestroyed = true;
    if (currentHeader) { HeaderManager.destroy(currentHeader); currentHeader = null; }
}

export const PageAbout = {
    render,
    destroy
};

export const PageAbouttldr = {
    render: (params, context) => render({ ...params, tldr: true }, context),
    destroy
};

window.log.info('[About ' + F_V + '] (3) PageAbout & PageAbouttldr dimuat');

// ================================ End Of File ================================