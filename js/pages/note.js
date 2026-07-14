/**
 * =================================================================================
 * FILE         : /js/pages/note.js
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
    DOCUMENT: '📄',
    BACK: '◀',
    MENU: '☰',
    HOME: '🏠'
};

let isDestroyed = false;
let detailHTML = null;
let currentHeader = null;

const OVERVIEW_HTML = `<div class="notes-overview">
    <div class="text-center mb-lg">
        <div class="logo" style="font-size: 2.5rem;">${ICON.DOCUMENT}</div>
        <h2 class="text-xl font-bold mt-sm">Catatan</h2>
        <p class="text-secondary">Latar belakang dan tujuan kalkulator ride hailing</p>
    </div>
    <div class="divider"></div>
    <p class="mb-md">
        <strong>KupasTarif</strong> lahir dari kebutuhan akan transparansi tarif 
        di industri ride hailing. Halaman ini menjelaskan mengapa aplikasi ini dibuat 
        dan apa yang ingin dicapai.
    </p>
    <p class="mb-md">Ketuk tombol di bawah untuk membaca selengkapnya.</p>
    <div class="bg-muted p-md rounded-lg mb-lg">
        <p class="text-sm text-center text-secondary">
            ${ICON.DOCUMENT} Semua data dan kalkulasi bersifat terbuka. 
            Tidak ada yang disembunyikan.
        </p>
    </div>
    <p class="text-muted text-sm text-center">Dibuat dengan transparansi oleh tim KupasTarif</p>
</div>`;

async function loadDetail() {
    if (detailHTML !== null) return detailHTML;
    try {
        const base = window.APP_FULL_BASE || '';
        const url = window.cacheBust ? window.cacheBust(base + 'docs/notes.html') : (base + 'docs/notes.html');
        const response = await fetch(url);
        if (!response.ok) throw new Error('Gagal memuat detail');
        detailHTML = await response.text();
        return detailHTML;
    } catch (error) {
        window.log.error('[Note ' + F_V + '] (1) Gagal load detail:', error);
        return '<div class="text-center text-danger"><p>Gagal memuat konten lengkap.</p><p class="text-sm text-muted mt-sm">' + error.message + '</p></div>';
    }
}

function buildHTML(isTldr) {
    if (isTldr) {
        return `<div class="page-container">
            <div class="card">
                <div id="notes-content" class="notes-content">
                    <div class="text-center p-lg">
                        <div class="spinner"></div>
                        <p class="text-muted mt-md">Memuat...</p>
                    </div>
                </div>
            </div>
        </div>`;
    }
    return `<div class="page-container">
        <div class="card">
            <div id="notes-content" class="notes-content">${OVERVIEW_HTML}</div>
            <div class="notes-footer mt-lg text-center">
                <button id="more-btn" class="btn btn-outline">Lihat Lebih Lanjut</button>
            </div>
        </div>
    </div>`;
}

function bindEvents(isTldr) {
    const moreBtn = document.getElementById('more-btn');
    if (moreBtn && !isTldr) {
        moreBtn.addEventListener('click', () => {
            if (isDestroyed) return;
            Router.navigateTo({ target: 'catatantldr' });
        });
    }
}

DrawerManager.register('catatan', () => ({
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
                Router.navigateTo({ target: 'catatan' });
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
            const notesContent = document.getElementById('notes-content');
            if (notesContent) notesContent.innerHTML = detail;
        }
    } else {
        content.innerHTML = buildHTML(false);
        bindEvents(false);
        updateHeader();
        updateFooter(false);
    }

    window.log.info('[Note ' + F_V + '] (2) Notes dirender | tldr=' + isTldr);
}

function destroy() {
    isDestroyed = true;
    if (currentHeader) { HeaderManager.destroy(currentHeader); currentHeader = null; }
}

export const PageCatatan = {
    render,
    destroy
};

export const PageCatatantldr = {
    render: (params, context) => render({ ...params, tldr: true }, context),
    destroy
};

window.log.info('[Note ' + F_V + '] (3) PageCatatan & PageCatatantldr dimuat');

// ================================ End Of File ================================