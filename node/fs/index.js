"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDirectory = exports.isFile = exports.fileStats = exports.findDirectory = exports.findFile = exports.findStats = void 0;
const fs_1 = require("fs");
const path = require('path');
function findStats(name, dirs) {
    let dir = path.resolve(".");
    let fpath = path.join(dir, name);
    let found = (0, fs_1.existsSync)(fpath);
    while (dir.length > 1 && !found) {
        dir = path.resolve(path.join(dir, ".."));
        fpath = path.join(dir, name);
        found = (0, fs_1.existsSync)(fpath);
    }
    if (!found && dirs) {
        for (let dir of dirs) {
            fpath = path.join(dir, name);
            found = (0, fs_1.existsSync)(fpath);
            if (found)
                break;
        }
    }
    if (found) {
        try {
            return [(0, fs_1.statSync)(fpath), fpath];
        }
        catch (_a) { }
    }
    return [undefined, fpath];
}
exports.findStats = findStats;
function findFile(name, dirs) {
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
