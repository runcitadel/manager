/**
 * Generic disk functions.
 */

const logger = require('utils/logger');
const fs = require('fs-extra');
const crypto = require('crypto');
const uint32Bytes = 4;

// Deletes a file from the filesystem
function deleteFile(filePath) {
  return new Promise((resolve, reject) => fs.unlink(filePath, (error, string) => {
    if (error) {
      reject(error);
    } else {
      resolve(string);
    }
  }));
}

async function copyFolder(fromFile, toFile) {
  return new Promise((resolve, reject) => fs.copy(fromFile, toFile, error => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  }));
}

// Delete all items in a directory.
async function deleteItemsInDir(path) {
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

async function deleteFoldersInDir(path) {
  const contents = fs.readdirSync(path);

  for (const item of contents) {
    if (fs.statSync(path + '/' + item).isDirectory()) {
      deleteFolderRecursive(path + '/' + item);
    }
  }
}

function deleteFolderRecursive(path) {
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

async function listDirsInDir(dir) {
  const contents = fs.readdirSync(dir);

  const dirs = [];

  for (const item of contents) {
    if (fs.statSync(dir + '/' + item).isDirectory()) {
      dirs.push(item);
    }
  }

  return dirs;
}

async function moveFoldersToDir(fromDir, toDir) {
  const contents = fs.readdirSync(fromDir);

  for (const item of contents) {
    if (item !== '.git' && fs.statSync(fromDir + '/' + item).isDirectory()) {
      await copyFolder(fromDir + '/' + item, toDir + '/' + item);
    }
  }
}

// Reads a file. Wraps fs.readFile into a native promise
function readFile(filePath, encoding) {
  return new Promise((resolve, reject) => fs.readFile(filePath, encoding, (error, string) => {
    if (error) {
      reject(error);
    } else {
      resolve(string);
    }
  }));
}

// Reads a file as a utf8 string. Wraps fs.readFile into a native promise
async function readUtf8File(filePath) {
  return (await readFile(filePath, 'utf8')).trim();
}

async function readJsonFile(filePath) {
  return readUtf8File(filePath).then(JSON.parse);
}

// Writes a string to a file. Wraps fs.writeFile into a native promise
// This is _not_ concurrency safe, so don't export it without making it like writeJsonFile
function writeFile(filePath, data, encoding) {
  return new Promise((resolve, reject) => fs.writeFile(filePath, data, encoding, error => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  }));
}

// Like writeFile but will create the file if it doesn't already exist
async function ensureWriteFile(filePath, data, encoding) {
  await fs.ensureFile(filePath);
  return writeFile(filePath, data, encoding);
}

function writeJsonFile(filePath, object) {
  const temporaryFileName = `${filePath}.${crypto.randomBytes(uint32Bytes).readUInt32LE(0)}`;

  return writeFile(temporaryFileName, JSON.stringify(object, null, 2), 'utf8')
    .then(() => new Promise((resolve, reject) => fs.rename(temporaryFileName, filePath, error => {
      if (error) {
        reject(error);
      } else {
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

function writeKeyFile(filePath, object) {
  const temporaryFileName = `${filePath}.${crypto.randomBytes(uint32Bytes).readUInt32LE(0)}`;

  return writeFile(temporaryFileName, object, 'utf8')
    .then(() => new Promise((resolve, reject) => fs.rename(temporaryFileName, filePath, error => {
      if (error) {
        reject(error);
      } else {
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

module.exports = {
  deleteItemsInDir,
  deleteFile,
  deleteFoldersInDir,
  listDirsInDir,
  moveFoldersToDir,
  readFile,
  readUtf8File,
  readJsonFile,
  writeJsonFile,
  writeKeyFile,
  writeFile,
  ensureWriteFile
};
