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

export const PLATFORMS: Platform[] = [
	{ id: 'macos',     label: 'macOS',                  short: 'macOS',   file: 'Pepo_{v}_universal.dmg',    ext: '.dmg',      icon: 'apple' },
	{ id: 'windows',   label: 'Windows',                short: 'Windows', file: 'Pepo_{v}_x64-setup.exe',    ext: '.exe',      icon: 'windows' },
	{ id: 'linux-deb', label: 'Linux — Debian/Ubuntu',  short: 'Linux',   file: 'Pepo_{v}_amd64.deb',        ext: '.deb',      icon: 'linux' },
	{ id: 'linux-rpm', label: 'Linux — Fedora/RHEL',    short: 'Linux',   file: 'Pepo-{v}-1.x86_64.rpm',     ext: '.rpm',      icon: 'linux' },
	{ id: 'linux-app', label: 'Linux — AppImage',       short: 'Linux',   file: 'Pepo_{v}_amd64.AppImage',   ext: '.AppImage', icon: 'linux' }
];

export const RELEASES_URL = 'https://github.com/synthlabs/pepo/releases/latest';
export const RELEASES_API = 'https://api.github.com/repos/synthlabs/pepo/releases/latest';

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

export function releaseAssetUrl(version: string, filename: string): string {
	return `https://github.com/synthlabs/pepo/releases/download/v${version}/${filename}`;
}

export function hrefFor(p: Platform, version: string | null): string {
	if (!version) return RELEASES_URL;
	return releaseAssetUrl(version, p.file.replace('{v}', version));
}
