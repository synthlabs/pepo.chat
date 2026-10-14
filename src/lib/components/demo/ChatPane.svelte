<script lang="ts">
	import { Users } from 'lucide-svelte';
	import type { BrokenEmotes, EmoteName } from '$lib/chat/mock-chat';
	import { formatViewers, type DemoMessage } from '$lib/chat/demo-data';
	import { m as msgs } from '$lib/paraglide/messages';
	import ChatMessage from './ChatMessage.svelte';

	let {
		messages,
		broken,
		viewers,
		onemoteerror
	}: {
		messages: DemoMessage[];
		broken: BrokenEmotes;
		viewers: number;
		onemoteerror: (name: EmoteName) => void;
	} = $props();

	let log: HTMLElement | undefined = $state();

	$effect(() => {
		void messages.length;
		if (log) log.scrollTop = log.scrollHeight;
	});
</script>

<div class="demo-chat">
	<div class="chat-head">
		<span class="chat-head-title">{msgs.demo_stream_title()}</span>
		<span class="chat-head-viewers">
			<Users size={12} strokeWidth={1.75} aria-hidden="true" />
			{formatViewers(viewers)}
		</span>
	</div>
	<div class="chat-log" bind:this={log} role="log" aria-label={msgs.demo_chat_label()} aria-live="polite">
		{#each messages as message, index (message.id)}
			<ChatMessage {message} {index} {broken} {onemoteerror} />
		{/each}
	</div>
</div>

<style>
	.demo-chat {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-height: 0;
	}

	.chat-head {
		align-items: center;
		border-bottom: 1px solid hsl(var(--border));
		color: hsl(var(--muted-foreground));
		display: flex;
		font-size: 12.5px;
		flex: 0 0 36px;
		gap: 10px;
		height: 36px;
		justify-content: space-between;
		padding: 0 12px;
	}

	.chat-head-title {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chat-head-viewers {
		align-items: center;
		display: inline-flex;
		flex: 0 0 auto;
		font-size: 12px;
		font-variant-numeric: tabular-nums;
		gap: 5px;
	}

	.chat-log {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 3px;
		min-height: 0;
		overflow-y: auto;
		padding: 8px;
	}

	.chat-log :global(.dmsg:first-child) {
		margin-top: auto;
	}
</style>
