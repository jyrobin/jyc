import { existsSync, statSync, Stats } from "fs";

const path = require('path');

export function findStats(name: string, dirs?: string[]): [Stats|undefined, string] {
	let dir = path.resolve(".");
	let fpath = path.join(dir, name);
	let found = existsSync(fpath);
	while (dir.length > 1 && !found) {
		dir = path.resolve(path.join(dir, ".."));
		fpath = path.join(dir, name);
		found = existsSync(fpath);
	}

	if (!found && dirs) {
		for (let dir of dirs) {
			fpath = path.join(dir, name);
			found = existsSync(fpath);
			if (found) break;
		}
	}

	if (found) {
		try {
			return [statSync(fpath), fpath];
		} catch {}
	}

	return [undefined, fpath];
}

export function findFile(name: string, dirs?: string[]): string {
	let pair = findStats(name);
	return pair ? pair[1] : ''
}

export function findDirectory(name: string): string {
	const [stats, fpath] = findStats(name);
	return stats && stats.isDirectory() ? fpath : '';
}

export function fileStats(fpath: string): [Stats|undefined, string] {
	try {
        fpath = path.resolve(fpath);
        if (existsSync(fpath)) {
		    return [statSync(fpath), fpath];
        }
	} catch {}

	return [undefined, ''];
}

export function isFile(fpath: string): boolean {
	const [stats, fp] = fileStats(fpath);
	return stats?.isFile() || false;
}

export function isDirectory(fpath: string): boolean {
	let [stats, fp] = fileStats(fpath);
	return stats?.isDirectory() || false;
}
