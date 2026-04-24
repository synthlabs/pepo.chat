<script lang="ts">
	import { onMount } from 'svelte';
	import { ChevronDown } from 'lucide-svelte';
	import {
		PLATFORMS,
		RELEASES_URL,
		RELEASES_API,
		detectPlatform,
		hrefFor,
		type PlatformId
	} from '$lib/platform';
	import PlatformGlyph from '$lib/glyphs/PlatformGlyph.svelte';
	import GithubGlyph from '$lib/glyphs/GithubGlyph.svelte';

	let platformId: PlatformId = $state('macos');
	let version: string | null = $state(null);
	let menuOpen = $state(false);
	let wrap: HTMLDivElement | undefined = $state();

	const current = $derived(PLATFORMS.find((p) => p.id === platformId) ?? PLATFORMS[0]);

	onMount(() => {
		platformId = detectPlatform();

		const ctrl = new AbortController();
		(async () => {
			try {
				const r = await fetch(RELEASES_API, {
					headers: { Accept: 'application/vnd.github+json' },
					signal: ctrl.signal
				});
				if (!r.ok) return;
				const j = await r.json();
				const v = (j.tag_name ?? '').replace(/^v/, '');
				if (v) version = v;
			} catch {
				/* stay null — falls back to /releases/latest */
			}
		})();

		function onDoc(e: MouseEvent) {
			if (wrap && !wrap.contains(e.target as Node)) menuOpen = false;
		}
		document.addEventListener('mousedown', onDoc);

		return () => {
			ctrl.abort();
			document.removeEventListener('mousedown', onDoc);
		};
	});
</script>

<div bind:this={wrap} style="position: relative; display: inline-block;">
	<div class="btn-split">
		<a class="primary" href={hrefFor(current, version)}>
			<PlatformGlyph icon={current.icon} size={18} />
			<span style="display: flex; flex-direction: column; align-items: flex-start; line-height: 1.15;">
				<span>Download for {current.short}</span>
				<span style="font-size: 11px; opacity: 0.75; font-weight: 400;">
					{version ? `v${version} · ${current.ext}` : `latest release · ${current.ext}`}
				</span>
			</span>
		</a>
		<button
			class="caret"
			aria-label="Other platforms"
			onclick={() => (menuOpen = !menuOpen)}
		>
			<ChevronDown size={16} strokeWidth={1.75} />
		</button>
	</div>

	{#if menuOpen}
		<div class="menu" role="menu">
			{#each PLATFORMS as p (p.id)}
				<a href={hrefFor(p, version)}>
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
					<span>All releases</span>
					<span class="k-file">GitHub</span>
				</button>
			</a>
		</div>
	{/if}
</div>
