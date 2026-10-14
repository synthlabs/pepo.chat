import { m as msgs } from '$lib/paraglide/messages';

export type FeatureId = 'chat' | 'channels' | 'app' | 'events';
export type FeatureTriggerId = 'emotes' | 'channels' | 'app' | 'replies' | 'events' | 'notifications';

export interface FeatureDetails {
	side: 'left' | 'right';
	title: () => string;
	intro: () => string;
	available: readonly (() => string)[];
	planned: readonly (() => string)[];
}

export interface FeatureTrigger {
	id: FeatureTriggerId;
	feature: FeatureId;
	label: () => string;
	n?: number;
}

export const FEATURES: Record<FeatureId, FeatureDetails> = {
	chat: {
		side: 'right',
		title: msgs.feature_group_chat_label,
		intro: msgs.feature_group_chat_blurb,
		available: [msgs.hero_feature_emotes],
		planned: [msgs.feature_chat_reply_threads, msgs.feature_chat_history, msgs.feature_chat_decorations]
	},
	channels: {
		side: 'left',
		title: msgs.feature_group_channels_label,
		intro: msgs.feature_group_channels_blurb,
		available: [msgs.feature_channels_following, msgs.feature_channels_live_sorting],
		planned: [msgs.feature_channels_favorites, msgs.feature_channels_live_notifications, msgs.feature_channels_groups]
	},
	app: {
		side: 'left',
		title: msgs.feature_group_app_label,
		intro: msgs.feature_group_app_blurb,
		available: [msgs.hero_feature_platforms, msgs.hero_feature_open_source, msgs.feature_app_autoupdater],
		planned: [msgs.feature_app_appearance, msgs.feature_app_mentions, msgs.feature_app_accounts, msgs.feature_app_youtube]
	},
	events: {
		side: 'right',
		title: msgs.feature_group_events_label,
		intro: msgs.feature_group_events_blurb,
		available: [],
		planned: [msgs.feature_events_activity, msgs.feature_events_moderation, msgs.feature_events_deleted_messages, msgs.feature_events_support_activity]
	}
};

export const SHIPPED_CALLOUTS: readonly FeatureTrigger[] = [
	{ id: 'emotes', feature: 'chat', n: 1, label: msgs.demo_callout_emotes },
	{ id: 'channels', feature: 'channels', n: 2, label: msgs.demo_callout_channels },
	{ id: 'app', feature: 'app', n: 3, label: msgs.demo_callout_app }
];

export const PLANNED_CALLOUTS: readonly FeatureTrigger[] = [
	{ id: 'replies', feature: 'chat', label: msgs.demo_planned_replies },
	{ id: 'events', feature: 'events', label: msgs.demo_planned_events },
	{ id: 'notifications', feature: 'app', label: msgs.demo_planned_notifications }
];

export const FEATURE_CALLOUTS = [...SHIPPED_CALLOUTS, ...PLANNED_CALLOUTS];
