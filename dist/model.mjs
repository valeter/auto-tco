import {LEGACY_V2} from './legacy-v2.mjs';
export const VERSION = 4;
export const DATE = '2026-10-22';
export const CAR_INFO = [
  {id:'azimut',name:'Lada Azimut',trim:'Условная топовая комплектация',color:'#39775e',reference:2800000,sale5:1500000*28/27,sale8:1100000*28/27,fuel:9,service:32000*28/27,lateService:45333.333333333336*28/27,summer:60000,winter:70000,mount:4500,tax:5250,anchors:[],note:'Цена 2,8 млн ₽ — ваша гипотеза. Прежние оценки перепродажи по Vesta и бюджета ТО увеличены пропорционально с 2,7 до 2,8 млн ₽. Это не официальный прайс Azimut.'},
  {id:'changan',name:'Changan CS75 Plus IV',trim:'Techno',color:'#57749b',reference:4249900,sale5:2300000,sale8:1750000,fuel:10.5,service:50000,lateService:63333.333333333336,summer:80000,winter:100000,mount:4500,tax:17625,anchors:[[1,3535000]],note:'Прогноз привязан к объявлению IV поколения 2025 года. Длинная история перепродажи отсутствует.'},
  {id:'tenet',name:'TENET T9',trim:'Ultra · 5 мест',color:'#aa7542',reference:4299000,sale5:2150000,sale8:1600000,fuel:11,service:50220,lateService:62966.666666666664,summer:90000,winter:110000,mount:5000,tax:18375,anchors:[],note:'Перепродажа экстраполирована с Chery Tiggo 8. Различия модели и бренда не устранены.'},
  {id:'gac',name:'GAC GS8',trim:'GX Premium',color:'#8c6384',reference:5349000,sale5:2800000,sale8:2100000,fuel:12.5,service:55000,lateService:68333.33333333333,summer:100000,winter:125000,mount:5000,tax:17325,anchors:[[3,3550000]],note:'Ориентир — объявления GS8 II 2023 года. Будущие цены продажи — прогноз.'},
  {id:'jolion',name:'Haval Jolion',trim:'Техно+ · 1.5 DCT 4WD · 150 л.с.',color:'#5d8d92',reference:2949000,sale5:1600000,sale8:1200000,fuel:9.5,service:35000,lateService:45000,summer:60000,winter:70000,mount:4500,tax:5250,anchors:[],note:'Цена — официальный прайс от 14.08.2026. Расход 9,5 л/100 км, ТО и страховки — бюджетные допущения; паспортный расход 7,6 л/100 км. Доступен чёрно-красный салон.'},
  {id:'volga',name:'Volga K50',trim:'Эксклюзив · 2.0 8AT AWD · 238 л.с.',color:'#9e603f',reference:4799000,sale5:3200000/4899990*4799000*.95*.91**2,sale8:3200000/4899990*4799000*.95*.91**5,fuel:11.5,service:40000,lateService:50000,serviceKm:10000,zeroService:15000,summer:100000,winter:120000,mount:5000,tax:17850,anchors:[[3,3200000/4899990*4799000]],note:'Официальная цена без акций — 4,799 млн ₽. Перепродажа по Monjaro, расходы — допущения. В этой комплектации указан чёрно-серый салон: добавлена для сравнения расходов, но не проходит ваше требование к цвету.'},
  {id:'belgee',name:'Belgee X70',trim:'Стиль · 1.5 6AT FWD · 150 л.с.',color:'#757b38',reference:2745990,sale5:2000000*.95*.91**2,sale8:2000000*.95*.91**5,fuel:9,service:28000,lateService:37000,serviceKm:10000,zeroService:12000,summer:50000,winter:60000,mount:4000,tax:5250,anchors:[[3,2000000]],note:'Официальная цена — 2,746 млн ₽ без трейд-ин. Выбрана максимальная переднеприводная версия без гибрида: полноприводные версии имеют 48V MHEV. Перепродажа по Atlas Pro 150 л.с. с 6AT. Подходящий не-чёрный и не-серый заводской салон не подтверждён.'}
];
CAR_INFO.push({id:'custom',custom:true,name:'Твой автомобиль',trim:'Ваши параметры',color:'#7662ad',reference:3000000,sale5:1567500,sale8:1140000,fuel:9,service:30000,lateService:45000,summer:60000,winter:70000,mount:4500,tax:5250,anchors:[],note:'Назовите автомобиль, измените условные начальные значения и включите его в сравнение. Рыночные данные для этой машины не подставляются автоматически. Цена перепродажи задаётся вами: через доли стоимости нового аналога либо вручную.'});
// Keep the user-defined car last in the catalogue.
CAR_INFO.splice(CAR_INFO.length-1,0,{id:'granta',benchmark:true,name:'Lada Granta',trim:'База расходов · седан Клуб ММС · 106 л.с. · 5МТ',color:'#a24d56',reference:1290000,sale5:800000*.95,sale8:600000*.95,fuel:8,service:20000,lateService:25000,serviceKm:15000,serviceMonths:12,summer:30000,winter:35000,mount:2500,tax:3286,anchors:[],note:'База для сравнения расходов: Клуб ММС, 106 л.с., механика, 1,29 млн ₽ без условных скидок у официального дилера. МКПП и чёрный салон не соответствуют вашим условиям покупки. Расход 8 л/100 км, ТО 20 / 25 тыс. ₽ и перепродажа — допущения. Резерв ремонта оставлен таким же, как у остальных машин, без предположений о надёжности.'});
const reviewed = {
  azimut:{trim:'Условная топовая · 1.8 CVT · 132 л.с.',tax:4620,note:'Цена 2,8 млн ₽ задана вами, не подтверждена прайсом. Для сценария принят заявленный двигатель 132 л.с. с вариатором. ТО, расход и перепродажа остаются гипотезами по Vesta, а не проверенными характеристиками Azimut.'},
  changan:{serviceKm:10000,serviceMonths:6,serviceFirstKm:5000,serviceFirstMonths:3,note:'Цена Techno подтверждена. В руководстве IV поколения: первое ТО 5 000 км / 3 месяца, затем 10 000 км / 6 месяцев. Общие российские сервисные материалы указывают другой календарный интервал: до подтверждения по VIN принят более частый график. Стоимость визита и перепродажа — допущения; прежнее объявление снято.'},
  tenet:{serviceKm:10000,service:33690,lateService:35000,zeroService:16500,servicePrices:[24300,24300,36300,30800,35200,59400,24300,30800,36300,35200],note:'Ultra на 5 мест — 4,299 млн ₽ по официальному прайсу. ТО каждые 10 000 км / 12 месяцев; первые 10 визитов — по опубликованной программе цен у участвующих дилеров. Рекомендованное ТО-0 за 16 500 ₽ включено для сохранения сервисных привилегий; его можно убрать. Перепродажа по Tiggo 8 — гипотеза.'},
  gac:{serviceKm:10000,note:'GX Premium — 5,349 млн ₽ по официальному предложению. ТО каждые 10 000 км / 12 месяцев. Первое начальное обслуживание на 5 000 км / 3 месяцах бесплатное. Средняя цена платного ТО и будущая перепродажа не подтверждены тарифом и статистикой сделок.'},
  jolion:{serviceFirstKm:10000,serviceFirstMonths:12,note:'Техно+ 4WD — 2,949 млн ₽ по официальному прайсу. Первое ТО 10 000 км / 12 месяцев, затем 15 000 км / 12 месяцев. Расход 9,5 л/100 км — бюджет, паспортный смешанный расход 7,6. Цены обслуживания, страховок и перепродажи — допущения.'},
  volga:{zeroService:11880},
  belgee:{}
};
for(const info of CAR_INFO)Object.assign(info,reviewed[info.id]);
export const displayName=(info,car)=>info.custom?(car.name?.trim()||info.name):info.name;

const n = (key,label,min,max,step,unit,help='',extra={}) => ({key,label,min,max,step,unit,help,type:'number',...extra});
const b = (key,label,help='') => ({key,label,help,type:'boolean'});
const s = (key,label,options,help='') => ({key,label,options,help,type:'select'});
export const CASCO_KEYS=['cascoFirst','cascoNext','cascoLate','cascoYears'];
const cascoFields=()=>[
  n('cascoFirst','Каско · первый год',0,15,.1,'% цены покупки','Бюджет от исходной цены покупки, не от уменьшающейся страховой суммы. Это не персональная котировка страховщика.'),
  n('cascoNext','Каско · годы 2–5',0,15,.1,'% цены покупки'),
  n('cascoLate','Каско · с 6-го года',0,15,.1,'% цены покупки'),
  n('cascoYears','Сколько лет оформлять каско',0,15,1,'лет','0 отключает каско. Общие тарифы действуют для всех машин без индивидуального тарифа. Начальные ставки — допущения для полиса без франшизы.')
];
export const GENERAL_GROUPS = [
  {id:'main',title:'Условия владения',open:true,fields:[
    n('years','Срок владения',1,15,1,'лет','Быстрый выбор: 3, 5 или 8 лет. Остальные сроки также доступны; перепродажа между опорными возрастами интерполируется.'),
    n('km','Пробег в год',0,300000,1000,'км'),
    n('fuelPrice','Цена бензина',40,150,1,'₽/л'),
    n('resaleShift','Общая поправка к перепродаже',-30,30,1,'п.п.','От рыночной цены нового аналога. Не действует при ручной цене продажи.'),
    b('cascoEnabled','Покупка каско','Для всех машин, включая индивидуальные тарифы. Настроенные ставки сохраняются.'),
    b('includePurchase','Учесть цену покупки','При отключении стоимость машины не входит в расходы. Исходная цена для каско и оценки продажи сохраняется.'),
    b('includeSale','Учесть цену продажи','При отключении машина остаётся у вас: выручка и расходы на продажу не учитываются.'),
    n('serviceIntervalShift','Изменение интервала ТО',-50,100,5,'%','Минус — чаще, плюс — реже. −20%: 10 000 → 8 000 км и 12 → 9,6 месяца; +20%: 12 000 км и 14,4 месяца. Применяется к исходным интервалам каждой машины, включая первый визит. Нулевое ТО оплачивается один раз.')
  ]},
  {id:'extras',title:'Общие дополнительные расходы',fields:[
    ...cascoFields(),
    n('parking','Парковка',0,600000,6000,'₽/год'),n('wash','Мойки',0,120000,1000,'₽/год'),
    n('tolls','Платные дороги',0,300000,3000,'₽/год'),n('other','Прочие регулярные расходы',0,300000,3000,'₽/год'),
    n('oneOff','Разовые прочие расходы',0,1000000,10000,'₽'),n('oneOffYear','Год разовых расходов',1,15,1,'год')
  ]},
  {id:'finance',title:'Финансы и изменение цен',fields:[
    b('financial','Включить финансовый блок','При выключении все расходы считаются в постоянных ценах 2026 года, кредит и стоимость капитала не учитываются.'),
    s('moneyMode','Показывать суммы',[['real','В покупательной способности 2026 года'],['nominal','В будущих номинальных рублях']]),
    n('inflation','Общая инфляция',0,20,.5,'%/год','Для перевода номинальных платежей в рубли 2026 года.'),
    n('fuelGrowth','Рост цены топлива',-10,30,.5,'%/год'),n('serviceGrowth','Рост цен ТО, ремонта и шин',-10,30,.5,'%/год'),
    n('insuranceGrowth','Рост стоимости страховок',-10,30,.5,'%/год'),n('otherGrowth','Рост остальных расходов',-10,30,.5,'%/год'),
    n('taxGrowth','Изменение транспортного налога',-10,20,.5,'%/год','По умолчанию 0%: налог не растёт автоматически вместе с ценами. Возможное изменение закона — отдельный сценарий.'),
    n('resaleGrowth','Изменение рыночного уровня цен авто',-10,30,.5,'%/год','Индексирует будущую сумму продажи; возрастное удешевление учитывается отдельно.'),
    b('loanEnabled','Покупка в кредит','Кредитуется только цена автомобиля. Допоборудование и комиссии оплачиваются отдельно.'),
    n('downPayment','Первоначальный взнос',0,100,5,'%'),n('loanRate','Ставка кредита',0,40,.5,'%/год'),
    n('loanYears','Срок кредита',1,10,1,'лет'),n('loanFees','Дополнительные расходы на кредит',0,500000,5000,'₽','Единовременно при покупке; не ПСК. Страховки учитываются в собственных разделах.'),
    b('capitalEnabled','Оценить альтернативную доходность','Показывается отдельно и не добавляется повторно к стоимости владения.'),
    n('returnRate','Доходность вложений после налогов',0,30,.5,'%/год','Условная номинальная ставка. Это сценарий, не прогноз доходности вклада.')
  ]}
];
export const CAR_GROUPS = [
  {id:'customIdentity',title:'Твой автомобиль',open:true,customOnly:true,fields:[
    {key:'name',label:'Название автомобиля',type:'text',maxLength:60,help:'До 60 символов. Название появится в результатах, графике, выгрузке и сохранённом сценарии.'},
    b('enabled','Включить в сравнение','Все начальные числа условные. Уточните цену, расходы и перепродажу для своей машины.')
  ]},
  {id:'purchase',title:'Покупка и топливо',open:true,fields:[
    n('price','Фактическая цена покупки',0,15000000,25000,'₽','Скидка при покупке сама по себе не снижает будущую рыночную цену продажи.',{basis:'base'}),
    n('initialExtras','Оформление, оборудование, подготовка',0,1000000,500,'₽','В исходном расчёте 4 500 ₽: новые номера и обычное СТС при готовом ЭПТС. Допоборудование и услуги посредника добавьте отдельно. Не дублируйте стоимость зимних шин.'),
    n('fuel','Средний расход',3,25,.1,'л/100 км','Бюджетная оценка реального среднего расхода, не паспортный показатель.')
  ]},
  {id:'service',title:'ТО и независимый сервис',fields:[
    {...b('serviceUseSchedule','Использовать опубликованный прайс ТО','TENET T9: первые 10 регулярных ТО по программе производителя. Средняя цена ниже применяется только после конца таблицы; отключите переключатель для своего бюджета всех визитов.'),models:['tenet']},
    n('serviceEarly','Средняя цена ТО · первые 5 лет',0,150000,1000,'₽','Бюджет визита с работой, материалами и дорогими регламентными заменами. При включённом прайсе T9 применяется только за пределами опубликованной таблицы.'),
    n('serviceLate','Средняя цена ТО · с 6-го года',0,200000,1000,'₽','Оценка, не подтверждённый будущий тариф. Не включает поломки и нерегламентный износ.'),
    n('serviceKm','Интервал ТО по пробегу',5000,30000,1000,'км','После первого ТО. Подтверждённые регламенты и оговорки для каждой модели — в проверке данных. Для Azimut 15 000 км остаются гипотезой.'),
    n('serviceMonths','Интервал ТО по времени',3,24,1,'мес.','Исходный интервал до общей поправки. ТО происходит по тому ограничению, которое наступит раньше.'),
    n('serviceFirstKm','Первое регулярное ТО по пробегу',0,30000,1000,'км','0 — обычный интервал. Jolion: 10 000 км. Changan: первое обслуживание 5 000 км уже входит в число визитов.'),
    n('serviceFirstMonths','Первое регулярное ТО по времени',0,24,1,'мес.','0 — обычный интервал. Затем отсчёт начинается от выполненного ТО. Пробег условно равномерный.'),
    n('zeroService','Дополнительное нулевое ТО',0,100000,500,'₽','Сверх посчитанных визитов: T9 — рекомендованные 16 500 ₽, K50 — 11 880 ₽ по прайсу, X70 — бюджет 12 000 ₽. Начальное ТО GAC бесплатно. У Changan первое ТО уже считается визитом: второй раз не добавлять.'),
    n('independentYear','Переход в независимый сервис',1,16,1,'год','16 означает отсутствие перехода в пределах расчёта.'),
    n('independentDiscount','Снижение цены ТО в независимом сервисе',0,70,5,'%','По умолчанию 0% сохраняет прежний бюджет; дополнительную экономию можно задать вручную.')
  ]},
  {id:'repairs',title:'Износ и ремонт',fields:[
    n('repairEarly','Резерв · первые 5 лет',0,300000,5000,'₽/год','При 15 000 км/год. Нерегламентный износ: колодки, диски, щётки, аккумулятор, незастрахованные поломки. Не добавляйте сюда то, что оплачено в ТО, гарантией или страховщиком. Неизрасходованные деньги остаются у вас.'),
    n('repairLate','Резерв · с 6-го года',0,500000,5000,'₽/год','При базовом пробеге 15 000 км/год.'),
    n('repairMileage','Доля резерва, зависящая от пробега',0,100,5,'%'),
    n('largeRepair','Дополнительный крупный ремонт',0,1500000,10000,'₽','Сверх резерва, чтобы проверить отдельный неблагоприятный сценарий.'),
    n('largeRepairYear','Год крупного ремонта',1,15,1,'год')
  ]},
  {id:'tires',title:'Шины и сезонные расходы',fields:[
    s('tireMode','Как учитывать шины',[['purchases','Покупка комплектов по сроку и пробегу'],['reserve','Равномерный резерв · прежняя методика']],'По умолчанию первый летний комплект входит в цену машины, первый зимний оплачивается при покупке. Остальные — по мере износа; покупки непосредственно в момент продажи нет.'),
    b('winterIncluded','Первый зимний комплект уже включён в покупку','Не добавляет стоимость первого зимнего комплекта повторно в режиме покупок. Замены, шиномонтаж и хранение учитываются.'),
    n('summerPrice','Цена летнего комплекта',0,300000,5000,'₽'),n('winterPrice','Цена зимнего комплекта',0,300000,5000,'₽'),
    n('summerKm','Ресурс летнего комплекта',10000,100000,5000,'км'),n('winterKm','Ресурс зимнего комплекта',10000,100000,5000,'км'),
    n('summerYears','Предельный возраст летних шин',1,10,1,'лет'),n('winterYears','Предельный возраст зимних шин',1,10,1,'лет'),
    n('summerShare','Доля пробега на летних шинах',0,100,5,'%'),
    n('mount','Стоимость одной смены шин',0,20000,500,'₽'),n('changes','Смен шин в год',0,4,1,'раза'),n('storage','Хранение шин',0,60000,1000,'₽/год')
  ]},
  {id:'insurance',title:'Страховки и налог',fields:[
    b('overrideCasco','Свой тариф каско для этой машины','По умолчанию используются тарифы из раздела «Общие дополнительные расходы». При включении общие значения копируются сюда, затем их можно изменить.'),
    ...cascoFields(),
    n('osago','ОСАГО',0,100000,1000,'₽/год','22 000 ₽ — одинаковый условный бюджет, не расчёт для водителя 35 лет без стажа. Нужна персональная котировка; изменение КБМ и стажа по годам не моделируется.'),n('tax','Транспортный налог',0,150000,500,'₽/год','За полный год в Москве без льгот: мощность × региональная ставка. Для Azimut условно принят мотор 132 л.с. Будущие изменения закона не прогнозируются.')
  ]},
  {id:'resale',title:'Перепродажа',fields:[
    s('resaleMode','Способ расчёта',[['auto','Прогноз по возрасту и пробегу'],['manual','Задать сумму вручную']]),
    n('referencePrice','Рыночная цена нового аналога',100000,15000000,25000,'₽','Основа оценки перепродажи; независима от вашей скидки при покупке.',{basis:'base'}),
    n('retention3','Цена через 3 года до торга',0,100,1,'% цены нового','Доля рыночной цены нового аналога при пробеге 15 000 км/год. Условное начальное значение — 70%.',{customOnly:true}),
    n('retention5','Цена через 5 лет до торга',0,100,1,'% цены нового','Условное начальное значение — 55%. Между опорными возрастами цена интерполируется.',{customOnly:true}),
    n('retention8','Цена через 8 лет до торга',0,100,1,'% цены нового','Условное начальное значение — 40%. После восьми лет действует настройка ежегодного удешевления.',{customOnly:true}),
    n('manualSale','Ручная цена продажи до торга',0,15000000,25000,'₽','В рублях 2026 года. При изменении срока и пробега эта сумма не меняется.'),
    n('individualShift','Индивидуальная поправка к прогнозу',-30,30,1,'п.п.','Добавляется к общей поправке; только в автоматическом режиме.'),
    n('mileagePenalty','Снижение цены за лишние 1 000 км',0,2,.05,'%','Относительно 15 000 км в год. Экспоненциальная поправка; допущение, не статистика.'),
    n('tailDepreciation','Удешевление после 8-го года',0,30,1,'%/год'),
    n('bargain','Торг от цены объявления',0,30,1,'%','Исходные 5% уже вычтены в опубликованном базовом прогнозе. Повторного вычета нет.'),
    n('urgentDiscount','Дополнительная скидка за срочность',0,40,1,'%','После торга; например, при срочном выкупе.'),
    n('saleCommission','Комиссия при продаже',0,20,.5,'%'),n('saleFixed','Разовые расходы при продаже',0,300000,5000,'₽')
  ]},
  {id:'extraOverrides',title:'Индивидуальные дополнительные расходы',fields:[
    b('overrideExtras','Задать расходы для этой машины','Иначе используются общие настройки парковки, моек и прочих расходов.'),
    n('parking','Парковка',0,600000,6000,'₽/год'),n('wash','Мойки',0,120000,1000,'₽/год'),n('tolls','Платные дороги',0,300000,3000,'₽/год'),
    n('other','Прочие регулярные расходы',0,300000,3000,'₽/год'),n('oneOff','Разовые прочие расходы',0,1000000,10000,'₽'),n('oneOffYear','Год разовых расходов',1,15,1,'год')
  ]},
  {id:'loanOverrides',title:'Индивидуальные условия кредита',fields:[
    b('overrideLoan','Задать кредит для этой машины','Работает при включённом общем финансовом блоке и кредите.'),
    n('downPayment','Первоначальный взнос',0,100,5,'%'),n('loanRate','Ставка кредита',0,40,.5,'%/год'),
    n('loanYears','Срок кредита',1,10,1,'лет'),n('loanFees','Дополнительные расходы на кредит',0,500000,5000,'₽')
  ]}
];

export function defaultState(){
  const general={years:5,km:15000,fuelPrice:77,resaleShift:0,parking:0,wash:18000,tolls:0,other:0,oneOff:0,oneOffYear:1,
    cascoEnabled:true,includePurchase:true,includeSale:true,serviceIntervalShift:0,cascoFirst:6,cascoNext:3.5,cascoLate:2.5,cascoYears:15,
    financial:false,moneyMode:'real',inflation:5,fuelGrowth:5,serviceGrowth:5,insuranceGrowth:5,otherGrowth:5,taxGrowth:0,resaleGrowth:5,
    loanEnabled:false,downPayment:50,loanRate:10,loanYears:3,loanFees:0,capitalEnabled:false,returnRate:10};
  const cars={};
  for(const c of CAR_INFO)cars[c.id]={enabled:!c.custom,price:c.reference,referencePrice:c.reference,initialExtras:4500,fuel:c.fuel,
    serviceEarly:c.service,serviceLate:c.lateService,serviceKm:c.serviceKm??15000,serviceMonths:c.serviceMonths??12,serviceFirstKm:c.serviceFirstKm??0,serviceFirstMonths:c.serviceFirstMonths??0,serviceUseSchedule:!!c.servicePrices,zeroService:c.zeroService??0,independentYear:6,independentDiscount:0,
    repairEarly:25000,repairLate:78333.33333333333,repairMileage:50,largeRepair:0,largeRepairYear:6,
    tireMode:'purchases',winterIncluded:false,summerPrice:c.summer,winterPrice:c.winter,summerKm:40000,winterKm:40000,summerYears:5,winterYears:5,summerShare:50,mount:c.mount,changes:2,storage:0,
    overrideCasco:false,cascoFirst:6,cascoNext:3.5,cascoLate:2.5,cascoYears:15,osago:22000,tax:c.tax,
    resaleMode:'auto',manualSale:c.sale5/.95,individualShift:0,mileagePenalty:.3,tailDepreciation:9,bargain:5,urgentDiscount:0,saleCommission:0,saleFixed:0,
    overrideExtras:false,parking:0,wash:18000,tolls:0,other:0,oneOff:0,oneOffYear:1,
    overrideLoan:false,downPayment:50,loanRate:10,loanYears:3,loanFees:0};
  Object.assign(cars.custom,{name:'Твой автомобиль',retention3:70,retention5:55,retention8:40});
  return {version:VERSION,needsReview:false,general,cars};
}
export const FIELDS = {
  general:Object.fromEntries(GENERAL_GROUPS.flatMap(g=>g.fields).map(f=>[f.key,f])),
  car:Object.fromEntries(CAR_GROUPS.flatMap(g=>g.fields).map(f=>[f.key,f]))
};
export const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
export function coerce(field,value,fallback){
  if(field.type==='text')return typeof value==='string'?value.replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,field.maxLength):fallback;
  if(field.type==='boolean')return typeof value==='boolean'?value:fallback;
  if(field.type==='select')return field.options.some(([k])=>k===value)?value:fallback;
  if(typeof value!=='number'||!Number.isFinite(value))return fallback;
  const v=clamp(value,field.min,field.max);
  return field.step>=1&&['years','serviceMonths','serviceFirstMonths','independentYear','largeRepairYear','summerYears','winterYears','changes','cascoYears','oneOffYear','loanYears'].includes(field.key)?Math.round(v):v;
}
export function normalizeState(input){
  const out=defaultState();
  if(!input||typeof input!=='object')return out;
  out.needsReview=input.needsReview===true||input.version===2;
  // Existing links and named scenarios must retain their original car selection.
  if([2,3].includes(input.version)&&!Object.hasOwn(input.cars??{},'granta'))out.cars.granta.enabled=false;
  if(input.version===2){
    Object.assign(out.general,LEGACY_V2.general,{taxGrowth:coerce(FIELDS.general.taxGrowth,input.general?.otherGrowth,5)});
    for(const info of CAR_INFO)if(LEGACY_V2.cars[info.id])Object.assign(out.cars[info.id],LEGACY_V2.cars[info.id],{tireMode:'reserve',serviceFirstKm:0,serviceFirstMonths:0,serviceUseSchedule:false});
  }
  for(const [key,field] of Object.entries(FIELDS.general))if(Object.hasOwn(input.general??{},key))out.general[key]=coerce(field,input.general[key],out.general[key]);
  for(const c of CAR_INFO){const source=input.cars?.[c.id];if(!source||typeof source!=='object')continue;
    // Older saved scenarios have individual CASCO values without an override flag.
    const legacyCasco=!Object.hasOwn(source,'overrideCasco')&&CASCO_KEYS.some(key=>Object.hasOwn(source,key)&&coerce(FIELDS.car[key],source[key],out.cars[c.id][key])!==out.cars[c.id][key]);
    if(typeof source.enabled==='boolean')out.cars[c.id].enabled=source.enabled;
    for(const [key,field] of Object.entries(FIELDS.car))if(Object.hasOwn(out.cars[c.id],key)&&Object.hasOwn(source,key))out.cars[c.id][key]=coerce(field,source[key],out.cars[c.id][key]);
    if(legacyCasco)out.cars[c.id].overrideCasco=true;
  }
  return out;
}
export const CATEGORY_LABELS={purchase:'Покупка автомобиля',equipment:'Оформление и оборудование',fuel:'Топливо',service:'Плановое ТО',repairs:'Резерв и крупный ремонт',tires:'Шины, смена, хранение',casco:'Каско',osago:'ОСАГО',tax:'Транспортный налог',parking:'Парковка',wash:'Мойки',tolls:'Платные дороги',other:'Прочие расходы',finance:'Проценты и расходы на кредит',saleCosts:'Расходы при продаже'};
const emptyCategories=()=>Object.fromEntries(Object.keys(CATEGORY_LABELS).map(k=>[k,0]));
const sum=o=>Object.values(o).reduce((a,b)=>a+b,0);

export function loanSchedule(principal,rate,years,horizon){
  const months=years*12,r=rate/1200;
  const payment=principal===0?0:r===0?principal/months:principal*r/(1-(1+r)**(-months));
  const rows=Array.from({length:horizon},()=>({principal:0,interest:0,payment:0,settlement:0}));
  let balance=principal;
  for(let m=1;m<=Math.min(months,horizon*12);m++){
    const interest=balance*r;
    const amortization=Math.min(balance,Math.max(0,payment-interest));
    balance=Math.max(0,balance-amortization);
    const row=rows[Math.floor((m-1)/12)];row.principal+=amortization;row.interest+=interest;row.payment+=amortization+interest;
  }
  const remaining=balance;
  if(balance>1e-6)rows[horizon-1].settlement=balance;
  return {payment,rows,remaining,interest:rows.reduce((a,b)=>a+b.interest,0)};
}

export function resale(info,car,g,years=g.years){
  let quote;
  if(car.resaleMode==='manual')quote=car.manualSale;
  else{
    const anchors=info.custom?[[0,car.referencePrice],[3,car.referencePrice*car.retention3/100],[5,car.referencePrice*car.retention5/100],[8,car.referencePrice*car.retention8/100]]:[[0,info.reference],...info.anchors,[5,info.sale5/.95],[8,info.sale8/.95]].sort((a,b)=>a[0]-b[0]);
    if(years>8)quote=anchors.at(-1)[1]*(1-car.tailDepreciation/100)**(years-8);
    else{
      const right=anchors.findIndex(a=>a[0]>=years);
      const [x1,y1]=anchors[Math.max(0,right-1)],[x2,y2]=anchors[Math.max(0,right)];
      const fraction=x1===x2?1:(years-x1)/(x2-x1);
      quote=x1===x2?y2:y1>0&&y2>0?y1*(y2/y1)**fraction:y1+(y2-y1)*fraction;
    }
    if(!info.custom)quote*=car.referencePrice/info.reference;
    quote*=Math.exp(-car.mileagePenalty/100*((g.km-15000)*years/1000));
    quote=clamp(quote,0,car.referencePrice);
  }
  let afterBargain=quote*(1-car.bargain/100);
  if(car.resaleMode==='auto')afterBargain+=car.referencePrice*(g.resaleShift+car.individualShift)/100;
  afterBargain=Math.max(0,afterBargain)*(1-car.urgentDiscount/100);
  const fees=afterBargain*car.saleCommission/100+car.saleFixed;
  return {quote,gross:afterBargain,fees,net:afterBargain-fees};
}

export function maintenanceIntervals(car,g){
  const factor=1+(g.serviceIntervalShift??0)/100;
  return {km:car.serviceKm*factor,months:car.serviceMonths*factor,firstKm:(car.serviceFirstKm||car.serviceKm)*factor,firstMonths:(car.serviceFirstMonths||car.serviceMonths)*factor};
}

export function calculateCar(info,car,g){
  const years=g.years;
  const includePurchase=g.includePurchase!==false,includeSale=g.includeSale!==false;
  const growth=(rate,year)=>g.financial?(1+rate/100)**year:1;
  const divisor=year=>g.financial&&g.moneyMode==='real'?(1+g.inflation/100)**year:1;
  const extra=car.overrideExtras?car:g;
  const casco=car.overrideCasco?car:g;
  const loan=car.overrideLoan?car:g;
  const useLoan=g.financial&&g.loanEnabled;
  const principal=useLoan?car.price*(1-loan.downPayment/100):0;
  const schedule=loanSchedule(principal,loan.loanRate,loan.loanYears,years);
  const upfront=emptyCategories();upfront.purchase=includePurchase?car.price-principal:0;upfront.equipment=car.initialExtras;
  if(car.tireMode==='purchases'&&!car.winterIncluded&&car.summerShare<100)upfront.tires=car.winterPrice;
  upfront.finance=useLoan?loan.loanFees:0;
  const nominalRows=[{year:0,categories:upfront,sale:0,serviceCount:0,debtSettlement:0}];
  const intervals=maintenanceIntervals(car,g);
  const servicePeriod=Math.min(intervals.months,g.km>0?12*intervals.km/g.km:Infinity);
  const firstService=Math.min(intervals.firstMonths,g.km>0?12*intervals.firstKm/g.km:Infinity);
  const servicesBy=month=>month+1e-8<firstService?0:1+Math.floor((month-firstService+1e-8)/servicePeriod);
  const summerAnnual=car.summerPrice*Math.max(1/car.summerYears,g.km*car.summerShare/100/car.summerKm);
  const winterAnnual=car.winterPrice*Math.max(1/car.winterYears,g.km*(1-car.summerShare/100)/car.winterKm);
  const tireAnnual=summerAnnual+winterAnnual+car.mount*car.changes+car.storage;
  const replacementsBy=(year,life)=>Math.max(0,Math.ceil(year/life-1e-9)-1);
  const tirePurchases=(year,price,share,km,age)=>{
    if(share===0)return 0;
    const life=Math.min(age,g.km>0?km/(g.km*share):Infinity);
    return price*(replacementsBy(year,life)-replacementsBy(year-1,life));
  };
  const resaleBase=resale(info,car,g);
  for(let year=1;year<=years;year++){
    const cat=emptyCategories();
    const firstVisit=servicesBy((year-1)*12),lastVisit=servicesBy(year*12),serviceCount=lastVisit-firstVisit;
    const servicePrice=year<=5?car.serviceEarly:car.serviceLate;
    const discount=year>=car.independentYear?1-car.independentDiscount/100:1;
    const repairFactor=(1-car.repairMileage/100)+(car.repairMileage/100)*(g.km/15000);
    cat.fuel=g.km/100*car.fuel*g.fuelPrice*growth(g.fuelGrowth,year);
    let visitsCost=0;
    for(let visit=firstVisit;visit<lastVisit;visit++)visitsCost+=car.serviceUseSchedule?(info.servicePrices?.[visit]??servicePrice):servicePrice;
    cat.service=(visitsCost*discount+(year===1?car.zeroService:0))*growth(g.serviceGrowth,year);
    cat.repairs=((year<=5?car.repairEarly:car.repairLate)*repairFactor+(year===car.largeRepairYear?car.largeRepair:0))*growth(g.serviceGrowth,year);
    cat.tires=(car.tireMode==='reserve'?tireAnnual:tirePurchases(year,car.summerPrice,car.summerShare/100,car.summerKm,car.summerYears)+tirePurchases(year,car.winterPrice,1-car.summerShare/100,car.winterKm,car.winterYears)+car.mount*car.changes+car.storage)*growth(g.serviceGrowth,year);
    const cascoRate=year===1?casco.cascoFirst:year<=5?casco.cascoNext:casco.cascoLate;
    cat.casco=(g.cascoEnabled!==false&&year<=casco.cascoYears?car.price*cascoRate/100:0)*growth(g.insuranceGrowth,year);
    cat.osago=car.osago*growth(g.insuranceGrowth,year);cat.tax=car.tax*growth(g.taxGrowth,year);
    for(const key of ['parking','wash','tolls','other'])cat[key]=extra[key]*growth(g.otherGrowth,year);
    if(year===extra.oneOffYear)cat.other+=extra.oneOff*growth(g.otherGrowth,year);
    const l=schedule.rows[year-1],settlement=includeSale?l.settlement:0;
    cat.purchase=includePurchase?l.principal+settlement:0;cat.finance=l.interest;
    let sale=0;
    if(includeSale&&year===years){sale=resaleBase.gross*growth(g.resaleGrowth,year);cat.saleCosts=resaleBase.fees*growth(g.resaleGrowth,year);}
    nominalRows.push({year,categories:cat,sale,serviceCount,debtSettlement:includePurchase?settlement:0});
  }
  const categories=emptyCategories();let nominalCash=0,cash=0,sale=0,cumulative=0;
  const rows=nominalRows.map(row=>{
    const d=divisor(row.year),current=Object.fromEntries(Object.entries(row.categories).map(([k,v])=>[k,v/d]));
    for(const k of Object.keys(categories))categories[k]+=current[k];
    const expenses=sum(current),proceeds=row.sale/d;cumulative+=expenses;cash+=expenses;sale+=proceeds;nominalCash+=sum(row.categories)-row.sale;
    return {...row,categories:current,sale:proceeds,expenses,net:expenses-proceeds,cumulative,debtSettlement:row.debtSettlement/d};
  });
  const tco=cash-sale;
  let capital=0;
  if(g.financial&&g.capitalEnabled){
    const futureValue=nominalRows.reduce((total,row)=>total+(sum(row.categories)-row.sale)*(1+g.returnRate/100)**(years-row.year),0);
    capital=(futureValue-nominalCash)/divisor(years);
  }
  const operating=sum(Object.fromEntries(Object.entries(categories).filter(([k])=>!['purchase','equipment','finance','saleCosts'].includes(k))));
  return {id:info.id,name:displayName(info,car),trim:info.trim,color:info.color,years,km:g.km*years,tco,cash,sale,saleNet:sale-categories.saleCosts,
    annual:tco/years,monthly:tco/years/12,perKm:g.km===0?null:tco/(g.km*years),categories,operating,rows,capital,
    loanPayment:useLoan?schedule.payment:0,loanRemaining:useLoan?schedule.remaining:0,loanInterest:useLoan?schedule.interest:0,referenceSale:resaleBase};
}
export function calculate(input){const state=normalizeState(input);return CAR_INFO.filter(c=>state.cars[c.id].enabled).map(c=>calculateCar(c,state.cars[c.id],state.general));}

export function builtInScenarios(){
  const base=defaultState();
  const rare=defaultState();rare.general.km=8000;rare.general.years=8;
  const trips=defaultState();trips.general.km=25000;trips.general.tolls=30000;
  return [{id:'base',name:'Исходный расчёт',state:base},{id:'rare',name:'Редкие поездки',state:rare},{id:'trips',name:'Много путешествий',state:trips}];
}
export function stateDelta(input){
  const state=normalizeState(input),base=defaultState(),out={version:VERSION,needsReview:state.needsReview,general:{},cars:{}};
  for(const k of Object.keys(base.general))if(state.general[k]!==base.general[k])out.general[k]=state.general[k];
  for(const info of CAR_INFO){
    const changed={};for(const k of Object.keys(base.cars[info.id]))if(state.cars[info.id][k]!==base.cars[info.id][k])changed[k]=state.cars[info.id][k];
    // Preserve an explicit false for dormant values so legacy migration cannot enable them.
    if(CASCO_KEYS.some(key=>Object.hasOwn(changed,key)))changed.overrideCasco=state.cars[info.id].overrideCasco;
    if(Object.keys(changed).length)out.cars[info.id]=changed;
  }
  return out;
}
