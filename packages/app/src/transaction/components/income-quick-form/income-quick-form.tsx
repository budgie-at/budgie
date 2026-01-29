import { TransactionTypeEnum } from '@budgie/contracts';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { buildIncomeEntry } from '../../utils/build-income-entry.util';
import { SimpleQuickForm } from '../simple-quick-form/simple-quick-form';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly onSubmit: () => void;
    readonly onCancel: () => void;
}

export const IncomeQuickForm = ({ variant, onSubmit, onCancel }: Props) => (
    <SimpleQuickForm
        variant={variant}
        transactionType={TransactionTypeEnum.INCOME}
        accountFieldName="toAccountId"
        buildEntries={buildIncomeEntry}
        onSubmit={onSubmit}
        onCancel={onCancel}
    />
);
