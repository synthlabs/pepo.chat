export type PlatformId =
	| 'macos'
	| 'windows'
	| 'linux-deb'
	| 'linux-rpm'
	| 'linux-app';

export type PlatformIcon = 'apple' | 'windows' | 'linux';

export interface Platform {
	id: PlatformId;
	label: string;
	short: string;
	file: string;
	ext: string;
	icon: PlatformIcon;
}

export interface ReleaseAsset {
	name: string;
	url: string;
}

export type ReleaseAssetMap = Partial<Record<PlatformId, ReleaseAsset>>;

export type ReleaseState =
	| { status: 'loading' }
	| { status: 'ready'; assets: ReleaseAssetMap }
	| { status: 'error' };

export const PLATFORMS: Platform[] = [
	{ id: 'macos',     label: 'macOS',                  short: 'macOS',   file: 'Pepo_{v}_universal.dmg',    ext: '.dmg',      icon: 'apple' },
	{ id: 'windows',   label: 'Windows',                short: 'Windows', file: 'Pepo_{v}_x64-setup.exe',    ext: '.exe',      icon: 'windows' },
	{ id: 'linux-deb', label: 'Linux — Debian/Ubuntu',  short: 'Linux',   file: 'Pepo_{v}_amd64.deb',        ext: '.deb',      icon: 'linux' },
	{ id: 'linux-rpm', label: 'Linux — Fedora/RHEL',    short: 'Linux',   file: 'Pepo-{v}-1.x86_64.rpm',     ext: '.rpm',      icon: 'linux' },
	{ id: 'linux-app', label: 'Linux — AppImage',       short: 'Linux',   file: 'Pepo_{v}_amd64.AppImage',   ext: '.AppImage', icon: 'linux' }
];

export const RELEASES_URL = 'https://github.com/synthlabs/pepo/releases/latest';
export const RELEASES_API = 'https://api.github.com/repos/synthlabs/pepo/releases/latest';

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matcherFor(template: string): RegExp {
	const [prefix, suffix] = template.split('{v}');
	return new RegExp(`^${escapeRegExp(prefix)}.+${escapeRegExp(suffix)}$`);
}

export function resolveReleaseAssets(payload: unknown): ReleaseAssetMap {
	if (!payload || typeof payload !== 'object' || !Array.isArray((payload as { assets?: unknown }).assets)) {
		throw new Error('GitHub release payload is missing assets');
	}

	const githubAssets = (payload as { assets: unknown[] }).assets.flatMap((asset) => {
		if (!asset || typeof asset !== 'object') return [];
		const { name, browser_download_url: url } = asset as {
			name?: unknown;
			browser_download_url?: unknown;
		};
		return typeof name === 'string' && typeof url === 'string' ? [{ name, url }] : [];
	});

	return Object.fromEntries(
		PLATFORMS.flatMap((platform) => {
			const asset = githubAssets.find(({ name }) => matcherFor(platform.file).test(name));
			return asset ? [[platform.id, asset]] : [];
		})
	) as ReleaseAssetMap;
}

export async function fetchLatestReleaseAssets(signal?: AbortSignal): Promise<ReleaseAssetMap> {
	const response = await fetch(RELEASES_API, {
		headers: { Accept: 'application/vnd.github+json' },
		signal
	});
	if (!response.ok) throw new Error(`GitHub releases request failed with ${response.status}`);
	return resolveReleaseAssets(await response.json());
}

export function detectPlatform(): PlatformId {
	if (typeof navigator === 'undefined') return 'macos';
	const ua = (navigator.userAgent || '').toLowerCase();
	const plat = (navigator.platform || '').toLowerCase();
	if (/mac|iphone|ipad/.test(plat) || /mac os x/.test(ua)) return 'macos';
	if (/win/.test(plat) || /windows/.test(ua)) return 'windows';
	if (/linux/.test(plat) || /linux/.test(ua)) {
		if (/fedora|rhel|centos/.test(ua)) return 'linux-rpm';
		return 'linux-deb';
	}
	return 'macos';
}
