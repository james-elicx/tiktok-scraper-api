import { z } from 'zod';
import { basicResp, imageUri, shareInfo } from './basic';

export const user = z.object({
  account_region: z.string().optional(),
  account_type: z.number(),
  ad_virtual: z.boolean(),
  analytics_status: z.boolean().optional(),
  apple_account: z.number().optional(),

  aweme_count: z.number(),
  bio_secure_url: z.string(),
  bio_url: z.string(),
  bind_phone: z.string(),

  commerce_user_info: z.object({
    ad_revenue_rits: z.array(z.object({})),
    show_star_atlas_cooperation: z.boolean(),
    star_atlas: z.number(),
  }),
  commerce_user_level: z.number(),
  custom_verify: z.string(),
  enterprise_verify_reason: z.string(),
  cover_url: z.array(imageUri).optional(),

  favoriting_count: z.number(),
  follow_status: z.number(),
  follower_status: z.number(),
  followers_detail: z.array(z.object({})).optional(),
  forward_count: z.number(),
  hide_following_follower_list: z.number().optional(),

  ins_id: z.string(),
  is_block: z.boolean(),
  is_blocked: z.boolean(),
  is_effect_artist: z.boolean(),
  is_pro_account: z.boolean().optional(),
  is_star: z.boolean(),
  iso_country_code: z.string().optional(),
  item_list: z.array(z.object({})).optional(),
  live_commerce: z.boolean(),
  live_push_notification_status: z.number(),
  message_chat_entry: z.boolean(),

  privacy_setting: z.object({
    following_visibility: z.number(),
  }),
  profile_tab_type: z.number(),
  qa_status: z.number(),
  recommend_reason_relation: z.string(),

  room_id: z.number(),
  secret: z.number(),
  share_info: shareInfo,
  share_qrcode_uri: z.string().optional(),
  short_id: z.string(),
  show_favorite_list: z.boolean(),
  signature_language: z.string(),
  story_status: z.number(),
  supporting_ngo: z.object({}),
  tab_settings: z.object({
    private_tab: z.object({
      private_tab_style: z.number(),
      show_private_tab: z.boolean(),
    }),
  }),
  verification_type: z.number(),
  video_icon: imageUri,
  watch_status: z.boolean(),
  with_commerce_enterprise_tab_entry: z.boolean(),
  with_commerce_entry: z.boolean(),
  with_new_goods: z.boolean(),

  avatar_168x168: imageUri,
  avatar_300x300: imageUri,
  avatar_larger: imageUri,
  avatar_medium: imageUri,
  avatar_thumb: imageUri,
  avatar_uri: z.string(),

  mplatform_followers_count: z.number(),
  original_musician: z.object({
    digg_count: z.number(),
    music_count: z.number(),
    music_used_count: z.number(),
  }),

  follower_count: z.number(),
  following_count: z.number(),
  total_favorited: z.string(),

  sec_uid: z.string(),
  uid: z.string(),
  unique_id: z.string(),
  unique_id_modify_time: z.number(),
  nickname: z.string(),
  twitter_id: z.string(),
  signature: z.string(),
  twitter_name: z.string(),
  youtube_channel_id: z.string(),
  youtube_channel_title: z.string(),
});

export const userResp = basicResp.extend({
  user,
});
