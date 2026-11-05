import { TransactionCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { isNotEmptyString } from '@rnw-community/shared';

import { TransactionFormRowStackedContext } from '../../context/transaction-form-row-stacked.context';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionFieldIcon } from '../transaction-field-icon/transaction-field-icon';

import type { EmptyFn } from '@rnw-community/shared';

interface Props {
    readonly onPress: EmptyFn;
}

export const TransactionNoteFieldIcon = ({ onPress }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<TransactionCreateInputInterface>();
    const comment = useWatch({ control, name: 'comment' });

    const hasNote = isNotEmptyString(comment);
    const noteValue = hasNote ? comment : void 0;

    return (
        <TransactionFormRowStackedContext value={hasNote}>
            <TransactionFieldIcon
                icon={UserIconNameEnum.MessageSquare}
                label={t`Note`}
                value={noteValue}
                placeholder={t`Add`}
                onPress={onPress}
                testID={SimpleQuickFormSelector.CommentInput}
            />
        </TransactionFormRowStackedContext>
    );
};
