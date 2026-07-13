/**
 * =================================================================================
 * FILE         : /js/components/popup.js
 * FILE VERSION : 2.0a-rev1
 * APP VERSION  : 2.0a-beta
 */
'use strict';

const F_V = '2.0a-rev1';

import { Texts } from '../helpers/texts.js';

const ICON = {
    CLOSE: '❌'
};

const POPUP_CONTAINER_ID = 'popup-container';
const OVERLAY_CLASS = 'popup-overlay';
const POPUP_CLASS = 'popup-container';
const CLOSE_ICON = ICON.CLOSE;

const registry = new Map();

let activePopup = null;
let overlayElement = null;
let popupElement = null;
let _onClose = null;

function collectConfig(index, data = {}) {
    window.log.info('[Popup ' + F_V + '] (1) collectConfig dipanggil: index=' + index + ' helpKey=' + (data.helpKey || 'none'));

    const popupTexts = Texts.POPUP_TEXTS || {};
    const fallbackConfig = popupTexts[1] || {
        title: 'Informasi',
        message: 'Konten tidak dapat ditemukan.',
        buttons: [{ text: 'MENGERTI', action: 'confirm' }]
    };

    if (index === 2 && data.helpKey) {
        const help = Texts.getOpenHelp(data.helpKey);
        if (help) {
            return {
                title: help.title || 'Bantuan',
                message: help.content || 'Tidak ada informasi.',
                contentElement: null,
                showCloseButton: true,
                closeOnOverlay: true,
                showActions: true,
                buttons: [{ text: 'MENGERTI', action: 'confirm' }]
            };
        }
        window.log.warn('[Popup ' + F_V + '] (2) OpenHelp tidak ditemukan untuk helpKey=' + data.helpKey + ', menggunakan popup 2 default');
    }

    const factoryFn = registry.get(index);

    if (typeof factoryFn === 'function') {
        try {
            const result = factoryFn(data);
            
            if (result && result.defaultOnly) {
                const defaultConfig = popupTexts[index] || fallbackConfig;
                
                if (typeof result.onConfirm === 'function') data.onConfirm = result.onConfirm;
                if (typeof result.onCancel === 'function') data.onCancel = result.onCancel;
                
                return {
                    title: defaultConfig.title || fallbackConfig.title,
                    message: defaultConfig.message || fallbackConfig.message,
                    contentElement: null,
                    showCloseButton: true,
                    closeOnOverlay: true,
                    showActions: true,
                    buttons: defaultConfig.buttons || fallbackConfig.buttons
                };
            }
            
            if (result instanceof HTMLElement) {
                const customOptions = result._popupOptions || {};
                return {
                    title: customOptions.title || '',
                    message: '',
                    contentElement: result,
                    showCloseButton: customOptions.showCloseButton !== false,
                    closeOnOverlay: customOptions.closeOnOverlay !== false,
                    showActions: customOptions.showActions !== false,
                    buttons: Array.isArray(customOptions.buttons) ? customOptions.buttons : fallbackConfig.buttons
                };
            }
            
            if (result && typeof result === 'object') {
                const contentElement = result.contentElement instanceof HTMLElement ? result.contentElement : null;
                const customOptions = result.options || {};
                
                if (typeof result.onConfirm === 'function') data.onConfirm = result.onConfirm;
                if (typeof result.onCancel === 'function') data.onCancel = result.onCancel;
                
                if (contentElement) {
                    return {
                        title: customOptions.title || '',
                        message: '',
                        contentElement: contentElement,
                        showCloseButton: customOptions.showCloseButton !== false,
                        closeOnOverlay: customOptions.closeOnOverlay !== false,
                        showActions: customOptions.showActions !== false,
                        buttons: Array.isArray(customOptions.buttons) ? customOptions.buttons : 
                                 (customOptions.showActions !== false ? fallbackConfig.buttons : [])
                    };
                }
            }
        } catch (err) {
            window.log.error('[Popup ' + F_V + '] (3) Gagal membangun konten custom index ' + index + ':', err);
        }
    }

    if (index >= 1 && index <= 9) {
        const config = popupTexts[index] || fallbackConfig;
        return {
            title: config.title || fallbackConfig.title,
            message: config.message || fallbackConfig.message,
            contentElement: null,
            showCloseButton: true,
            closeOnOverlay: true,
            showActions: true,
            buttons: config.buttons || fallbackConfig.buttons
        };
    }

    window.log.warn('[Popup ' + F_V + '] (4) Tidak ada konten untuk index ' + index + ', menggunakan fallback');
    return {
        title: fallbackConfig.title,
        message: fallbackConfig.message,
        contentElement: null,
        showCloseButton: true,
        closeOnOverlay: true,
        showActions: true,
        buttons: fallbackConfig.buttons
    };
}

function ensureContainer() {
    let container = document.getElementById(POPUP_CONTAINER_ID);
    if (!container) {
        container = document.createElement('div');
        container.id = POPUP_CONTAINER_ID;
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.zIndex = '10000';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);
    }
    return container;
}

function buildFrame(config) {
    const { title, showCloseButton, closeOnOverlay } = config;

    const overlay = document.createElement('div');
    overlay.className = OVERLAY_CLASS;
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.pointerEvents = 'auto';

    if (closeOnOverlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && typeof _onClose === 'function') {
                _onClose();
            }
        });
    }

    const popup = document.createElement('div');
    popup.className = POPUP_CLASS;
    popup.style.position = 'relative';
    popup.style.pointerEvents = 'auto';

    const header = document.createElement('div');
    header.className = 'popup-header';

    const titleEl = document.createElement('div');
    titleEl.className = 'popup-title';
    titleEl.textContent = title || '';
    header.appendChild(titleEl);

    if (showCloseButton) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'popup-close';
        closeBtn.textContent = CLOSE_ICON;
        closeBtn.setAttribute('aria-label', 'Tutup');
        closeBtn.addEventListener('click', () => {
            if (typeof _onClose === 'function') {
                _onClose();
            }
        });
        header.appendChild(closeBtn);
    }

    popup.appendChild(header);

    const bodyContainer = document.createElement('div');
    bodyContainer.className = 'popup-content';
    popup.appendChild(bodyContainer);

    const footerContainer = document.createElement('div');
    footerContainer.className = 'popup-footer';
    popup.appendChild(footerContainer);

    overlay.appendChild(popup);

    const onKeyDown = (e) => {
        if (e.key === 'Escape' && typeof _onClose === 'function') {
            _onClose();
        }
    };
    document.addEventListener('keydown', onKeyDown);
    overlay._keydownHandler = onKeyDown;

    return { overlay, popup, bodyContainer, footerContainer };
}

function renderPopup(config, data = {}) {
    window.log.info('[Popup ' + F_V + '] (5) renderPopup dipanggil');

    const { overlay, popup, bodyContainer, footerContainer } = buildFrame(config);

    if (config.contentElement instanceof HTMLElement) {
        bodyContainer.appendChild(config.contentElement);
    } else if (config.message) {
        const lines = config.message.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim() === '') {
                bodyContainer.appendChild(document.createElement('br'));
            } else {
                const p = document.createElement('p');
                p.textContent = line;
                bodyContainer.appendChild(p);
            }
        }
    }

    if (config.showActions && config.buttons.length > 0) {
        for (let i = 0; i < config.buttons.length; i++) {
            const btnConfig = config.buttons[i];
            const button = document.createElement('button');
            button.className = 'btn';
            if (btnConfig.type === 'primary') button.classList.add('btn-primary');
            else if (btnConfig.type === 'danger') button.classList.add('btn-danger');
            else button.classList.add('btn-outline');
            button.textContent = btnConfig.text;

            button.addEventListener('click', async () => {
                if (i === 0 && typeof data.onCancel === 'function') {
                    await data.onCancel();
                } else if (i === 1 && typeof data.onConfirm === 'function') {
                    await data.onConfirm();
                }
                if (typeof _onClose === 'function') {
                    _onClose();
                }
            });

            footerContainer.appendChild(button);
        }
    } else {
        footerContainer.style.display = 'none';
    }

    const container = ensureContainer();
    container.innerHTML = '';
    container.appendChild(overlay);

    overlayElement = overlay;
    popupElement = popup;
}

function register(index, factoryFn) {
    if (typeof factoryFn !== 'function') {
        window.log.error('[Popup ' + F_V + '] (6) register() memerlukan factory function.');
        return;
    }
    registry.set(index, factoryFn);
    window.log.info('[Popup ' + F_V + '] (7) Popup custom terdaftar: index=' + index);
}

function open(index, data = {}, callbacks = {}) {
    if (!index || index < 1) {
        window.log.error('[Popup ' + F_V + '] (8) open() memerlukan index valid.');
        return;
    }
    if (index === 10) {
        window.log.error('[Popup ' + F_V + '] (9) Index 10 dicadangkan, tidak dapat digunakan.');
        return;
    }

    if (activePopup) {
        window.log.info('[Popup ' + F_V + '] (10) Menutup popup sebelumnya (index=' + activePopup.index + ')');
        forceClose();
    }

    _onClose = typeof callbacks.onClose === 'function' ? callbacks.onClose : null;

    const config = collectConfig(index, data);
    renderPopup(config, data);

    activePopup = {
        index,
        type: (index >= 1 && index <= 9) ? 'default' : 'custom'
    };

    window.log.info('[Popup ' + F_V + '] (11) Popup dibuka: index=' + index + ' type=' + activePopup.type);
}

function forceClose() {
    if (!activePopup) return;

    const container = document.getElementById(POPUP_CONTAINER_ID);
    if (container) {
        container.innerHTML = '';
    }

    if (overlayElement && typeof overlayElement._keydownHandler === 'function') {
        document.removeEventListener('keydown', overlayElement._keydownHandler);
    }

    overlayElement = null;
    popupElement = null;
    _onClose = null;
    activePopup = null;
    window.log.info('[Popup ' + F_V + '] (12) Popup ditutup');
}

function isOpen() {
    return activePopup !== null;
}

function getActiveIndex() {
    return activePopup ? activePopup.index : 0;
}

export const PopupManager = {
    register,
    open,
    forceClose,
    isOpen,
    getActiveIndex
};

window.PopupManager = PopupManager;

window.log.info('[Popup ' + F_V + '] (13) PopupManager dimuat');

// ================================ End Of File ================================
