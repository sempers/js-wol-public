class Account {    
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

class Tx {
    constructor(obj) {
        Object.assign(this, {...obj});

        if (this.active !== false && typeof this.active === "undefined") {
            this.active = true;
        }
        this.date = new Date(this.date);
        this.created = new Date(this.created);
        if (this.edited) {
            this.edited = new Date(this.edited);
        }

        this.isRemoved = false;
        this.isEdited = false;

        this.setTrade();
    }

    setTrade() {
        //проставляем бай-селл
        if (this.type == "transfer" && this.tag && this.tag.includes("Invest_")) {
            switch (this.tag) {
                case "Invest_Usd":
                    if (this.dst == "SUSD" || this.dst == "CUSD")
                        this.trade = "buy";
                    else if (this.src == "SUSD" || this.src == "CUSD")
                        this.trade = "sell";
                    break;
                case "Invest_Eur":
                    if (this.dst == "SEUR")
                        this.trade = "buy";
                    else if (this.src == "SEUR")
                        this.trade = "sell";
                    break;
                case "Invest_Btc":
                    if (this.dst == "BTC")
                        this.trade = "buy";
                    else if (this.src == "BTC")
                        this.trade = "sell";
                    break;
                case "Invest_Bnb":
                    if (this.dst == "BNB")
                        this.trade = "buy";
                    else if (this.src == "BNB")
                        this.trade = "sell";
                    break;
                case "Invest_Crypto":
                    if (["USDT", "BTCE", "HITBTC"].includes(this.dst) && ["MAIN", "Yandex", "Sberbank", "DRUB", "DRUB1"].includes(this.src))
                        this.trade = "buy";
                    if (["USDT", "BTCE", "HITBTC"].includes(this.src) && ["MAIN", "Yandex", "Sberbank", "DRUB", "DRUB1"].includes(this.dst))
                        this.trade = "sell";
                    
            }
        } else {
            this.trade = null;
        }
    }
}