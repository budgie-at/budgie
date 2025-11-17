import { CurrencyEnum, InstrumentEntityInterface, InstrumentTypeEnum } from '@budgie/contracts';

export const DEFAULT_INSTRUMENT = {
    id: 1,
    symbol: '$',
    deletedAt: null,
    // eslint-disable-next-line lingui/no-unlocalized-strings
    name: 'US Dollar',
    createdAt: new Date(),
    updatedAt: new Date(),
    code: CurrencyEnum.USD,
    type: InstrumentTypeEnum.FIAT
} satisfies InstrumentEntityInterface;
