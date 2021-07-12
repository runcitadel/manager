/**
 * Generic disk functions.
 */

import * as fs from 'fs';
import {fs_utils} from '@runcitadel/utils';
import copy from 'recursive-copy';

export async function copyFolder(fromFile: string, toFile: string): Promise<NodeJS.ErrnoException | void> {
    return new Promise((resolve, reject) => copy(fromFile, toFile, (error: NodeJS.ErrnoException | null) => {
        if (error) {
            reject(error);
        } else {
            resolve();
        }
    }));
}

// Delete all items in a directory.
export async function deleteItemsInDir(path: string): Promise<void> {
    const contents = fs.readdirSync(path);

    for (const item of contents) {
        const curPath = path + '/' + item;
        if (fs.statSync(curPath).isDirectory()) {
            deleteFolderRecursive(curPath);
        } else {
            fs.unlinkSync(curPath);
        }
    }
}

export async function deleteFoldersInDir(path: string): Promise<void> {
    const contents = fs.readdirSync(path);

    for (const item of contents) {
        if (fs.statSync(path + '/' + item).isDirectory()) {
            deleteFolderRecursive(path + '/' + item);
        }
    }
}

export function deleteFolderRecursive(path: string): void {
    if (fs.existsSync(path)) {
        const contents = fs.readdirSync(path);

        for (const file of contents) {
            const curPath = path + '/' + file;
            if (fs.statSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        }

        fs.rmdirSync(path);
    }
}

export async function listDirsInDir(dir: string): Promise<string[]> {
    const contents = fs.readdirSync(dir);

    const dirs = [];

    for (const item of contents) {
        if (fs.statSync(dir + '/' + item).isDirectory()) {
            dirs.push(item);
        }
    }

    return dirs;
}

export async function moveFoldersToDir(fromDir: string, toDir: string): Promise<void> {
    const contents = fs.readdirSync(fromDir);

    for (const item of contents) {
        if (item !== '.git' && fs.statSync(fromDir + '/' + item).isDirectory()) {
            await copyFolder(fromDir + '/' + item, toDir + '/' + item);
        }
    }
}

// Like writeFile but will create the file if it doesn't already exist
export async function ensureWriteFile(filePath: string, data: string): Promise<NodeJS.ErrnoException | void> {
    const time = new Date();
    try {
        fs.utimesSync(filePath, time, time);
    } catch (err) {
        fs.closeSync(fs.openSync(filePath, 'w'));
    }
    return await fs_utils.safeWriteFile(filePath, data);
}
