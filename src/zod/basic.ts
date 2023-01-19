import { z } from 'zod';

export const basicResp = z.object({
  extra: z.object({
    fatal_item_ids: z.array(z.string()).optional(),
    logid: z.string().optional(),
    now: z.number(),
  }),
  log_pb: z.object({
    impr_id: z.string(),
  }),
  status_code: z.number(),
});

export const imageUri = z.object({
  uri: z.string(),
  url_list: z.array(z.string()),
});

export const imageUriDims = imageUri.extend({
  width: z.number(),
  height: z.number(),
});
export const shareInfo = z.object({
  bool_persist: z.number(),
  now_invitation_card_image_urls: z.array(z.string()).nullable(),
  share_desc: z.string(),
  share_desc_info: z.string(),
  share_image_url: imageUri,
  share_title: z.string(),
  share_title_myself: z.string(),
  share_title_other: z.string(),
  share_url: z.string(),
});
