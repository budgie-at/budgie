import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { TransactionFieldIcon } from '../transaction-field-icon/transaction-field-icon';
import { TransactionFieldIconsSelector } from '../transaction-field-icons/transaction-field-icons.selector';

import type { EmptyFn } from '@rnw-community/shared';

interface Props {
    readonly onPress: EmptyFn;
}

export const TransactionSourcesFieldIcon = ({ onPress }: Props) => {
    const { t } = useLingui();

    return (
        <TransactionFieldIcon
            icon={UserIconNameEnum.GitMerge}
            label={t`Sources`}
            onPress={onPress}
            animationDelay={155}
            testID={TransactionFieldIconsSelector.Sources}
        />
    );
};
