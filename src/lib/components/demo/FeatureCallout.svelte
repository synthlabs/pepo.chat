<script lang="ts">
	let {
		c,
		side,
		label,
		n,
		planned = false,
		plannedPrefix = '',
		expanded,
		controls,
		sheetMode,
		onselect
	}: {
		c: string;
		side?: 'left' | 'right';
		label: string;
		n?: number;
		planned?: boolean;
		plannedPrefix?: string;
		expanded: boolean;
		controls: string;
		sheetMode: boolean;
		onselect: () => void;
	} = $props();
</script>

<li class="demo-callout" class:planned data-c={c} data-side={side}>
	<button
		class="feature-trigger"
		class:callout-pill={planned}
		id={`feature-trigger-${c}`}
		data-feature-trigger={c}
		type="button"
		aria-expanded={expanded}
		aria-controls={controls}
		aria-haspopup={sheetMode ? 'dialog' : undefined}
		onclick={onselect}
	>
		{#if planned}
			{#if plannedPrefix}<span class="callout-planned-tag">{plannedPrefix}</span>{/if}
			<span class="callout-planned-label">{label}</span>
		{:else}
			<span class="callout-pin" aria-hidden="true">{n}</span>
			<span class="callout-label">{label}</span>
		{/if}
	</button>
</li>

<style>
	.demo-callout {
		display: flex;
		list-style: none;
		margin: 0;
		min-width: 0;
	}

	.feature-trigger {
		align-items: center;
		background: transparent;
		border: 0;
		border-radius: var(--radius);
		color: inherit;
		cursor: pointer;
		display: flex;
		font: inherit;
		gap: 8px;
		min-width: 0;
		padding: 0;
		pointer-events: auto;
		text-align: left;
		width: 100%;
	}

	.feature-trigger:hover .callout-label,
	.feature-trigger[aria-expanded='true'] .callout-label {
		color: hsl(var(--c-pepo));
	}

	.feature-trigger[aria-expanded='true'] .callout-pin {
		background: hsl(var(--c-pepo));
		color: hsl(var(--primary-foreground));
	}

	.callout-pin {
		align-items: center;
		background: hsl(var(--popover));
		border: 1px solid hsl(var(--c-pepo));
		border-radius: 50%;
		color: hsl(var(--c-pepo));
		display: inline-flex;
		flex: 0 0 18px;
		font-size: 10.5px;
		font-weight: 600;
		height: 18px;
		justify-content: center;
		width: 18px;
	}

	.callout-label {
		color: hsl(var(--muted-foreground));
		font-size: 13px;
		line-height: 1.45;
		text-align: left;
	}

	.feature-trigger.callout-pill {
		border: 1px dashed hsl(var(--border));
		border-radius: 999px;
		color: hsl(var(--muted-foreground));
		display: inline-flex;
		font-size: 11px;
		gap: 5px;
		line-height: 1.3;
		max-width: 100%;
		padding: 3px 10px;
		width: auto;
	}

	.callout-pill:hover,
	.callout-pill[aria-expanded='true'] {
		border-color: hsl(var(--c-pepo));
		color: hsl(var(--foreground));
	}

	.callout-planned-label {
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.callout-planned-tag {
		color: hsl(var(--c-pepo));
		flex-shrink: 0;
	}
</style>
