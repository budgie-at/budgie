import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { LOGO_DIR, assetUrl, readPngSize } from './render-slide.mjs';

const CAPTURE_FALLBACK = { width: 1206, height: 2622 };
const DEVICE_CORNER_RATIO = 0.154;
const DEVICE_BEZEL_RATIO = 0.028;

export const MISSING_SCREENS = new Set();

const PENDING_RECAPTURE = new Set();

const logoCache = new Map();

const ICONS = {
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    userX: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M17 8l5 5M22 8l-5 5"/>',
    phone: '<rect x="5" y="2" width="14" height="20" rx="2.5"/><path d="M11 18h2"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
    cloudOff:
        '<path d="m2 2 20 20"/><path d="M5.8 5.8A7 7 0 0 0 9 19h8.5a4.4 4.4 0 0 0 1.3-.2"/><path d="M21.5 16.5A4.5 4.5 0 0 0 17.5 10h-1.8A7 7 0 0 0 10 5.1"/>',
    database:
        '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>',
    server: '<rect x="2" y="3" width="20" height="8" rx="2"/><rect x="2" y="13" width="20" height="8" rx="2"/><path d="M6 7h.01M6 17h.01"/>',
    bank: '<path d="M3 22h18"/><path d="M6 18v-7M10 18v-7M14 18v-7M18 18v-7"/><path d="M12 2l9 6H3l9-6Z"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h6"/><path d="M8 13h8M8 17h5"/>',
    folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
    eyeOff: '<path d="M10.7 5.1A10.4 10.4 0 0 1 12 5c7 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68"/><path d="M6.6 6.6A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M14.1 14.1a3 3 0 1 1-4.2-4.2"/><path d="m2 2 20 20"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z"/>',
    tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42Z"/><path d="M7.5 7.5h.01"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    mic: '<path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/>',
    chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 16v-5M12 16V8M17 16v-3"/>',
    refresh:
        '<path d="M3 12a9 9 0 0 1 15.36-6.36L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.36 6.36L3 16"/><path d="M3 21v-5h5"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    ban: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
    wifiOff:
        '<path d="m2 2 20 20"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 4.17-2.65"/><path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76"/><path d="M16.85 11.25a10 10 0 0 1 2.22 1.68"/><path d="M5 12.86a10 10 0 0 1 3-1.99"/><path d="M12 20h.01"/>',
    cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M9 2v2M15 20v2M9 20v2M2 15h2M2 9h2M20 15h2M20 9h2"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>'
};

export function escapeHtml(text) {
    return String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

export function icon(name) {
    return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

function logoSvg(theme) {
    const file = path.join(LOGO_DIR, theme === 'light' ? 'black-on-white.svg' : 'white-on-black.svg');

    if (!logoCache.has(file)) {
        logoCache.set(file, readFileSync(file, 'utf8').replace(/\s+width="800"\s+height="800"/, ''));
    }

    return logoCache.get(file);
}

export function brand(context) {
    return `<div class="brand"><span class="mark">${logoSvg(context.theme)}</span><span class="word">Budgie</span></div>`;
}

export function domain() {
    return '<span class="domain">budgie.at</span>';
}

export function counter(index, total) {
    return `<span class="counter">${String(index).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>`;
}

export function draftTag() {
    return '<div class="draft">Draft &middot; demo data</div>';
}

export function chip(text, variant = '') {
    return `<span class="chip ${variant}">${escapeHtml(text)}</span>`;
}

export function chips(items, variant = '') {
    return `<div class="chips">${items.map(item => chip(item, variant)).join('')}</div>`;
}

export function noteChip(text, iconName = 'refresh') {
    return `<div class="chips"><span class="chip note">${icon(iconName)}${escapeHtml(text)}</span></div>`;
}

export function checkRow(label, { hollow = false } = {}) {
    const box = hollow ? '<span class="box"></span>' : `<span class="box">${icon('check')}</span>`;

    return `<div class="check ${hollow ? 'hollow' : ''}">${box}<span class="label">${escapeHtml(label)}</span></div>`;
}

export function lineRow({ label, iconName, accent = false }) {
    return `<div class="line-row ${accent ? 'accent' : ''}">${icon(iconName)}<span class="label">${escapeHtml(label)}</span></div>`;
}

export function flowNode({ label, note, iconName, variant = '' }) {
    const text = note
        ? `<span><span class="label">${escapeHtml(label)}</span><span class="note">${escapeHtml(note)}</span></span>`
        : `<span class="label">${escapeHtml(label)}</span>`;

    return `<div class="node ${variant}"><span style="display:flex;align-items:center">${icon(iconName)}</span>${text}</div>`;
}

function flowLink() {
    return '<div class="link"><svg class="icon" viewBox="0 0 8 26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 1v18"/><path d="m1 16 3 3 3-3"/></svg></div>';
}

export function flow(nodes) {
    return `<div class="flow">${nodes.map(node => flowNode(node)).join(flowLink())}</div>`;
}

export function splitCard({ mine, theirs, mineIcon, theirsIcon }) {
    return `<div class="split"><div class="card mine">${icon(mineIcon)}<span class="col-head">Local-first &middot; Budgie</span><span class="col-value">${escapeHtml(mine)}</span></div><div class="card">${icon(theirsIcon)}<span class="col-head">Cloud-first tracker</span><span class="col-value">${escapeHtml(theirs)}</span></div></div>`;
}

export function tiles(items) {
    return `<div class="tiles">${items.map(item => `<div class="tile">${icon(item.iconName)}<span class="label">${escapeHtml(item.label)}</span></div>`).join('')}</div>`;
}

export function repoCard({ repository, files }) {
    const rows = files
        .map(
            file =>
                `<div class="file">${icon(file.endsWith('/') ? 'folder' : 'file')}<span>${escapeHtml(file).split('/').join('/<wbr>')}</span></div>`
        )
        .join('');

    return `<div class="card repo"><div class="bar"><span class="dots"><i></i><i></i><i></i></span><span class="path">${escapeHtml(repository)}</span></div><div class="files">${rows}</div></div>`;
}

function screenFile(context, screenName) {
    if (PENDING_RECAPTURE.has(screenName)) {
        MISSING_SCREENS.add(`${context.theme}/${screenName}.png (pending recapture)`);

        return null;
    }

    const candidates = [
        path.join(context.screensDir, context.theme, `${screenName}.png`),
        path.join(context.screensDir, `${screenName}.png`)
    ];
    const found = candidates.find(candidate => existsSync(candidate));

    if (found === undefined) {
        MISSING_SCREENS.add(`${context.theme}/${screenName}.png`);
    }

    return found ?? null;
}

export function phone(screenName, options, context) {
    const { width, place = 'inline', top = null, left = null, right = null, ring = null } = options;
    const file = screenFile(context, screenName);
    const capture = file ? (readPngSize(file) ?? CAPTURE_FALLBACK) : CAPTURE_FALLBACK;
    const bezel = width * DEVICE_BEZEL_RATIO;
    const innerWidth = width - bezel * 2;
    const innerHeight = (innerWidth * capture.height) / capture.width;
    const innerRadius = innerWidth * DEVICE_CORNER_RATIO;
    const box = `width:${width}rem;height:${(innerHeight + bezel * 2).toFixed(2)}rem;padding:${bezel.toFixed(2)}rem;border-radius:${(innerRadius + bezel).toFixed(2)}rem`;
    const horizontal =
        left === 'center' ? `left:50%;margin-left:${(-width / 2).toFixed(2)}rem` : left === null ? `right:${right}rem` : `left:${left}rem`;
    const placement = place === 'bleed' ? `${horizontal};top:${top}rem` : '';
    const content = file ? `<img src="${assetUrl(file)}" alt="">` : '<div class="pending">screen capture pending</div>';
    const marker = ring
        ? `<div class="ring" style="left:${ring.left}%;top:${ring.top}%;width:${ring.width}%;height:${ring.height}%"></div>`
        : '';

    return `<div class="phone ${place === 'bleed' ? 'phone-bleed' : ''}" style="${box};${placement}"><div class="screen" style="border-radius:${innerRadius.toFixed(2)}rem">${content}${marker}</div></div>`;
}
