import { cubicOut } from 'svelte/easing';
import { fly, type FlyParams } from 'svelte/transition';

export function featureMotion(node: HTMLElement, params: FlyParams & { settle?: boolean } = {}) {
	const immediate = params.settle || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	return fly(node, { ...params, duration: immediate ? 0 : 250, easing: cubicOut });
}

export function markPresentation(event: Event, current: boolean) {
	const node = event.currentTarget as HTMLElement;
	node.inert = !current;
	node.setAttribute('aria-hidden', String(!current));
	node.dataset.current = String(current);
	if (node.classList.contains('feature-details')) {
		if (current) node.id = 'demo-feature-details';
		else node.removeAttribute('id');
	}
}
