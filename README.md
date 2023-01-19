# TikTok Scraper + API Wrapper

This is a simple API wrapper and scraper for use with [Somjik's TikTok mobile API](https://rapidapi.com/Sonjik/api/tokapi-mobile-version).

## Installation

To get started, you will need to install [Node.js](https://nodejs.org/en/) and [Yarn](https://yarnpkg.com/).

Then, clone the repository and install the dependencies.

```bash
git clone https://github.com/james-elicx/tiktok-scraper-api
cd tiktok-scraper-api

yarn install
```

## Usage

To use the API wrapper or scraper, you will need to create a `.env` file in the root directory with the following variables:

```bash
API_KEY=<your rapidapi key>
```

### Scraper

The scraper is located in `src/libs/tiktok-scraper.ts`. It is a simple scraper that uses the API wrapper.

Run the program with `yarn start` to see the available arguments.

```bash
TikTok Scraper v1.0.0

Available arguments:

  User Posts - Scrape a user's posts
    --posts, -P <username | user id>
  Data Path - Directory to save scraped data
    --path, -D <path>
```

##### Example - Scrape User Posts

```bash
yarn start --posts tiktok --path ./scraped/
```

### API Wrapper

The API wrapper is located in `src/libs/tiktok-api.ts`. It is a simple wrapper around [Somjik's TikTok mobile API](https://rapidapi.com/Sonjik/api/tokapi-mobile-version) and is not affiliated with Somjik or TikTok in any way.

##### Implemented Endpoints

- [x] Get user posts (`/v1/post/user/{userId}/posts` -> `user.getPosts`)
- [x] Get user info (`/v1/user/{userId}` -> `user.getInfo`)
- [x] Get user ID (`/v1/user/username/{username}` -> `user.getUserId`)
