import type { InzhurStatementHoldingInterface } from './inzhur-statement-holding.interface';
import type { PdfTextItemInterface } from '@budgie/sync';

const LINE_HEIGHT = 20;
const TABLE_TOP = 560;
const X_NAME = 50;
const X_CODE = 190;
const X_ISIN = 250;
const X_TYPE = 330;
const X_NOMINAL = 400;
const X_QUANTITY = 470;
const X_TOTAL = 520;
const X_BLOCKED = [560, 580, 600];
const TYPE_LINES = ['Інвестиційний', 'сертифікат', 'електронний', 'іменний'];

const item = (y: number, x: number, text: string): PdfTextItemInterface => ({ text, x, y, width: 100, height: 10, page: 1 });

const formatSpaced = (value: number): string => String(value).replaceAll(/\B(?=(\d{3})+(?!\d))/gu, ' ');

const buildHeaderItems = (statementDate: string): PdfTextItemInterface[] => [
    item(800, 150, 'Виписка про стан рахунку в цінних паперах'),
    item(780, 250, `на ${statementDate}`),
    item(760, 250, `Дата та час складання виписки: ${statementDate}`),
    item(740, X_NAME, 'Депонент'),
    item(720, X_NAME, "Найменування / прізвище, ім'я, по батькові"),
    item(720, 300, 'Тестенко Тест Тестович'),
    item(700, X_NAME, 'Код за ЄДРПОУ/Ідентифікаційний код'),
    item(700, 300, '0000000000'),
    item(680, X_NAME, 'Серія, номер, дата видачі паспорту'),
    item(680, 300, 'Серія та номер: 000000000 Дата видачі: 01.01.2020'),
    item(660, X_NAME, 'Депозитарний код рахунку в цінних паперах'),
    item(660, 300, '000000-IN00000000; Активний'),
    item(640, X_NAME, 'Депозитарна установа'),
    item(640, 300, 'Найменування: ТОВ "ІНЖУР КЕПІТАЛ"'),
    item(600, X_NAME, 'Найменування емітента за ГС; Код ЄДРПОУ'),
    item(600, X_ISIN, 'ISIN'),
    item(600, X_TYPE, 'Вид, тип,'),
    item(600, X_NOMINAL, 'Номінальна'),
    item(600, X_QUANTITY, 'Кількість ЦП,'),
    item(600, X_TOTAL, 'Загальна')
];

const buildHoldingItems = (holding: InzhurStatementHoldingInterface, top: number): PdfTextItemInterface[] => {
    const { layout, quantity } = holding;
    const nominalText = `${layout.nominalValue.toFixed(2).replace('.', ',')} (UAH)`;

    return [
        ...layout.nameLines.map((line, index) => item(top - index * LINE_HEIGHT, X_NAME, line)),
        ...layout.codeLines.map((line, index) => item(top - index * LINE_HEIGHT, X_CODE, line)),
        ...TYPE_LINES.map((line, index) => item(top - index * LINE_HEIGHT, X_TYPE, line)),
        item(top, X_ISIN, layout.isin),
        item(top, X_NOMINAL, nominalText),
        item(top, X_QUANTITY, formatSpaced(quantity)),
        item(top, X_TOTAL, formatSpaced(quantity * layout.nominalValue)),
        ...X_BLOCKED.map(x => item(top, x, '0'))
    ];
};

export const buildInzhurStatementItems = (
    statementDate: string,
    holdings: readonly InzhurStatementHoldingInterface[],
    footerLines: readonly string[] = []
): PdfTextItemInterface[] => {
    let top = TABLE_TOP;
    const holdingItems: PdfTextItemInterface[] = [];

    for (const holding of holdings) {
        holdingItems.push(...buildHoldingItems(holding, top));
        top -= (Math.max(holding.layout.nameLines.length, TYPE_LINES.length) + 1) * LINE_HEIGHT;
    }

    const footerItems = footerLines.map((line, index) => item(top - index * LINE_HEIGHT, X_NAME, line));

    return [...buildHeaderItems(statementDate), ...holdingItems, ...footerItems];
};
