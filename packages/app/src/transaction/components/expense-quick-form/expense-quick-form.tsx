import { TransactionTypeEnum } from '@budgie/contracts';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { buildExpenseEntry } from '../../utils/build-expense-entry.util';
import { SimpleQuickForm } from '../simple-quick-form/simple-quick-form';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly onSubmit: () => void;
    readonly onCancel: () => void;
}

export const ExpenseQuickForm = ({ variant, onSubmit, onCancel }: Props) => (
    <SimpleQuickForm
        variant={variant}
        transactionType={TransactionTypeEnum.EXPENSE}
        accountFieldName="fromAccountId"
        buildEntries={buildExpenseEntry}
        onSubmit={onSubmit}
        onCancel={onCancel}
    />
);
