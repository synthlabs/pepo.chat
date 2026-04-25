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
		class="ls-button"
		aria-haspopup="menu"
		aria-expanded={open}
		onclick={toggle}
	>
		<Languages size={14} strokeWidth={1.75} />
		<span>{current.toUpperCase()}</span>
	</button>

	<div class="ls-menu" class:open role="menu">
		{#each locales as locale (locale)}
			{@const active = locale === current}
			<a
				class="ls-item"
				class:active
				href={localizeHref(page.url.pathname, { locale })}
				role="menuitem"
				data-sveltekit-reload
			>
				<span class="ls-code">{locale.toUpperCase()}</span>
				<span class="ls-name">{labels[locale]?.() ?? locale}</span>
			</a>
		{/each}
	</div>
</div>

<style>
	.ls {
		position: relative;
		display: inline-flex;
	}
	.ls-button {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 5px 10px 5px 9px;
		font-family: inherit;
		font-size: 13px;
		color: hsl(var(--muted-foreground));
		background: transparent;
		border: 1px solid hsl(var(--border));
		border-radius: 9999px;
		cursor: pointer;
		transition: color 150ms, border-color 150ms;
	}
	.ls-button:hover {
		color: hsl(var(--foreground));
		border-color: hsl(215 27.9% 30%);
	}
	.ls-menu {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		min-width: 160px;
		background: hsl(var(--popover));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-popover);
		padding: 6px;
		z-index: 20;
		opacity: 0;
		pointer-events: none;
		transform: translateY(-4px);
		transition: opacity 180ms ease-out, transform 180ms ease-out;
	}
	.ls-menu.open {
		opacity: 1;
		pointer-events: auto;
		transform: translateY(0);
	}
	.ls-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		border-radius: var(--radius-md);
		color: hsl(var(--foreground));
		font-size: 13px;
		cursor: pointer;
		transition: background-color 150ms ease-out;
	}
	.ls-item:hover { background: hsl(var(--accent)); }
	.ls-item.active { color: hsl(263 75% 75%); }
	.ls-code {
		font-family: var(--font-mono);
		font-size: 11px;
		min-width: 22px;
		color: hsl(var(--muted-foreground));
	}
	.ls-item.active .ls-code { color: hsl(263 75% 75%); }
	.ls-name { font-size: 13px; }
</style>
