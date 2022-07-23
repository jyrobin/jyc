"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findDirectory = exports.findFile = exports.findStats = void 0;
const fs_1 = require("fs");
const path = require('path');
function findStats(name) {
    let dir = path.resolve(".");
    let fpath = path.join(dir, name);
    while (!(0, fs_1.existsSync)(fpath)) {
        if (dir.length <= 1) {
            return undefined;
        }
        dir = path.resolve(path.join(dir, ".."));
        fpath = path.join(dir, name);
    }
    try {
        return [fpath, (0, fs_1.statSync)(fpath)];
    }
    catch (_a) {
        return undefined;
    }
}
exports.findStats = findStats;
function findFile(name) {
    let pair = findStats(name);
    return pair ? pair[0] : '';
}
exports.findFile = findFile;
function findDirectory(name) {
    const pair = findStats(name);
    return pair && pair[1].isDirectory() ? pair[0] : '';
}
exports.findDirectory = findDirectory;
