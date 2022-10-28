/// <reference types="node" />
import { Stats } from "fs";
export declare function findStats(name: string, dirs?: string[]): [Stats | undefined, string];
export declare function findFile(name: string, dirs?: string[]): string;
export declare function findDirectory(name: string): string;
export declare function fileStats(fpath: string): [Stats | undefined, string];
export declare function isFile(fpath: string): boolean;
export declare function isDirectory(fpath: string): boolean;
//# sourceMappingURL=index.d.ts.map