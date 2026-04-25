<script lang="ts">
	import { page } from '$app/state';
	import { Languages } from 'lucide-svelte';
	import { locales, getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { m as msgs } from '$lib/paraglide/messages';

	let open = $state(false);
	let root: HTMLDivElement;

	const current = $derived(getLocale());

	const labels: Record<string, () => string> = {
		en: msgs.locale_label_en,
		ru: msgs.locale_label_ru
	};

	function toggle(e: MouseEvent) {
		e.stopPropagation();
		open = !open;
	}

	$effect(() => {
		const onDocClick = (e: MouseEvent) => {
			if (root && !root.contains(e.target as Node)) open = false;
		};
		document.addEventListener('click', onDocClick);
		return () => document.removeEventListener('click', onDocClick);
	});
</script>

<div class="ls" bind:this={root}>
	<button
		type="button"
		class="ls-button btn-ghost"
		aria-haspopup="menu"
		aria-expanded={open}
		onclick={toggle}
		style="padding: 6px 10px; display: inline-flex; align-items: center; gap: 6px;"
	>
		<Languages size={14} strokeWidth={1.75} />
		<span style="font-size: 12px; letter-spacing: 0.02em;">{current.toUpperCase()}</span>
	</button>

	<div class="menu" class:visible={open} role="menu">
		{#each locales as locale (locale)}
			<a
				href={localizeHref(page.url.pathname, { locale })}
				role="menuitem"
				data-sveltekit-reload
			>
				<button>
					<span class="k-file" style="min-width: 22px;">{locale.toUpperCase()}</span>
					<span style="font-size: 13px;">{labels[locale]?.() ?? locale}</span>
				</button>
			</a>
		{/each}
	</div>
</div>

<style>
	.ls {
		position: relative;
		display: inline-flex;
	}
	.menu {
		opacity: 0;
		pointer-events: none;
		transform: translateY(-4px);
		transition: opacity 180ms ease-out, transform 180ms ease-out;
	}
	.menu.visible {
		opacity: 1;
		pointer-events: auto;
		transform: translateY(0);
	}
</style>
