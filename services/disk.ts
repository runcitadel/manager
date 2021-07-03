/**
 * Generic disk functions.
 */

 import * as fs from 'fs';
 import * as crypto from "crypto";
 import * as logger from '../utils/logger.js';
 import copy from 'recursive-copy';

const uint32Bytes = 4;

// Deletes a file from the filesystem
export function deleteFile(filePath: string): Promise<NodeJS.ErrnoException | void> {
    return new Promise((resolve, reject) => fs.unlink(filePath, (error: NodeJS.ErrnoException | null) => {
        if (error) {
            reject(error);
        } else {
            resolve();
        }
    }));
}

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
export async function deleteItemsInDir(path: string) {
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

export async function deleteFoldersInDir(path: string) {
    const contents = fs.readdirSync(path);

    for (const item of contents) {
        if (fs.statSync(path + '/' + item).isDirectory()) {
            deleteFolderRecursive(path + '/' + item);
        }
    }
}

export function deleteFolderRecursive(path: string) {
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

export async function listDirsInDir(dir: string) {
    const contents = fs.readdirSync(dir);

    const dirs = [];

    for (const item of contents) {
        if (fs.statSync(dir + '/' + item).isDirectory()) {
            dirs.push(item);
        }
    }

    return dirs;
}

export async function moveFoldersToDir(fromDir: string, toDir: string) {
    const contents = fs.readdirSync(fromDir);

    for (const item of contents) {
        if (item !== '.git' && fs.statSync(fromDir + '/' + item).isDirectory()) {
            await copyFolder(fromDir + '/' + item, toDir + '/' + item);
        }
    }
}

// Reads a file. Wraps fs.readFile into a native promise
export function readFile(filePath: string, encoding: string = 'utf-8') {
    return new Promise((resolve, reject) => fs.readFile(filePath, encoding, (error, string) => {
        if (error) {
            reject(error);
        } else {
            resolve(string);
        }
    }));
}

// Reads a file as a utf8 string. Wraps fs.readFile into a native promise
export async function readUtf8File(filePath: string) {
    return (await readFile(filePath, 'utf8') as string).trim();
}

export async function readJsonFile(filePath: string) {
    return readUtf8File(filePath).then(JSON.parse);
}

// Writes a string to a file. Wraps fs.writeFile into a native promise
// This is _not_ concurrency safe, so don't export it without making it like writeJsonFile
export function writeFile(filePath: string, data: string | NodeJS.ArrayBufferView, encoding: string = 'utf-8'): Promise<NodeJS.ErrnoException | void>{
    return new Promise((resolve, reject) => fs.writeFile(filePath, data, encoding, error => {
        if (error) {
            reject(error);
        } else {
            resolve();
        }
    }));
}

// Like writeFile but will create the file if it doesn't already exist
export async function ensureWriteFile(filePath: string, data: string, encoding: string = 'utf-8'): Promise<NodeJS.ErrnoException | void> {
    const time = new Date();
    try {
        fs.utimesSync(filePath, time, time);
    } catch (err) {
        fs.closeSync(fs.openSync(filePath, 'w'));
    }
    return await writeFile(filePath, data, encoding);
}

export function writeJsonFile(filePath: string, object: unknown): Promise<NodeJS.ErrnoException | void> {
    const temporaryFileName = `${filePath}.${crypto.randomBytes(uint32Bytes).readUInt32LE(0)}`;

    return <Promise<NodeJS.ErrnoException | void>>writeFile(temporaryFileName, JSON.stringify(object, null, 2), 'utf8')
        .then(() => new Promise((resolve, reject) => fs.rename(temporaryFileName, filePath, error => {
            if (error) {
                reject(error);
            } else {
                // @ts-expect-error
                resolve();
            }
        })))
        .catch(error => {
            if (error) {
                fs.unlink(temporaryFileName, error_ => {
                    logger.warn('Error removing temporary file after error', 'disk', {err: error_, tempFileName: temporaryFileName});
                });
            }

            throw error;
        });
}

export function writeKeyFile(filePath: string, object: string | NodeJS.ArrayBufferView): Promise<NodeJS.ErrnoException | void> {
    const temporaryFileName = `${filePath}.${crypto.randomBytes(uint32Bytes).readUInt32LE(0)}`;

    return <Promise<NodeJS.ErrnoException | void>>writeFile(temporaryFileName, object, 'utf8')
        .then(() => new Promise((resolve, reject) => fs.rename(temporaryFileName, filePath, error => {
            if (error) {
                reject(error);
            } else {
                // @ts-expect-error
                resolve();
            }
        })))
        .catch(error => {
            if (error) {
                fs.unlink(temporaryFileName, error_ => {
                    logger.warn('Error removing temporary file after error', 'disk', {err: error_, tempFileName: temporaryFileName});
                });
            }

            throw error;
        });
}

