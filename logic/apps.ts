import * as diskLogic from './disk.js';
import * as lightningService from '../services/lightning-api.js';

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
  compatible: boolean;
};

export type AppQuery = {
  installed?: boolean;
};

export async function get(query: AppQuery, jwt: string): Promise<App[]> {
  let apps = await diskLogic.readAppRegistry();
  const lightningImplementation = await lightningService.getImplementation(jwt);
  // Do all hidden service lookups concurrently
  await Promise.all(
    apps.map(async (app: App) => {
      try {
        app.hiddenService = await diskLogic.readHiddenService(`app-${app.id}`);
      } catch {
        app.hiddenService = '';
      }
      if((app.dependencies.includes("lnd") && lightningImplementation === "c-lightning")
        || (app.dependencies.includes("c-lightning") && lightningImplementation === "lnd")) {
          app.compatible = false;
        } else {
          app.compatible = true;
        }
    }),
  );

  if (query.installed === true) {
    const userFile = await diskLogic.readUserFile();
    const installedApps = userFile.installedApps ?? [];
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

export async function update(id: string): Promise<void> {
  if (!(await isValidAppId(id))) {
    throw new Error('Invalid app id');
  }

  try {
    await diskLogic.writeSignalFile(`app-update-${id}`);
  } catch {
    throw new Error('Could not write the signal file');
  }
}

export function getAvailableUpdates(): Promise<string[]> {
  return diskLogic.readJsonStatusFile<string[]>("app-updates");
}
