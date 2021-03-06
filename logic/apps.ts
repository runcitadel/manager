import * as lightningService from '../services/lightning-api.js';
import {runCommand} from '../services/karen.js';
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

export type MetadataV4 = {
  /**
   * The category for the app
   */
  category: string;
  /**
   * The app's default password. Can also be $APP_SEED for a random password
   */
  defaultPassword?: string | undefined;
  developers: Record<string, string>;
  /**
   * A list of promo images for the apps
   */
  gallery?: string[] | undefined;
  /**
   * The name of the app
   */
  name: string;
  /**
   * The path the "Open" link on the dashboard should lead to
   */
  path?: string | undefined;
  /**
   * Permissions the app requires
   */
  permissions?: Array<string | string[]>;
  /**
   * App repository name -> repo URL
   */
  repo: Record<string, string>;
  /**
   * A support link for the app
   */
  support: string;
  /**
   * A short tagline for the app
   */
  tagline: string;
  /**
   * True if the app only works over Tor
   */
  torOnly?: boolean;
  /**
   * A list of containers to update automatically (still validated by the Citadel team)
   */
  updateContainers?: string[] | undefined;
  /**
   * The version of the app
   */
  version: string;
  /** Automatically added */
  hiddenService?: string;
  /** Automatically added */
  installed?: boolean;
  /** Automatically added */
  compatible: boolean;
};

export type AppQuery = {
  installed?: boolean;
  compatible?: boolean;
};

export async function get(
  query: AppQuery,
  jwt: string,
): Promise<Array<App | MetadataV4>> {
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
    apps = apps.filter((app) => installedApps.includes(app.id));
  }

  if (query.compatible === true) {
    apps = apps.filter((app) => app.compatible);
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
    await runCommand(`trigger app install ${id}`);
  } catch {
    throw new Error('Could not communicate with karen');
  }
}

export async function uninstall(id: string): Promise<void> {
  if (!(await isValidAppId(id))) {
    throw new Error('Invalid app id');
  }

  try {
    await runCommand(`trigger app uninstall ${id}`);
  } catch {
    throw new Error('Could not communicate with karen');
  }
}

export async function update(id: string): Promise<void> {
  if (!(await isValidAppId(id))) {
    throw new Error('Invalid app id');
  }

  try {
    await runCommand(`trigger app update ${id}`);
  } catch {
    throw new Error('Could not communicate with karen');
  }
}

export async function getAvailableUpdates(): Promise<string[]> {
  return diskLogic.readJsonStatusFile<string[]>('app-updates');
}
