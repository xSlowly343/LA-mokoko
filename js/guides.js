// Гайды. Правило: каждый факт — из источника в data/sources.json, с датой.
// Если факта нет в источниках — не пишем его, а говорим «проверьте в игре».

export const GUIDES = [
  {
    id: 'outdated',
    cover: 'assets/bosses/kamen-poster.webp',
    title: 'Старые гайды врут: что убрали и поменяли',
    tag: 'Важно',
    icon: '⚠',
    minutes: 3,
    updated: '2026-11-20',
    summary: 'Системы и режимы, которых больше нет в РУ-версии. Если гайд про них — он устарел.',
    sources: ['changelist', 'news-2500', 'news-2702', 'news-2701'],
    body: `
<p>Lost Ark сильно поменялся в 2025–2026 годах. Многие видео и статьи в интернете описывают то, чего в игре уже нет. Перед тем как следовать гайду, посмотрите на его дату и сверьте с этим списком.</p>

<h3>Удалено</h3>
<div class="timeline">
  <div class="tl-item"><div class="tl-date">17.12.2025</div><div class="tl-body"><b>Трансценденция и эликсиры</b> — системы удалены в обновлении «Снеговейные чудеса».<span class="src" data-src="changelist"></span></div></div>
  <div class="tl-item"><div class="tl-date">11.02.2026</div><div class="tl-body">С обновлением «Наследница Хранителя» удалены: <b>«Дневник бойца»</b>, <b>Колизей</b>, <b>Башни испытаний</b>, <b>«Крепость Кенуа»</b>, <b>«Тренировка»</b>, <b>«Мококомпендиум»</b>.<span class="src" data-src="changelist"></span></div></div>
  <div class="tl-item"><div class="tl-date">18.11.2026</div><div class="tl-body">В экстремальных версиях рейдов «Акт III» и «Финал» <b>нет кошмарной сложности</b>.<span class="src" data-src="news-2702"></span></div></div>
  <div class="tl-item"><div class="tl-date">18.11.2026</div><div class="tl-body">Убраны анимации призыва транспорта — призыв теперь мгновенный, валюту за них компенсировали.<span class="src" data-src="news-2701"></span></div></div>
</div>

<h3>Переработано (цифры из старых гайдов не годятся)</h3>
<ul>
  <li><b>11.02.2026</b> — переработаны награды за Чертоги Хаоса, Крузанские фронты, рейды на Хранителей, Разломы Хаоса и мировых боссов; скорректировано золото за активности; упрощены механики «Акт I», «Акт III», «Пролога» и «Финала». Попытка улучшения кармы стоит 900 золотых (было 1100).<span class="src" data-src="news-2500"></span></li>
  <li><b>10.06.2026</b> — скорректировано золото за эндгейм-контент.<span class="src" data-src="changelist"></span></li>
  <li><b>16.09.2026</b> — переработана прогрессия снаряжения 3-го ранга; изменены количество золота и стоимость дополнительных наград за некоторые активности.<span class="src" data-src="changelist"></span></li>
</ul>

<div class="callout">Мококо советует: если в гайде упоминается что-то из списка «Удалено» — закрывайте его. Если гайд старше сентября 2026 и в нём есть цифры золота — цифры, скорее всего, уже другие.</div>
`
  },
  {
    id: 'gold-basics',
    cover: 'assets/bosses/kazeros-poster.webp',
    title: 'Золото: обычное, персональное и экстрим-рейды',
    tag: 'Экономика',
    icon: '◉',
    minutes: 3,
    updated: '2026-11-20',
    summary: 'Чем персональное золото отличается от обычного и почему экстрим-рейд — отдельная строка дохода.',
    sources: ['wiki-currency', 'changelist', 'news-2695', 'news-2613'],
    body: `
<h3>Два вида золота</h3>
<div class="cards2">
  <div class="mini-card"><div class="mc-ico gold">◉</div><b>Обычное золото</b><p>Общее на Наследие — им может пользоваться любой ваш персонаж.<span class="src" data-src="wiki-currency"></span></p></div>
  <div class="mini-card"><div class="mc-ico bound">◉</div><b>Персональное золото</b><p>Может использовать только тот персонаж, который его заработал.<span class="src" data-src="wiki-currency"></span> Например, всё золото из «Сакра-Финистрии» — персональное (с 17.06.2026).<span class="src" data-src="changelist"></span></p></div>
</div>

<h3>Экстрим-рейды Казероса</h3>
<ul>
  <li>Вход и награда — <b>1 раз в неделю на Наследие</b>, а не на каждого персонажа.</li>
  <li>Награда <b>не учитывается в лимите золота персонажа</b> и выдаётся, даже если персонаж не назначен получателем.<span class="src" data-src="news-2695"></span></li>
  <li>«Акт III» (18.11–16.12.2026): обычный — 20 000, героический — 50 000 золота за босса. На момент анонса (11.11.2026) контент был в тестировании, так что сверьте с превью наград.<span class="src" data-src="news-2695"></span></li>
</ul>

<h3>Чего мы пока не знаем точно</h3>
<p>Сколько золота даёт каждый рейд, смотрите в превью наград в окне входа и в официальной таблице Энциклопедии lostark.ru.</p>
`
  },
  {
    id: 'gold-howto',
    cover: 'assets/items/use_13_34.webp',
    title: 'Как заработать золото',
    tag: 'Экономика',
    icon: '◉',
    minutes: 5,
    updated: '2026-11-20',
    summary: 'Все источники золота по официальной Энциклопедии и новостям: рейды, экстримы, события, биржа.',
    sources: ['wiki-currency', 'wiki-exchange', 'wiki-single', 'news-2695', 'news-2699', 'changelist', 'news-2500'],
    body: `
<h3>Три вида золота</h3>
<div class="cards3">
  <div class="mini-card"><img class="mc-img" src="assets/items/use_13_34.webp" alt=""><b class="hl-gold">Обычное</b><p>Общее на Наследие, им пользуется любой ваш персонаж.<span class="src" data-src="wiki-currency"></span></p></div>
  <div class="mini-card"><img class="mc-img" src="assets/items/use_13_34.webp" alt="" style="filter:hue-rotate(220deg)"><b class="hl-purple">Персональное</b><p>Тратит только персонаж, который его заработал. Основной источник — «Инферно» Пантеона героев.<span class="src" data-src="wiki-currency"></span></p></div>
  <div class="mini-card"><img class="mc-img" src="assets/items/use_13_34.webp" alt="" style="filter:grayscale(1)"><b class="hl-blue">Лимитированное</b><p>За одиночные рейды и события. Это не эквивалент обычного золота, им нельзя оплачивать списания.<span class="src" data-src="wiki-currency"></span></p></div>
</div>

<h3>Откуда берётся обычное золото</h3>
<ul class="icon-list">
  <li><iconify-icon icon="game-icons:crossed-swords"></iconify-icon><span><b>Рейды</b> обычного и героического режима — главный источник. Сколько даёт каждый рейд, смотрите в окне входа и в разделе <a href="#/bosses">«Рейды по ГС»</a>.<span class="src" data-src="wiki-currency"></span></span></li>
  <li><iconify-icon icon="game-icons:present"></iconify-icon><span><b>«Подарки Судьбы»</b> — в активностях выше 1580 уровня снаряжения.<span class="src" data-src="wiki-currency"></span></span></li>
  <li><iconify-icon icon="game-icons:compass"></iconify-icon><span><b>Острова Компаса Процея.</b><span class="src" data-src="wiki-currency"></span></span></li>
  <li><iconify-icon icon="game-icons:shaking-hands"></iconify-icon><span><b>Торговля с игроками</b> и некоторые задания.<span class="src" data-src="wiki-currency"></span></span></li>
</ul>

<h3>Золото сверх недельного лимита</h3>
<ul class="icon-list">
  <li><iconify-icon icon="game-icons:fire-ring"></iconify-icon><span><b>Экстрим «Акт III»</b> (18.11–16.12.2026): 20 000 на обычном и 50 000 на героическом, раз в неделю на Наследие. Не учитывается в лимите персонажа.<span class="src" data-src="news-2695"></span></span></li>
  <li><iconify-icon icon="game-icons:hourglass"></iconify-icon><span><b>«Эхо погибели»</b> (до 13.01.2027): слиток на 10 000 (обычный) или 20 000 (героический) за первое прохождение каждого из 6 этапов, на каждого персонажа. Лимит золота не действует.<span class="src" data-src="news-2699"></span></span></li>
  <li><iconify-icon icon="game-icons:cupcake"></iconify-icon><span><b>«Легион вкусняшек»</b> (до 16.12.2026): «Золотой пирожок» может дать слиток на 10 000–300 000 <span class="hl-purple">персонального</span> золота.<span class="src" data-src="news-2699"></span></span></li>
</ul>

<h3>Биржа: кристаллы ↔ золото</h3>
<p>На бирже можно продавать кристаллы за золото и наоборот. Конвертация кристаллов в золото — без комиссии, а рекомендуемая ставка считается по самым выгодным предложениям на бирже.<span class="src" data-src="wiki-exchange"></span></p>

<h3>Подводные камни</h3>
<ul>
  <li><b>Одиночный режим</b> даёт меньше золота и больше ресурсов.<span class="src" data-src="wiki-single"></span></li>
  <li>Со старых рейдов золото <b>перестаёт начисляться</b> после определённого уровня: Волдан и Белакис — с 1600, Ку-Сатот — с 1610, Аврельсуд (Владыка) — с 1620.<span class="src" data-src="wiki-single"></span></li>
  <li>Всё золото из «Собора Сакра-Финистриа» — <span class="hl-purple">персональное</span> (с 17.06.2026).<span class="src" data-src="changelist"></span></li>
  <li>Золото за рейды меняли 10.06 и 16.09.2026 — <b>цифры из старых гайдов не годятся</b>.<span class="src" data-src="changelist"></span></li>
</ul>
`
  },
  {
    id: 'materials',
    cover: 'assets/items/use_13_249.webp',
    title: 'Где брать материалы и предметы',
    tag: 'Экономика',
    icon: '⚒',
    minutes: 5,
    updated: '2026-11-20',
    summary: 'Кристаллы и камни судьбы, руниты, манжеты — откуда они берутся по официальным новостям.',
    sources: ['news-2681', 'news-2546', 'news-2676', 'news-2612', 'news-2699', 'news-2500', 'wiki-currency'],
    body: `
<h3>Материалы для закалки</h3>
<div class="item-row">
  <img src="assets/items/use_13_249.webp" alt="" title="Оружейный кристалл судьбы"><img src="assets/items/use_13_250.webp" alt="" title="Защитный кристалл судьбы">
  <img src="assets/items/use_13_251.webp" alt="" title="Большой камень судьбы"><img src="assets/items/use_12_92.webp" alt="" title="Мешочек с осколками судьбы">
</div>
<p><b>Оружейные и защитные кристаллы судьбы, большие камни судьбы, осколки судьбы.</b></p>
<ul class="icon-list">
  <li><iconify-icon icon="game-icons:spiked-dragon-head"></iconify-icon><span><b>Мировой босс</b> — с 1770 уровня выпадает больше материалов для закалки (кристаллов судьбы и больших камней судьбы).<span class="src" data-src="news-2681"></span></span></li>
  <li><iconify-icon icon="game-icons:portal"></iconify-icon><span><b>Разломы Хаоса</b> — с 21.10.2026 добавлена новая сложность для 1770+.<span class="src" data-src="news-2681"></span></span></li>
  <li><iconify-icon icon="game-icons:magic-portal"></iconify-icon><span><b>Брешь Хаоса</b> — с 1730 уровня после обучающего задания. Награды персональные: материалы закалки, руниты и с шансом «Подарки судьбы» — в том числе сундуки с <b>передаваемыми</b> материалами.<span class="src" data-src="news-2546"></span></span></li>
  <li><iconify-icon icon="game-icons:hourglass"></iconify-icon><span><b>События</b> — например, «Эхо погибели» даёт кристаллы и камни судьбы за каждый этап (подробности в <a href="#/events">«Событиях»</a>).<span class="src" data-src="news-2699"></span></span></li>
</ul>

<h3>Руниты</h3>
<div class="item-row"><img src="assets/items/shop_icon_9963.webp" alt="" title="Сундук с эпическим рунитом"><img src="assets/items/use_13_201.webp" alt="" title="Сертификат на сброс рунита"></div>
<ul class="icon-list">
  <li><iconify-icon icon="game-icons:magic-portal"></iconify-icon><span><b>Брешь Хаоса</b>.<span class="src" data-src="news-2546"></span></span></li>
  <li><iconify-icon icon="game-icons:fire-ring"></iconify-icon><span>Награды за первые прохождения экстримов и событий («Эхо погибели», «Падение Бельгардина»).<span class="src" data-src="news-2695"></span></span></li>
</ul>

<h3>Персональное золото и «Инферно»</h3>
<p>«Инферно» Пантеона героев — главный источник <span class="hl-purple">персонального золота</span>.<span class="src" data-src="wiki-currency"></span> Ключи и награды режима менялись по сезонам Пантеона — сверяйтесь с окном Пантеона в игре.</p>

<h3>Манжеты (новый слот)</h3>
<p>Выдаются за первое прохождение 2-й фазы «Бельгардина» на любой сложности, слот открывается с 1750. Для закалки нужны осколки судьбы, оружейные и защитные кристаллы, большие камни судьбы и огромный авидорский кристалл.<span class="src" data-src="news-2676"></span></p>

<h3>Что важно помнить</h3>
<ul>
  <li><b>Энергию эсдо</b> не получить в одиночном режиме и в «Экспедиции».<span class="src" data-src="news-2612"></span></li>
  <li>Попытки входа в одиночный и другие режимы рейда <b>общие</b> для персонажа.<span class="src" data-src="news-2612"></span></li>
  <li>Награды за Чертоги Хаоса, Крузанские фронты, рейды на Хранителей, Разломы Хаоса и мировых боссов переработаны 11.02.2026 — старые таблицы наград не годятся.<span class="src" data-src="news-2500"></span></li>
</ul>
<p class="muted" style="font-size:12px">Иконки предметов: lostarkcodex.com.</p>
`
  },
  {
    id: 'classes-new',
    cover: 'assets/bosses/belgardin-poster.webp',
    title: 'Новые классы 2025–2026',
    tag: 'Классы',
    icon: '✸',
    minutes: 2,
    updated: '2026-11-20',
    summary: 'Какие классы добавили в РУ-версию и когда. Подробные карточки — в следующих версиях сайта.',
    sources: ['history'],
    body: `
<div class="timeline">
  <div class="tl-item"><div class="tl-date">26.02.2025</div><div class="tl-body"><b>Друид</b> — обновление «Духи Реймьярка».<span class="src" data-src="history"></span></div></div>
  <div class="tl-item"><div class="tl-date">20.08.2025</div><div class="tl-body"><b>Храмовница</b> — обновление «Путь Света».<span class="src" data-src="history"></span></div></div>
  <div class="tl-item"><div class="tl-date">11.02.2026</div><div class="tl-body"><b>Рыцарь-Хранитель</b> — обновление «Наследница Хранителя».<span class="src" data-src="history"></span></div></div>
  <div class="tl-item"><div class="tl-date">16.09.2026</div><div class="tl-body"><b>Хрономант</b> — обновление «Повелитель времени».<span class="src" data-src="history"></span></div></div>
</div>
<div class="callout">Баланс классов меняется почти каждый месяц (последний раз — 18.11.2026). Карточки классов с ролями и советами появятся, когда соберём проверенные источники по каждому.</div>
`
  },
  {
    id: 'updates',
    cover: 'assets/bosses/zerka-poster.webp',
    title: 'Летопись обновлений 2025–2026',
    tag: 'Справка',
    icon: '❖',
    minutes: 3,
    updated: '2026-11-20',
    summary: 'Все обновления РУ-версии по датам — чтобы понимать, насколько свеж гайд, который вы читаете.',
    sources: ['history', 'news-2659'],
    body: `
<div class="timeline">
  <div class="tl-item now"><div class="tl-date">18.11.2026</div><div class="tl-body"><b>«Забытые легенды»</b> — экстрим Казерос «Акт III», Боевой Пропуск «Забытые легенды» (до 13.01.2027), события «Возвращение Легиона вкусняшек» и «Эхо погибели», баланс классов.</div></div>
  <div class="tl-item"><div class="tl-date">21.10.2026</div><div class="tl-body"><b>«Бельгардин»</b> — рейд Теней «Бельгардин, Длань смерти», события «Аркландия» и «Падение Бельгардина».</div></div>
  <div class="tl-item"><div class="tl-date">16.09.2026</div><div class="tl-body"><b>«Повелитель времени»</b> — класс Хрономант, Боевой Пропуск «Высший пилотаж».</div></div>
  <div class="tl-item"><div class="tl-date">12.08.2026</div><div class="tl-body"><b>«Обретенное знание»</b> — экстрим Казерос «Акт II», «Репозиторий знаний».</div></div>
  <div class="tl-item"><div class="tl-date">15.07.2026</div><div class="tl-body"><b>«Летний триумф»</b> — экстрим «Акт I», режим «Экспедиция» для «Зерки», 4-й сезон Пантеона.</div></div>
  <div class="tl-item"><div class="tl-date">10.06.2026</div><div class="tl-body"><b>«Интриги Шеакрии»</b> — архипелаг Кадарум, «Собор Сакра-Финистриа».</div></div>
  <div class="tl-item"><div class="tl-date">13.05.2026</div><div class="tl-body"><b>«Охота на Аргоса»</b>.</div></div>
  <div class="tl-item"><div class="tl-date">15.04.2026</div><div class="tl-body"><b>«Пробуждение теней»</b> — рейд Теней «Зерка, ведьма боли», снаряжение до 1800.</div></div>
  <div class="tl-item"><div class="tl-date">11.03.2026</div><div class="tl-body"><b>«Высший закон»</b> — 3-й сезон Пантеона.</div></div>
  <div class="tl-item"><div class="tl-date">11.02.2026</div><div class="tl-body"><b>«Наследница Хранителя»</b> — класс Рыцарь-Хранитель, удаление старых режимов.</div></div>
  <div class="tl-item"><div class="tl-date">21.01.2026</div><div class="tl-body"><b>«Темный рыцарь»</b> — экстремальный режим Камена.</div></div>
  <div class="tl-item"><div class="tl-date">17.12.2025</div><div class="tl-body"><b>«Снеговейные чудеса»</b> — удалены трансценденция и эликсиры.</div></div>
  <div class="tl-item"><div class="tl-date">19.11.2025</div><div class="tl-body"><b>«Казерос: Финал»</b> — «Акт IV. Цитадель рока», «Финал. Судный день», система «Созвездие А.Р.К.».</div></div>
</div>
<p class="muted">Источник по всем пунктам: <span class="src" data-src="history"></span></p>
`
  },
  {
    id: 'how-to-site',
    cover: 'assets/screens/demo.svg',
    title: 'Как пользоваться сайтом',
    tag: 'Старт',
    icon: '✦',
    minutes: 1,
    updated: '2026-11-20',
    summary: 'Разбор интерфейса, прокачка, рейды по ГС и отметки «прочитано».',
    sources: [],
    body: `
<ol class="steps">
  <li><b>Интерфейс</b> — откройте экран и нажимайте на подсвеченные зоны. Мококо объяснит, что это.</li>
  <li><b>Гайды</b> — у каждого факта есть значок источника <span class="src-demo">ⓘ</span> с датой. Нажмите «Прочитано», чтобы отметить гайд.</li>
  <li><b>Прокачка</b> — отвечайте на вопросы, и квест подскажет следующий шаг заточки.</li>
  <li><b>Рейды по ГС</b> — какие рейды доступны на вашем уровне снаряжения.</li>
  <li><b>Поиск</b> — клавиша <kbd>/</kbd> или значок лупы.</li>
</ol>
`
  }
];
