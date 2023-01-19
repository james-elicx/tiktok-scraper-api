import sqlite3 from 'sqlite3';

type UpdatePostProps = {
  postId: string;
  userId: string;
  downloaded?: boolean;
  error?: string;
};

type UpdateLastScrapedProps = {
  postId: string;
  userId: string;
  timestamp?: Date;
};

type UpdateUserProps = {
  userId: string;
  uniqueName?: string;
  secUid?: string;
  enabled?: boolean;
};

type Constructor = { path: string };

/** Database. */
export class Database {
  /** Path name for the database file. */
  private path: string;

  /** Sqlite3 database instance. */
  private db: sqlite3.Database;

  /**
   * Create a new Database instance.
   *
   * @param args.path Path name for the database file
   */
  constructor({ path }: Constructor) {
    this.path = path;

    this.db = new sqlite3.Database(this.path);
    this.setupTables();
  }

  /**
   * Setup the database tables.
   */
  private setupTables = () => {
    // Users table
    this.db.run(
      `CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(50) NOT NULL,
        unique_name VARCHAR(50) NOT NULL UNIQUE,
        sec_uid VARCHAR(100) NOT NULL UNIQUE,
        enabled INTEGER NOT NULL DEFAULT 1,
        PRIMARY KEY (user_id)
      )`,
    );

    // Posts table
    this.db.run(
      `CREATE TABLE IF NOT EXISTS posts (
        post_id VARCHAR(50) NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        downloaded INTEGER NOT NULL DEFAULT 1,
        error TEXT,
        PRIMARY KEY (post_id),
        FOREIGN KEY (user_id) REFERENCES users (user_id)
      )`,
    );

    // Last scraped table
    this.db.run(
      `CREATE TABLE IF NOT EXISTS last_scraped (
        user_id VARCHAR(50) NOT NULL,
        post_id VARCHAR(50) NOT NULL,
        timestamp DATETIME NOT NULL,
        PRIMARY KEY (user_id),
        FOREIGN KEY (user_id) REFERENCES users (user_id),
        FOREIGN KEY (post_id) REFERENCES posts (post_id)
      )`,
    );
  };

  /**
   * Update a user.
   *
   * @param args.userId User ID
   * @param args.uniqueName Unique name
   * @param args.secUid Sec UID
   * @returns If the user was updated
   */
  public updateUser = ({ userId, uniqueName, secUid, enabled = true }: UpdateUserProps) => {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO users (
            user_id, unique_name, sec_uid, enabled
          ) VALUES (
            $userId, $uniqueName, $secUid, $enabled
          ) ON CONFLICT (user_id) DO UPDATE SET
            enabled = $enabled
          WHERE users.user_id = $userId`,
        {
          $userId: userId,
          $uniqueName: uniqueName,
          $secUid: secUid,
          $enabled: enabled ? 1 : 0,
        },
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        },
      );
    });
  };

  /**
   * Get a user.
   *
   * @param type Type of user identifier
   * @param userId User identifier
   * @returns User object
   */
  public getUser = (type: 'userId' | 'uniqueName' | 'secUid', userId: string) => {
    const colName = { userId: 'user_id', uniqueName: 'unique_name', secUid: 'sec_uid' };

    return new Promise<{
      user_id: string;
      unique_name: string;
      sec_uid: string;
      enabled: number;
    } | null>((resolve, reject) => {
      this.db.get(
        `SELECT * FROM users WHERE ${colName[type]} = $${type}`,
        {
          [`$${type}`]: userId,
        },
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ?? null);
          }
        },
      );
    });
  };

  /**
   * Update a post.
   *
   * @param args.postId Post ID
   * @param args.userId User ID
   * @param args.downloaded If the post was downloaded
   * @param args.error Error message
   * @returns If the post was updated
   */
  public updatePost = ({ postId, userId, downloaded = true, error }: UpdatePostProps) => {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO posts (
          post_id, user_id, downloaded, error
        ) VALUES (
          $postId, $userId, $downloaded, $error
        ) ON CONFLICT (post_id) DO UPDATE SET
          downloaded = $downloaded, error = $error
        WHERE posts.post_id = $postId`,
        {
          $postId: postId,
          $userId: userId,
          $downloaded: downloaded ? 1 : 0,
          $error: error ?? null,
        },
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        },
      );
    });
  };

  /**
   * Update the last scraped post for a user.
   *
   * @param args.postId Post ID
   * @param args.userId User ID
   * @param args.timestamp Timestamp
   * @returns If the last scraped post was updated
   */
  public updateLastScraped = ({
    postId,
    userId,
    timestamp = new Date(),
  }: UpdateLastScrapedProps) => {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO last_scraped (
          post_id, user_id, timestamp
        ) VALUES (
          $postId, $userId, $timestamp
        )`,
        {
          $postId: postId,
          $userId: userId,
          $timestamp: timestamp,
        },
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        },
      );
    });
  };

  /**
   * Get the last scraped post for a user.
   *
   * @param userId User ID
   * @returns Last scraped post object
   */
  public getLastScraped = (userId: string) => {
    return new Promise<{ user_id: string; post_id: string; timestamp: string } | null>(
      (resolve, reject) => {
        this.db.get(
          `SELECT * FROM last_scraped WHERE user_id = $userId ORDER BY timestamp DESC LIMIT 1`,
          {
            $userId: userId,
          },
          (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row ?? null);
            }
          },
        );
      },
    );
  };
}
