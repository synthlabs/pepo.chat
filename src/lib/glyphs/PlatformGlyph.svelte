<script lang="ts">
	import type { PlatformIcon } from '$lib/platform';
	import AppleGlyph from './AppleGlyph.svelte';
	import WindowsGlyph from './WindowsGlyph.svelte';
	import LinuxGlyph from './LinuxGlyph.svelte';

	let { icon, size = 16 }: { icon: PlatformIcon; size?: number } = $props();
</script>

{#if icon === 'apple'}
	<AppleGlyph {size} />
{:else if icon === 'windows'}
	<WindowsGlyph {size} />
{:else}
	<LinuxGlyph {size} />
{/if}
