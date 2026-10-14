#!/usr/bin/env node
/**
 * Headless-Chromium audit of the pepo.chat landing page.
 * Exercises every interactive state (hero, demo window, install panel) at two locales
 * and responsive breakpoints, with the GitHub releases API replaced by a fixture.
 * Zero dependencies beyond node:chromium. Run `pnpm build` first.
 */
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const PREVIEW_PORT = 4175;
const DEBUG_PORT = 9333;
const CHROMIUM = process.env.CHROMIUM_BIN ?? 'chromium';

const RELEASE_FIXTURE = {
    tag_name: 'v0.2.19',
    assets: [
        { name: 'Pepo_0.2.19_universal.dmg', browser_download_url: 'https://example.com/Pepo_0.2.19_universal.dmg' },
        { name: 'Pepo_0.2.19_x64-setup.exe', browser_download_url: 'https://example.com/Pepo_0.2.19_x64-setup.exe' },
        { name: 'Pepo_0.2.19_amd64.deb', browser_download_url: 'https://example.com/Pepo_0.2.19_amd64.deb' },
        { name: 'Pepo-0.2.19-1.x86_64.rpm', browser_download_url: 'https://example.com/Pepo-0.2.19-1.x86_64.rpm' },
        { name: 'Pepo_0.2.19_amd64.AppImage', browser_download_url: 'https://example.com/Pepo_0.2.19_amd64.AppImage' }
    ]
};

const selectedWidths = process.argv.find((arg) => arg.startsWith('--widths='))?.slice(9) ?? process.env.AUDIT_WIDTHS;
const MOTION_ONLY = process.argv.includes('--motion-only');
const VIEWPORTS = (selectedWidths?.split(',').map(Number) ?? [320, 390, 560, 960, 1119, 1120, 1241, 1440]).map((width) => ({
    name: String(width), width, height: 900, mobile: width <= 560
}));
const LOCALES = ['/', '/ru/'];
const SCREENSHOTS = 'build/landing-audit';

const failures = [];
let passed = 0;

function check(label, condition, detail = '') {
    if (condition) {
        passed += 1;
        console.log(`  ok  ${label}`);
    } else {
        failures.push(`${label}${detail ? ` - ${detail}` : ''}`);
        console.log(`FAIL  ${label}${detail ? ` - ${detail}` : ''}`);
    }
}

async function checkLocales() {
    const locales = await Promise.all(['en', 'ru'].map(async (locale) => JSON.parse(await readFile(`messages/${locale}.json`, 'utf8'))));
    const keys = locales.map((messages) => Object.keys(messages).sort());
    check('locale key parity', JSON.stringify(keys[0]) === JSON.stringify(keys[1]));
    const missing = [];
    async function inspect(directory) {
        for (const entry of await readdir(directory, { withFileTypes: true })) {
            if (entry.name === 'paraglide') continue;
            const path = join(directory, entry.name);
            if (entry.isDirectory()) await inspect(path);
            else if (/\.(svelte|ts)$/.test(entry.name)) {
                const source = await readFile(path, 'utf8');
                for (const [, key] of source.matchAll(/msgs\.([a-zA-Z_][\w]*)/g)) {
                    if (!locales.every((messages) => typeof messages[key] === 'string')) missing.push(`${path}: ${key}`);
                }
            }
        }
    }
    await inspect('src');
    check('localized message references exist in both languages', missing.length === 0, missing.join(', '));
}

function startProcess(cmd, args, readyUrl) {
    const child = spawn(cmd, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    child.stderr.on('data', (d) => process.env.AUDIT_VERBOSE && process.stderr.write(d));
    if (readyUrl) {
        child.ready = (async () => {
            for (let i = 0; i < 100; i += 1) {
                try {
                    const res = await fetch(readyUrl);
                    if (res.ok) return child;
                } catch { /* not up yet */ }
                await delay(150);
            }
            throw new Error(`${cmd} did not become ready at ${readyUrl}`);
        })();
    }
    return child;
}

async function connectDebugger() {
    for (let i = 0; i < 100; i += 1) {
        try {
            const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
            const targets = await res.json();
            const page = targets.find((t) => t.type === 'page');
            if (page) return page.webSocketDebuggerUrl;
        } catch { /* not up yet */ }
        await delay(100);
    }
    throw new Error('chromium debugger never came up');
}

function makeCdp(wsUrl) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        let msgId = 0;
        const pending = new Map();
        const listeners = [];

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.id !== undefined && pending.has(msg.id)) {
                const { res, rej, timer } = pending.get(msg.id);
                clearTimeout(timer);
                pending.delete(msg.id);
                if (msg.error) rej(new Error(`${msg.error.message}`));
                else res(msg.result);
            } else {
                for (const listener of listeners) listener(msg);
            }
        };
        ws.onerror = () => reject(new Error('websocket error'));
        ws.onopen = () => {
            const cdp = {
                send(method, params = {}) {
                    return new Promise((res, rej) => {
                        const id = ++msgId;
                        const timer = setTimeout(() => {
                            pending.delete(id);
                            rej(new Error(`${method} timed out`));
                        }, 15000);
                        pending.set(id, { res, rej, timer });
                        ws.send(JSON.stringify({ id, method, params }));
                    });
                },
                on(listener) { listeners.push(listener); },
                close() { ws.close(); }
            };
            resolve(cdp);
        };
    });
}

async function main() {
    await checkLocales();
    await mkdir(SCREENSHOTS, { recursive: true });
    const profile = await mkdtemp(join(tmpdir(), 'pepo-landing-audit-'));
    const preview = startProcess(
        process.execPath,
        ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PREVIEW_PORT), '--strictPort', '--host', '127.0.0.1'],
        `http://127.0.0.1:${PREVIEW_PORT}/`
    );
    const chromium = startProcess(
        CHROMIUM,
        ['--headless=new', '--disable-gpu', '--no-sandbox', '--user-data-dir=' + profile,
            '--remote-debugging-port=' + DEBUG_PORT, 'about:blank']
    );
    let cdp;

    try {
        await preview.ready;
        const wsUrl = await connectDebugger();
        cdp = await makeCdp(wsUrl);

        const consoleErrors = [];
        const uncaughtExceptions = [];
        cdp.on((msg) => {
            if (msg.method === 'Runtime.exceptionThrown') {
                uncaughtExceptions.push(msg.params.exceptionDetails?.exception?.description ?? 'exception');
            }
            if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
                consoleErrors.push(msg.params.args?.map((a) => a.value ?? a.description).join(' '));
            }
            if (msg.method === 'Fetch.requestPaused') {
                void cdp.send('Fetch.fulfillRequest', {
                    requestId: msg.params.requestId,
                    responseCode: 200,
                    responseHeaders: [
                        { name: 'content-type', value: 'application/json' },
                        { name: 'access-control-allow-origin', value: '*' }
                    ],
                    body: btoa(JSON.stringify(RELEASE_FIXTURE))
                }).catch((error) => uncaughtExceptions.push(error.message));
            }
        });

        await cdp.send('Page.enable');
        await cdp.send('Runtime.enable');
        await cdp.send('Fetch.enable', {
            patterns: [{ urlPattern: 'https://api.github.com/repos/synthlabs/pepo/releases/latest' }]
        });

        const evalJs = async (expression) => {
            const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
            if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'eval failed');
            return r.result.value;
        };
        const navigate = async (path) => {
            await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PREVIEW_PORT}${path}` });
            await delay(1800); // load + hydration + a few chat ticks
        };
        const settle = () => evalJs(`new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))`);
        const clickAt = async (x, y) => {
            await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
            await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
            await settle();
        };
        const click = async (selector) => {
            const point = await evalJs(`(() => {
				const el = document.querySelector(${JSON.stringify(selector)});
				el.scrollIntoView({ block: 'center' });
				const r = el.getBoundingClientRect();
				const x = r.x + r.width / 2, y = r.y + r.height / 2;
				const hit = document.elementFromPoint(x, y);
				document.addEventListener('pointerdown', (event) => {
					window.__auditClick = { matched: el.contains(event.target), x: event.clientX, y: event.clientY, target: event.target.outerHTML.slice(0, 200) };
				}, { once: true, capture: true });
				return {
					x: (x - visualViewport.offsetLeft) * visualViewport.scale,
					y: (y - visualViewport.offsetTop) * visualViewport.scale,
					hit: el.contains(hit), target: hit?.outerHTML.slice(0, 200),
					viewport: { scale: visualViewport.scale, top: visualViewport.offsetTop, left: visualViewport.offsetLeft }
				};
			})()`);
            if (!point.hit) throw new Error(`Click target ${selector} is covered: ${JSON.stringify(point)}`);
            await clickAt(point.x, point.y);
            const actual = await evalJs('window.__auditClick');
            if (!actual?.matched) throw new Error(`Pointer missed ${selector}: ${JSON.stringify({ point, actual })}`);
        };
        const press = async (key, { shift = false } = {}) => {
            const keyCode = { Enter: 13, Escape: 27, Tab: 9, ArrowRight: 39, ArrowDown: 40 }[key];
            const text = key === 'Enter' ? '\r' : undefined;
            await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: keyCode, text, unmodifiedText: text, modifiers: shift ? 8 : 0 });
            await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: keyCode, modifiers: shift ? 8 : 0 });
            await settle();
        };
        const fill = async (selector, value) => {
            await evalJs(`(() => {
				const el = document.querySelector(${JSON.stringify(selector)});
				el.value = ${JSON.stringify(value)};
				el.dispatchEvent(new Event('input', { bubbles: true }));
			})()`);
            await settle();
        };
        const screenshot = async (name) => {
            const modal = await evalJs(`Boolean(document.querySelector('#demo-feature-sheet[open]'))`);
            const clip = modal ? undefined : await evalJs(`(() => {
				const r = document.querySelector('#features').getBoundingClientRect();
				return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height, scale: 1 };
			})()`);
            // Exclude sticky navigation from the section-only screenshot.
            const visibility = await evalJs(`(() => {
				const header = document.querySelector('.site-header');
				const previous = header.style.visibility;
				if (!${modal}) header.style.visibility = 'hidden';
				return previous;
			})()`);
            try {
                const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !modal, clip });
                await writeFile(join(SCREENSHOTS, `${name}.png`), Buffer.from(data, 'base64'));
            } finally {
                await evalJs(`document.querySelector('.site-header').style.visibility = ${JSON.stringify(visibility)}`);
            }
        };
        const translated = {
            '/': JSON.parse(await readFile('messages/en.json', 'utf8')),
            '/ru/': JSON.parse(await readFile('messages/ru.json', 'utf8'))
        };
        const featureCases = [
            { trigger: 'emotes', group: 'chat', side: 'right', available: ['hero_feature_emotes'], planned: ['feature_chat_reply_threads', 'feature_chat_history', 'feature_chat_decorations'] },
            { trigger: 'channels', group: 'channels', side: 'left', available: ['feature_channels_following', 'feature_channels_live_sorting'], planned: ['feature_channels_favorites', 'feature_channels_live_notifications', 'feature_channels_groups'] },
            { trigger: 'app', group: 'app', side: 'left', available: ['hero_feature_platforms', 'hero_feature_open_source', 'feature_app_autoupdater'], planned: ['feature_app_appearance', 'feature_app_mentions', 'feature_app_accounts', 'feature_app_youtube'] },
            { trigger: 'replies', group: 'chat', side: 'right', available: ['hero_feature_emotes'], planned: ['feature_chat_reply_threads', 'feature_chat_history', 'feature_chat_decorations'] },
            { trigger: 'events', group: 'events', side: 'right', available: [], planned: ['feature_events_activity', 'feature_events_moderation', 'feature_events_deleted_messages', 'feature_events_support_activity'] },
            { trigger: 'notifications', group: 'app', side: 'left', available: ['hero_feature_platforms', 'hero_feature_open_source', 'feature_app_autoupdater'], planned: ['feature_app_appearance', 'feature_app_mentions', 'feature_app_accounts', 'feature_app_youtube'] }
        ];
        const featureEmphasis = { emotes: 'available', channels: 'available', app: 'available', replies: 'planned', events: 'planned', notifications: 'planned' };
        const readDetails = () => evalJs(`(() => {
			const panel = document.querySelector('#demo-feature-sheet[open]') ?? document.querySelector('#demo-feature-details:not([hidden])');
			if (!panel) return null;
			const r = panel.getBoundingClientRect();
			const body = panel.querySelector('.feature-details-body');
			if (!body) return null;
			body.scrollTop = body.scrollHeight;
			const lastItems = [...body.querySelectorAll('li')];
			const lastReachable = !lastItems.length || lastItems.at(-1).getBoundingClientRect().bottom <= body.getBoundingClientRect().bottom + 1;
			body.scrollTop = 0;
			const side = document.querySelector('.demo-stage').dataset.detailsSide;
			return {
				group: panel.dataset.feature,
				title: panel.querySelector('h3').textContent,
				available: [...panel.querySelectorAll('[data-status="available"] li span')].map((el) => el.textContent),
				planned: [...panel.querySelectorAll('[data-status="planned"] li span')].map((el) => el.textContent),
				bright: getComputedStyle(panel.querySelector('h3')).color,
				muted: getComputedStyle(panel.querySelector('.feature-details-intro')).color,
				accent: getComputedStyle(document.querySelector('.callout-pin')).borderTopColor,
				sections: [...panel.querySelectorAll('.feature-status')].map((section) => ({
					status: section.dataset.status,
					text: [...section.querySelectorAll('h4, li span')].map((element) => getComputedStyle(element).color),
					icons: [...section.querySelectorAll('li svg')].map((element) => getComputedStyle(element).color)
				})),
				modal: panel.matches(':modal'), side,
				contained: r.left >= -1 && r.right <= innerWidth + 1,
				labelsAbove: !side || [...document.querySelectorAll('.demo-callouts [data-side="' + side + '"]')].every((el) => el.getBoundingClientRect().bottom <= r.top + 1),
				lastReachable,
				closeVisible: panel.querySelector('.feature-close').getBoundingClientRect().bottom <= r.bottom,
				focusInside: panel.contains(document.activeElement),
				count: document.querySelectorAll('#demo-feature-sheet[open], #demo-feature-details:not([hidden])').length
			};
		})()`);
        const checkEmphasis = (label, details, status) => {
            check(`${label}: opener selects the prominent section`, details.bright !== details.muted &&
                details.sections.some((section) => section.status === status) &&
                details.sections.every((section) => section.text.every((color) => color === (section.status === status ? details.bright : details.muted))), JSON.stringify(details.sections));
            check(`${label}: icons follow section emphasis`, details.sections.every((section) => section.icons.every((color) => color === (section.status === status ? details.accent : details.muted))), JSON.stringify(details.sections));
        };
        const startMotionSample = (duration = 360) => evalJs(`(() => {
			const start = performance.now();
			window.__motionSample = new Promise((resolve) => {
				const frames = [];
				const lines = (element) => {
					const range = document.createRange();
					range.selectNodeContents(element);
					return [...range.getClientRects()].map((rect) => rect.width);
				};
				const sample = () => {
					const stage = document.querySelector('.demo-stage').getBoundingClientRect();
					const sheet = document.querySelector('#demo-feature-sheet');
					const layers = [...document.querySelectorAll('.feature-layer, .feature-sheet-surface')].map((layer) => {
						const panel = layer.closest('.feature-details');
						const content = layer.querySelector('.feature-content');
						const style = getComputedStyle(layer);
						const transform = new DOMMatrix(style.transform);
						const outerTransform = new DOMMatrix(panel ? getComputedStyle(panel).transform : undefined);
						const inert = Boolean(layer.closest('[inert]'));
						const close = layer.querySelector('.feature-close');
						const focused = document.activeElement;
						const focusProbed = inert && focused !== close;
						if (focusProbed) close.focus();
						const rect = close.getBoundingClientRect();
						const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
						return {
							id: layer.querySelector('h3').id,
							group: layer.dataset.feature,
							width: content.getBoundingClientRect().width,
							lines: [...content.querySelectorAll('h3, .feature-details-intro, li span')].map(lines),
							opacity: Number(style.opacity) * (panel ? Number(getComputedStyle(panel).opacity) : 1),
							x: transform.m41 + outerTransform.m41,
							y: transform.m42,
							inert,
							focusProbed,
							focusBlocked: !focusProbed || document.activeElement === focused,
							focusBefore: focused?.className,
							focusAfter: document.activeElement?.className,
							pointerBlocked: !inert || !layer.contains(hit),
							hidden: Boolean(layer.closest('[aria-hidden="true"]')),
							frameX: panel ? document.querySelector('.feature-frame[data-side="' + panel.dataset.side + '"]').getBoundingClientRect().x : undefined
						};
					});
					const labels = [...document.querySelectorAll('.demo-callouts .demo-callout')].map((label) => {
						const rect = label.getBoundingClientRect();
						return { id: label.dataset.c, x: rect.x - stage.x, y: rect.y - stage.y, width: rect.width, lines: [lines(label.querySelector('.callout-label'))] };
					});
					const ids = [...document.querySelectorAll('.feature-content [id], .feature-details[id]')].map((element) => element.id);
					frames.push({
						time: performance.now() - start, layers, labels,
						previewWidth: document.querySelector('.demo-window').getBoundingClientRect().width,
						duplicateIds: ids.length !== new Set(ids).size,
						sheet: { open: sheet.open, modal: sheet.matches(':modal'), backdrop: Number(getComputedStyle(sheet, '::backdrop').opacity), locked: getComputedStyle(document.documentElement).overflow === 'hidden', focusInside: sheet.contains(document.activeElement) }
					});
					if (performance.now() - start < ${duration}) requestAnimationFrame(sample);
					else resolve(frames);
				};
				sample();
			});
		})()`);
        const finishMotionSample = () => evalJs('window.__motionSample');
        const stableText = (frames, field) => {
            const seen = new Map();
            for (const frame of frames) {
                for (const item of frame[field]) {
                    const prior = seen.get(item.id);
                    if (prior && (Math.abs(prior.width - item.width) > 0.1 || prior.lines.length !== item.lines.length ||
                        prior.lines.some((line, i) => line.length !== item.lines[i].length || line.some((width, j) => Math.abs(width - item.lines[i][j]) > 1)))) return false;
                    seen.set(item.id, item);
                }
            }
            return seen.size > 0;
        };
        const checkMotion = (label, frames, modal) => {
            check(`${label}: panel text width and line breaks stay stable`, stableText(frames, 'layers'));
            check(`${label}: detail ids remain unique`, frames.every((frame) => !frame.duplicateIds));
            check(`${label}: outgoing details reject focus and pointer hits`, frames.every((frame) => frame.layers.every((layer) => layer.focusBlocked && layer.pointerBlocked)), JSON.stringify(frames.filter((frame) => frame.layers.some((layer) => !layer.focusBlocked || !layer.pointerBlocked)).map((frame) => ({ time: frame.time, layers: frame.layers.map(({ group, inert, focusBlocked, focusBefore, focusAfter, pointerBlocked }) => ({ group, inert, focusBlocked, focusBefore, focusAfter, pointerBlocked })) }))));
            if (frames.some((frame) => frame.layers.some((layer) => layer.inert))) check(`${label}: outgoing focus rejection is exercised`, frames.some((frame) => frame.layers.some((layer) => layer.focusProbed)));
            check(`${label}: panels fade through intermediate opacity`, frames.some((frame) => frame.layers.some((layer) => layer.opacity > 0.05 && layer.opacity < 0.95)));
            check(`${label}: panels slide through intermediate positions`, frames.some((frame) => frame.layers.some((layer) => modal ? layer.y > 0.5 && layer.y < 23.5 : Math.abs(layer.x) > 0.5 && Math.abs(layer.x) < 11.5)));
            if (modal) {
                check(`${label}: backdrop fades`, frames.some((frame) => frame.sheet.open && frame.sheet.backdrop > 0.05 && frame.sheet.backdrop < 0.95));
                check(`${label}: modal focus and scroll lock persist through motion`, frames.every((frame) => !frame.sheet.open || frame.sheet.modal && frame.sheet.locked && frame.sheet.focusInside));
            } else {
                check(`${label}: labels keep their line breaks`, stableText(frames, 'labels') && frames.every((frame) => frame.labels.every((label) => Math.abs(label.width - 168) < 0.1)));
            }
        };
        const testFeatures = async (locale, vp, imageName, label) => {
            const modal = vp.width < 1120;
            const panelSelector = modal ? '#demo-feature-sheet[open]' : '#demo-feature-details:not([hidden])';
            const triggerSelector = (id) => `[data-feature-trigger="${id}"]`;
            const draft = 'Draft kept while exploring features';
            await fill('.demo-composer input', draft);
            await fill('.sidebar-head input', 'gam');

            for (const feature of featureCases) {
                const beforeWidth = await evalJs(`document.querySelector('.demo-window').getBoundingClientRect().width`);
                await startMotionSample();
                await click(triggerSelector(feature.trigger));
                const openingFrames = await finishMotionSample();
                checkMotion(`${label}: ${feature.trigger} opening`, openingFrames, modal);
                const details = await readDetails();
                check(`${label}: ${feature.trigger} opens ${feature.group} details`, details?.group === feature.group && details.count === 1, JSON.stringify(details));
                if (!details) throw new Error(`${feature.trigger} did not open a feature panel`);
                checkEmphasis(`${label}: ${feature.trigger}`, details, featureEmphasis[feature.trigger]);
                check(`${label}: ${feature.trigger} title and status bullets`,
                    details.title === translated[locale][`feature_group_${feature.group}_label`] &&
                    JSON.stringify(details.available) === JSON.stringify(feature.available.map((key) => translated[locale][key])) &&
                    JSON.stringify(details.planned) === JSON.stringify(feature.planned.map((key) => translated[locale][key])));
                check(`${label}: ${feature.trigger} panel fits and content is reachable`, details.contained && details.lastReachable && details.closeVisible, JSON.stringify(details));
                check(`${label}: ${feature.trigger} controls relationship`, await evalJs(`document.querySelector(${JSON.stringify(triggerSelector(feature.trigger))}).getAttribute('aria-controls') === document.querySelector(${JSON.stringify(panelSelector)}).id && document.querySelector(${JSON.stringify(triggerSelector(feature.trigger))}).getAttribute('aria-expanded') === 'true'`));
                const afterWidth = await evalJs(`document.querySelector('.demo-window').getBoundingClientRect().width`);
                if (modal) {
                    check(`${label}: ${feature.trigger} is modal without resizing preview`, details.modal && details.focusInside && Math.abs(beforeWidth - afterWidth) < 1);
                    for (let i = 0; i < 3; i++) await press('Tab');
                    check(`${label}: ${feature.trigger} traps keyboard focus`, await evalJs(`document.querySelector('#demo-feature-sheet').contains(document.activeElement)`));
                    for (let i = 0; i < 3; i++) await press('Tab', { shift: true });
                    check(`${label}: ${feature.trigger} traps backward keyboard focus`, await evalJs(`document.querySelector('#demo-feature-sheet').contains(document.activeElement)`));
                    const backdrop = await evalJs(`({ x: innerWidth / 2 * visualViewport.scale, y: Math.max(1, document.querySelector('#demo-feature-sheet').getBoundingClientRect().top - 10 - visualViewport.offsetTop) * visualViewport.scale })`);
                    await clickAt(backdrop.x, backdrop.y);
                    check(`${label}: ${feature.trigger} ignores backdrop clicks`, await evalJs(`document.querySelector('#demo-feature-sheet').open`));
                } else {
                    check(`${label}: ${feature.trigger} opens on its side with labels above`, details.side === feature.side && details.labelsAbove && !details.modal);
                    check(`${label}: ${feature.trigger} preview resizes smoothly`, afterWidth < beforeWidth - 1 && openingFrames.some((frame) => frame.previewWidth > afterWidth + 1 && frame.previewWidth < beforeWidth - 1));
                    const movingLabel = feature.side === 'right' ? 'emotes' : feature.trigger === 'channels' ? 'channels' : 'app';
                    const positions = openingFrames.map((frame) => frame.labels.find((label) => label.id === movingLabel));
                    const first = positions[0], last = positions.at(-1);
                    check(`${label}: ${feature.trigger} label glides horizontally`, positions.some((position) => position.x > Math.min(first.x, last.x) + 1 && position.x < Math.max(first.x, last.x) - 1));
                    if (feature.side === 'right') check(`${label}: ${feature.trigger} label glides vertically`, positions.some((position) => position.y > Math.min(first.y, last.y) + 1 && position.y < Math.max(first.y, last.y) - 1));
                    await click('.demo-composer input');
                    check(`${label}: ${feature.trigger} stays open during demo use`, Boolean(await readDetails()));
                }
                if (['emotes', 'app', 'events'].includes(feature.trigger)) await screenshot(`${imageName}-details-${feature.group}`);
                if (['replies', 'notifications'].includes(feature.trigger)) await screenshot(`${imageName}-planned-${feature.trigger}`);
                await startMotionSample();
                await click(`${panelSelector} .feature-close`);
                const closingFrames = await finishMotionSample();
                checkMotion(`${label}: ${feature.trigger} closing`, closingFrames, modal);
                check(`${label}: ${feature.trigger} outgoing details are inaccessible`, closingFrames.every((frame) => frame.layers.every((layer) => layer.opacity > 0.99 || layer.inert && layer.hidden)));
                if (!modal) {
                    const closedWidth = await evalJs(`document.querySelector('.demo-window').getBoundingClientRect().width`);
                    check(`${label}: ${feature.trigger} preview expands smoothly on close`, closedWidth > afterWidth + 1 && closingFrames.some((frame) => frame.previewWidth > afterWidth + 1 && frame.previewWidth < closedWidth - 1));
                }
                check(`${label}: ${feature.trigger} Close returns focus`, await evalJs(`document.activeElement === document.querySelector(${JSON.stringify(triggerSelector(feature.trigger))}) && !document.querySelector('#demo-feature-sheet[open], #demo-feature-details:not([hidden])')`));
                check(`${label}: ${feature.trigger} preserves draft and filter`, await evalJs(`document.querySelector('.demo-composer input').value === ${JSON.stringify(draft)} && document.querySelector('.sidebar-head input').value === 'gam'`));
            }

            await evalJs(`(() => {
				const trigger = document.querySelector('[data-feature-trigger="emotes"]');
				window.__featureKeys = [];
				for (const type of ['keydown', 'keypress', 'keyup', 'click']) {
					trigger.addEventListener(type, (event) => window.__featureKeys.push({ type, key: event.key, trusted: event.isTrusted }), { once: true });
				}
				trigger.focus();
			})()`);
            await press('Enter');
            await delay(300);
            const keyboardDetails = await readDetails();
            const keyboardTrace = await evalJs(`({ events: window.__featureKeys, focused: document.activeElement?.outerHTML.slice(0, 150), hasFocus: document.hasFocus() })`);
            check(`${label}: keyboard opens feature details`, keyboardDetails?.group === 'chat', JSON.stringify(keyboardTrace));
            await press('Escape');
            await delay(300);
            check(`${label}: Escape closes feature and returns focus`, await evalJs(`document.activeElement === document.querySelector('[data-feature-trigger="emotes"]') && !document.querySelector('#demo-feature-sheet[open], #demo-feature-details:not([hidden])')`));

            if (!modal) {
                await click(triggerSelector('app'));
                await delay(300);
                await startMotionSample();
                await click(triggerSelector('channels'));
                const sameSideFrames = await finishMotionSample();
                checkMotion(`${label}: same-side switch`, sameSideFrames, false);
                check(`${label}: same-side details crossfade`, sameSideFrames.some((frame) => frame.layers.length === 2 && frame.layers.every((layer) => layer.opacity > 0.05 && layer.opacity < 0.95)));
                check(`${label}: same-side frame stays stationary`, sameSideFrames.every((frame) => frame.layers.every((layer) => Math.abs(layer.frameX - sameSideFrames[0].layers[0].frameX) < 0.1)));
                check(`${label}: outgoing same-side details are inert and hidden`, sameSideFrames.every((frame) => frame.layers.every((layer) => layer.group !== 'app' || layer.opacity > 0.99 || layer.inert && layer.hidden)));
                await click(triggerSelector('app'));
                await delay(300);
                await startMotionSample();
                await evalJs(`window.__emphasisContent = document.querySelector('#demo-feature-details .feature-content')`);
                await click(triggerSelector('notifications'));
                const sameGroupFrames = await finishMotionSample();
                check(`${label}: same-group labels preserve content without restarting motion`, sameGroupFrames.every((frame) => frame.layers.length === 1 && frame.layers[0].opacity === 1 && Math.abs(frame.layers[0].x) < 0.1));
                check(`${label}: different label for same group switches opener`, (await readDetails())?.group === 'app' && await evalJs(`document.querySelector('[data-feature-trigger="notifications"]').getAttribute('aria-expanded') === 'true' && document.querySelector('[data-feature-trigger="app"]').getAttribute('aria-expanded') === 'false'`));
                checkEmphasis(`${label}: same-group planned opener`, await readDetails(), 'planned');
                check(`${label}: planned emphasis updates existing content`, await evalJs(`document.querySelector('#demo-feature-details .feature-content') === window.__emphasisContent`));
                await click(triggerSelector('app'));
                checkEmphasis(`${label}: same-group shipped opener`, await readDetails(), 'available');
                check(`${label}: shipped emphasis updates existing content`, await evalJs(`document.querySelector('#demo-feature-details .feature-content') === window.__emphasisContent`));
                await startMotionSample();
                await click(triggerSelector('emotes'));
                const otherSideFrames = await finishMotionSample();
                checkMotion(`${label}: opposite-side switch`, otherSideFrames, false);
                check(`${label}: opposite-side details crossfade`, otherSideFrames.some((frame) => frame.layers.length === 2 && frame.layers.every((layer) => layer.opacity > 0.05 && layer.opacity < 0.95)));
                check(`${label}: outgoing opposite-side details are inert and hidden`, otherSideFrames.every((frame) => frame.layers.every((layer) => layer.group !== 'app' || layer.opacity > 0.99 || layer.inert && layer.hidden)));
                check(`${label}: another group switches the open panel`, (await readDetails())?.group === 'chat');
                await click('.picker-trigger');
                await press('Escape');
                check(`${label}: picker Escape leaves feature details open`, !await evalJs(`Boolean(document.querySelector('#demo-emote-picker'))`) && (await readDetails())?.group === 'chat');
                await click(triggerSelector('emotes'));
                await delay(300);
                check(`${label}: active label toggles details closed`, !await readDetails());
            }
            await fill('.demo-composer input', '');
            await fill('.sidebar-head input', '');
        };
        const setViewport = (width, height = 900) => cdp.send('Emulation.setDeviceMetricsOverride', {
            width, height, deviceScaleFactor: 1, mobile: width <= 560
        });
        const testResponsiveDetails = async (locale) => {
            const label = `${locale} responsive details`;
            await setViewport(1241);
            await navigate(locale);
            await fill('.demo-composer input', 'Responsive draft');
            await fill('.sidebar-head input', 'gam');
            await click('[data-feature-trigger="app"]');
            await delay(300);
            await setViewport(1119);
            await settle();
            const sheet = await readDetails();
            check(`${label}: resize opens modal with selected feature`, sheet?.group === 'app' && sheet.modal && sheet.focusInside);
            check(`${label}: breakpoint change settles sheet motion`, await evalJs(`document.querySelector('.feature-sheet-surface').getAnimations().length === 0 && getComputedStyle(document.querySelector('.feature-sheet-surface')).opacity === '1'`));
            await setViewport(1241);
            await delay(300);
            const desktop = await readDetails();
            check(`${label}: resize restores side panel with selected feature`, desktop?.group === 'app' && !desktop.modal && desktop.side === 'left');
            check(`${label}: resize preserves draft and filter`, await evalJs(`document.querySelector('.demo-composer input').value === 'Responsive draft' && document.querySelector('.sidebar-head input').value === 'gam'`));
            for (const width of [1119, 1120, 1119, 1241]) await setViewport(width);
            await delay(300);
            check(`${label}: repeated breakpoint crossings keep the selected feature`, (await readDetails())?.group === 'app');
            await setViewport(320, 480);
            await settle();
            const compact = await readDetails();
            const smallSheet = await evalJs(`(() => {
				const panel = document.querySelector('#demo-feature-sheet');
				const body = panel.querySelector('.feature-details-body');
				return { height: panel.getBoundingClientRect().height, viewport: innerHeight, scrolls: body.scrollHeight > body.clientHeight };
			})()`);
            check(`${label}: short-screen sheet scrolls within viewport`, smallSheet.height <= smallSheet.viewport * 0.8 + 1 && smallSheet.scrolls && compact.lastReachable && compact.closeVisible, JSON.stringify(smallSheet));
            await screenshot(`${locale === '/' ? 'en' : 'ru'}-320-short-sheet`);
            await press('Escape');
            await delay(300);
            check(`${label}: mobile close returns focus to original label`, await evalJs(`document.activeElement === document.querySelector('[data-feature-trigger="app"]') && !document.querySelector('#demo-feature-sheet').open`));
            await setViewport(1440);
            await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
            await click('[data-feature-trigger="app"]');
            const reduced = await evalJs(`({ width: document.querySelector('.demo-window').getBoundingClientRect().width, duration: getComputedStyle(document.querySelector('.demo-stage')).transitionDuration })`);
            await delay(300);
            check(`${label}: reduced motion disables resize animation`, reduced.duration === '0s' && Math.abs(reduced.width - await evalJs(`document.querySelector('.demo-window').getBoundingClientRect().width`)) < 1);
            check(`${label}: reduced motion disables panels and labels`, await evalJs(`document.querySelector('.feature-details').getAnimations().length === 0 && getComputedStyle(document.querySelector('.feature-details')).opacity === '1' && getComputedStyle(document.querySelector('.demo-callout')).transitionDuration === '0s'`));
            await press('Escape');
            await setViewport(390);
            await settle();
            await click('[data-feature-trigger="app"]');
            check(`${label}: reduced motion opens sheet immediately`, await evalJs(`document.querySelector('#demo-feature-sheet').open && document.querySelector('.feature-sheet-surface').getAnimations().length === 0 && getComputedStyle(document.querySelector('#demo-feature-sheet'), '::backdrop').transitionDuration === '0s'`));
            await press('Escape');
            check(`${label}: reduced motion closes sheet immediately`, await evalJs(`!document.querySelector('#demo-feature-sheet').open && document.activeElement === document.querySelector('[data-feature-trigger="app"]')`));
            await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
        };
        const testInterruptedMotion = async (locale) => {
            for (const width of [1241, 390]) {
                const label = `${locale} ${width} interrupted motion`;
                await setViewport(width);
                await navigate(locale);
                await fill('.demo-composer input', 'Motion draft');
                await fill('.sidebar-head input', 'gam');
                await startMotionSample(650);
                // Programmatic activation fixes the intervals independently of pointer travel.
                await evalJs(`(async () => {
					for (const id of ${JSON.stringify(width >= 1120 ? ['app', 'channels', 'emotes', 'app', 'app', 'app'] : ['app', 'app', 'app'])}) {
						document.querySelector('[data-feature-trigger="' + id + '"]').click();
						await new Promise((resolve) => setTimeout(resolve, 45));
					}
				})()`);
                const frames = await finishMotionSample();
                await writeFile(join(SCREENSHOTS, `${locale === '/' ? 'en' : 'ru'}-${width}-motion.json`), JSON.stringify({ frames, html: await evalJs(`document.querySelector('.demo-stage').outerHTML`) }, null, 2));
                check(`${label}: interrupted text stays stable`, stableText(frames, 'layers'));
                check(`${label}: latest selection wins and outgoing layers finish`, (await readDetails())?.group === 'app' && frames.at(-1).layers.length === 1 && frames.at(-1).layers[0].opacity === 1);
                check(`${label}: outgoing details stay inaccessible`, frames.every((frame) => frame.layers.filter((layer) => !layer.inert).length <= 1 && frame.layers.every((layer) => !layer.inert || layer.hidden)));
                check(`${label}: outgoing controls reject focus and pointer hits`, frames.every((frame) => frame.layers.every((layer) => layer.focusBlocked && layer.pointerBlocked)));
                check(`${label}: ids stay unique`, frames.every((frame) => !frame.duplicateIds));
                check(`${label}: opacity reverses without jumping`, frames.every((frame, index) => !index || frame.layers.every((layer) => {
                    const prior = frames[index - 1].layers.find((item) => item.id === layer.id);
                    return !prior || Math.abs(prior.opacity - layer.opacity) < 0.4;
                })));
                check(`${label}: draft and filter survive interruptions`, await evalJs(`document.querySelector('.demo-composer input').value === 'Motion draft' && document.querySelector('.sidebar-head input').value === 'gam'`));
                await evalJs(`(() => {
					const sheet = document.querySelector('#demo-feature-sheet');
					window.__sheetTrace = [];
					const close = sheet.close.bind(sheet);
					sheet.close = (...args) => { window.__sheetTrace.push({ type: 'close method', time: performance.now(), stack: new Error().stack }); return close(...args); };
					for (const type of ['cancel', 'close', 'keydown']) {
						sheet.addEventListener(type, (event) => {
							window.__sheetTrace.push({ type, key: event.key, time: performance.now(), cancelable: event.cancelable, prevented: event.defaultPrevented, open: sheet.open });
							setTimeout(() => window.__sheetTrace.push({ type: type + ' after', time: performance.now(), prevented: event.defaultPrevented, open: sheet.open }), 0);
						}, { capture: true });
					}
				})()`);
                await startMotionSample();
                if (width >= 1120) await click('#demo-feature-details .feature-close');
                else await press('Escape');
                if (width < 1120) await press('Tab');
                const closing = await finishMotionSample();
                await writeFile(join(SCREENSHOTS, `${locale === '/' ? 'en' : 'ru'}-${width}-motion-close.json`), JSON.stringify({ frames: closing, events: await evalJs('window.__sheetTrace') }, null, 2));
                checkMotion(`${label}: final dismissal`, closing, width < 1120);
                check(`${label}: final dismissal completes and restores focus`, !await readDetails() && await evalJs(`document.activeElement === document.querySelector('[data-feature-trigger="app"]')`));
                if (width < 1120) check(`${label}: Tab during exit stays in the modal`, closing.every((frame) => !frame.sheet.open || frame.sheet.focusInside && frame.sheet.locked));
            }
        };

        for (const locale of LOCALES) {
            for (const vp of MOTION_ONLY ? [] : VIEWPORTS) {
                const label = `${locale.trim() || '/'} ${vp.name}`;
                console.log(`\n== ${label} ==`);
                await cdp.send('Emulation.setDeviceMetricsOverride', {
                    width: vp.width,
                    height: vp.height,
                    deviceScaleFactor: 1,
                    mobile: vp.mobile
                });
                await navigate(locale);
                await evalJs(`document.querySelector('#features').scrollIntoView({ block: 'start' })`);
                await settle();
                const imageName = `${locale === '/' ? 'en' : 'ru'}-${vp.width}`;

                // Hero: chat rows arrive from the ticker
                const heroRows = await evalJs(`document.querySelectorAll('.hero-chat-column .chat-row').length`);
                check(`${label}: hero chat ticking`, heroRows >= 4, `rows=${heroRows}`);

                // Demo window: frozen snapshot present, no live ticker
                const demoRows = await evalJs(`document.querySelectorAll('.chat-log .dmsg').length`);
                check(`${label}: demo snapshot rows`, demoRows === 9, `rows=${demoRows}`);

                // Measure actual text boxes, not just element visibility.
                const calloutInfo = await evalJs(`(() => {
					const rect = (el) => {
						const r = el.getBoundingClientRect();
						return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
					};
					const windowRect = rect(document.querySelector('.demo-window'));
					const boxes = [...document.querySelectorAll('.callout-label, .callout-pill')].map(rect);
					const overlaps = [];
					for (let i = 0; i < boxes.length; i++) {
						for (let j = i + 1; j < boxes.length; j++) {
							const a = boxes[i], b = boxes[j];
							if (Math.min(a.right, b.right) > Math.max(a.left, b.left) + 1 &&
								Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top) + 1) overlaps.push([i, j]);
						}
					}
					const shipped = [...document.querySelectorAll('.demo-callouts .demo-callout')];
					return {
						count: boxes.length, overlaps, windowRect,
						contained: boxes.every((r) => r.width > 0 && r.left >= 0 && r.right <= innerWidth + 1),
						plannedBelow: rect(document.querySelector('.demo-planned')).top > windowRect.bottom,
						shippedBelow: shipped.every((el) => rect(el).top > windowRect.bottom),
						pinsOnEdges: shipped.every((el) => {
							const pin = rect(el.querySelector('.callout-pin'));
							const edge = el.dataset.side === 'left' ? windowRect.left : windowRect.right;
							return Math.abs((pin.left + pin.right) / 2 - edge) < 2;
						}),
						numbers: shipped.map((el) => el.querySelector('.callout-pin').textContent.trim()),
						composerBottom: rect(document.querySelector('.demo-composer')).bottom,
						pageOverflow: document.documentElement.scrollWidth - innerWidth,
						windowOverflow: document.querySelector('.demo-main').scrollWidth - document.querySelector('.demo-main').clientWidth
					};
				})()`);
                check(`${label}: callout count`, calloutInfo.count === 6, JSON.stringify(calloutInfo));
                check(`${label}: annotations do not overlap`, calloutInfo.overlaps.length === 0, JSON.stringify(calloutInfo.overlaps));
                check(`${label}: annotations within viewport`, calloutInfo.contained);
                check(`${label}: planned features below preview`, calloutInfo.plannedBelow);
                check(`${label}: shipped annotations placement`, vp.width >= 1120 ? calloutInfo.pinsOnEdges : calloutInfo.shippedBelow);
                check(`${label}: shipped numbers in order`, calloutInfo.numbers.join(',') === '1,2,3');
                check(`${label}: composer anchored to bottom`, Math.abs(calloutInfo.windowRect.bottom - calloutInfo.composerBottom - 1) < 2);
                check(`${label}: no horizontal page overflow`, calloutInfo.pageOverflow <= 1, `overflow=${calloutInfo.pageOverflow}`);
                check(`${label}: no composer overflow`, calloutInfo.windowOverflow <= 1, `overflow=${calloutInfo.windowOverflow}`);
                check(`${label}: preview size`, calloutInfo.windowRect.width <= 900 && calloutInfo.windowRect.height === (vp.width >= 1120 ? 560 : vp.mobile ? 440 : 460));
                await screenshot(`${imageName}-demo`);
                await testFeatures(locale, vp, imageName, label);

                if (vp.mobile) {
                    check(`${label}: sidebar initially hidden`, await evalJs(`document.querySelector('.demo-sidebar-panel').getClientRects().length === 0`));
                    await click('.sidebar-trigger');
                    check(`${label}: channels toggle opens sidebar`, await evalJs(`document.querySelector('.sidebar-trigger').getAttribute('aria-expanded') === 'true' && document.querySelector('.demo-sidebar-panel').getClientRects().length > 0`));
                    check(`${label}: sidebar receives focus`, await evalJs(`document.activeElement === document.querySelector('.sidebar-head input')`));
                    await screenshot(`${imageName}-sidebar`);
                }

                // Sidebar filtering and sorting work at every width.
                const beforeSort = await evalJs(`[...document.querySelectorAll('.sidebar-channels .ch-name')].map((el) => el.textContent)`);
                await fill('.sidebar-head input', 'gam');
                const filteredChannels = await evalJs(`[...document.querySelectorAll('.sidebar-channels .ch-name')].map((el) => el.textContent)`);
                check(`${label}: sidebar filter narrows`, filteredChannels.length === 1 && filteredChannels[0] === 'gamer_kim', JSON.stringify(filteredChannels));
                await fill('.sidebar-head input', '');
                await click('.sort-toggle');
                const afterSort = await evalJs(`[...document.querySelectorAll('.sidebar-channels .ch-name')].map((el) => el.textContent)`);
                const sorted = [...afterSort].sort((a, b) => a.localeCompare(b));
                check(`${label}: sort toggle reorders`, JSON.stringify(beforeSort) !== JSON.stringify(afterSort) && JSON.stringify(afterSort) === JSON.stringify(sorted));
                await click('.sort-toggle');

                if (vp.mobile) {
                    await press('Escape');
                    check(`${label}: Escape closes sidebar and returns focus`, await evalJs(`document.querySelector('.demo-sidebar-panel').getClientRects().length === 0 && document.activeElement === document.querySelector('.sidebar-trigger')`));
                    await press('Tab');
                    const tabFocus = await evalJs(`({
						inSidebar: document.querySelector('.demo-sidebar-panel').contains(document.activeElement),
						inLog: document.activeElement === document.querySelector('.chat-log'),
						focused: document.activeElement?.outerHTML.slice(0, 250)
					})`);
                    check(`${label}: hidden sidebar skipped by Tab`, !tabFocus.inSidebar, tabFocus.focused);
                    if (tabFocus.inLog) await press('Tab');
                    check(`${label}: composer reachable by Tab`, await evalJs(`document.activeElement === document.querySelector('.demo-composer input')`));
                    await click('.sidebar-trigger');
                    await click('.sidebar-trigger');
                    check(`${label}: toggle closes sidebar`, await evalJs(`document.querySelector('.sidebar-trigger').getAttribute('aria-expanded') === 'false'`));
                    await click('.sidebar-trigger');
                    await click('#features h2');
                    check(`${label}: outside click closes sidebar`, await evalJs(`document.querySelector('.demo-sidebar-panel').getClientRects().length === 0`));
                }

                {
                    // Emote picker: open, search filters, Enter inserts, send appends
                    await click('.picker-trigger');
                    check(`${label}: picker opens`, await evalJs(`Boolean(document.querySelector('#demo-emote-picker'))`));
                    await screenshot(`${imageName}-picker`);
                    await fill('#demo-emote-picker input', 'KEK');
                    const filtered = await evalJs(`document.querySelectorAll('#demo-emote-listbox [role="option"]').length`);
                    check(`${label}: picker search filters`, filtered === 1, `options=${filtered}`);
                    await press('Enter');
                    const composerValue = await evalJs(`document.querySelector('.demo-composer form input').value`);
                    check(`${label}: picker inserts one emote`, composerValue.trim() === 'KEKW', `value="${composerValue}"`);
                    await press('Escape');
                    check(`${label}: Escape closes picker and returns focus`, await evalJs(`!document.querySelector('#demo-emote-picker') && document.activeElement === document.querySelector('.picker-trigger')`));
                    await click('.send');
                    const sent = await evalJs(`(() => {
						const rows = [...document.querySelectorAll('.chat-log .dmsg')];
						const last = rows.at(-1);
						return { count: rows.length, sent: last?.classList.contains('sent'), emotes: [...last.querySelectorAll('.dmsg-emote')].map((img) => img.alt) };
					})()`);
                    check(`${label}: send appends message`, sent.sent && sent.emotes.includes('KEKW'), JSON.stringify(sent));
                    check(`${label}: message list capped`, sent.count <= 14, `count=${sent.count}`);

                    for (let i = 0; i < 18; i++) {
                        await fill('.demo-composer input', `Message ${i}: ${'chat '.repeat(20)}`);
                        await click('.send');
                    }
                    const scrolling = await evalJs(`(() => {
						const log = document.querySelector('.chat-log');
						const composer = document.querySelector('.demo-composer').getBoundingClientRect();
						const windowRect = document.querySelector('.demo-window').getBoundingClientRect();
						const atBottom = Math.abs(log.scrollHeight - log.clientHeight - log.scrollTop) < 2;
						log.scrollTop = 0;
						return {
							count: log.querySelectorAll('.dmsg').length,
							overflow: log.scrollHeight > log.clientHeight,
							atBottom,
							firstReachable: log.firstElementChild.getBoundingClientRect().top >= log.getBoundingClientRect().top,
							composerAligned: Math.abs(windowRect.bottom - composer.bottom - 1) < 2
						};
					})()`);
                    check(`${label}: capped messages scroll and oldest is reachable`, scrolling.count === 14 && scrolling.overflow && scrolling.atBottom && scrolling.firstReachable, JSON.stringify(scrolling));
                    check(`${label}: composer stays at bottom after sends`, scrolling.composerAligned);
                }

                // Install: fixture artifact resolved, detected platform preselected, radio swap works
                const install = await evalJs(`(() => {
					const title = document.querySelector('.install-primary-title')?.textContent.trim() ?? '';
					const file = document.querySelector('.install-primary-file')?.textContent.trim() ?? '';
					const chip = document.querySelector('.install-detected-chip')?.textContent.trim() ?? '';
					const link = document.querySelector('.install-download')?.href ?? '';
					return { title, file, chip, link };
				})()`);
                check(`${label}: install resolves fixture asset`, install.file.startsWith('Pepo_0.2.19_'), install.file);
                check(`${label}: install link matches fixture`, install.link.startsWith('https://example.com/'), install.link);
                check(`${label}: detected platform flagged`, install.chip.length > 0, `chip="${install.chip}" title="${install.title}"`);

                await evalJs(`document.querySelector('[data-radio="windows"]').click()`);
                await delay(100);
                const windowsCard = await evalJs(`document.querySelector('.install-primary-file').textContent.trim()`);
                check(`${label}: radio swaps artifact`, windowsCard === 'Pepo_0.2.19_x64-setup.exe', windowsCard);

                // Keyboard: roving tabindex on the radios
                await click('[data-radio="macos"]');
                const focused = await evalJs(`(async () => {
					const macos = document.querySelector('[data-radio="macos"]');
					macos.focus();
					macos.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
					await new Promise((r) => setTimeout(r, 50));
					return document.activeElement?.dataset.radio ?? '';
				})()`);
                check(`${label}: radio arrow keys move focus`, focused === 'windows', `focused=${focused}`);
            }
            await testResponsiveDetails(locale);
            await testInterruptedMotion(locale);
        }

        check('no console errors', consoleErrors.length === 0, consoleErrors.join(' | ').slice(0, 300));
        check('no uncaught exceptions', uncaughtExceptions.length === 0, uncaughtExceptions.join(' | ').slice(0, 300));
    } finally {
        cdp?.close();
        preview.kill('SIGTERM');
        chromium.kill('SIGTERM');
        await Promise.all([preview, chromium].map((child) => child.exitCode !== null || child.signalCode !== null ? Promise.resolve() : new Promise((resolve) => child.once('exit', resolve))));
        await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 1000 });
    }

    await writeFile(join(SCREENSHOTS, 'results.json'), JSON.stringify({ passed, failures, mode: MOTION_ONLY ? 'motion' : 'full', widths: MOTION_ONLY ? [320, 390, 1119, 1120, 1241, 1440] : VIEWPORTS.map((vp) => vp.width), locales: LOCALES }, null, 2));
    console.log(`\n${passed} passed, ${failures.length} failed`);
    console.log(`Screenshots: ${SCREENSHOTS}`);
    if (failures.length > 0) {
        console.error('\nFAILURES:');
        for (const f of failures) console.error(` - ${f}`);
        process.exit(1);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
