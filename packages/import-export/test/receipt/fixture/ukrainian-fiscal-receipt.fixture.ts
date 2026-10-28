import { receiptLine } from './receipt-line';

import type { ReceiptTextLineInterface } from '../../../src/receipt/interface/receipt-text-line.interface';

export const UKRAINIAN_FISCAL_RECEIPT: readonly ReceiptTextLineInterface[] = [
    receiptLine('ТОВ "АТБ-МАРКЕТ"', 0.25, 0.03, 0.03),
    receiptLine('Магазин №1024', 0.32, 0.07),
    receiptLine('м. Дніпро, вул. Шевченка, 15', 0.2, 0.088),
    receiptLine('ПН 300123456789', 0.3, 0.106),
    receiptLine('Хліб Український', 0.06, 0.14),
    receiptLine('1 x 32,50', 0.5, 0.14),
    receiptLine('32,50 А', 0.8, 0.14),
    receiptLine('Молоко 2,5% 900г', 0.06, 0.158),
    receiptLine('2 x 41,90', 0.5, 0.158),
    receiptLine('83,80 А', 0.8, 0.158),
    receiptLine('Банан ваговий', 0.06, 0.176),
    receiptLine('1,234 x 54,90', 0.5, 0.176),
    receiptLine('67,75 А', 0.8, 0.176),
    receiptLine('СУМА', 0.06, 0.206, 0.018),
    receiptLine('184,05 ГРН', 0.7, 0.206, 0.018),
    receiptLine('ПДВ А = 20,00%', 0.06, 0.236),
    receiptLine('30,68', 0.8, 0.236),
    receiptLine('БЕЗГОТІВКОВА', 0.06, 0.262),
    receiptLine('184,05', 0.8, 0.262),
    receiptLine('КАРТКА ****5512', 0.06, 0.28),
    receiptLine('ЧЕК № 0012345', 0.06, 0.31),
    receiptLine('27.10.2026 18:41:09', 0.06, 0.328),
    receiptLine('ФН 3000123456', 0.06, 0.346),
    receiptLine('ФІСКАЛЬНИЙ ЧЕК', 0.3, 0.37, 0.014)
];
