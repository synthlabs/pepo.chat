<script lang="ts">
	import { ArrowDownUp, Users } from 'lucide-svelte';
	import { formatViewers, type DemoChannel } from '$lib/chat/demo-data';
	import { m as msgs } from '$lib/paraglide/messages';

	let {
		channels,
		active,
		filter,
		sortMode,
		onfilter,
		onsortoggle
	}: {
		channels: DemoChannel[];
		active: string;
		filter: string;
		sortMode: 'live' | 'alpha';
		onfilter: (value: string) => void;
		onsortoggle: () => void;
	} = $props();

	const sortLabel = $derived(sortMode === 'live' ? msgs.demo_sort_live_label() : msgs.demo_sort_alpha_label());
</script>

<aside class="demo-sidebar">
	<div class="sidebar-head">
		<input
			type="text"
			value={filter}
			oninput={(e) => onfilter(e.currentTarget.value)}
			placeholder={msgs.demo_sidebar_filter()}
			aria-label={msgs.demo_sidebar_filter()}
		/>
		<button
			class="sort-toggle"
			type="button"
			onclick={onsortoggle}
			aria-pressed={sortMode === 'alpha'}
			aria-label={sortLabel}
			title={sortLabel}
		>
			<ArrowDownUp size={13} strokeWidth={1.75} aria-hidden="true" />
		</button>
	</div>

	<div class="sidebar-group-label">{msgs.demo_sidebar_following()}</div>

	<ul class="sidebar-channels">
		{#each channels as channel (channel.login)}
			<li class:live={channel.live} class:active={channel.login === active}>
				<span class="ch-avatar" style={`background: ${channel.color};`} aria-hidden="true">
					{channel.login.charAt(0).toUpperCase()}
				</span>
				<span class="ch-name">{channel.login}</span>
				{#if channel.live}
					<span class="ch-live-dot" aria-hidden="true"></span>
					<span class="ch-viewers">
						<Users size={11} strokeWidth={1.75} aria-hidden="true" />
						{formatViewers(channel.viewers)}
					</span>
				{/if}
			</li>
		{/each}
	</ul>

	<div class="sidebar-foot">
		<span class="ch-avatar you" aria-hidden="true">y</span>
		<span class="ch-name">{msgs.demo_you()}</span>
	</div>
</aside>

<style>
	.demo-sidebar {
		border-right: 1px solid hsl(var(--border));
		display: flex;
		flex: 1;
		flex-direction: column;
		min-height: 0;
		overflow: hidden;
	}

	.sidebar-head {
		display: flex;
		gap: 6px;
		padding: 10px;
	}

	.sidebar-head input {
		background: hsl(var(--content-primary));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius);
		color: hsl(var(--foreground));
		font-size: 12px;
		flex: 1;
		min-width: 0;
		padding: 6px 8px;
	}

	.sidebar-head input::placeholder {
		color: hsl(var(--muted-foreground));
	}

	.sort-toggle {
		align-items: center;
		background: transparent;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius);
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		display: inline-flex;
		flex: 0 0 auto;
		height: 28px;
		justify-content: center;
		width: 30px;
	}

	.sort-toggle:hover,
	.sort-toggle[aria-pressed='true'] {
		background: hsl(var(--content-secondary));
		border-color: hsl(var(--c-pepo));
		color: hsl(var(--c-pepo));
	}

	.sidebar-group-label {
		color: hsl(var(--muted-foreground));
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.02em;
		padding: 4px 12px 8px;
	}

	.sidebar-channels {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 2px;
		list-style: none;
		margin: 0;
		min-height: 0;
		overflow-y: auto;
		padding: 0 6px;
	}

	.sidebar-channels li {
		align-items: center;
		border-radius: var(--radius);
		color: hsl(var(--muted-foreground));
		display: flex;
		font-size: 13px;
		gap: 8px;
		min-height: 30px;
		padding: 4px 6px;
	}

	.sidebar-channels li.active {
		background: hsl(var(--content-secondary));
		color: hsl(var(--foreground));
	}

	.sidebar-channels li.active .ch-avatar {
		outline: 1px solid hsl(var(--border));
	}

	.ch-avatar {
		align-items: center;
		border-radius: 50%;
		color: hsl(0 0% 100% / 0.92);
		display: inline-flex;
		flex: 0 0 20px;
		font-size: 10px;
		font-weight: 700;
		height: 20px;
		justify-content: center;
		width: 20px;
	}

	.ch-avatar.you {
		background: hsl(var(--c-pepo));
	}

	.ch-name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	li:not(.live) .ch-name {
		opacity: 0.65;
	}

	.ch-live-dot {
		background: hsl(var(--c-pepo));
		border-radius: 50%;
		flex: 0 0 5px;
		height: 5px;
		width: 5px;
	}

	.ch-viewers {
		align-items: center;
		color: hsl(var(--muted-foreground));
		display: inline-flex;
		font-size: 11px;
		font-variant-numeric: tabular-nums;
		gap: 3px;
	}

	.sidebar-foot {
		align-items: center;
		border-top: 1px solid hsl(var(--border));
		display: flex;
		gap: 8px;
		padding: 10px 12px;
	}

	.sidebar-foot .ch-name {
		color: hsl(var(--foreground));
		font-size: 13px;
	}
</style>
