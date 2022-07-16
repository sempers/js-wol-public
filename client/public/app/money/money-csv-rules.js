const csvRules = [
    {
        cat: ["Супермаркеты", "Фастфуд", "Рестораны"],
        tag: "Food"
    },
    {
        cat: ["Дом, ремонт"],
        desc: ["Remit", "Novosel"],
        tag: "Food"
    },
    {
        cat: ["Дом, ремонт"],
        desc: ["DNS"],
        tag: "Equipment"
    },
    {
        cat: ["Транспорт", "Ж/д билеты"],
        tag: "Commuting"
    },
    {
        cat: ["Другое"],
        desc: ["Компенсация покупки", "Проценты по кредиту", "Проценты на остаток", "Кэшбэк за обычные покупки", "Комиссия за операцию"],
        tag: "Interest"
    },
    {
        lera: true,
        cat: ["Другое"],
        desc: ["Заработная плата", "Пополнение через Сбербанк"],
        tag: "Salary"
    },
    {
        cat: ["Другое", "ДРУГИЕ ОПЕРАЦИИ"],
        desc: ["Погашение задолженности", "Досрочное погашение задолженности", "Получение кредита"],
        tag: "Loan"
    },
    {
        cat: ["ДРУГИЕ ОПЕРАЦИИ"],
        desc: ["Google"],
        tag: "Services",
    },
    {
        cat: ["ДРУГИЕ ОПЕРАЦИИ"],
        desc: ["Steam"],
        tag: "Games",
    },
    {
        cat: ["ДРУГИЕ ОПЕРАЦИИ"],
        tag: "Other",
        distinct: true
    },
    {
        cat: ["Другое"],
        desc: ["Внесение наличных через банкомат Тинькофф"],
        tag: "Other",
        distinct: true
    },
    {
        cat: ["Дом, ремонт"],
        tag: "Home"
    },
    {
        cat: ["Авто услуги"],
        tag: "Car"
    },
    {
        cat: ["Образование"],
        tag: "Education"
    }, 
    {
        cat: ["Аптеки", "Мед. услуги"],
        tag: "Healthcare"
    },
    {
        cat: ["Топливо"],
        tag: "Fuel"
    },
    {
        cat: ["Гос. сборы"],
        tag: "Taxes"
    },
    {
        cat: ["Ювелирные изделия и часы"],
        tag: "Jewels"
    },
    {
        cat: ["Разные товары"],
        tag: "Misc",
        distinct: true
    },
    {
        cat: ["Развлечения"],
        tag: "Fun"
    },
    {
        cat: ["Жкх/иб"],
        tag: "Bills"
    },
    {
        cat: ["Красота"],
        tag: "Beauty",
    },
    {
        cat: ["Одежда, обувь", "Спорттовары"],
        tag: "Clothes"
    },
    {
        cat: ["Связь, телеком", "Мобильные/иб"],
        tag: "Telephone"
    },
    {
        cat: ["Книги"],
        tag: "Books"
    },
    {
        cat: ["Турагентства"],
        tag: "Vacation"
    },
    {
        sasha: true,
        cat: ["Другое"],
        desc: ["Пополнение через Альфа-Банк"],
        tag: "Equilibrium"
    },
    {
        sasha: true,
        cat: ["Переводы/иб"],
        desc: ["росбанк кредит"],
        tag: "Loan_Rosbank"
    },
    {
        sasha: true,
        cat: ["Другое", "Переводы/иб"],
        desc: ["Валерия Ч."],
        tag: "Lera"
    },
    {
        lera: true,
        cat: ["Другое", "Переводы/иб"],
        desc: ["Валерия Ч.", "Перевод между счетами"],
        tag: "Myself",
        distinct: true
    },
    {
        lera: true,
        cat: ["Переводы/иб"],
        desc: ["Александр Б."],
        tag: "Sasha"
    },
    {
        lera: true,
        cat: ["Переводы/иб"],
        tag: "Transfers",
        distinct: true
    },
    {
        cat: ["Сервис. услуги"],
        desc: ["Ozon.ru", "WILDBERRIES"],
        tag: "Misc",
        distinct: true
    },
    {
        cat: ["Сервис. услуги"],
        tag: "Services",
        distinct: true
    },
    {
        cat: ["Финан. услуги"],
        tag: "Finance"
    }
]