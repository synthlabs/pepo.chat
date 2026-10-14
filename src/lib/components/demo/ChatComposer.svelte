<script lang="ts">
	import { SendHorizontal, Smile } from 'lucide-svelte';
	import type { EmoteName } from '$lib/chat/mock-chat';
	import { m as msgs } from '$lib/paraglide/messages';
	import EmotePicker from './EmotePicker.svelte';

	let {
		input,
		pickerOpen,
		pickerQuery,
		pickerEmotes,
		selectedEmote,
		oninput,
		onsend,
		ontogglepicker,
		onpickerquery,
		onpickerkeydown,
		onpickerselect
	}: {
		input: string;
		pickerOpen: boolean;
		pickerQuery: string;
		pickerEmotes: EmoteName[];
		selectedEmote: number;
		oninput: (value: string) => void;
		onsend: () => void;
		ontogglepicker: () => void;
		onpickerquery: (value: string) => void;
		onpickerkeydown: (event: KeyboardEvent) => void;
		onpickerselect: (name: EmoteName) => void;
	} = $props();
</script>

<div class="demo-composer">
	{#if pickerOpen}
		<div class="picker-anchor">
			<EmotePicker
				query={pickerQuery}
				emotes={pickerEmotes}
				selected={selectedEmote}
				onquery={onpickerquery}
				onkeydown={onpickerkeydown}
				onselect={onpickerselect}
			/>
		</div>
	{/if}

	<form onsubmit={(e) => { e.preventDefault(); onsend(); }}>
		<input
			type="text"
			value={input}
			oninput={(e) => oninput(e.currentTarget.value)}
			placeholder={msgs.demo_composer_placeholder()}
			aria-label={msgs.demo_composer_placeholder()}
		/>
		<button
			class="picker-trigger"
			type="button"
			onclick={ontogglepicker}
			aria-expanded={pickerOpen}
			aria-controls={pickerOpen ? 'demo-emote-picker' : undefined}
			aria-label={msgs.demo_picker_toggle()}
			title={msgs.demo_picker_toggle()}
		>
			<Smile size={16} strokeWidth={1.75} aria-hidden="true" />
		</button>
		<button class="send" type="submit">
			<SendHorizontal size={14} strokeWidth={1.75} aria-hidden="true" />
			<span>{msgs.demo_composer_send()}</span>
		</button>
	</form>
</div>

<style>
	.demo-composer {
		border-top: 1px solid hsl(var(--border));
		flex-shrink: 0;
		position: relative;
	}

	.picker-anchor {
		bottom: calc(100% + 6px);
		inset-inline: 10px;
		position: absolute;
		z-index: 30;
	}

	form {
		align-items: center;
		display: flex;
		gap: 6px;
		padding: 10px;
	}

	form input {
		background: hsl(var(--content-primary));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius);
		color: hsl(var(--foreground));
		flex: 1;
		font-size: 13px;
		min-width: 0;
		padding: 7px 10px;
	}

	form input::placeholder {
		color: hsl(var(--muted-foreground));
	}

	.picker-trigger,
	.send {
		align-items: center;
		background: transparent;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius);
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		display: inline-flex;
		flex: 0 0 auto;
		gap: 6px;
		height: 32px;
		justify-content: center;
		padding: 0 10px;
	}

	.picker-trigger:hover,
	.picker-trigger[aria-expanded='true'] {
		border-color: hsl(var(--c-pepo));
		color: hsl(var(--c-pepo));
	}

	.send {
		border-color: transparent;
		color: hsl(var(--primary-foreground));
		background: hsl(var(--primary));
		font-size: 12.5px;
		font-weight: 500;
		padding: 0 12px;
	}

	.send:hover {
		background: hsl(263.4 70% 45%);
	}
</style>
