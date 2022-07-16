import $config from '../config.js'

export default {
    MONTHS: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],

    loading: false,

    name: 'alex',

    accounts: [],
    transactions: [],
    baseTags: [],
    rates: [],

    isHistoricalMode: true,

    shownChartDialog: false,

    cur: {
        isMonthView: true,        
        begin: 0,
        end: 0,
        delta: 0,
        deltaPercent: 0,
        rateNet: 0,
        net: 0,
        viewNet: 0,
        tx: [],
        tags: [],
        budget: {
            type: 'monthly',
            spent: 0,
            max: 0,
            percentage: 0
        },        
        //filter
        account: null,
        month: (new Date()).getMonth(),
        year: (new Date()).getFullYear(),
        tag: null,
        txType: null
    },

    stats: {
        totalBalance: 0,
        totalBalanceUSD: 0,
        netWorth: 0,
        personalThings: 757000,
        netBalance: 0,
        flatValue: 3975000,
        mortgage: -461656,
        flatInvested: 0,
        flatEquity: 0,
        flatNwRatio: 0,
        flatROI: 0,
        rubRatio: 0,
        currRatio: 0,
        secRatio: 0,
        cryptoRatio: 0,
        stableRatio: 0,
        rateItems: {
            "USDRUB": {
                sym1: 'USD',
                sym2: 'RUB',
                avgEntrance: '',
                category: "2d"
            },
            "EURRUB": {
                sym1: 'EUR',
                sym2: 'RUB',
                avgEntrance: '',
                category: "2d"
            }
        }
    },

    lastUpdated: null,

    totalHistory: [],

    shownChartDialog: false,

    orderMap: {},    

    // functions
    nextYm(ym) {
        if (ym % 100 == 11)
            return (Math.floor(ym/100) + 1)*100;
        else
            return ym + 1;
    },

    rate(symbol, ym) {
        let result = 1;

        if (symbol == "RUB") {  // 
            return result;
        }

        if (!ym) {  // по умолчанию - текущий курс
            result = this.rates[0][symbol];
        } else {
            //correct ym
            if (ym > this.ym(new Date())) {
                ym = 0; // для будущих дат - текущий курс
            }
            if (ym % 100 > 11) {
                ym = (Math.floor(ym / 100) + 1) * 100;
            }
            result = !this.rates[ym] ? this.rates[0][symbol] : this.rates[ym][symbol];
        }

        return result || 1;
    },

    ym(yearOrDate, month) {
        yearOrDate = yearOrDate || new Date();            
        if (yearOrDate instanceof Date) {
            return (yearOrDate.getFullYear() - 2000) * 100 + yearOrDate.getMonth();
        }
        return (yearOrDate - 2000) * 100 + month;
    },

    ymd(date) {
        return (date.getFullYear() - 2000) * 1000000 + date.getMonth() * 10000 + date.getDate() * 100;
    },

    order(tx) {
        let ymd = this.ymd(tx.date);
        if (!this.orderMap[ymd]) {
            this.orderMap[ymd] = 0;
        }
        let dayNum = ++this.orderMap[ymd];
        tx.order = ymd + dayNum;
    },

    nextId() {
        let max = this.transactions.max(tx => tx.f41_id);
        if (max < 0)
            max = 0;
        return max + 1;        
    },

    baseTag(tagName) {
        return this.baseTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase());
    },

    normalAccounts() {
        return this.accounts.filter(acc => !acc.special);
    },

    filterTxs(lambda, special) {
        let txs = special ? this.transactions : this.transactions.filter(tx => !this.isAccSpecial(tx.src));      
        return txs.filter(lambda).sortBy(tx => tx.date.getTime());
    },

    sumTxs(lambda, toCurr, special) {
        let txs = special ? this.transactions : this.transactions.filter(tx => !this.isAccSpecial(tx.src));
        return (!toCurr)?
            txs.filter(lambda).reduce((a, tx) => a + tx.amount, 0) :
            txs.filter(lambda).reduce((a, tx) => a + this.convertTxAmount(tx, toCurr), 0);
    },

    acc(accName) {
        if (!accName) {
            return null;
        }
        return this.accounts.find(a => a.name === accName);
    },

    accCurrency(accName) {
        return !this.acc(accName) ? null : (this.acc(accName)).currency;
    },

    accCategory(accName) {
        if (!this.acc(accName)) {
            return "";
        }
        let cat = this.acc(accName).category;
        return cat == "crypto" && this.accCurrency(accName) == "USD" ? "currency" : cat;
    },

    accBalance(accName) {
        let acc = this.acc(accName);
        return !acc ? null : acc.balance
    },

    isAccCurrent(accName) {
        return this.cur.account.name === accName;
    },

    isTagCurrent(tagName) {
        return this.cur.tag === tagName;
    },

    noAcc() {
        return this.cur.account === null;
    },

    noTag() {
        return this.cur.tag === null;
    },

    isAccSpecial(accName) {
        return (accName) ?
            this.acc(accName) && this.acc(accName).special :
            this.cur.account && this.cur.account.special;
    },

    randomTagColor() {
        const max = 256;
        let r = Math.floor(Math.random() * max).toString(16);
        let g = Math.floor(Math.random() * max).toString(16);
        let b = Math.floor(Math.random() * max).toString(16);
        return `#${r}${g}${b}`;
    },

    tagColor(tagName) {
        let bt = this.baseTag(tagName);
        return this.baseTag(tagName) ? this.hexToRgbA(bt.color, '0.61') : "#ffffff";
    },

    parseAmount(str) {
        if (!isNaN(+str)) {
            return +str;
        }
        try {
            return eval(str.replace($config.thousand, "").replace($config.decimal, "."));
        } catch (e) {
            return NaN;
        }
    },

    convert(amount, curr1, curr2, ym) {
        if (curr1 == curr2)
            return amount;
        return amount * this.rate(curr1, ym) / this.rate(curr2, ym);
    },

    convertTxAmount(tx, curr2) {
        let curr1 = this.accCurrency(tx.src);
        if (curr1 != "RUB" && curr2 == "RUB" && tx.type != "transfer" && tx.rate && tx.rate != 1) {
            return tx.amount * tx.rate;
        } else {
            return this.convert(tx.amount, curr1, curr2, this.ym(tx.year, tx.month));
        }
    },

    hexToRgb(hex) {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }: { r: 255, g: 255, b: 255 };
    },

    hexToRgba(hex, alpha) {
        let rgb = this.hexToRgb(hex);
        return 'rgba(' + rgb.r + ", " + rgb.g + ', ' + rgb.b + ', ' + alpha + ')';
    },

    hexToRgbA(hex, opacity) {
        if (!hex) {
            return '#ffffff';
        }
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            let c = hex.substring(1).split('');
            if (c.length === 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c = '0x' + c.join('');
            return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + opacity + ')';
        }
    },

}