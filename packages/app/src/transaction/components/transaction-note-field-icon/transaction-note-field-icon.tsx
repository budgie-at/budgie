import { TransactionCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { isNotEmptyString } from '@rnw-community/shared';

import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionFieldIcon } from '../transaction-field-icon/transaction-field-icon';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { EmptyFn } from '@rnw-community/shared';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly onPress: EmptyFn;
}

export const TransactionNoteFieldIcon = ({ variant, onPress }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<TransactionCreateInputInterface>();
    const comment = useWatch({ control, name: 'comment' });

    const noteValue = isNotEmptyString(comment) ? comment : void 0;

    return (
        <TransactionFieldIcon
            icon={UserIconNameEnum.MessageSquare}
            label={t`Note`}
            value={noteValue}
            variant={variant}
            onPress={onPress}
            animationDelay={140}
            testID={SimpleQuickFormSelector.CommentInput}
        />
    );
};
