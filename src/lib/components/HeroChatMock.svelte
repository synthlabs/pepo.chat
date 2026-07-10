<script lang="ts">
	import { onMount } from 'svelte';
	import { m as msgs } from '$lib/paraglide/messages';

	const BADGE_IMAGES = {
		broadcaster: '/badges/hero-chat/broadcaster.png',
		mod: '/badges/hero-chat/moderator.png',
		vip: '/badges/hero-chat/vip.png',
		'subscriber-1': '/badges/hero-chat/subscriber-1.png',
		'subscriber-2': '/badges/hero-chat/subscriber-2.png',
		'subscriber-3': '/badges/hero-chat/subscriber-3.png'
	} as const;

	type Badge = keyof typeof BADGE_IMAGES;

	interface ChatSource {
		user: string;
		color: string;
		badges: Badge[];
		text: () => string;
	}

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

	const EMOTES = {
		KEKW: 'https://cdn.betterttv.net/emote/5e9c6c187e090362f8b0b9e8/2x',
		catJAM: 'https://cdn.betterttv.net/emote/5f1b0186cf6d2144653d2970/2x',
		monkaS: 'https://cdn.betterttv.net/emote/56e9f494fff3cc5c35e5287e/2x',
		EZ: 'https://cdn.betterttv.net/emote/5590b223b344e2c42a9e28e3/2x',
		POGGERS: 'https://cdn.betterttv.net/emote/58ae8407ff7b7276f8e594f2/2x',
		OMEGALUL: 'https://cdn.betterttv.net/emote/583089f4737a8e61abb0186b/2x',
		PepeLaugh: 'https://cdn.betterttv.net/emote/5c548025009a2e73916b3a37/2x',
		Sadge: 'https://cdn.betterttv.net/emote/5e0fa9d40550d42106b8a489/2x',
		Pog: 'https://cdn.frankerfacez.com/emoticon/210748/2',
		PepeHands: 'https://cdn.frankerfacez.com/emoticon/231552/2',
		widepeepoHappy: 'https://cdn.frankerfacez.com/emoticon/270930/2',
		LULW: 'https://cdn.frankerfacez.com/emoticon/139407/2',
		Pepega: 'https://cdn.frankerfacez.com/emoticon/243789/2',
		GIGACHAD: 'https://cdn.7tv.app/emote/01F6MZGCNG000255K4X1K7NTHR/2x.webp',
		NOOOO: 'https://cdn.7tv.app/emote/01F6MKTFTG0009C9ZSNZTFV2ZF/2x.webp',
		COPIUM: 'https://cdn.7tv.app/emote/01F6ME7ADR0000WDA7ERT9H30R/2x.webp',
		Prayge: 'https://cdn.7tv.app/emote/01F6NACCD80006SZ7ZW5FMWKWK/2x.webp',
		NODDERS: 'https://cdn.7tv.app/emote/01F6MDFCSR0000WDA7ERT623YT/2x.webp'
	} as const;

	type EmoteName = keyof typeof EMOTES;

	const POOL: ChatSource[] = [
		{ user: 'viewerdude',     color: '#ff7f50', badges: [],                 text: msgs.mock_chat_01 },
		{ user: 'gamer_kim',      color: '#1e90ff', badges: ['subscriber-1'],   text: msgs.mock_chat_02 },
		{ user: 'mod_wren',       color: '#00ad03', badges: ['mod'],            text: msgs.mock_chat_03 },
		{ user: 'kappa_kate',     color: '#8a2be2', badges: ['subscriber-2', 'vip'], text: msgs.mock_chat_04 },
		{ user: 'casualviewer',   color: '#ff69b4', badges: [],                 text: msgs.mock_chat_05 },
		{ user: 'laurendev',      color: '#e91916', badges: ['broadcaster'],    text: msgs.mock_chat_06 },
		{ user: 'subscriber99',   color: '#ffaa00', badges: ['subscriber-3'],   text: msgs.mock_chat_07 },
		{ user: 'newguy',         color: '#00bcd4', badges: [],                 text: msgs.mock_chat_08 },
		{ user: 'oldtimer',       color: '#9c27b0', badges: ['subscriber-1'],   text: msgs.mock_chat_09 },
		{ user: 'sadlad',         color: '#6495ed', badges: [],                 text: msgs.mock_chat_10 },
		{ user: 'emote_enjoyer',  color: '#00a86b', badges: ['subscriber-2'],   text: msgs.mock_chat_11 },
		{ user: 'lurker_5000',    color: '#ff7f50', badges: [],                 text: msgs.mock_chat_12 },
		{ user: 'vibecat',        color: '#ff69b4', badges: ['subscriber-3'],   text: msgs.mock_chat_13 },
		{ user: 'chatterino_fan', color: '#1e90ff', badges: [],                 text: msgs.mock_chat_14 },
		{ user: 'doomer_dan',     color: '#9c27b0', badges: [],                 text: msgs.mock_chat_15 },
		{ user: 'glhf_gg',        color: '#ffaa00', badges: ['vip'],            text: msgs.mock_chat_16 },
		{ user: 'clip_farmer',    color: '#00bcd4', badges: [],                 text: msgs.mock_chat_17 },
		{ user: 'hands_down',     color: '#6495ed', badges: ['subscriber-1'],   text: msgs.mock_chat_18 },
		{ user: 'happy_peepo',    color: '#00a86b', badges: ['vip'],            text: msgs.mock_chat_19 },
		{ user: 'replay_andy',    color: '#ff7f50', badges: [],                 text: msgs.mock_chat_20 },
		{ user: 'button_masher',  color: '#ffaa00', badges: [],                 text: msgs.mock_chat_21 },
		{ user: 'macro_mike',     color: '#e91916', badges: ['subscriber-2'],   text: msgs.mock_chat_22 },
		{ user: 'cope_tank',      color: '#9c27b0', badges: [],                 text: msgs.mock_chat_23 },
		{ user: 'prayge_chat',    color: '#1e90ff', badges: ['subscriber-3'],   text: msgs.mock_chat_24 }
	];

	let messages = $state<ChatMessage[]>([]);
	let floaters = $state<Floater[]>([]);
	let broken = $state<Partial<Record<EmoteName, true>>>({});
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
			ts: clock(),
			user: src.user,
			color: src.color,
			badges: src.badges,
			text: src.text()
		};
		nextMessageId += 1;
		messages = [...messages, msg].slice(-MAX_MESSAGES);

		if (!spawnFloaters || reduceMotion) return;

		uniqueEmotes(msg.text).forEach((name, i) => {
			const copies = 1 + Math.floor(Math.random() * 2);
			for (let c = 0; c < copies; c += 1) {
				schedule(() => spawnFloater(name), (i * 2 + c) * 350 + Math.random() * 300);
			}
		});
	}

	function clock() {
		const d = new Date();
		const hour = d.getHours() % 12 || 12;
		return `${hour}:${String(d.getMinutes()).padStart(2, '0')}`;
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

	function uniqueEmotes(text: string) {
		return [...new Set(text.split(/\s+/).map(usableEmote).filter((name): name is EmoteName => Boolean(name)))];
	}

	function usableEmote(token: string): EmoteName | null {
		if (!Object.prototype.hasOwnProperty.call(EMOTES, token)) return null;
		const name = token as EmoteName;
		return broken[name] ? null : name;
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
