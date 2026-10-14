<script lang="ts">
	import { Check, Circle, X } from 'lucide-svelte';
	import { m as msgs } from '$lib/paraglide/messages';
	import type { FeatureDetails } from './features';

	let { feature, headingId, emphasis = 'available', onclose }: {
		feature: FeatureDetails;
		headingId: string;
		emphasis?: 'available' | 'planned';
		onclose: () => void;
	} = $props();
</script>

<div class="feature-content">
	<header class="feature-details-head">
		<h3 id={headingId}>{feature.title()}</h3>
		<button class="feature-close" type="button" onclick={onclose} aria-label={msgs.demo_feature_close()}>
			<X size={16} strokeWidth={1.75} aria-hidden="true" />
		</button>
	</header>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (keyboard access to scrollable details) -->
	<div class="feature-details-body" role="region" aria-labelledby={headingId} tabindex="0">
		<p class="feature-details-intro">{feature.intro()}</p>
		{#if feature.available.length > 0}
			<section class="feature-status" class:emphasized={emphasis === 'available'} data-status="available" aria-labelledby={`${headingId}-available`}>
				<h4 id={`${headingId}-available`}>{msgs.feature_status_now()}</h4>
				<ul>
					{#each feature.available as label}
						<li><Check size={14} strokeWidth={2} aria-hidden="true" /><span>{label()}</span></li>
					{/each}
				</ul>
			</section>
		{/if}
		{#if feature.planned.length > 0}
			<section class="feature-status planned" class:emphasized={emphasis === 'planned'} data-status="planned" aria-labelledby={`${headingId}-planned`}>
				<h4 id={`${headingId}-planned`}>{msgs.feature_status_planned()}</h4>
				<ul>
					{#each feature.planned as label}
						<li><Circle size={12} strokeWidth={1.5} aria-hidden="true" /><span>{label()}</span></li>
					{/each}
				</ul>
			</section>
		{/if}
	</div>
</div>

<style>
	.feature-content {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-height: 0;
		min-width: 0;
	}

	.feature-details-head {
		align-items: flex-start;
		border-bottom: 1px solid hsl(var(--border));
		display: flex;
		flex-shrink: 0;
		gap: 12px;
		justify-content: space-between;
		padding: 16px 18px;
	}

	h3 {
		font-size: 17px;
		font-weight: 600;
		line-height: 1.35;
		margin: 3px 0 0;
	}

	.feature-close {
		align-items: center;
		background: transparent;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius);
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		display: inline-flex;
		flex: 0 0 28px;
		height: 28px;
		justify-content: center;
		padding: 0;
	}

	.feature-close:hover {
		border-color: hsl(var(--c-pepo));
		color: hsl(var(--foreground));
	}

	.feature-details-body {
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 18px;
	}

	.feature-details-body:focus-visible {
		outline-offset: -3px;
	}

	.feature-details-intro {
		color: hsl(var(--muted-foreground));
		font-size: 13px;
		line-height: 1.6;
		margin: 0 0 22px;
	}

	.feature-status + .feature-status {
		margin-top: 22px;
	}

	.feature-status {
		color: hsl(var(--muted-foreground));
	}

	.feature-status.emphasized {
		color: hsl(var(--foreground));
	}

	h4 {
		font-size: 12px;
		font-weight: 600;
		margin: 0 0 12px;
	}

	ul {
		display: grid;
		gap: 12px;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li {
		display: grid;
		font-size: 13px;
		gap: 9px;
		grid-template-columns: 14px minmax(0, 1fr);
		line-height: 1.5;
	}

	li :global(svg) {
		color: inherit;
		margin-top: 3px;
	}

	.emphasized li :global(svg) {
		color: hsl(var(--c-pepo));
	}

	.planned li :global(svg) {
		margin-top: 4px;
	}
</style>
