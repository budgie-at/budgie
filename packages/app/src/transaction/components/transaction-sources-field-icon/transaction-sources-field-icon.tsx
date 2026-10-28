import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { TransactionFieldIcon } from '../transaction-field-icon/transaction-field-icon';
import { TransactionFieldIconsSelector } from '../transaction-field-icons/transaction-field-icons.selector';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { EmptyFn } from '@rnw-community/shared';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly onPress: EmptyFn;
}

export const TransactionSourcesFieldIcon = ({ variant, onPress }: Props) => {
    const { t } = useLingui();

    return (
        <TransactionFieldIcon
            icon={UserIconNameEnum.GitMerge}
            label={t`Sources`}
            variant={variant}
            onPress={onPress}
            animationDelay={155}
            testID={TransactionFieldIconsSelector.Sources}
        />
    );
};
