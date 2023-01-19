import { join } from 'path';
import * as dotenv from 'dotenv';
import { TikTokScraper } from './libs/index';
import type { Arg } from './utils/index';
import { cli } from './utils/index';

dotenv.config();

const cliArgs: Arg[] = [
  {
    type: 'text',
    entry: true,
    required: false,
    key: 'posts',
    alternativeKey: 'P',
    placeholder: 'username | user id',
    name: 'User Posts',
    desc: "Scrape a user's posts",
    needs: ['path'],
  },
  {
    type: 'text',
    entry: false,
    required: false,
    key: 'path',
    alternativeKey: 'D',
    placeholder: 'path',
    name: 'Data Path',
    desc: 'Directory to save scraped data',
  },
];

const parsedCliArgs = cli.parseArgs(cliArgs);

switch (parsedCliArgs['_entry']) {
  case 'posts': {
    const scraper = new TikTokScraper({
      dir: join(process.cwd(), parsedCliArgs['path'] as string),
    });

    const username = parsedCliArgs['posts'] as string;

    const userId = await scraper.resolveUserId(username);

    const resp = await scraper.scrapeUserPosts(userId);
    await scraper.downloadPosts(resp);

    break;
  }
  default: {
    cli.helpMenu(cliArgs);
    process.exit(1);
  }
}
