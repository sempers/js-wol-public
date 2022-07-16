Array.prototype.sortBy = function(predicate) {
	if (!this) return this;

	if (this.length === 0) return [];

	let copy = [...this];
	if (predicate instanceof Function) {
		copy.sort((a, b) => {
			if (predicate(a) > predicate(b)) return 1;
			if (predicate(a) == predicate(b)) return 0;
			if (predicate(a) < predicate(b)) return -1;
		});
	} else if (predicate instanceof String) {
		const prop = predicate;
		copy.sort((a, b) => {
			if (a[prop] > b[prop]) return 1;
			if (a[prop] == b[prop]) return 0;
			if (a[prop] < b[prop]) return -1;
		});
	} 
    else {
        copy.sort();
    }
	return copy;
};

Array.prototype.unique = function() {
	if (!this || this.length === 0) return [];
	return Array.from(new Set(this).values());
};

Array.prototype.pluck = function(prop) {
	return this.map((x) => x[prop]);
};

Array.prototype.reject = function(predicate) {
	if (!predicate) return this;
	return this.filter((x) => !predicate(x));
};

Array.prototype.max = function(predicate) {
	if (!predicate) return this;
	return Math.max(...this.map(predicate));
};

Array.prototype.groupBy = function(key) {
	let g = {};
	for (let item of this) {
		if (!item) continue;
		if (!g[item[key]]) {
			g[item[key]] = [item];
		} else {
			g[item[key]].push(item);
		}
	}
	return g;
};

Number.prototype.toFixedS = function(decimals, addSign) {
	if (isNaN(this)) return this;

	return (addSign && Math.sign(this) > 0 ? "+" : "") + this.toFixed(decimals);
};
