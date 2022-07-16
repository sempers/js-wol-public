//-------------- WEEK MODEL ----------------//
class WeekModel {
    allowedPNG() {
        return ['ng', 'dr', 'buy', 'mov', 'games', 'zz', 'soc', 'major', 'interview', 'quit', 'qbb', 'buh', 'acid', 'crush', 'meet', 'breakup', 'ill', 'sex', 'love', 'exam', 'gig', 'bad', 'death', 'sea', 'abroad'];
    }

    constructor(startMoment, endMoment, weekNum, info, spans) {
        const nowTime = (new Date()).getTime();
        this.startTime = startMoment._d.getTime();
        this.endTime = endMoment._d.getTime();
        this.year = endMoment.isoWeekYear();   //год
        this.yearNum = endMoment.isoWeek();       //номер недели в году
        this.weekNum = weekNum;                //номер недели в жизни
        this.flags = ""; //флаги
        this.spanIds = [];
        this.coloredFlags = [];                //комбинация
        this.info = info;              //инфо
        this.desc = `${this.yearNum} / ${this.weekNum} неделя: ${startMoment.format('L')} — ${endMoment.format('L')}`; //декскрипшн - статический
        this.messages = [];                //сообщения
        this.msgCount = 0;
        this.selected = false;
        this.tagged = false;
        this.future = "";                //признак что будущее
        this.msgLoading = false;             //загрузка сообщений

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
                    let cFlag = {
                        name: span.name,
                        color: span.color
                    };
                    this.coloredFlags.push(cFlag);
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

    getTags(options) {
        options = options || { stripped: false, asstring: false };
        if (this.info.indexOf("#") < 0) {
            return [];
        }
        else {
            let tagnames = [];
            let tag;
            const re = (/#([a-z]+)/g);
            while (tag = re.exec(this.info)) {
                let tagName = tag[1];
                if (!options.hasPng || this.allowedPNG().includes(tagName)) {
                    tagnames.push((options.stripped ? "" : "#") + tagName);
                }
            }
            return options.asstring ? tagnames.join(" ") : tagnames;
        }
    }

    hasTag(tag) {
        return this.info.includes(tag);
    }
}