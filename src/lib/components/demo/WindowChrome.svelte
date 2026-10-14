<script lang="ts">
	import { PanelLeft } from 'lucide-svelte';
	import { m as msgs } from '$lib/paraglide/messages';

	let { sidebarOpen, ontogglesidebar }: {
		sidebarOpen: boolean;
		ontogglesidebar: () => void;
	} = $props();
</script>

<div class="window-chrome">
	<span class="chrome-dots" aria-hidden="true">
		<span></span><span></span><span></span>
	</span>
	<button
		class="sidebar-trigger"
		type="button"
		aria-expanded={sidebarOpen}
		aria-controls="demo-channel-sidebar"
		onclick={ontogglesidebar}
	>
		<PanelLeft size={14} strokeWidth={1.75} aria-hidden="true" />
		{msgs.demo_sidebar_toggle()}
	</button>
	<span class="chrome-title">
		<img src="/pepo-flat.png" alt="" width="14" height="18" />
		pepo
	</span>
</div>

<style>
	.window-chrome {
		align-items: center;
		border-bottom: 1px solid hsl(var(--border));
		display: flex;
		flex: 0 0 36px;
		gap: 10px;
		height: 36px;
		padding: 0 12px;
		position: relative;
	}

	.chrome-dots {
		align-items: center;
		display: flex;
		gap: 6px;
	}

	.chrome-dots span {
		background: hsl(var(--content-secondary));
		border: 1px solid hsl(var(--border));
		border-radius: 50%;
		height: 8px;
		width: 8px;
	}

	.chrome-title {
		align-items: center;
		color: hsl(var(--muted-foreground));
		display: flex;
		font-size: 12px;
		font-weight: 500;
		gap: 6px;
		inset-inline: 0;
		justify-content: center;
		margin: 0 auto;
		pointer-events: none;
		position: absolute;
	}

	.sidebar-trigger {
		align-items: center;
		background: hsl(var(--content-primary));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius);
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		display: none;
		font-size: 12px;
		gap: 6px;
		height: 28px;
		padding: 0 8px;
	}

	.sidebar-trigger:hover,
	.sidebar-trigger[aria-expanded='true'] {
		border-color: hsl(var(--c-pepo));
		color: hsl(var(--c-pepo));
	}

	@media (max-width: 560px) {
		.chrome-dots { display: none; }
		.sidebar-trigger { display: inline-flex; }
	}
</style>
