import type { AxiosError, AxiosInstance } from 'axios';
import axios from 'axios';
import { z } from 'zod';
import type { InferZodType } from '../zod/index';
import { basicResp, postsResp, userResp } from '../zod/index';

type Constructor = { apiKey: string };

/** TikTok API. */
export class TikTokAPI {
  /** API details. */
  private readonly api: {
    /** Host name */
    host: string;
    /** Base URL */
    url: string;
    /** API key */
    key: string;
  };

  /** API endpoints. */
  private endpoints = {
    user: {
      getPosts: {
        url: '/v1/post/user/{userId}/posts',
        urlParams: z.object({ userId: z.string() }),
        queryParams: z.object({
          count: z.number().min(0).max(35),
          offset: z.number().optional(),
          with_pinned_posts: z.string().optional(),
        }),
        response: postsResp,
      },
      getInfo: {
        url: '/v1/user/{userId}',
        urlParams: z.object({ userId: z.string() }),
        queryParams: null,
        response: userResp,
      },
      getUserId: {
        url: '/v1/user/username/{username}',
        urlParams: z.object({ username: z.string() }),
        queryParams: null,
        response: basicResp.extend({
          sec_uid: z.string(),
          uid: z.string(),
        }),
      },
    },
  };

  /** Axios instance for API requests. */
  private axios: AxiosInstance;

  /**
   * Create a new TikTokAPI instance.
   *
   * @param params.apiKey - API key
   */
  constructor({ apiKey }: Constructor) {
    if (!apiKey || apiKey.length === 0) {
      throw new Error('API key is required');
    }

    this.api = {
      host: 'tokapi-mobile-version.p.rapidapi.com',
      url: 'https://tokapi-mobile-version.p.rapidapi.com',
      key: apiKey,
    };

    this.axios = axios.create({
      baseURL: this.api.url,
      headers: {
        'X-RapidAPI-Key': this.api.key,
        'X-RapidAPI-Host': this.api.host,
      },
    });
  }

  /**
   * Transform an endpoint by replacing URL parameters.
   *
   * @param endpoint - API endpoint name
   * @param endpointParams - API endpoint parameters
   * @returns Transformed endpoint
   */
  private static transformEndpoint = (
    endpoint: string,
    endpointParams: InferZodType<z.ZodObject<{ [key: string]: z.ZodString }>> | null,
  ): string => {
    return endpointParams
      ? Object.entries(endpointParams).reduce(
          (curr, [key, value]) => curr.replace(`{${key}}`, value),
          endpoint,
        )
      : endpoint;
  };

  /**
   * Make an API request.
   *
   * @param group - API endpoint group.
   * @param endpoint - API endpoint name.
   * @param urlParams - API endpoint URL parameters.
   * @param queryParams - API endpoint query parameters.
   * @returns - API endpoint response.
   */
  private request: ApiRequest<typeof this.endpoints> = async (
    group,
    endpoint,
    urlParams,
    queryParams,
  ) => {
    try {
      const actualEndpoint = this.endpoints[group][endpoint] as Endpoint;

      const { data } = await this.axios.get(
        TikTokAPI.transformEndpoint(actualEndpoint.url, urlParams),
        {
          params: queryParams,
        },
      );

      if (!data) {
        throw new Error('Failed to get data');
      }

      if (!('status_code' in data) || data.status_code !== 0) {
        throw new Error('Failed to get data - status code is not 0');
      }

      return data;
    } catch (error: unknown) {
      throw new Error((error as AxiosError).response?.statusText || 'Getting data failed');
    }
  };

  /** User API requests. */
  public user: InferApiEndpoint<typeof this.endpoints, 'user'> = {
    /** Get a user's posts */
    getPosts: (...args) => this.request('user', 'getPosts', ...args),
    /** Get a user's profile information */
    getInfo: (...args) => this.request('user', 'getInfo', ...args),
    /** Get a user's ID and sec UID */
    getUserId: (...args) => this.request('user', 'getUserId', ...args),
  };
}

type Endpoint = {
  url: string;
  urlParams: z.ZodObject<{ [key: string]: z.ZodString }> | null;
  queryParams: z.ZodObject<{ [key: string]: z.ZodTypeAny }> | null;
  response: z.ZodObject<{ [key: string]: z.ZodTypeAny }>;
};
type Endpoints = Record<string, Record<string, Endpoint>>;

type ApiRequest<T extends Endpoints> = <G extends keyof T, K extends keyof T[G]>(
  section: G,
  endpoint: K,
  urlParams: InferZodType<T[G][K]['urlParams']>,
  queryParams: InferZodType<T[G][K]['queryParams']>,
) => Promise<InferZodType<T[G][K]['response']>>;

type InferApiEndpoint<T extends Endpoints, G extends keyof T> = {
  [K in keyof T[G]]: (
    urlParams: InferZodType<T[G][K]['urlParams']>,
    queryParams: InferZodType<T[G][K]['queryParams']>,
  ) => Promise<InferZodType<T[G][K]['response']>>;
};
