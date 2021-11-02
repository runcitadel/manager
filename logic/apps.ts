import * as diskLogic from './disk.js';

export type App = {
  id: string;
  category: string;
  name: string;
  version: string;
  tagline: string;
  description: string;
  developer: string;
  website: string;
  dependencies: string[];
  repo: string;
  support: string;
  port: number;
  gallery: string[];
  path: string;
  defaultPassword: string;
  hiddenService?: string;
  installed?: boolean;
};

export type AppQuery = {
  installed?: boolean;
};

export async function get(query: AppQuery): Promise<App[]> {
  let apps = await diskLogic.readAppRegistry();

  // Do all hidden service lookups concurrently
  await Promise.all(
    apps.map(async (app: App) => {
      try {
        app.hiddenService = await diskLogic.readHiddenService(`app-${app.id}`);
      } catch {
        app.hiddenService = '';
      }
    }),
  );

  if (query.installed === true) {
    const installedApps = (await diskLogic.readUserFile()).installedApps ?? [];
    apps = apps.filter((app: App) => installedApps.includes(app.id));
  }

  return apps;
}

async function isValidAppId(id: string): Promise<boolean> {
  if (!id) {
    return false;
  }

  const appRegExp = /^[a-z\d-]+$/;
  return appRegExp.test(id);
}

export async function install(id: string): Promise<void> {
  if (!(await isValidAppId(id))) {
    throw new Error('Invalid app id');
  }

  try {
    await diskLogic.writeSignalFile(`app-install-${id}`);
  } catch {
    throw new Error('Could not write the signal file');
  }
}

export async function uninstall(id: string): Promise<void> {
  if (!(await isValidAppId(id))) {
    throw new Error('Invalid app id');
  }

  try {
    await diskLogic.writeSignalFile(`app-uninstall-${id}`);
  } catch {
    throw new Error('Could not write the signal file');
  }
}
