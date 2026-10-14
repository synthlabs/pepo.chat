<script lang="ts">
	import { onMount } from 'svelte';
	import { Download } from 'lucide-svelte';
	import {
		PLATFORMS,
		RELEASES_URL,
		detectPlatform,
		type Platform,
		type PlatformId,
		type ReleaseState
	} from '$lib/platform';
	import PlatformGlyph from '$lib/glyphs/PlatformGlyph.svelte';
	import { m as msgs } from '$lib/paraglide/messages';

	let { releaseState }: { releaseState: ReleaseState } = $props();
	let root: HTMLElement | undefined = $state();

	let selected: PlatformId = $state(PLATFORMS[0]!.id);
	let detected: PlatformId | undefined = $state();

	const current = $derived(PLATFORMS.find((p) => p.id === selected) ?? PLATFORMS[0]!);
	const currentAsset = $derived(
		releaseState.status === 'ready' ? releaseState.assets[current.id] : undefined
	);

	// Linux variants share a short label; the package format tells them apart.
	function radioText(platform: Platform): string {
		return platform.id.startsWith('linux-') ? platform.ext.replace('.', '') : platform.short;
	}

	function select(platform: Platform) {
		selected = platform.id;
	}

	function focusRadio(id: PlatformId) {
		requestAnimationFrame(() => {
			root?.querySelector<HTMLButtonElement>(`[data-radio="${id}"]`)?.focus();
		});
	}

	function radioKeydown(event: KeyboardEvent) {
		const index = PLATFORMS.findIndex((p) => p.id === selected);
		let next = -1;
		if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % PLATFORMS.length;
		else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + PLATFORMS.length) % PLATFORMS.length;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = PLATFORMS.length - 1;
		else return;
		event.preventDefault();
		const platform = PLATFORMS[next];
		if (!platform) return;
		select(platform);
		focusRadio(platform.id);
	}

	onMount(() => {
		detected = detectPlatform();
		selected = detected;
	});
</script>

<div class="install-panel" bind:this={root}>
	<div class="platform-radios" role="radiogroup" aria-label={msgs.dl_other_platforms()}>
		{#each PLATFORMS as platform (platform.id)}
			<button
				type="button"
				role="radio"
				data-radio={platform.id}
				aria-checked={platform.id === selected}
				tabindex={platform.id === selected ? 0 : -1}
				onclick={() => select(platform)}
				onkeydown={radioKeydown}
			>
				<PlatformGlyph icon={platform.icon} size={13} />
				{radioText(platform)}
			</button>
		{/each}
	</div>

	<article class="install-primary-card">
		<div class="install-primary-icon">
			<PlatformGlyph icon={current.icon} size={22} />
		</div>
		<div class="install-primary-copy">
			<span class="install-primary-title">
				{current.label}
				{#if detected === current.id}
					<span class="install-detected-chip">{msgs.install_detected()}</span>
				{/if}
			</span>
			<span class="install-primary-file">
				{#if releaseState.status === 'loading'}
					<span class="release-name-skeleton" aria-hidden="true"></span>
				{:else}
					{currentAsset?.name ?? `${msgs.dl_latest_release()} · ${current.ext}`}
				{/if}
			</span>
		</div>
		<a class="btn-primary install-download" href={currentAsset?.url ?? RELEASES_URL}>
			<Download size={15} strokeWidth={1.75} aria-hidden="true" />
			{msgs.dl_download_for()} {current.short}
		</a>
	</article>

	<ol class="install-steps">
		<li>
			<span class="step-num" aria-hidden="true">1</span>
			<div>
				<h3>{msgs.install_step1_title()}</h3>
				<p>{msgs.install_step1_body()}</p>
			</div>
		</li>
		<li>
			<span class="step-num" aria-hidden="true">2</span>
			<div>
				<h3>{msgs.install_step2_title()}</h3>
				<p>{msgs.install_step2_body()}</p>
			</div>
		</li>
		<li>
			<span class="step-num" aria-hidden="true">3</span>
			<div>
				<h3>{msgs.install_step3_title()}</h3>
				<p>{msgs.install_step3_body()}</p>
			</div>
		</li>
	</ol>

	<details class="build-details">
		<summary>{msgs.build_summary()}</summary>
		<p class="build-intro">{msgs.build_intro()}</p>
		<div class="code-block">
			<div><span class="c-prompt">$</span> git clone --recurse-submodules https://github.com/synthlabs/pepo.git</div>
			<div><span class="c-prompt">$</span> cd pepo</div>
			<div><span class="c-prompt">$</span> pnpm install</div>
			<div><span class="c-prompt">$</span> make build</div>
			<div class="build-comment"><span class="c-comment"># {msgs.build_comment()}</span></div>
		</div>
		<a class="build-link" href="https://github.com/synthlabs/pepo#build-from-source" target="_blank" rel="noopener">
			{msgs.build_link()}
		</a>
	</details>
</div>
