"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toStringMap = void 0;
function toStringMap(obj) {
    const ret = new Map();
    for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'string') {
            ret.set(k, v);
        }
    }
    return ret;
}
exports.toStringMap = toStringMap;
