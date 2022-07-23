import { existsSync, statSync, Stats } from "fs";

const path = require('path');

export function findStats(name: string): [string, Stats]|undefined {
	let dir = path.resolve(".");
	let fpath = path.join(dir, name);
	while (!existsSync(fpath)) {
		if (dir.length <= 1) {
			return undefined; 
		}
		dir = path.resolve(path.join(dir, ".."));
		fpath = path.join(dir, name);
	}
	try {
		return [fpath, statSync(fpath)];
	} catch {
		return undefined;
	}
}

export function findFile(name: string): string {
	let pair = findStats(name);
	return pair ? pair[0] : ''
}

export function findDirectory(name: string): string {
	const pair = findStats(name);
	return pair && pair[1].isDirectory() ? pair[0] : '';
}
