import { m as msgs } from '$lib/paraglide/messages';

export const BADGE_IMAGES = {
	broadcaster: '/badges/hero-chat/broadcaster.png',
	mod: '/badges/hero-chat/moderator.png',
	vip: '/badges/hero-chat/vip.png',
	'subscriber-1': '/badges/hero-chat/subscriber-1.png',
	'subscriber-2': '/badges/hero-chat/subscriber-2.png',
	'subscriber-3': '/badges/hero-chat/subscriber-3.png'
} as const;

export type Badge = keyof typeof BADGE_IMAGES;

export interface MockChatter {
	user: string;
	color: string;
	badges: Badge[];
	text: () => string;
}

export const EMOTES = {
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
	COPIUM: 'https://cdn.7tv.app/emote/01F6ME7ADR0000WDA7ERT9H30/2x.webp',
	Prayge: 'https://cdn.7tv.app/emote/01F6NACCD80006SZ7ZW5FMWKWK/2x.webp',
	NODDERS: 'https://cdn.7tv.app/emote/01F6MDFCSR0000WDA7ERT623YT/2x.webp'
} as const;

export type EmoteName = keyof typeof EMOTES;

export type BrokenEmotes = Partial<Record<EmoteName, true>>;

export const POOL: MockChatter[] = [
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

export function tokenEmote(token: string, broken: BrokenEmotes): EmoteName | null {
	if (!Object.prototype.hasOwnProperty.call(EMOTES, token)) return null;
	const name = token as EmoteName;
	return broken[name] ? null : name;
}

export function uniqueEmotes(text: string, broken: BrokenEmotes): EmoteName[] {
	return [
		...new Set(
			text
				.split(/\s+/)
				.map((token) => tokenEmote(token, broken))
				.filter((name): name is EmoteName => Boolean(name))
		)
	];
}

export function chatClock(date = new Date()): string {
	const hour = date.getHours() % 12 || 12;
	return `${hour}:${String(date.getMinutes()).padStart(2, '0')}`;
}
