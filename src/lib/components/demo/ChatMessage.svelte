<script lang="ts">
	import { BADGE_IMAGES, EMOTES, tokenEmote, type BrokenEmotes, type EmoteName } from '$lib/chat/mock-chat';
	import type { DemoMessage } from '$lib/chat/demo-data';

	let {
		message,
		index,
		broken,
		onemoteerror
	}: {
		message: DemoMessage;
		index: number;
		broken: BrokenEmotes;
		onemoteerror: (name: EmoteName) => void;
	} = $props();

	function usableEmote(token: string): EmoteName | null {
		return tokenEmote(token, broken);
	}
</script>

<div class="dmsg" class:alt={index % 2 === 1} class:sent={message.you}>
	<span class="dmsg-time">{message.ts}</span>
	{#each message.badges as badge (badge)}
		<img class="dmsg-badge" src={BADGE_IMAGES[badge]} alt="" width="18" height="18" />
	{/each}
	<span class="dmsg-user" style={`color: ${message.color};`}>{message.user}</span>
	<span class="dmsg-sep">: </span>
	{#each message.text.split(/\s+/) as token, tokenIndex (`${message.id}-${tokenIndex}`)}
		{@const emote = usableEmote(token)}
		{#if emote}
			{#if tokenIndex > 0}<span> </span>{/if}
			<img
				class="dmsg-emote"
				src={EMOTES[emote]}
				alt={emote}
				title={emote}
				onerror={() => onemoteerror(emote)}
			/>
		{:else}
			<span>{tokenIndex === 0 ? token : ` ${token}`}</span>
		{/if}
	{/each}
</div>

<style>
	.dmsg {
		background: hsl(var(--content-primary));
		border-radius: 3px;
		flex-shrink: 0;
		font-size: 13.5px;
		line-height: 1.55;
		overflow: hidden;
		padding: 5px 12px;
		word-break: break-word;
	}

	.dmsg.alt {
		background: hsl(var(--content-secondary));
	}

	.dmsg.sent {
		box-shadow: inset 2px 0 0 hsl(var(--c-pepo));
	}

	@media (prefers-reduced-motion: no-preference) {
		.dmsg.sent {
			animation: demoSentIn 150ms ease-out both;
		}
	}

	@keyframes demoSentIn {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.dmsg-time {
		color: #6b7280;
		font-size: 10.5px;
		font-variant-numeric: tabular-nums;
		margin-right: 6px;
	}

	.dmsg-badge {
		display: inline-block;
		height: 18px;
		margin-right: 4px;
		object-fit: contain;
		vertical-align: -4px;
		width: 18px;
	}

	.dmsg-user {
		font-weight: 700;
	}

	.dmsg-sep {
		color: hsl(var(--muted-foreground));
	}

	.dmsg-emote {
		display: inline-block;
		height: 24px;
		margin: 0 3px -2px;
		min-width: 24px;
		vertical-align: middle;
		width: auto;
	}
</style>
