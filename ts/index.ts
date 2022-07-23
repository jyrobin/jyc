
export function toStringMap(obj: object): Map<string, string> {
	const ret = new Map<string, string>();
	for (const [k, v] of Object.entries(obj)) {
		if (typeof v === 'string') {
			ret.set(k, v);
		}
	} 
	return ret;
}

