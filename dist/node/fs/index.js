"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDirectory = exports.isFile = exports.fileStats = exports.findDirectory = exports.findFile = exports.findStats = void 0;
const fs_1 = require("fs");
const path = require('path');
function findStats(name) {
    let dir = path.resolve(".");
    let fpath = path.join(dir, name);
    while (!(0, fs_1.existsSync)(fpath)) {
        if (dir.length <= 1) {
            return [undefined, ''];
        }
        dir = path.resolve(path.join(dir, ".."));
        fpath = path.join(dir, name);
    }
    try {
        return [(0, fs_1.statSync)(fpath), fpath];
    }
    catch (_a) {
        return [undefined, fpath];
    }
}
exports.findStats = findStats;
function findFile(name) {
    let pair = findStats(name);
    return pair ? pair[1] : '';
}
exports.findFile = findFile;
function findDirectory(name) {
    const [stats, fpath] = findStats(name);
    return stats && stats.isDirectory() ? fpath : '';
}
exports.findDirectory = findDirectory;
function fileStats(fpath) {
    try {
        fpath = path.resolve(fpath);
        if ((0, fs_1.existsSync)(fpath)) {
            return [(0, fs_1.statSync)(fpath), fpath];
        }
    }
    catch (_a) { }
    return [undefined, ''];
}
exports.fileStats = fileStats;
function isFile(fpath) {
    const [stats, fp] = fileStats(fpath);
    return (stats === null || stats === void 0 ? void 0 : stats.isFile()) || false;
}
exports.isFile = isFile;
function isDirectory(fpath) {
    let [stats, fp] = fileStats(fpath);
    return (stats === null || stats === void 0 ? void 0 : stats.isDirectory()) || false;
}
exports.isDirectory = isDirectory;
