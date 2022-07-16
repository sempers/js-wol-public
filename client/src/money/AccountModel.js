export default class AccountModel {    
    constructor(obj) {
        Object.assign(this, obj);
        this.history = [];
        this.id = obj.name.toUpperCase();
    }

    beginBalance(ym) {
        for (let i = ym - 1; i >= 1000; i--) {
            if (typeof this.history[i] !== "undefined") {
                return this.history[i];
            }
        }
        return 0;
    }

    endBalance(ym) {
        return typeof this.history[ym] !== "undefined" ? this.history[ym] : this.beginBalance(ym);
    }

    getSort() {
        let sort = this.sort;
        if (this.category === "crypto") {
            sort *= 10;
        }
        if (this.hidden) {
            sort *= 100;
        }
        return sort;
    }
}