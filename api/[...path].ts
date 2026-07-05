import { createApp } from '../server';

let appPromise: ReturnType<typeof createApp> | null = null;

export default async function handler(req: any, res: any) {
  appPromise ??= createApp({ mountFrontend: false });
  const app = await appPromise;
  return app(req, res);
}
