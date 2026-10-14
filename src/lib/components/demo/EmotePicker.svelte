<script lang="ts">
	import { EMOTES, type EmoteName } from '$lib/chat/mock-chat';
	import { m as msgs } from '$lib/paraglide/messages';

	let {
		query,
		emotes,
		selected,
		onquery,
		onkeydown,
		onselect
	}: {
		query: string;
		emotes: EmoteName[];
		selected: number;
		onquery: (value: string) => void;
		onkeydown: (event: KeyboardEvent) => void;
		onselect: (name: EmoteName) => void;
	} = $props();

	let root: HTMLElement | undefined = $state();

	$effect(() => {
		root?.querySelector('input')?.focus();
	});

	$effect(() => {
		void selected;
		void emotes;
		root?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
	});
</script>

<div class="demo-picker" id="demo-emote-picker" bind:this={root}>
	<input
		type="text"
		role="combobox"
		aria-expanded="true"
		aria-controls="demo-emote-listbox"
		aria-activedescendant={emotes[selected] ? `demo-emote-opt-${emotes[selected]}` : undefined}
		aria-label={msgs.demo_picker_search()}
		placeholder={msgs.demo_picker_search()}
		value={query}
		oninput={(e) => onquery(e.currentTarget.value)}
		onkeydown={onkeydown}
	/>
	{#if emotes.length > 0}
		<div class="picker-grid" id="demo-emote-listbox" role="listbox" aria-label={msgs.demo_picker_search()}>
			{#each emotes as name, i (name)}
				<button
					type="button"
					role="option"
					tabindex="-1"
					id={`demo-emote-opt-${name}`}
					aria-selected={i === selected}
					class:selected={i === selected}
					onclick={() => onselect(name)}
				>
					<img src={EMOTES[name]} alt={name} title={name} loading="lazy" />
				</button>
			{/each}
		</div>
	{:else}
		<p class="picker-empty">{msgs.demo_picker_empty()}</p>
	{/if}
</div>

<style>
	.demo-picker {
		background: hsl(var(--popover));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius);
		box-shadow: var(--shadow-popover, var(--shadow-lg));
		overflow: hidden;
	}

	.demo-picker input {
		background: hsl(var(--content-primary));
		border: 0;
		border-bottom: 1px solid hsl(var(--border));
		border-radius: 0;
		color: hsl(var(--foreground));
		font-size: 12px;
		padding: 8px 10px;
		width: 100%;
	}

	.demo-picker input::placeholder {
		color: hsl(var(--muted-foreground));
	}

	.picker-grid {
		display: grid;
		gap: 2px;
		grid-template-columns: repeat(6, 1fr);
		max-height: 168px;
		overflow-y: auto;
		padding: 6px;
	}

	.picker-grid button {
		align-items: center;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 3px;
		cursor: pointer;
		display: inline-flex;
		height: 34px;
		justify-content: center;
		padding: 0;
	}

	.picker-grid button:hover,
	.picker-grid button.selected {
		background: hsl(var(--content-secondary));
		border-color: hsl(var(--c-pepo));
	}

	.picker-grid img {
		height: 24px;
		width: auto;
	}

	.picker-empty {
		color: hsl(var(--muted-foreground));
		font-size: 12px;
		margin: 0;
		padding: 12px 10px;
	}
</style>
