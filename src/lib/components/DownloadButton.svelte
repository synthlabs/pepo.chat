<script lang="ts">
	import { onMount } from 'svelte';
	import { ChevronDown } from 'lucide-svelte';
	import {
		PLATFORMS,
		RELEASES_URL,
		detectPlatform,
		type PlatformId,
		type ReleaseState
	} from '$lib/platform';
	import PlatformGlyph from '$lib/glyphs/PlatformGlyph.svelte';
	import GithubGlyph from '$lib/glyphs/GithubGlyph.svelte';
	import { m as msgs } from '$lib/paraglide/messages';

	let { releaseState }: { releaseState: ReleaseState } = $props();

	let platformId: PlatformId = $state('macos');
	let menuOpen = $state(false);
	let wrap: HTMLDivElement | undefined = $state();

	const current = $derived(PLATFORMS.find((p) => p.id === platformId) ?? PLATFORMS[0]);
	const currentAsset = $derived(
		releaseState.status === 'ready' ? releaseState.assets[current.id] : undefined
	);

	onMount(() => {
		platformId = detectPlatform();

		function onDoc(e: MouseEvent) {
			if (wrap && !wrap.contains(e.target as Node)) menuOpen = false;
		}
		document.addEventListener('mousedown', onDoc);

		return () => {
			document.removeEventListener('mousedown', onDoc);
		};
	});
</script>

<div class="download-wrap" bind:this={wrap} style="position: relative; display: inline-block;">
	<div class="btn-split">
		<a class="primary" href={currentAsset?.url ?? RELEASES_URL}>
			<PlatformGlyph icon={current.icon} size={18} />
			<span class="download-label">
				<span>{msgs.dl_download_for()} {current.short}</span>
				<span class="download-file">
					{#if releaseState.status === 'loading'}
						<span class="release-name-skeleton" aria-hidden="true"></span>
					{:else}
						{currentAsset?.name ?? `${msgs.dl_latest_release()} · ${current.ext}`}
					{/if}
				</span>
			</span>
		</a>
		<button
			class="caret"
			aria-label={msgs.dl_other_platforms()}
			onclick={() => (menuOpen = !menuOpen)}
		>
			<ChevronDown size={16} strokeWidth={1.75} />
		</button>
	</div>

	{#if menuOpen}
		<div class="menu" role="menu">
			{#each PLATFORMS as p (p.id)}
				{@const asset = releaseState.status === 'ready' ? releaseState.assets[p.id] : undefined}
				<a href={asset?.url ?? RELEASES_URL}>
					<button>
						<PlatformGlyph icon={p.icon} size={14} />
						<span>{p.label}</span>
						<span class="k-file">{p.ext}</span>
					</button>
				</a>
			{/each}
			<div style="height: 1px; background: hsl(var(--border)); margin: 4px 2px;"></div>
			<a href={RELEASES_URL}>
				<button>
					<GithubGlyph size={14} />
					<span>{msgs.dl_all_releases()}</span>
					<span class="k-file">GitHub</span>
				</button>
			</a>
		</div>
	{/if}
</div>
