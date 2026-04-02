/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set on Vercel when the API is a separate deployment, e.g. `https://your-api.vercel.app` */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
