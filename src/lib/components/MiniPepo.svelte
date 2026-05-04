<script lang="ts">
	import { Search, Users, PanelLeft, Smile, Sword } from 'lucide-svelte';

	type Highlight = 'emotes' | 'following' | 'badges' | 'composer';
	type MsgPart = string | { e: keyof typeof EMO };

	let { highlight }: { highlight: Highlight } = $props();

	const EMO = {
		widepeepoHappy: { url: 'https://cdn.betterttv.net/emote/5e1a76dd8af14b5f1b438c04/3x.webp' },
		catJAM:         { url: 'https://cdn.betterttv.net/emote/5f1b0186cf6d2144653d2970/3x.webp' },
		KEKW:           { url: 'https://cdn.betterttv.net/emote/5e9c6c187e090362f8b0b9e8/3x.webp' },
		monkaS:         { url: 'https://cdn.betterttv.net/emote/56e9f494fff3cc5c35e5287e/3x.webp' },
		EZ:             { url: 'https://cdn.betterttv.net/emote/5590b223b344e2c42a9e28e3/3x.webp' },
		Clap:           { url: 'https://cdn.betterttv.net/emote/55b6f480e66682f576dd94f5/3x.webp' },
		PogChamp:       { url: 'https://static-cdn.jtvnw.net/emoticons/v2/305954156/default/dark/2.0' }
	} as const;

	type Badge = 'sub' | 'mod' | 'vip';
	interface Row { t: string; u: string; color: string; msg: MsgPart[]; badges: Badge[] }

	const rows: Row[] = [
		{ t: '5:58', u: 'quietcactus',  color: '#5CD3A0', msg: ['hey ', { e: 'widepeepoHappy' }, ' ', { e: 'catJAM' }], badges: [] },
		{ t: '5:58', u: 'stormloop',    color: '#E29148', msg: ["damn he's actually good ", { e: 'PogChamp' }], badges: ['sub'] },
		{ t: '5:58', u: 'mintcurtains', color: '#C98AFF', msg: ['FINALLY'], badges: [] },
		{ t: '5:58', u: 'braverabbit',  color: '#6AA7FF', msg: [{ e: 'KEKW' }, ' I WAS HERE'], badges: [] },
		{ t: '5:58', u: 'barticus_1',   color: '#8FD14F', msg: ['first try ', { e: 'EZ' }, ' ', { e: 'Clap' }], badges: ['mod'] },
		{ t: '5:58', u: 'softginger',   color: '#55C6D9', msg: ["it's that ", { e: 'monkaS' }], badges: [] },
		{ t: '5:58', u: 'f6rzen',       color: '#E6E6E6', msg: ['i was here'], badges: [] },
		{ t: '5:58', u: 'nightowl42',   color: '#FF6FB5', msg: ['I WAS HERE ', { e: 'widepeepoHappy' }], badges: ['vip'] }
	];

	interface Side { name: string; status: string; viewers: string; live: boolean }
	const side: Side[] = [
		{ name: 'quietcactus',  status: 'lets talk about',  viewers: '3,388', live: true },
		{ name: 'stormloop',    status: 'Just Chatting',    viewers: '12.1K', live: true },
		{ name: 'mintcurtains', status: 'offline',          viewers: '—',     live: false },
		{ name: 'braverabbit',  status: 'building a synth', viewers: '24.5K', live: true },
		{ name: 'softginger',   status: 'offline',          viewers: '—',     live: false }
	];

	function badgeBg(b: Badge): string {
		if (b === 'mod') return '#00ad03';
		if (b === 'vip') return '#e005b9';
		return 'hsl(263 75% 65%)';
	}
</script>

<div class="shell mini-pepo-shell" style="width: 100%;">
	<div class="shell-bar">
		<span class="shell-dot" style="background: #ff5f57;"></span>
		<span class="shell-dot" style="background: #febc2e;"></span>
		<span class="shell-dot" style="background: #28c840;"></span>
		<span class="shell-title">
			<img src="/pepo-flat.png" style="width: 14px; height: 14px;" alt="" />
			Pepo 0.2.19
		</span>
		<div style="width: 40px;"></div>
	</div>

	<div class="mini-pepo-grid" style="display: grid; grid-template-columns: 220px 1fr; min-height: 380px;">
		<aside
			class="mini-pepo-sidebar"
			style="
				background: hsl(var(--sidebar-background));
				border-right: 1px solid hsl(var(--border));
				padding: 10px;
				position: relative;
				box-shadow: {highlight === 'following' ? 'inset 0 0 0 1px hsl(263 75% 65% / 0.5)' : 'none'};
				transition: box-shadow 220ms ease-out;
			"
		>
			<div
				style="
					display: flex; align-items: center; gap: 8px;
					padding: 6px 8px;
					border: 1px solid hsl(var(--border));
					border-radius: var(--radius);
					background: hsl(var(--sidebar-accent));
					font-size: 13px; color: hsl(var(--muted-foreground));
				"
			>
				<Search size={14} strokeWidth={1.75} /> <span>squ</span>
			</div>
			<div style="font-size: 12px; color: hsl(var(--muted-foreground)); padding: 12px 8px 4px; font-weight: 500;">
				Following
			</div>
			{#each side as s (s.name)}
				<div class="mini-side-item">
					<div class="mini-avatar {s.live ? 'live' : ''}" style="opacity: {s.live ? 1 : 0.5};"></div>
					<div style="display: flex; flex-direction: column; min-width: 0; flex: 1;">
						<span style="font-weight: 500; color: hsl(var(--sidebar-foreground));">{s.name}</span>
						<span style="font-size: 11px; color: hsl(var(--muted-foreground)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
							{s.status}
						</span>
					</div>
					{#if s.live}
						<span style="font-size: 11px; color: hsl(var(--muted-foreground)); display: inline-flex; align-items: center; gap: 3px;">
							<Users size={11} strokeWidth={1.75} /> {s.viewers}
						</span>
					{/if}
				</div>
			{/each}
		</aside>

		<div style="display: flex; flex-direction: column; min-width: 0;">
			<div style="display: flex; align-items: center; padding: 10px 14px; border-bottom: 1px solid hsl(var(--border)); font-size: 13px; color: hsl(var(--foreground));">
				<PanelLeft size={14} strokeWidth={1.75} color="hsl(var(--muted-foreground))" />
				<span style="margin-left: 10px;">building a synth from scratch</span>
				<span style="margin-left: auto; font-size: 12px; color: hsl(var(--muted-foreground)); display: inline-flex; align-items: center; gap: 4px;">
					<Users size={12} strokeWidth={1.75} /> 3,388
				</span>
			</div>

			<div style="flex: 1; overflow: hidden; position: relative;">
				{#each rows as r, i (i)}
					<div class="demo-row row-in" style="animation-delay: {i * 40}ms;">
						<span class="demo-time">{r.t} PM</span>
						<span style="display: inline-flex; align-items: center; flex-wrap: wrap; gap: 2px;">
							{#each r.badges as b, bi (bi)}
								<span
									class="demo-badge"
									style="
										background: {badgeBg(b)};
										box-shadow: {highlight === 'badges' ? '0 0 0 2px hsl(263 75% 65% / 0.5)' : 'none'};
									"
								>
									{#if b === 'mod'}
										<Sword size={10} strokeWidth={1.75} />
									{:else if b === 'vip'}
										◆
									{:else}
										$
									{/if}
								</span>
							{/each}
							<span class="demo-user" style="color: {r.color};">{r.u}</span>
							<span>:</span>
						</span>
						<span style="min-width: 0; flex: 1;">
							{#each r.msg as part, j (j)}
								{#if typeof part === 'string'}
									<span>{part}</span>
								{:else}
									<img
										src={EMO[part.e].url}
										alt={part.e}
										title={part.e}
										style="
											display: inline-block;
											height: 24px;
											width: auto;
											vertical-align: middle;
											margin: -4px 2px;
											border-radius: 3px;
											box-shadow: {highlight === 'emotes' ? '0 0 0 2px hsl(263 75% 65% / 0.6)' : 'none'};
										"
									/>
								{/if}
							{/each}
						</span>
					</div>
				{/each}
			</div>

			<div
				style="
					display: flex; align-items: center; gap: 10px;
					padding: 10px 14px;
					border-top: 1px solid hsl(var(--border));
					box-shadow: {highlight === 'composer' ? 'inset 0 0 0 1px hsl(263 75% 65% / 0.5)' : 'none'};
					transition: box-shadow 220ms ease-out;
				"
			>
				<div
					style="
						flex: 1;
						font-size: 13px;
						color: hsl(var(--muted-foreground));
						padding: 6px 10px;
						border: 1px solid hsl(var(--border));
						border-radius: var(--radius);
						background: hsl(var(--background));
						display: flex; align-items: center;
					"
				>
					Send message as sir_xin
					<span style="margin-left: 6px; width: 2px; height: 14px; background: hsl(var(--foreground)); opacity: 0.7; animation: liveBlink 1.25s ease-out infinite;"></span>
				</div>
				<button
					aria-label="Emote picker"
					style="background: transparent; border: none; color: hsl(var(--muted-foreground)); cursor: pointer; padding: 6px; display: inline-flex;"
				>
					<Smile size={18} strokeWidth={1.75} />
				</button>
			</div>
		</div>
	</div>
</div>
