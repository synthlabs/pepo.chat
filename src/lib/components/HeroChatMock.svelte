<script lang="ts">
	import { onMount } from 'svelte';
	import {
		BADGE_IMAGES,
		EMOTES,
		POOL,
		chatClock,
		tokenEmote,
		uniqueEmotes,
		type Badge,
		type BrokenEmotes,
		type EmoteName
	} from '$lib/chat/mock-chat';

	interface ChatMessage {
		id: number;
		ts: string;
		user: string;
		color: string;
		badges: Badge[];
		text: string;
	}

	interface Floater {
		id: string;
		name: EmoteName;
		x: number;
		size: number;
		dur: number;
		rise: number;
		drift: number;
		rot: number;
		peak: number;
	}

	const MSG_INTERVAL_MS = 1000;
	const MAX_MESSAGES = 13;
	const MAX_FLOATERS = 20;

	let messages = $state<ChatMessage[]>([]);
	let floaters = $state<Floater[]>([]);
	let broken = $state<BrokenEmotes>({});
	let nextMessageId = 0;
	let nextFloaterId = 0;
	let poolIdx = 0;
	let ticker: ReturnType<typeof setInterval> | undefined;
	let timeouts: Array<ReturnType<typeof setTimeout>> = [];
	let reduceMotion = false;

	onMount(() => {
		reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		poolIdx = Math.floor(Math.random() * POOL.length);
		for (let i = 0; i < 4; i += 1) pushMessage(false);
		ticker = setInterval(() => pushMessage(true), MSG_INTERVAL_MS);

		return cleanup;
	});

	function cleanup() {
		if (ticker) clearInterval(ticker);
		timeouts.forEach(clearTimeout);
		timeouts = [];
	}

	function schedule(fn: () => void, delay: number) {
		const timeout = setTimeout(() => {
			timeouts = timeouts.filter((item) => item !== timeout);
			fn();
		}, delay);
		timeouts = [...timeouts, timeout];
	}

	function pushMessage(spawnFloaters: boolean) {
		const src = POOL[poolIdx % POOL.length];
		poolIdx += 1;

		const msg = {
			id: nextMessageId,
			ts: chatClock(),
			user: src.user,
			color: src.color,
			badges: src.badges,
			text: src.text()
		};
		nextMessageId += 1;
		messages = [...messages, msg].slice(-MAX_MESSAGES);

		if (!spawnFloaters || reduceMotion) return;

		uniqueEmotes(msg.text, broken).forEach((name, i) => {
			const copies = 1 + Math.floor(Math.random() * 2);
			for (let c = 0; c < copies; c += 1) {
				schedule(() => spawnFloater(name), (i * 2 + c) * 350 + Math.random() * 300);
			}
		});
	}

	function spawnFloater(name: EmoteName) {
		if (broken[name]) return;

		const dur = 4500 + Math.random() * 3000;
		const floater = {
			id: `f${nextFloaterId}`,
			name,
			x: 3 + Math.random() * 92,
			size: 34 + Math.random() * 30,
			dur,
			rise: -(60 + Math.random() * 32),
			drift: (Math.random() - 0.5) * 160,
			rot: (Math.random() - 0.5) * 40,
			peak: 0.75 + Math.random() * 0.25
		};
		nextFloaterId += 1;
		floaters = [...floaters, floater].slice(-MAX_FLOATERS);
		schedule(() => {
			floaters = floaters.filter((item) => item.id !== floater.id);
		}, dur + 300);
	}

	function usableEmote(token: string): EmoteName | null {
		return tokenEmote(token, broken);
	}

	function onEmoteError(name: EmoteName) {
		broken = { ...broken, [name]: true };
		floaters = floaters.filter((item) => item.name !== name);
	}
</script>

<div class="hero-chat-wrap" aria-hidden="true">
	<div class="hero-chat-column">
		{#each messages as message (message.id)}
			<div class="chat-row" class:alt={message.id % 2 === 1}>
				<span class="chat-time">{message.ts}</span>
				{#each message.badges as badge (badge)}
					<img class="chat-badge" src={BADGE_IMAGES[badge]} alt="" width="18" height="18" />
				{/each}
				<span class="chat-user" style={`color: ${message.color};`}>{message.user}</span>
				<span class="chat-sep">: </span>
				{#each message.text.split(/\s+/) as token, tokenIndex (`${message.id}-${tokenIndex}`)}
					{@const emote = usableEmote(token)}
					{#if emote}
						{#if tokenIndex > 0}<span> </span>{/if}
						<img
							class="chat-emote"
							src={EMOTES[emote]}
							alt={emote}
							title={emote}
							onerror={() => onEmoteError(emote)}
						/>
					{:else}
						<span>{tokenIndex === 0 ? token : ` ${token}`}</span>
					{/if}
				{/each}
			</div>
		{/each}
	</div>
</div>

<div class="emote-layer" aria-hidden="true">
	{#each floaters as floater (floater.id)}
		<img
			class="emote-floater"
			src={EMOTES[floater.name]}
			alt=""
			onerror={() => onEmoteError(floater.name)}
			style={`left: ${floater.x}%; height: ${floater.size}px; --dur: ${floater.dur}ms; --rise: ${floater.rise}vh; --drift: ${floater.drift}px; --rot: ${floater.rot}deg; --peak: ${floater.peak};`}
		/>
	{/each}
</div>

<style>
	.hero-chat-wrap {
		align-self: center;
		display: flex;
		height: 600px;
		max-height: 82vh;
		position: relative;
		z-index: 10;
	}

	.hero-chat-column {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 4px;
		justify-content: flex-end;
		mask-image: linear-gradient(to bottom, transparent 0%, black 22%, black 96%, transparent 100%);
		overflow: hidden;
		-webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 22%, black 96%, transparent 100%);
	}

	.chat-row {
		animation: msgIn 380ms ease-out both;
		background: hsl(var(--content-primary));
		border-radius: 3px;
		color: hsl(var(--foreground));
		font-size: 14px;
		line-height: 1.55;
		max-height: 96px;
		overflow: hidden;
		padding: 6px 14px;
		word-break: break-word;
	}

	.chat-row.alt {
		background: hsl(var(--content-secondary));
	}

	.chat-time {
		color: #6b7280;
		font-size: 11px;
		font-variant-numeric: tabular-nums;
		margin-right: 6px;
	}

	.chat-badge {
		display: inline-block;
		height: 18px;
		margin-right: 4px;
		object-fit: contain;
		vertical-align: -4px;
		width: 18px;
	}

	.chat-user {
		font-weight: 700;
	}

	.chat-sep {
		color: hsl(var(--muted-foreground));
	}

	.chat-emote {
		display: inline-block;
		height: 26px;
		margin: 0 3px -2px;
		min-width: 26px;
		vertical-align: middle;
		width: auto;
	}

	.emote-layer {
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		position: absolute;
		z-index: 20;
	}

	.emote-floater {
		animation: floatUp var(--dur) linear both;
		bottom: -80px;
		position: absolute;
		width: auto;
	}

	@keyframes msgIn {
		from {
			max-height: 0;
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			max-height: 96px;
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes floatUp {
		0% {
			opacity: 0;
			transform: translateY(0) translateX(0) rotate(0deg);
		}
		8% {
			opacity: var(--peak, 0.9);
		}
		70% {
			opacity: var(--peak, 0.9);
		}
		100% {
			opacity: 0;
			transform: translateY(var(--rise, -85vh)) translateX(var(--drift, 0px)) rotate(var(--rot, 0deg));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.chat-row {
			animation: none;
		}
	}

	@media (max-width: 960px) {
		.hero-chat-wrap {
			height: 440px;
			max-height: none;
			width: 100%;
		}
	}

	@media (max-width: 560px) {
		.hero-chat-wrap {
			height: 360px;
		}

		.chat-row {
			font-size: 13px;
			padding: 6px 10px;
		}
	}
</style>
