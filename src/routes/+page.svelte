<script lang="ts">
	import { Activity, Code, Download, Heart, MessageSquareText, ShieldCheck, Users } from 'lucide-svelte';
	import DownloadButton from '$lib/components/DownloadButton.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import GithubGlyph from '$lib/glyphs/GithubGlyph.svelte';
	import PlatformGlyph from '$lib/glyphs/PlatformGlyph.svelte';
	import { PLATFORMS, RELEASES_URL } from '$lib/platform';
	import { m as msgs } from '$lib/paraglide/messages';

	type FeatureGroupId = 'chat' | 'events' | 'channels' | 'app';
	interface FeatureStatus { done: boolean; label: () => string }
	interface FeatureGroup {
		id: FeatureGroupId;
		label: () => string;
		blurb: () => string;
		items: FeatureStatus[];
	}

	const FEATURES: FeatureGroup[] = [
		{
			id: 'chat',
			label: msgs.feature_group_chat_label,
			blurb: msgs.feature_group_chat_blurb,
			items: [
				{ done: true,  label: msgs.feature_chat_sending },
				{ done: true,  label: msgs.feature_chat_parsing },
				{ done: true,  label: msgs.feature_chat_composer },
				{ done: false, label: msgs.feature_chat_history },
				{ done: false, label: msgs.feature_chat_reply_threads },
				{ done: false, label: msgs.feature_chat_decorations }
			]
		},
		{
			id: 'events',
			label: msgs.feature_group_events_label,
			blurb: msgs.feature_group_events_blurb,
			items: [
				{ done: false, label: msgs.feature_events_activity },
				{ done: false, label: msgs.feature_events_moderation },
				{ done: false, label: msgs.feature_events_deleted_messages },
				{ done: false, label: msgs.feature_events_support_activity }
			]
		},
		{
			id: 'channels',
			label: msgs.feature_group_channels_label,
			blurb: msgs.feature_group_channels_blurb,
			items: [
				{ done: true,  label: msgs.feature_channels_following },
				{ done: true,  label: msgs.feature_channels_live_sorting },
				{ done: false, label: msgs.feature_channels_live_notifications },
				{ done: false, label: msgs.feature_channels_groups },
				{ done: false, label: msgs.feature_channels_favorites }
			]
		},
		{
			id: 'app',
			label: msgs.feature_group_app_label,
			blurb: msgs.feature_group_app_blurb,
			items: [
				{ done: true,  label: msgs.feature_app_autoupdater },
				{ done: false, label: msgs.feature_app_accounts },
				{ done: false, label: msgs.feature_app_appearance },
				{ done: false, label: msgs.feature_app_mentions },
				{ done: false, label: msgs.feature_app_youtube }
			]
		}
	];
</script>

<svelte:head>
	<title>{msgs.meta_title()}</title>
	<meta name="description" content={msgs.meta_description()} />
	<link rel="alternate" hreflang="en" href="https://pepo.chat/" />
	<link rel="alternate" hreflang="ru" href="https://pepo.chat/ru" />
	<link rel="alternate" hreflang="x-default" href="https://pepo.chat/" />
</svelte:head>

<div class="landing-page" style="min-height: 100vh; display: flex; flex-direction: column;">
	<header class="site-header" style="display: flex; align-items: center; padding: 18px 32px; max-width: 1200px; margin: 0 auto; width: 100%; box-sizing: border-box;">
		<div class="brand-lockup" style="display: flex; align-items: center; gap: 10px;">
			<img class="brand-logo" src="/pepo-flat.png" alt="" style="height: 28px; width: 28px;" />
			<span class="brand-name" style="font-size: 16px; font-weight: 600; letter-spacing: 0;">pepo</span>
			<span class="brand-badge" style="font-size: 11px; padding: 2px 6px; margin-left: 4px; border-radius: 999px; background: hsl(var(--accent)); color: hsl(var(--muted-foreground)); border: 1px solid hsl(var(--border));">
				{msgs.early_access()}
			</span>
		</div>
		<nav class="site-nav" style="margin-left: auto; display: flex; gap: 6px; align-items: center;">
			<a class="btn-ghost nav-link" href="#features" style="padding: 6px 10px;">{msgs.nav_features()}</a>
			<a class="btn-ghost nav-link" href="#install" style="padding: 6px 10px;">{msgs.nav_install()}</a>
			<a class="btn-ghost nav-link" href="https://github.com/synthlabs/pepo" style="padding: 6px 10px;">
				<GithubGlyph size={14} /> {msgs.nav_github()}
			</a>
			<LanguageSwitcher />
		</nav>
	</header>

	<section class="landing-section hero-section" style="max-width: 1200px; margin: 0 auto; width: 100%; padding: 32px 32px 64px; box-sizing: border-box;">
		<div class="hero-grid" style="display: grid; grid-template-columns: 1fr 1.15fr; gap: 56px; align-items: center;">
			<div class="hero-copy">
				<div class="hero-status" style="display: flex; align-items: center; gap: 8px; margin-bottom: 18px;">
					<span class="live-dot" style="width: 8px; height: 8px; border-radius: 999px; background: hsl(var(--primary));"></span>
					<span style="font-size: 12px; color: hsl(var(--muted-foreground)); letter-spacing: 0;">
						{msgs.hero_status()}
					</span>
				</div>
				<h1 class="hero-title" style="font-weight: 600; line-height: 1.04; letter-spacing: 0; margin: 0;">
					{msgs.hero_headline_part1()}<br />{msgs.hero_headline_part2()}
				</h1>
				<p class="hero-subtitle" style="margin-top: 18px; font-size: 17px; line-height: 1.55; color: hsl(var(--muted-foreground)); max-width: 480px; text-wrap: pretty;">
					{msgs.hero_subtitle()}
				</p>

				<div class="hero-actions" style="display: flex; gap: 12px; align-items: center; margin-top: 28px; flex-wrap: wrap;">
					<DownloadButton />
					<a class="btn-ghost hero-source" href="https://github.com/synthlabs/pepo">
						<GithubGlyph size={16} /> {msgs.view_source()}
					</a>
				</div>

				<div class="hero-chips" style="margin-top: 20px; font-size: 12px; color: hsl(var(--muted-foreground)); display: flex; gap: 16px; flex-wrap: wrap;">
					<span class="hero-chip" style="display: inline-flex; align-items: center; gap: 6px;">
						<ShieldCheck size={12} strokeWidth={1.75} /> {msgs.hero_chip_updates()}
					</span>
					<span class="hero-chip" style="display: inline-flex; align-items: center; gap: 6px;">
						<Code size={12} strokeWidth={1.75} /> {msgs.hero_chip_stack()}
					</span>
					<span class="hero-chip" style="display: inline-flex; align-items: center; gap: 6px;">
						<Heart size={12} strokeWidth={1.75} /> {msgs.hero_chip_unaffiliated()}
					</span>
				</div>
			</div>

			<div class="hero-preview" style="position: relative;">
				<img
					src="/pepo-logo.png"
					alt="pepo mascot"
					class="duck-mark hero-mascot"
				/>
				<div class="shell hero-shell hero-visual" style="border: none; box-shadow: var(--shadow-lg);">
					<img class="hero-demo" src="/pepo-chat-demo.gif" alt="Pepo chat demo" style="width: 100%; display: block;" />
				</div>
			</div>
		</div>
	</section>

	<section class="landing-section features-section" id="features" style="max-width: 1200px; margin: 0 auto; width: 100%; padding: 48px 32px; box-sizing: border-box;">
		<div class="section-head" style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
			<h2 class="section-title" style="margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 0;">{msgs.features_heading()}</h2>
			<p style="margin: 0; font-size: 13px; color: hsl(var(--muted-foreground)); line-height: 1.5; max-width: 420px; text-wrap: pretty;">
				{msgs.features_intro()}
			</p>
		</div>

		<div class="features-grid" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; align-items: stretch;">
			{#each FEATURES as feature (feature.id)}
				<article class="f-card feature-card" style="display: flex; flex-direction: column; gap: 14px;">
					<div class="feature-card-head">
						<div class="feature-card-title-row">
							<div class="feature-card-icon">
								{#if feature.id === 'chat'}
									<MessageSquareText size={18} strokeWidth={1.75} />
								{:else if feature.id === 'events'}
									<Activity size={18} strokeWidth={1.75} />
								{:else if feature.id === 'channels'}
									<Users size={18} strokeWidth={1.75} />
								{:else}
									<Code size={18} strokeWidth={1.75} />
								{/if}
							</div>
							<h3 class="feature-card-title">
								{feature.label()}
							</h3>
						</div>
						<p class="feature-card-blurb">
							{feature.blurb()}
						</p>
					</div>
					<div class="feature-status-list">
						{#each feature.items as item (item.label)}
							<div class="feature-status-item">
								<span class:done={item.done} class="feature-status-badge">
									{item.done ? msgs.feature_status_now() : msgs.feature_status_planned()}
								</span>
								<span class="feature-status-text">{item.label()}</span>
							</div>
						{/each}
					</div>
				</article>
			{/each}
		</div>
	</section>

	<section class="landing-section install-section" id="install" style="max-width: 1200px; margin: 0 auto; width: 100%; padding: 48px 32px 32px; box-sizing: border-box;">
		<h2 class="section-title" style="margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 0;">{msgs.install_heading()}</h2>
		<p style="margin-top: 8px; color: hsl(var(--muted-foreground)); font-size: 15px; max-width: 600px;">
			{msgs.install_intro()}
		</p>

		<div class="install-grid" style="margin-top: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
			{#each PLATFORMS as p (p.id)}
				<div class="f-card install-card" style="display: flex; align-items: center; gap: 14px; padding: 16px;">
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

	<footer class="site-footer" style="margin-top: 32px; padding: 0 32px 24px;">
		<div class="footer-inner" style="max-width: 1200px; margin: 0 auto; border-top: 1px solid hsl(var(--border)); padding-top: 24px; display: flex; gap: 20px; align-items: center; flex-wrap: wrap; font-size: 13px;">
			<div style="display: flex; align-items: center; gap: 8px;">
				<img src="/pepo-flat.png" style="width: 18px; height: 18px;" alt="" />
				<span style="color: hsl(var(--muted-foreground));">{msgs.foot_attribution()}</span>
			</div>
			<nav class="footer-nav" style="margin-left: auto; display: flex; gap: 18px;">
				<a class="link" href="https://github.com/synthlabs/pepo">{msgs.foot_github()}</a>
				<a class="link" href="https://github.com/synthlabs/pepo/releases">{msgs.foot_releases()}</a>
				<a class="link" href="https://github.com/synthlabs/pepo/issues">{msgs.foot_issues()}</a>
				<a class="link" href="https://github.com/synthlabs">{msgs.foot_synthlabs()}</a>
			</nav>
		</div>
	</footer>
</div>
