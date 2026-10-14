<script lang="ts">
	import { onMount } from 'svelte';
	import { Code, Heart, Monitor, ShieldCheck, Smile } from 'lucide-svelte';
	import DownloadButton from '$lib/components/DownloadButton.svelte';
	import HeroChatMock from '$lib/components/HeroChatMock.svelte';
	import InstallPanel from '$lib/components/InstallPanel.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import AppWindowDemo from '$lib/components/demo/AppWindowDemo.svelte';
	import GithubGlyph from '$lib/glyphs/GithubGlyph.svelte';
	import { fetchLatestReleaseAssets, type ReleaseState } from '$lib/platform';
	import { m as msgs } from '$lib/paraglide/messages';

	let releaseState: ReleaseState = $state({ status: 'loading' });

	onMount(() => {
		const controller = new AbortController();
		void fetchLatestReleaseAssets(controller.signal)
			.then((assets) => (releaseState = { status: 'ready', assets }))
			.catch(() => {
				if (!controller.signal.aborted) releaseState = { status: 'error' };
			});

		return () => controller.abort();
	});
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
						<DownloadButton {releaseState} />
						<a class="btn-ghost hero-source" href="https://github.com/synthlabs/pepo" target="_blank" rel="noopener">
							<GithubGlyph size={16} /> {msgs.view_source()}
						</a>
					</div>
					<div class="hero-assurances">
						<span class="hero-assurance">
							<ShieldCheck size={13} strokeWidth={1.5} aria-hidden="true" />
							{msgs.hero_chip_updates()}
						</span>
						<span class="hero-assurance">
							<Code size={13} strokeWidth={1.5} aria-hidden="true" />
							{msgs.hero_chip_stack()}
						</span>
						<span class="hero-assurance">
							<Heart size={13} strokeWidth={1.5} aria-hidden="true" />
							{msgs.hero_chip_unaffiliated()}
						</span>
					</div>
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

			<div class="demo-wrap">
				<AppWindowDemo />
			</div>
		</section>

		<section class="landing-section install-section" id="download">
			<div class="section-inner">
				<div class="section-head">
					<h2 class="section-title">{msgs.install_heading()}</h2>
					<p class="install-intro">
						{msgs.install_intro()}
					</p>
				</div>

				<InstallPanel {releaseState} />
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
