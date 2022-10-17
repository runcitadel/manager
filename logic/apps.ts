import { runCommand } from "../services/karen.ts";
import * as diskLogic from "./disk.ts";

/** A dependency an app could have */
export type Dependency = "bitcoind" | "electrum" | "lnd" | "c-lightning";

export type MetadataV4 = {
  /**
   * The category for the app
   */
  category: string;
  /**
   * The app's default password. Can also be $APP_SEED for a random password
   */
  defaultPassword?: string;
  /**
   * A description of the app
   */
  description: string;
  developers: Record<string, string>;
  /**
   * A list of promo images for the apps
   */
  gallery?: string[];
  /**
   * The app id, only set in output
   */
  id: string;
  /**
   * For "virtual" apps, the service the app implements
   */
  implements?: string;
  /**
   * The name of the app
   */
  name: string;
  /**
   * The path the "Open" link on the dashboard should lead to
   */
  path?: string;
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
  updateContainers?: string[] | null;
  /**
   * The version of the app
   */
  version:         string;
  versionControl?: null | string;
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
): Promise<Array<MetadataV4>> {
  let apps = await diskLogic.readAppRegistry();
  // Do all hidden service lookups concurrently
  await Promise.all(
    apps.map(async (app: MetadataV4) => {
      try {
        app.hiddenService = await diskLogic.readHiddenService(`app-${app.id}`);
      } catch {
        app.hiddenService = "";
      }

      app.permissions = app.permissions || [];
      if (app.implements && await getImplementation(app.implements) !== app.id) {
        app.compatible = false;
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

function isValidAppId(id: string): boolean {
  if (!id) {
    return false;
  }

  const appRegExp = /^[a-z\d-]+$/;
  return appRegExp.test(id);
}

export async function install(id: string): Promise<void> {
  if (!isValidAppId(id)) {
    throw new Error("Invalid app id");
  }

  try {
    await runCommand(`trigger app install ${id}`);
  } catch {
    throw new Error("Could not communicate with karen");
  }
}

export async function uninstall(id: string): Promise<void> {
  if (!(await isValidAppId(id))) {
    throw new Error("Invalid app id");
  }

  try {
    await runCommand(`trigger app uninstall ${id}`);
  } catch {
    throw new Error("Could not communicate with karen");
  }
}

export async function update(id: string): Promise<void> {
  if (!(await isValidAppId(id))) {
    throw new Error("Invalid app id");
  }

  try {
    await runCommand(`trigger app update ${id}`);
  } catch {
    throw new Error("Could not communicate with karen");
  }
}

export function getAvailableUpdates(): Promise<string[]> {
  return diskLogic.readJsonStatusFile<string[]>("app-updates");
}

export async function getImplementation(service: string): Promise<string | undefined> {
  const installedApps = (await diskLogic.readUserFile()).installedApps || [];
  const implementations = (await diskLogic.readVirtualApps())[service] || [];
  return implementations.find((implementation) => installedApps.includes(implementation));
}
