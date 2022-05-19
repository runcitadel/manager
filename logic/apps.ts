import * as lightningService from '../services/lightning-api.js';
import * as diskLogic from './disk.js';

/** A dependency an app could have */
export type Dependency = 'bitcoind' | 'electrum' | 'lnd' | 'c-lightning';

export type App = {
  /** The id of the app, the name as a simple string without spaces */
  id: string;
  /** A category for the app, used for grouping apps on the dashboard */
  category: string;
  /** The name of the app */
  name: string;
  /** The version of the app */
  version: string;
  /** A One line description of the app (max 50 characters) */
  tagline: string;
  /** A longer description of the app (50 to 200 words) */
  description: string;
  /** The person(s) who created the app */
  developer?: string;
  /** The person(s) who created the app */
  developers?: Record<string, string>;
  /** The dependencies of the app */
  dependencies: Array<Dependency | Dependency[]>;
  /** The url to the app's Git repository */
  repo: string | Record<string, string>;
  /** The url to the app's support website/chat */
  support: string;
  /** The port the app's web UI uses */
  port: number;
  /** A list of links to app promotional images, if no domain is provided, https://runcitadel.github.io/old-apps-gallery/${app.id}/ will be put in front of the path */
  gallery: string[];
  /** The path of the app the open button should open */
  path: string;
  /** The app's default password */
  defaultPassword: string;
  /** Automatically added */
  hiddenService?: string;
  /** Automatically added */
  installed?: boolean;
  /** Automatically added */
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

      app.dependencies = app.dependencies || [];

      for (const dependency of app.dependencies) {
        if (typeof dependency === 'string') {
          if (
            (dependency === 'c-lightning' &&
              lightningImplementation === 'lnd') ||
            (dependency === 'lnd' && lightningImplementation === 'c-lightning')
          ) {
            app.compatible = false;
            // Skip validating other dependencies
            continue;
          }
        } else if (
          (dependency.includes('c-lightning') &&
            !dependency.includes('lnd') &&
            lightningImplementation === 'lnd') ||
          (dependency.includes('lnd') &&
            !dependency.includes('c-lightning') &&
            lightningImplementation === 'c-lightning')
        ) {
          app.compatible = false;
          // Skip validating other dependencies
          continue;
        }
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

export async function getAvailableUpdates(): Promise<string[]> {
  return diskLogic.readJsonStatusFile<string[]>('app-updates');
}
