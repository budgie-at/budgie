import { InzhurOperationKindEnum } from '../enum/inzhur-operation-kind.enum';

import type { InzhurOperationPatternInterface } from '../interface/inzhur-operation-pattern.interface';

export const INZHUR_OPERATION_PATTERNS: readonly InzhurOperationPatternInterface[] = [
    { kind: InzhurOperationKindEnum.TOP_UP, pattern: /^поповнення\s+брокерського\s+рахунку/iu, isIncoming: true, needsFund: false },
    { kind: InzhurOperationKindEnum.WITHDRAWAL, pattern: /^виведення\s+з\s+брокерського\s+рахунку/iu, isIncoming: false, needsFund: false },
    { kind: InzhurOperationKindEnum.BUY, pattern: /^купівля\s+(\d+(?:[.,]\d+)?)\s+сертифікат/iu, isIncoming: false, needsFund: true },
    { kind: InzhurOperationKindEnum.SELL, pattern: /^продаж\s+(\d+(?:[.,]\d+)?)\s+сертифікат/iu, isIncoming: true, needsFund: true },
    { kind: InzhurOperationKindEnum.DIVIDEND, pattern: /^нарахування\s+дивіденд/iu, isIncoming: true, needsFund: true },
    { kind: InzhurOperationKindEnum.TAX, pattern: /^сплата\s+податку/iu, isIncoming: false, needsFund: true },
    { kind: InzhurOperationKindEnum.CONVERSION, pattern: /^конвертація/iu, isIncoming: null, needsFund: true },
    { kind: InzhurOperationKindEnum.SURCHARGE, pattern: /^доплата/iu, isIncoming: false, needsFund: true }
];
