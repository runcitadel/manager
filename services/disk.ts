/**
 * Generic disk functions.
 */

import * as fs from "fs/promises";
import { existsSync as fileExists } from "fs";
import { fs_utils } from "@runcitadel/utils";
import copy from "recursive-copy";

export async function copyFolder(
  fromFile: string,
  toFile: string
): Promise<NodeJS.ErrnoException | void> {
  return new Promise((resolve, reject) =>
    copy(fromFile, toFile, (error: NodeJS.ErrnoException | null) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    })
  );
}

// Delete all items in a directory.
export async function deleteItemsInDir(path: string): Promise<void> {
  const contents = await fs.readdir(path);

  for (const item of contents) {
    const curPath = path + "/" + item;
    if ((await fs.stat(curPath)).isDirectory()) {
      await deleteFolderRecursive(curPath);
    } else {
      await fs.unlink(curPath);
    }
  }
}

export async function deleteFoldersInDir(path: string): Promise<void> {
  const directories = await listDirsInDir(path);

  for (const item of directories) {
    await deleteFolderRecursive(path + "/" + item);
  }
}

export async function deleteFolderRecursive(path: string): Promise<void> {
  if (fileExists(path)) {
    const contents = await fs.readdir(path);

    for (const file of contents) {
      const curPath = path + "/" + file;
      if ((await fs.stat(curPath)).isDirectory()) {
        await deleteFolderRecursive(curPath);
      } else {
        await fs.unlink(curPath);
      }
    }

    await fs.rmdir(path);
  }
}

export async function listDirsInDir(dir: string): Promise<string[]> {
  const contents = await fs.readdir(dir);

  const dirs: string[] = [];

  for (const item of contents) {
    if ((await fs.stat(dir + "/" + item)).isDirectory()) {
      dirs.push(item);
    }
  }

  return dirs;
}

export async function moveFoldersToDir(
  fromDir: string,
  toDir: string
): Promise<void> {
  const contents = await fs.readdir(fromDir);

  for (const item of contents) {
    if (
      item !== ".git" &&
      (await fs.stat(fromDir + "/" + item)).isDirectory()
    ) {
      await copyFolder(fromDir + "/" + item, toDir + "/" + item);
    }
  }
}

// Like writeFile but will create the file if it doesn't already exist
export async function ensureWriteFile(
  filePath: string,
  data: string
): Promise<NodeJS.ErrnoException | void> {
  const time = new Date();
  try {
    await fs.utimes(filePath, time, time);
  } catch (err) {
    await (await fs.open(filePath, "w")).close();
  }
  return await fs_utils.safeWriteFile(filePath, data);
}
