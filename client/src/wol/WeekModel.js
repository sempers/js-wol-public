import $config from "../config.js"

export const allowedPNG = ['ng', 'dr', 'buy', 'mov', 'games', 'zz', 'soc', 'major', 'interview', 'quit', 'qbb', 'buh', 'acid', 'crush', 'meet', 'breakup', 'ill', 'sex', 'love', 'exam', 'gig', 'bad', 'death', 'sea', 'abroad'];

export default class WeekModel {
    constructor(dbWeek, startMoment, endMoment, weekNum, spans) {
        dbWeek = dbWeek || { weekNum, info: "", msgCount: 0, photoCount: 0, name: $config.name, year: 0, yearNum: 0};

        const nowTime = (new Date()).getTime();
        Object.assign(this, {
            name:      dbWeek.name,
            startTime: startMoment._d.getTime(),
            endTime:   endMoment._d.getTime(),
            year:      dbWeek.year || endMoment.isoWeekYear(),
            yearNum:   dbWeek.yearNum || endMoment.isoWeek(),
            weekNum:   dbWeek.weekNum || weekNum,
            flags: "",
            spanIds: [],
            coloredFlags: [],
            tags: null,
            info: dbWeek.info || "",
            selected: false,
            tagged: false,
            future: "",
            messages: [],                //сообщения
            msgCount: dbWeek.msgCount || 0,
            msgLoading: true,         //загрузка сообщений        
            msgShown: false,
            curChat: { messages: [], chat: "" },
            photos: [],
            photoCount: dbWeek.photoCount || 0,
            photoLoading: true,
            photoShown: false
        });

        this.desc = `${this.yearNum} / ${this.weekNum} неделя: ${startMoment.format('L')} — ${endMoment.format('L')}`; //декскрипшн - статический     

        if (this.startTime > nowTime) {
            this.future = "future";
            this.bgStyle = "";
            this.bgcolor = "white";
        } else {
            spans.forEach(span => {
                if (span.startTime >= this.startTime && span.startTime <= this.endTime ||   //Начало спэна попадает
                    span.endTime >= this.startTime && span.endTime <= this.endTime ||       //Конец спэна попадает
                    span.startTime < this.startTime && span.endTime >= this.endTime) {      //спэн безусловно шире данной недели
                    this.flags += `[${span.name}]`;
                    this.spanIds.push(span.id);
                    this.coloredFlags.push({
                        name: span.name,
                        color: span.color
                    });
                }
            });

            if (this.coloredFlags.length === 0) {
                this.bgcolor = "#cccccc";
            } else if (this.coloredFlags.length == 1) {
                this.bgcolor = this.coloredFlags[0].color;
            } else {
                this.bgcolor = this.coloredFlags[0].color;
                this.bgcolor2 = this.coloredFlags[1].color;
            }
        }

        this.leftpx = (this.yearNum - 1) * 20 + 60; //горизонтальная координата
    }

    getTags() {
        if (this.tags === null) {
            this.updateTags();
        }        
        return this.tags;
    }

    updateTags() {
        this.tags = this.info.indexOf("#") < 0 ? [] : [...this.info.matchAll(/#([a-z]+)/g)].map(ti => ti[1]);
    }

    getTagIcons() {
        return this.getTags().map(x => x.replace("#", "")).filter(x => allowedPNG.includes(x)) || [];
    }

    getTagClasses() {
        return this.getTags().map(x => x.replace("#", "")).join(" ");
    }

    hasTag(tag) {
        return this.info.includes(tag);
    }
}