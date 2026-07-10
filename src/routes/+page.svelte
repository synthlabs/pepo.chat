<script lang="ts">
	import { Activity, Check, Circle, Code, Download, Monitor, MessageSquareText, Smile, Users } from 'lucide-svelte';
	import DownloadButton from '$lib/components/DownloadButton.svelte';
	import HeroChatMock from '$lib/components/HeroChatMock.svelte';
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
				{ done: true,  label: msgs.feature_chat_parsing },
				{ done: true,  label: msgs.feature_chat_composer },
				{ done: true,  label: msgs.feature_chat_sending },
				{ done: false, label: msgs.feature_chat_reply_threads },
				{ done: false, label: msgs.feature_chat_history },
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
				{ done: false, label: msgs.feature_channels_favorites },
				{ done: false, label: msgs.feature_channels_live_notifications },
				{ done: false, label: msgs.feature_channels_groups }
			]
		},
		{
			id: 'app',
			label: msgs.feature_group_app_label,
			blurb: msgs.feature_group_app_blurb,
			items: [
				{ done: true,  label: msgs.feature_app_autoupdater },
				{ done: false, label: msgs.feature_app_appearance },
				{ done: false, label: msgs.feature_app_mentions },
				{ done: false, label: msgs.feature_app_accounts },
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

<div class="landing-page">
	<header class="site-header">
		<a class="brand-lockup" href="/" aria-label="pepo">
			<img class="brand-logo" src="/pepo-flat.png" alt="" />
			<span class="brand-name">pepo</span>
		</a>
		<nav class="site-nav" aria-label="Primary">
			<a class="site-nav-link" href="#features">{msgs.nav_features()}</a>
			<a class="site-nav-link" href="#download">{msgs.nav_download()}</a>
			<a class="site-nav-link" href="https://github.com/synthlabs/pepo" target="_blank" rel="noopener">
				<GithubGlyph size={16} /> {msgs.nav_github()}
			</a>
			<LanguageSwitcher />
		</nav>
	</header>

	<main>
		<section class="hero-section" aria-labelledby="hero-title">
			<div class="hero-copy">
				<h1 class="hero-title" id="hero-title">
					{msgs.hero_headline_part1()}{#if msgs.hero_headline_part2()}<br />{msgs.hero_headline_part2()}{/if}
				</h1>
				<p class="hero-subtitle">
					{msgs.hero_subtitle()}
				</p>

				<div class="hero-feature-list">
					<div class="hero-feature-row">
						<Smile class="hero-feature-icon" size={18} strokeWidth={1.5} />
						<span>{msgs.hero_feature_emotes()}</span>
					</div>
					<div class="hero-feature-row">
						<Monitor class="hero-feature-icon" size={18} strokeWidth={1.5} />
						<span>{msgs.hero_feature_platforms()}</span>
					</div>
					<div class="hero-feature-row">
						<Code class="hero-feature-icon" size={18} strokeWidth={1.5} />
						<span>{msgs.hero_feature_open_source()}</span>
					</div>
				</div>

				<div class="hero-action-stack">
					<div class="hero-actions">
						<DownloadButton />
						<a class="btn-ghost hero-source" href="https://github.com/synthlabs/pepo" target="_blank" rel="noopener">
							<GithubGlyph size={16} /> {msgs.view_source()}
						</a>
					</div>
					<span class="hero-caption">{msgs.hero_status()}</span>
				</div>
			</div>

			<HeroChatMock />
		</section>

		<section class="landing-section features-section" id="features">
			<div class="section-head">
				<h2 class="section-title">{msgs.features_heading()}</h2>
				<p class="section-intro">
					{msgs.features_intro()}
				</p>
			</div>

			<div class="features-grid">
				{#each FEATURES as feature (feature.id)}
					{@const currentItems = feature.items.filter((item) => item.done)}
					{@const plannedItems = feature.items.filter((item) => !item.done)}
					<article class="feature-card">
						<div class="feature-card-head">
							<div class="feature-card-title-row">
								<div class="feature-card-icon">
									{#if feature.id === 'chat'}
										<MessageSquareText size={20} strokeWidth={1.5} aria-hidden="true" />
									{:else if feature.id === 'events'}
										<Activity size={20} strokeWidth={1.5} aria-hidden="true" />
									{:else if feature.id === 'channels'}
										<Users size={20} strokeWidth={1.5} aria-hidden="true" />
									{:else}
										<Code size={20} strokeWidth={1.5} aria-hidden="true" />
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
						<div class="feature-status-groups">
							{#if currentItems.length > 0}
								<div class="feature-status-group">
									<h4 class="feature-status-heading">{msgs.feature_status_now()}</h4>
									<ul class="feature-status-list">
										{#each currentItems as item (item.label)}
											<li class="feature-status-item current">
												<Check class="feature-status-icon" size={14} strokeWidth={2} aria-hidden="true" />
												<span class="feature-status-text">{item.label()}</span>
											</li>
										{/each}
									</ul>
								</div>
							{/if}

							{#if plannedItems.length > 0}
								<div class="feature-status-group planned">
									<h4 class="feature-status-heading">{msgs.feature_status_planned()}</h4>
									<ul class="feature-status-list">
										{#each plannedItems as item (item.label)}
											<li class="feature-status-item planned">
												<Circle class="feature-status-icon" size={8} strokeWidth={1.75} aria-hidden="true" />
												<span class="feature-status-text">{item.label()}</span>
											</li>
										{/each}
									</ul>
								</div>
							{/if}
						</div>
					</article>
				{/each}
			</div>
		</section>

		<section class="landing-section install-section" id="download">
			<div class="section-inner install-inner">
				<h2 class="section-title">{msgs.install_heading()}</h2>
				<p class="install-intro">
					{msgs.install_intro()}
				</p>

				<div class="install-grid">
					{#each PLATFORMS as p (p.id)}
						<div class="f-card install-card">
							<div class="install-card-icon">
								<PlatformGlyph icon={p.icon} size={18} />
							</div>
							<div class="install-card-copy">
								<span class="install-card-title">{p.label}</span>
								<span class="install-card-file">
									{p.file.replace('{v}', '0.2.19')}
								</span>
							</div>
							<a class="btn-ghost install-release" href={RELEASES_URL} aria-label={msgs.install_release_aria()}>
								<Download size={14} strokeWidth={1.75} />
							</a>
						</div>
					{/each}
				</div>

				<div class="build-section">
					<h3 class="build-title">{msgs.build_heading()}</h3>
					<p class="build-intro">
						{msgs.build_intro()}
					</p>
					<div class="code-block">
						<div><span class="c-prompt">$</span> git clone --recurse-submodules https://github.com/synthlabs/pepo.git</div>
						<div><span class="c-prompt">$</span> cd pepo</div>
						<div><span class="c-prompt">$</span> pnpm install</div>
						<div><span class="c-prompt">$</span> pnpm tauri build</div>
						<div class="build-comment"><span class="c-comment"># {msgs.build_comment()}</span></div>
					</div>
				</div>
			</div>
		</section>
	</main>

	<footer class="site-footer">
		<span>{msgs.foot_attribution()}</span>
		<nav class="footer-nav" aria-label="Footer">
			<a href="https://github.com/synthlabs/pepo" target="_blank" rel="noopener">{msgs.foot_github()}</a>
			<a href="https://github.com/synthlabs/pepo/releases" target="_blank" rel="noopener">{msgs.foot_releases()}</a>
			<a href="https://github.com/synthlabs/pepo/issues" target="_blank" rel="noopener">{msgs.foot_issues()}</a>
			<a href="https://github.com/synthlabs" target="_blank" rel="noopener">{msgs.foot_synthlabs()}</a>
		</nav>
	</footer>
</div>
