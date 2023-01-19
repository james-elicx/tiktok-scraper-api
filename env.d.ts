export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: STRING;

      APPDATA?: string;
      HOME: string;
    }
  }
}
