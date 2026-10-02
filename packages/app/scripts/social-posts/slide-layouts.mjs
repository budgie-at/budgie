import { safeArea } from './render-slide.mjs';
import {
    brand,
    checkRow,
    chips,
    counter,
    domain,
    draftTag,
    escapeHtml,
    flow,
    lineRow,
    noteChip,
    phone,
    repoCard,
    splitCard,
    tiles
} from './slide-components.mjs';

const PHONE_BELOW = {
    master: { width: 26, top: 38 },
    editorial: { width: 26, top: 38 },
    square: { width: 23, top: 28 },
    story: { width: 34, top: 44 }
};

const HEAD_AND_GAP_REM = 6.5;

const PHONE_FLOW = { master: 17, editorial: 17, square: 15, story: 22 };

const PHONE_SIDE = {
    master: { width: 26, top: 34, right: -4, textWidth: 38 },
    editorial: { width: 26, top: 34, right: -4, textWidth: 38 },
    square: { width: 22, top: 22, right: -3, textWidth: 40 },
    story: { width: 30, top: 44, right: -4, textWidth: 55 }
};

const HEADLINE_LEVEL = {
    xl: { master: 'h-xl', editorial: 'h-xl', square: 'h-xl', story: 'h-xl' },
    lg: { master: 'h-lg', editorial: 'h-lg', square: 'h-lg', story: 'h-xl' },
    md: { master: 'h-md', editorial: 'h-md', square: 'h-md', story: 'h-lg' },
    sm: { master: 'h-sm', editorial: 'h-sm', square: 'h-sm', story: 'h-md' }
};

function headlineClass(level, context) {
    return HEADLINE_LEVEL[level][context.sizeName];
}

function headline(text, level, context, style = '') {
    return `<h1 class="headline ${headlineClass(level, context)}"${style ? ` style="${style}"` : ''}>${escapeHtml(text)}</h1>`;
}

function shell({ body, bodyClass = '', bodyStyle = '', footLeft = '', bleed = '' }, context) {
    const marker = context.slideCount > 1 && context.carousel ? counter(context.slideIndex, context.slideCount) : '';
    const left = footLeft === '' ? marker : footLeft;
    const right = footLeft === '' ? domain() : `${marker}${domain()}`;

    return `${bleed}${context.verified ? '' : draftTag()}<div class="frame"><div class="head">${brand(context)}</div><div class="body ${bodyClass}" style="${bodyStyle}">${body}</div><div class="foot">${left}<span style="display:flex;align-items:flex-end;gap:2rem">${right}</span></div></div>`;
}

function footnote(text) {
    return `<span class="footnote">${escapeHtml(text)}</span>`;
}

function textAreaHeight(context, phoneTop) {
    const scale = context.size.width / 1080;

    return (phoneTop - safeArea(context.size).y / (16 * scale) - HEAD_AND_GAP_REM).toFixed(2);
}

export function statementSlide(options, context) {
    const { eyebrow = null, text, level = 'lg', secondary = null, note = null, screen = null, place = 'below', ring = null } = options;
    const layout = place === 'side' ? PHONE_SIDE[context.sizeName] : PHONE_BELOW[context.sizeName];
    const stack = [
        eyebrow === null ? '' : `<span class="eyebrow">${escapeHtml(eyebrow)}</span>`,
        headline(text, level, context),
        secondary === null ? '' : `<p class="secondary">${escapeHtml(secondary)}</p>`
    ].join('');

    if (screen === null) {
        return shell({ body: `<div class="stack">${stack}</div>`, footLeft: note === null ? '' : footnote(note) }, context);
    }

    if (place === 'side') {
        return shell(
            {
                bleed: phone(screen, { width: layout.width, place: 'bleed', top: layout.top, right: layout.right, ring }, context),
                body: `<div class="stack" style="max-width:${layout.textWidth}rem">${stack}</div>`,
                footLeft: note === null ? '' : footnote(note)
            },
            context
        );
    }

    return shell(
        {
            bleed: phone(screen, { width: layout.width, place: 'bleed', top: layout.top, left: 'center', ring }, context),
            body: `<div class="stack">${stack}</div>`,
            bodyStyle: `height:${textAreaHeight(context, layout.top)}rem;flex:none`,
            footLeft: note === null ? '' : footnote(note)
        },
        context
    );
}

export function checklistSlide(options, context) {
    const { lead, level = 'md', items, hollow = false, note = null } = options;

    return shell(
        {
            body: `<div class="stack" style="gap:3rem">${headline(lead, level, context)}<div class="rows" style="gap:1.9rem">${items.map(item => checkRow(item, { hollow })).join('')}</div></div>`,
            footLeft: note === null ? '' : footnote(note)
        },
        context
    );
}

export function iconListSlide(options, context) {
    const { text, level = 'md', items, note = null } = options;

    return shell(
        {
            body: `<div class="stack" style="gap:3rem">${headline(text, level, context)}<div class="rows">${items.map(item => lineRow(item)).join('')}</div></div>`,
            footLeft: note === null ? '' : footnote(note)
        },
        context
    );
}

export function pollSlide(options, context) {
    const { text, level = 'md', items, note = null } = options;

    return shell(
        {
            body: `<div class="stack" style="gap:3rem">${headline(text, level, context)}${tiles(items)}</div>`,
            footLeft: note === null ? '' : footnote(note)
        },
        context
    );
}

export function flowSlide(options, context) {
    const { text, level = 'md', secondary = null, nodes, tags = null, note = null, noteIcon = 'refresh', screen = null } = options;
    const parts = [
        headline(text, level, context),
        secondary === null ? '' : `<p class="secondary">${escapeHtml(secondary)}</p>`,
        `<div style="margin-top:1rem">${flow(nodes)}</div>`,
        tags === null ? '' : chips(tags),
        note === null ? '' : noteChip(note, noteIcon)
    ].join('');

    if (screen === null) {
        return shell({ body: `<div class="stack" style="gap:2rem">${parts}</div>` }, context);
    }

    return shell(
        {
            body: `<div class="two-col"><div class="col-text" style="gap:2rem">${parts}</div>${phone(screen, { width: PHONE_FLOW[context.sizeName] }, context)}</div>`
        },
        context
    );
}

export function chipsSlide(options, context) {
    const { text, level = 'md', secondary = null, tags } = options;
    const parts = [
        headline(text, level, context),
        secondary === null ? '' : `<p class="secondary">${escapeHtml(secondary)}</p>`,
        `<div style="margin-top:1rem">${chips(tags)}</div>`
    ].join('');

    return shell({ body: `<div class="stack" style="gap:2rem">${parts}</div>` }, context);
}

export function comparisonSlide(options, context) {
    const { label, mine, theirs, mineIcon, theirsIcon, note = null } = options;
    const parts = [
        headline(label, 'lg', context),
        splitCard({ mine, theirs, mineIcon, theirsIcon }),
        note === null ? '' : noteChip(note, 'refresh')
    ].join('');

    return shell({ body: `<div class="stack" style="gap:3.25rem">${parts}</div>` }, context);
}

export function repoSlide(options, context) {
    const { text, repository, files, annotation, screen, note } = options;
    const column = `<div class="col-text">${headline(text, 'sm', context)}${repoCard({ repository, files })}<span class="annotation">${escapeHtml(annotation)}</span></div>`;

    return shell(
        {
            body: `<div class="two-col">${column}${phone(screen, { width: context.sizeName === 'story' ? 24 : 17 }, context)}</div>`,
            footLeft: footnote(note)
        },
        context
    );
}
