<script lang="ts">
	import { onMount } from 'svelte';
	import { chatClock, EMOTES, type BrokenEmotes, type EmoteName } from '$lib/chat/mock-chat';
	import {
		DEMO_ACTIVE,
		DEMO_CHANNELS,
		DEMO_MAX_MESSAGES,
		DEMO_NEXT_ID,
		demoSnapshot,
		type DemoChannel,
		type DemoMessage
	} from '$lib/chat/demo-data';
	import { m as msgs } from '$lib/paraglide/messages';
	import WindowChrome from './WindowChrome.svelte';
	import ChannelsSidebar from './ChannelsSidebar.svelte';
	import ChatPane from './ChatPane.svelte';
	import ChatComposer from './ChatComposer.svelte';
	import FeatureCallout from './FeatureCallout.svelte';
	import FeatureDetails from './FeatureDetails.svelte';
	import { featureMotion, markPresentation } from './feature-motion';
	import { FEATURES, FEATURE_CALLOUTS, SHIPPED_CALLOUTS, PLANNED_CALLOUTS, type FeatureId, type FeatureTriggerId } from './features';

	type SortMode = 'live' | 'alpha';

	let messages = $state<DemoMessage[]>(demoSnapshot());
	let sortMode = $state<SortMode>('live');
	let filter = $state('');
	let input = $state('');
	let pickerOpen = $state(false);
	let sidebarOpen = $state(false);
	let pickerQuery = $state('');
	let selectedEmote = $state(0);
	let broken = $state<BrokenEmotes>({});
	let stage: HTMLElement | undefined = $state();
	let compact = $state(false);
	let activeTrigger: FeatureTriggerId | null = $state(null);
	let featureSheet: HTMLDialogElement | undefined = $state();
	let sheetGroup: FeatureId | null = $state(null);
	let closingOpener: FeatureTriggerId | null = null;
	let settling = $state(false);
	let motionEpoch = $state(0);
	let nextId = DEMO_NEXT_ID;

	const activeCallout = $derived(FEATURE_CALLOUTS.find((callout) => callout.id === activeTrigger));
	const activeFeature = $derived(activeCallout ? FEATURES[activeCallout.feature] : undefined);
	const detailEmphasis = $derived(PLANNED_CALLOUTS.some((callout) => callout.id === activeTrigger) ? 'planned' : 'available');
	const detailControls = $derived(compact ? 'demo-feature-sheet' : 'demo-feature-details');
	const detailGroups = $derived(activeCallout ? [activeCallout.feature] : []);
	const desktopGroups = $derived(compact ? [] : detailGroups);

	onMount(() => {
		const media = window.matchMedia('(max-width: 1119px)');
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		let settleFrame = 0;
		const update = () => {
			cancelAnimationFrame(settleFrame);
			settling = true;
			compact = media.matches;
			motionEpoch += 1;
			if (!activeTrigger && featureSheet?.open) finishSheetClose();
			settleFrame = requestAnimationFrame(() => {
				settleFrame = requestAnimationFrame(() => { settling = false; });
			});
		};
		update();
		media.addEventListener('change', update);
		reducedMotion.addEventListener('change', update);
		return () => {
			cancelAnimationFrame(settleFrame);
			media.removeEventListener('change', update);
			reducedMotion.removeEventListener('change', update);
		};
	});

	$effect(() => {
		if (!featureSheet) return;
		if (compact && activeFeature) {
			sheetGroup = activeCallout!.feature;
			if (!featureSheet.open) {
				featureSheet.dataset.visible = 'false';
				featureSheet.showModal();
				getComputedStyle(featureSheet, '::backdrop').opacity;
			}
			featureSheet.dataset.visible = 'true';
		} else if (!compact && featureSheet.open) {
			finishSheetClose();
		}
	});

	const activeChannel: DemoChannel = DEMO_CHANNELS.find((c) => c.login === DEMO_ACTIVE) ?? DEMO_CHANNELS[0]!;

	const visibleChannels = $derived.by(() => {
		const query = filter.trim().toLowerCase();
		const list = DEMO_CHANNELS.filter((c) => c.login.includes(query));
		if (sortMode === 'alpha') return [...list].sort((a, b) => a.login.localeCompare(b.login));
		// mirrors the app sidebar: live first, then viewer count
		return [...list].sort((a, b) => {
			if (a.live !== b.live) return a.live ? -1 : 1;
			return b.viewers - a.viewers;
		});
	});

	const pickerEmotes = $derived(
		Object.keys(EMOTES).filter(
			(name) =>
				!broken[name as EmoteName] &&
				name.toLowerCase().includes(pickerQuery.trim().toLowerCase())
		) as EmoteName[]
	);

	$effect(() => {
		if (selectedEmote >= pickerEmotes.length) selectedEmote = Math.max(0, pickerEmotes.length - 1);
	});

	function send() {
		const text = input.trim();
		if (!text) return;
		messages = [
			...messages,
			{
				id: nextId++,
				ts: chatClock(),
				user: msgs.demo_you(),
				color: 'hsl(var(--c-pepo))',
				badges: [],
				text,
				you: true
			}
		].slice(-DEMO_MAX_MESSAGES);
		input = '';
	}

	function insertEmote(name: EmoteName) {
		input = `${input}${name} `;
	}

	function openPicker() {
		pickerQuery = '';
		selectedEmote = 0;
		pickerOpen = true;
	}

	function closePicker(returnFocus = true) {
		pickerOpen = false;
		if (returnFocus) {
			requestAnimationFrame(() => stage?.querySelector<HTMLButtonElement>('.picker-trigger')?.focus());
		}
	}

	function togglePicker() {
		if (pickerOpen) closePicker(false);
		else openPicker();
	}

	function closeSidebar(returnFocus = false) {
		sidebarOpen = false;
		if (returnFocus) {
			requestAnimationFrame(() => stage?.querySelector<HTMLButtonElement>('.sidebar-trigger')?.focus());
		}
	}

	function toggleSidebar() {
		if (sidebarOpen) closeSidebar();
		else {
			closePicker(false);
			sidebarOpen = true;
			requestAnimationFrame(() => stage?.querySelector<HTMLInputElement>('.sidebar-head input')?.focus());
		}
	}

	function focusFeatureTrigger(id: FeatureTriggerId) {
		requestAnimationFrame(() => stage?.querySelector<HTMLButtonElement>(`[data-feature-trigger="${id}"]`)?.focus());
	}

	function closeFeature() {
		const opener = activeTrigger;
		if (!opener) return;
		if (featureSheet?.open) {
			closingOpener = opener;
			featureSheet.dataset.visible = 'false';
			featureSheet.focus();
		}
		activeTrigger = null;
		if (!featureSheet?.open) focusFeatureTrigger(opener);
	}

	function selectFeature(id: FeatureTriggerId) {
		if (activeTrigger === id) closeFeature();
		else {
			closePicker(false);
			closeSidebar();
			closingOpener = null;
			activeTrigger = id;
		}
	}

	function onSheetClose() {
		if (compact && activeTrigger && !featureSheet?.open) closeFeature();
	}

	function finishSheetClose() {
		const opener = activeTrigger ?? closingOpener;
		closingOpener = null;
		featureSheet?.close();
		sheetGroup = null;
		if (opener) focusFeatureTrigger(opener);
	}

	function onSheetOutroEnd() {
		if (compact && !activeTrigger) finishSheetClose();
	}

	function onSheetKeydown(event: KeyboardEvent) {
		if (!featureSheet?.open) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			closeFeature();
			return;
		}
		if (event.key !== 'Tab') return;
		const controls = [...featureSheet.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex="0"]')]
			.filter((control) => !control.closest('[inert]'));
		const first = controls[0];
		const last = controls.at(-1);
		if (!first || !last) {
			event.preventDefault();
			featureSheet.focus();
			return;
		}
		if (event.shiftKey && (document.activeElement === first || document.activeElement === featureSheet)) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && (document.activeElement === last || document.activeElement === featureSheet)) {
			event.preventDefault();
			first.focus();
		}
	}

	function pickerKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
			event.preventDefault();
			if (pickerEmotes.length > 0) selectedEmote = (selectedEmote + 1) % pickerEmotes.length;
		} else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
			event.preventDefault();
			if (pickerEmotes.length > 0) selectedEmote = (selectedEmote - 1 + pickerEmotes.length) % pickerEmotes.length;
		} else if (event.key === 'Enter') {
			event.preventDefault();
			const name = pickerEmotes[selectedEmote];
			if (name) insertEmote(name);
		} else if (event.key === 'Escape') {
			event.preventDefault();
			closePicker();
		}
	}

	function onWindowPointerDown(event: PointerEvent) {
		const target = event.target as Node;
		if (pickerOpen && !stage?.querySelector('.demo-composer')?.contains(target)) closePicker(false);
		if (
			sidebarOpen &&
			!stage?.querySelector('.demo-sidebar-panel')?.contains(target) &&
			!stage?.querySelector('.sidebar-trigger')?.contains(target)
		) closeSidebar();
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if (event.defaultPrevented || event.key !== 'Escape') return;
		if (featureSheet?.open) return;
		if (sidebarOpen && window.matchMedia('(max-width: 560px)').matches) {
			event.preventDefault();
			closeSidebar(true);
		} else if (pickerOpen) {
			event.preventDefault();
			closePicker();
		} else if (activeTrigger) {
			event.preventDefault();
			closeFeature();
		}
	}

	function markBroken(name: EmoteName) {
		broken = { ...broken, [name]: true };
	}
</script>

<svelte:window onpointerdown={onWindowPointerDown} onkeydown={onWindowKeydown} />

<div class="demo-stage" data-details-side={!compact ? activeFeature?.side : undefined} data-settling={settling} bind:this={stage}>
	<div class="demo-window" role="group" aria-label={msgs.demo_window_label()}>
		<WindowChrome {sidebarOpen} ontogglesidebar={toggleSidebar} />
		<div class="demo-body">
			<div class="demo-sidebar-panel" id="demo-channel-sidebar" class:open={sidebarOpen}>
				<ChannelsSidebar
					channels={visibleChannels}
					active={DEMO_ACTIVE}
					{filter}
					{sortMode}
					onfilter={(value) => (filter = value)}
					onsortoggle={() => (sortMode = sortMode === 'live' ? 'alpha' : 'live')}
				/>
			</div>
			<div class="demo-main">
				<ChatPane {messages} {broken} viewers={activeChannel.viewers} onemoteerror={markBroken} />
				<ChatComposer
					{input}
					{pickerOpen}
					pickerQuery={pickerQuery}
					pickerEmotes={pickerEmotes}
					selectedEmote={selectedEmote}
					oninput={(value) => (input = value)}
					onsend={send}
					ontogglepicker={togglePicker}
					onpickerquery={(value) => (pickerQuery = value)}
					onpickerkeydown={pickerKeydown}
					onpickerselect={insertEmote}
				/>
			</div>
		</div>
	</div>

	<ul class="demo-callouts">
		{#each SHIPPED_CALLOUTS as callout (callout.id)}
			<FeatureCallout
				c={callout.id}
				side={FEATURES[callout.feature].side}
				n={callout.n}
				label={callout.label()}
				expanded={activeTrigger === callout.id}
				controls={detailControls}
				sheetMode={compact}
				onselect={() => selectFeature(callout.id)}
			/>
		{/each}
	</ul>
	{#each ['left', 'right'] as side}
		<div class="feature-frame" data-side={side} aria-hidden="true"></div>
	{/each}
	{#key motionEpoch}
		{#each desktopGroups as group (group)}
			<aside
				class="feature-details"
				id="demo-feature-details"
				data-side={FEATURES[group].side}
				data-current="true"
				data-feature={group}
				aria-labelledby={`demo-feature-details-${group}-title`}
				transition:featureMotion={{ x: FEATURES[group].side === 'left' ? -12 : 12, settle: settling }}
				onintrostart={(event) => markPresentation(event, true)}
				onoutrostart={(event) => markPresentation(event, false)}
			>
				<div class="feature-layer" data-feature={group}>
					<FeatureDetails
						feature={FEATURES[group]}
						headingId={`demo-feature-details-${group}-title`}
						emphasis={detailEmphasis}
						onclose={closeFeature}
					/>
				</div>
			</aside>
		{/each}
	{/key}
	<ul class="demo-planned" aria-label={msgs.demo_planned_prefix()}>
		{#each PLANNED_CALLOUTS as callout (callout.id)}
			<FeatureCallout
				c={callout.id}
				side={FEATURES[callout.feature].side}
				planned
				plannedPrefix={msgs.demo_planned_prefix()}
				label={callout.label()}
				expanded={activeTrigger === callout.id}
				controls={detailControls}
				sheetMode={compact}
				onselect={() => selectFeature(callout.id)}
			/>
		{/each}
	</ul>
	<dialog
		class="feature-sheet"
		id="demo-feature-sheet"
		data-feature={activeCallout?.feature}
		aria-labelledby={sheetGroup && compact ? `demo-feature-sheet-${sheetGroup}-title` : undefined}
		tabindex="-1"
		bind:this={featureSheet}
		oncancel={(event) => { event.preventDefault(); closeFeature(); }}
		onclose={onSheetClose}
		onkeydown={onSheetKeydown}
	>
		{#key motionEpoch}
			{#if compact}
				{#each detailGroups as group (group)}
					<div
						class="feature-sheet-surface"
						data-feature={group}
						data-current="true"
						transition:featureMotion={{ y: 24, settle: settling }}
						onintrostart={(event) => markPresentation(event, true)}
						onoutrostart={(event) => markPresentation(event, false)}
						onoutroend={onSheetOutroEnd}
					>
						<FeatureDetails
							feature={FEATURES[group]}
							headingId={`demo-feature-sheet-${group}-title`}
							emphasis={detailEmphasis}
							onclose={closeFeature}
						/>
					</div>
				{/each}
			{/if}
		{/key}
	</dialog>
</div>
