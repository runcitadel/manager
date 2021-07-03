import * as diskLogic from './disk';
const NodeError = require('models/errors.js').NodeError;

type app = {
    id: string;
    hiddenService?: string;
    installed: boolean;
}

export type appQuery = {
    installed?: boolean;
}

export async function get(query: appQuery) {
    let apps = await diskLogic.readAppRegistry();

    // Do all hidden service lookups concurrently
    await Promise.all(apps.map(async (app: app) => {
        try {
            app.hiddenService = await diskLogic.readHiddenService(`app-${app.id}`);
        } catch {
            app.hiddenService = '';
        }
    }));

    if (query.installed === true) {
        const installedApps = (await diskLogic.readUserFile()).installedApps || [];
        apps = apps.filter((app: app) => installedApps.includes(app.id));
    }

    return apps;
}

async function isValidAppId(id: string): Promise<boolean> {
    if(!id) {
        return false;
    }
    return true;
}

export async function install(id: string) {
    if (!await isValidAppId(id)) {
        throw new NodeError('Invalid app id');
    }

    try {
        await diskLogic.writeSignalFile(`app-install-${id}`);
    } catch {
        throw new NodeError('Could not write the signal file');
    }
}

export async function uninstall(id: string) {
    if (!await isValidAppId(id)) {
        throw new NodeError('Invalid app id');
    }

    try {
        await diskLogic.writeSignalFile(`app-uninstall-${id}`);
    } catch {
        throw new NodeError('Could not write the signal file');
    }
}
