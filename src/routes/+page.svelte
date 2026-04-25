<script lang="ts">
	import { ShieldCheck, Code, Heart, Check, Download } from 'lucide-svelte';
	import DownloadButton from '$lib/components/DownloadButton.svelte';
	import MiniPepo from '$lib/components/MiniPepo.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import GithubGlyph from '$lib/glyphs/GithubGlyph.svelte';
	import PlatformGlyph from '$lib/glyphs/PlatformGlyph.svelte';
	import { PLATFORMS, RELEASES_URL } from '$lib/platform';
	import { m as msgs } from '$lib/paraglide/messages';

	type TabId = 'emotes' | 'following' | 'badges' | 'composer';
	interface Tab { id: TabId; label: () => string; blurb: () => string }

	const TABS: Tab[] = [
		{ id: 'emotes',    label: msgs.tab_emotes_label,    blurb: msgs.tab_emotes_blurb },
		{ id: 'following', label: msgs.tab_following_label, blurb: msgs.tab_following_blurb },
		{ id: 'badges',    label: msgs.tab_badges_label,    blurb: msgs.tab_badges_blurb },
		{ id: 'composer',  label: msgs.tab_composer_label,  blurb: msgs.tab_composer_blurb }
	];

	let tab: TabId = $state('emotes');

	const status: { done: boolean; label: () => string }[] = [
		{ done: true,  label: msgs.status_sending },
		{ done: true,  label: msgs.status_badges },
		{ done: true,  label: msgs.status_thirdparty },
		{ done: true,  label: msgs.status_following },
		{ done: true,  label: msgs.status_autoupdater },
		{ done: false, label: msgs.status_history },
		{ done: false, label: msgs.status_moderation },
		{ done: false, label: msgs.status_youtube }
	];
</script>

<svelte:head>
	<title>{msgs.meta_title()}</title>
	<meta name="description" content={msgs.meta_description()} />
	<link rel="alternate" hreflang="en" href="https://pepo.chat/" />
	<link rel="alternate" hreflang="ru" href="https://pepo.chat/ru" />
	<link rel="alternate" hreflang="x-default" href="https://pepo.chat/" />
</svelte:head>

<div style="min-height: 100vh; display: flex; flex-direction: column;">
	<header style="display: flex; align-items: center; padding: 18px 32px; max-width: 1200px; margin: 0 auto; width: 100%; box-sizing: border-box;">
		<div style="display: flex; align-items: center; gap: 10px;">
			<img src="/pepo-flat.png" alt="" style="height: 28px; width: 28px;" />
			<span style="font-size: 16px; font-weight: 600; letter-spacing: -0.01em;">pepo</span>
			<span style="font-size: 11px; padding: 2px 6px; margin-left: 4px; border-radius: 999px; background: hsl(var(--accent)); color: hsl(var(--muted-foreground)); border: 1px solid hsl(var(--border));">
				{msgs.early_access()}
			</span>
		</div>
		<nav style="margin-left: auto; display: flex; gap: 6px; align-items: center;">
			<a class="btn-ghost" href="#features" style="padding: 6px 10px;">{msgs.nav_features()}</a>
			<a class="btn-ghost" href="#install" style="padding: 6px 10px;">{msgs.nav_install()}</a>
			<a class="btn-ghost" href="https://github.com/synthlabs/pepo" style="padding: 6px 10px;">
				<GithubGlyph size={14} /> {msgs.nav_github()}
			</a>
			<LanguageSwitcher />
		</nav>
	</header>

	<section style="max-width: 1200px; margin: 0 auto; width: 100%; padding: 32px 32px 64px; box-sizing: border-box;">
		<div class="hero-grid" style="display: grid; grid-template-columns: 1fr 1.15fr; gap: 56px; align-items: center;">
			<div>
				<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 18px;">
					<span class="live-dot" style="width: 8px; height: 8px; border-radius: 999px; background: hsl(var(--primary));"></span>
					<span style="font-size: 12px; color: hsl(var(--muted-foreground)); letter-spacing: 0.02em;">
						{msgs.hero_status()}
					</span>
				</div>
				<h1 style="font-size: clamp(40px, 5vw, 64px); font-weight: 600; line-height: 1.04; letter-spacing: -0.025em; margin: 0;">
					{msgs.hero_headline_part1()}<br />{msgs.hero_headline_part2()}
				</h1>
				<p style="margin-top: 18px; font-size: 17px; line-height: 1.55; color: hsl(var(--muted-foreground)); max-width: 480px; text-wrap: pretty;">
					{msgs.hero_subtitle()}
				</p>

				<div style="display: flex; gap: 12px; align-items: center; margin-top: 28px; flex-wrap: wrap;">
					<DownloadButton />
					<a class="btn-ghost" href="https://github.com/synthlabs/pepo">
						<GithubGlyph size={16} /> {msgs.view_source()}
					</a>
				</div>

				<div style="margin-top: 20px; font-size: 12px; color: hsl(var(--muted-foreground)); display: flex; gap: 16px; flex-wrap: wrap;">
					<span style="display: inline-flex; align-items: center; gap: 6px;">
						<ShieldCheck size={12} strokeWidth={1.75} /> {msgs.hero_chip_updates()}
					</span>
					<span style="display: inline-flex; align-items: center; gap: 6px;">
						<Code size={12} strokeWidth={1.75} /> {msgs.hero_chip_stack()}
					</span>
					<span style="display: inline-flex; align-items: center; gap: 6px;">
						<Heart size={12} strokeWidth={1.75} /> {msgs.hero_chip_unaffiliated()}
					</span>
				</div>
			</div>

			<div style="position: relative;">
				<img
					src="/pepo-logo.png"
					alt="pepo mascot"
					class="duck-mark"
					style="position: absolute; top: -40px; right: -10px; width: 140px; height: auto; transform: rotate(8deg); z-index: 3; pointer-events: none;"
				/>
				<div class="shell" style="border: none; box-shadow: var(--shadow-lg);">
					<img src="/pepo-chat-demo.gif" alt="Pepo chat demo" style="width: 100%; display: block;" />
				</div>
			</div>
		</div>
	</section>

	<section id="features" style="max-width: 1200px; margin: 0 auto; width: 100%; padding: 48px 32px; box-sizing: border-box;">
		<div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
			<h2 style="margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.02em;">{msgs.features_heading()}</h2>
			<span style="font-size: 13px; color: hsl(var(--muted-foreground));">{msgs.features_hint()}</span>
		</div>

		<div class="features-grid" style="display: grid; grid-template-columns: 360px 1fr; gap: 32px; align-items: start;">
			<div role="tablist" aria-label="Feature preview" style="display: flex; flex-direction: column; gap: 4px;">
				{#each TABS as t (t.id)}
					{@const active = t.id === tab}
					<button
						role="tab"
						onclick={() => (tab = t.id)}
						aria-selected={active}
						style="
							text-align: left;
							padding: 16px;
							border: 1px solid {active ? 'hsl(var(--border))' : 'transparent'};
							border-radius: var(--radius);
							background: {active ? 'hsl(var(--card))' : 'transparent'};
							cursor: pointer;
							display: flex; gap: 12px;
							transition: all 180ms;
						"
					>
						<span style="margin-top: 4px; width: 6px; height: 6px; border-radius: 999px; flex-shrink: 0; background: {active ? 'hsl(var(--primary))' : 'hsl(var(--border))'};"></span>
						<span style="display: flex; flex-direction: column; gap: 4px;">
							<span style="font-size: 15px; font-weight: 500; color: hsl(var(--foreground));">{t.label()}</span>
							<span style="font-size: 13px; color: hsl(var(--muted-foreground)); line-height: 1.5; text-wrap: pretty;">
								{t.blurb()}
							</span>
						</span>
					</button>
				{/each}
			</div>

			<MiniPepo highlight={tab} />
		</div>
	</section>

	<section style="max-width: 1200px; margin: 0 auto; width: 100%; padding: 32px; box-sizing: border-box;">
		<div style="border: 1px solid hsl(var(--border)); border-radius: var(--radius); padding: 20px 24px; background: hsl(var(--card)); display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;">
			{#each status as it, i (i)}
				<div style="display: flex; gap: 10px; align-items: flex-start; font-size: 13px;">
					<span style="
						width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px;
						border-radius: 4px;
						background: {it.done ? 'hsl(263 75% 65% / 0.18)' : 'transparent'};
						border: 1px solid {it.done ? 'hsl(263 75% 65% / 0.5)' : 'hsl(var(--border))'};
						display: inline-flex; align-items: center; justify-content: center;
						color: hsl(263 75% 75%);
					">
						{#if it.done}
							<Check size={12} strokeWidth={1.75} />
						{/if}
					</span>
					<span style="color: {it.done ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'};">
						{it.label()}
					</span>
				</div>
			{/each}
		</div>
	</section>

	<section id="install" style="max-width: 1200px; margin: 0 auto; width: 100%; padding: 48px 32px 32px; box-sizing: border-box;">
		<h2 style="margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.02em;">{msgs.install_heading()}</h2>
		<p style="margin-top: 8px; color: hsl(var(--muted-foreground)); font-size: 15px; max-width: 600px;">
			{msgs.install_intro()}
		</p>

		<div style="margin-top: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
			{#each PLATFORMS as p (p.id)}
				<div class="f-card" style="display: flex; align-items: center; gap: 14px; padding: 16px;">
					<div style="width: 40px; height: 40px; border-radius: var(--radius); background: hsl(var(--accent)); display: inline-flex; align-items: center; justify-content: center; color: hsl(var(--foreground)); border: 1px solid hsl(var(--border));">
						<PlatformGlyph icon={p.icon} size={18} />
					</div>
					<div style="display: flex; flex-direction: column; flex: 1; min-width: 0;">
						<span style="font-size: 14px; font-weight: 500;">{p.label}</span>
						<span style="font-size: 12px; color: hsl(var(--muted-foreground)); font-family: var(--font-mono); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
							{p.file.replace('{v}', '0.2.19')}
						</span>
					</div>
					<a class="btn-ghost" href={RELEASES_URL} style="padding: 6px 10px;" aria-label={msgs.install_release_aria()}>
						<Download size={14} strokeWidth={1.75} />
					</a>
				</div>
			{/each}
		</div>

		<div style="margin-top: 32px;">
			<h3 style="margin: 0; font-size: 16px; font-weight: 500; color: hsl(var(--foreground));">{msgs.build_heading()}</h3>
			<p style="margin-top: 4px; color: hsl(var(--muted-foreground)); font-size: 13px;">
				{msgs.build_intro()}
			</p>
			<div class="code-block" style="margin-top: 12px; max-width: 720px;">
				<div><span class="c-prompt">$</span> git clone --recurse-submodules https://github.com/synthlabs/pepo.git</div>
				<div><span class="c-prompt">$</span> cd pepo</div>
				<div><span class="c-prompt">$</span> pnpm install</div>
				<div><span class="c-prompt">$</span> pnpm tauri build</div>
				<div style="margin-top: 8px;"><span class="c-comment"># {msgs.build_comment()}</span></div>
			</div>
		</div>
	</section>

	<footer style="border-top: 1px solid hsl(var(--border)); margin-top: 32px; padding: 24px 32px;">
		<div style="max-width: 1200px; margin: 0 auto; display: flex; gap: 20px; align-items: center; flex-wrap: wrap; font-size: 13px;">
			<div style="display: flex; align-items: center; gap: 8px;">
				<img src="/pepo-flat.png" style="width: 18px; height: 18px;" alt="" />
				<span style="color: hsl(var(--muted-foreground));">{msgs.foot_attribution()}</span>
			</div>
			<nav style="margin-left: auto; display: flex; gap: 18px;">
				<a class="link" href="https://github.com/synthlabs/pepo">{msgs.foot_github()}</a>
				<a class="link" href="https://github.com/synthlabs/pepo/releases">{msgs.foot_releases()}</a>
				<a class="link" href="https://github.com/synthlabs/pepo/issues">{msgs.foot_issues()}</a>
				<a class="link" href="https://github.com/synthlabs">{msgs.foot_synthlabs()}</a>
			</nav>
		</div>
	</footer>
</div>
