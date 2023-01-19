/* eslint-disable no-await-in-loop */
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { Database } from '../utils/index';
import type { InferZodType, postsResp } from '../zod/index';
import { TikTokAPI } from './tiktok-api';

// App data location
const appData = path.join(
  process.env.APPDATA ||
    (process.platform === 'darwin'
      ? path.join(process.env.HOME, '/Library/Application Support')
      : path.join(process.env.HOME, '/.local/share')),
  'tiktok-scraper',
);

type Constructor = { dir?: string };

/** TikTok scraper. */
export class TikTokScraper {
  /** TikTok API instance. */
  private api: TikTokAPI;

  /** Sqlite3 database instance. */
  public readonly db: Database;

  /** Directories to save data to. */
  private readonly dir: {
    /** Directory to store data in */
    data: string;
    /** Path name for the database */
    db: string;
    /** Directory to store scraped user data in */
    users: string;
  };

  /**
   * Create a new TikTokScraper instance.
   *
   * @param args.dir - Directory to save data to
   */
  constructor({ dir = appData }: Constructor) {
    this.api = new TikTokAPI({ apiKey: process.env.API_KEY });

    this.dir = {
      data: path.join(dir, 'data'),
      db: path.join(dir, 'data', 'db.sqlite3'),
      users: path.join(dir, 'data', 'users'),
    };

    this.checkDir();
    this.checkDir('users');

    this.db = new Database({ path: this.dir.db });
  }

  /**
   * Check a directory exists, if not create it.
   *
   * @param dir - Directory to check
   * @returns Path to directory
   */
  public checkDir = (dir?: string): string => {
    const location = dir ? path.join(this.dir.data, dir) : this.dir.data;

    if (!fs.existsSync(location)) {
      fs.mkdirSync(location, { recursive: true });
    }

    return location;
  };

  /**
   * Resolve the user ID for a given username, sec UID or user ID.
   *
   * @param username - Username, Sec UID or User ID
   * @returns User ID
   */
  public resolveUserId = async (username: string): Promise<string> => {
    if (!Number.isNaN(Number(username))) {
      return username;
    }

    const user = await this.db.getUser(username.length < 30 ? 'uniqueName' : 'secUid', username);
    if (user) return user.user_id;

    return (await this.api.user.getUserId({ username }, null)).uid;
  };

  /**
   * Download a post's video.
   *
   * @param post - Post object
   * @returns Path to downloaded video
   */
  public downloadPost = async (
    post: InferZodType<typeof postsResp>['aweme_list'][0],
  ): Promise<string> => {
    const { author, aweme_id: id, video } = post;

    if (!video || !id || !author) {
      throw new Error('Video not found');
    }

    const {
      play_addr: { url_list: playUrls } = {},
      download_addr: { url_list: downloadUrls } = {},
    } = video;
    const url = playUrls?.[0] ?? downloadUrls?.[0];

    if (!url) {
      throw new Error('Video url not found');
    }

    const pathName = path.join(
      this.checkDir(path.join('users', author.unique_id, 'videos')),
      `${id}.mp4`,
    );

    if (fs.existsSync(pathName)) {
      throw new Error('File already exists');
    }

    return this.downloadVideo(url, pathName, id);
  };

  /**
   * Download multiple posts' videos.
   *
   * @param posts - Array of posts
   */
  public downloadPosts = async (
    posts: InferZodType<typeof postsResp>['aweme_list'],
  ): Promise<void> => {
    const p = {
      downloaded: 0,
      skipped: 0,
      failed: 0,
    };

    let authorName = '';

    // eslint-disable-next-line no-restricted-syntax
    for (const post of posts) {
      if (authorName.length === 0) {
        await this.db.updateUser({
          userId: post.author.uid,
          uniqueName: post.author.unique_id,
          secUid: post.author.sec_uid,
          enabled: true,
        });

        authorName = post.author.unique_id;
      }

      try {
        await this.downloadPost(post);

        await this.db.updatePost({
          postId: post.aweme_id,
          userId: post.author.uid,
          downloaded: true,
        });

        p.downloaded++;
      } catch (err) {
        if (err instanceof Error && err.message.includes('File already exists')) {
          console.log(`Already downloaded ${post.aweme_id}`);
          p.skipped++;
        } else {
          await this.db.updatePost({
            postId: post.aweme_id,
            userId: post.author.uid,
            downloaded: false,
            error: err instanceof Error ? err.message : 'Unknown error while downloading post',
          });

          p.failed++;
        }
      }
    }

    if (posts.length > 0) {
      fs.writeFileSync(
        path.join(
          this.checkDir(path.join('users', authorName, 'json')),
          `posts-${new Date().valueOf()}.json`,
        ),
        JSON.stringify(posts),
      );

      console.log(
        `Downloaded ${p.downloaded + p.skipped}/${posts.length} posts from ${authorName}`,
      );
      console.log(
        `Saved: ${p.downloaded}/${posts.length}. Skipped: ${p.skipped}/${posts.length}. Failed: ${p.failed}/${posts.length}`,
      );

      const [mostRecentPost] = posts.sort((a, b) => b.aweme_id.localeCompare(a.aweme_id));
      if (mostRecentPost) {
        await this.db.updateLastScraped({
          userId: mostRecentPost.author.uid,
          postId: mostRecentPost.aweme_id,
          timestamp: new Date(),
        });
      }
    }
  };

  /**
   * Scrape a user's posts.
   *
   * @param userId - User ID
   * @param passedLatestPostId - Overriden latest post ID
   * @returns Array of posts
   */
  public scrapeUserPosts = async (
    userId: string,
    passedLatestPostId?: string,
  ): Promise<InferZodType<typeof postsResp>['aweme_list']> => {
    const posts: InferZodType<typeof postsResp>['aweme_list'] = [];
    let offset = 0;

    let latestPostId: number | undefined;

    if (passedLatestPostId) {
      latestPostId = parseInt(passedLatestPostId, 10);
    } else {
      const lastScraped = await this.db.getLastScraped(userId);

      if (lastScraped) {
        latestPostId = parseInt(lastScraped.post_id, 10);
      }
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
      process.stdout.write(`Finding new posts: ${posts.length}\r`);
      const resp = await this.api.user.getPosts({ userId }, { count: 35, offset });

      const { aweme_list: awemeList, has_more: hasMore, max_cursor: maxCursor } = resp;

      if (!awemeList) {
        console.log('No new posts found for user', resp);
        break;
      }

      // @ts-expect-error - what kind of retarded language server thinks latestPostId would be undefined when it needs to be truthy
      if (!!latestPostId && awemeList.some((post) => parseInt(post.aweme_id, 10) <= latestPostId)) {
        // @ts-expect-error - what kind of retarded language server thinks latestPostId would be undefined when it needs to be truthy
        posts.push(...awemeList.filter((post) => parseInt(post.aweme_id, 10) > latestPostId));
        break;
      }

      posts.push(...awemeList);

      if (!hasMore) break;

      offset = maxCursor;
    }

    console.log(`Found ${posts.length} new posts for user`);

    return posts;
  };

  /**
   * Download a video.
   *
   * @param url - Video URL
   * @param pathName - Path name to save the video to
   * @param prettyName - Pretty name for the video for logging
   * @returns Path name for the downloaded video
   */
  // eslint-disable-next-line class-methods-use-this
  private downloadVideo = async (
    url: string,
    pathName: string,
    prettyName?: string,
  ): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const stream = fs.createWriteStream(pathName, { autoClose: true });

      stream.on('finish', () => {
        process.stdout.write(`Finished downloading ${prettyName ?? 'video'}\n`);
        stream.close();
        resolve(pathName);
      });
      stream.on('error', (err) => {
        process.stdout.write(`Failed downloading ${prettyName ?? 'video'}\n`);
        stream.close();
        reject(err);
      });

      axios({
        method: 'GET',
        url,
        responseType: 'stream',
      }).then(({ data, headers }) => {
        const contentLength = headers['content-length'] ?? '14000000';
        let downloaded = 0;

        data.on('data', (chunk: Buffer) => {
          downloaded += chunk.length;
          const percent = Math.floor((downloaded / Number(contentLength)) * 100);
          process.stdout.write(`Downloading ${prettyName ?? 'video'}: ${percent}%\r`);
        });

        data.pipe(stream);
      });
    });
  };
}
