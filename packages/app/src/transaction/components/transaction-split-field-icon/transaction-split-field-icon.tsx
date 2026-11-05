import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { TransactionFieldIcon } from '../transaction-field-icon/transaction-field-icon';
import { TransactionFieldIconsSelector } from '../transaction-field-icons/transaction-field-icons.selector';

import type { EmptyFn } from '@rnw-community/shared';

interface Props {
    readonly splitEntryCount: number;
    readonly isAmountPositive: boolean;
    readonly onPress: EmptyFn;
}

export const TransactionSplitFieldIcon = ({ splitEntryCount, isAmountPositive, onPress }: Props) => {
    const { t } = useLingui();

    const isSplitActive = splitEntryCount > 1;
    const splitValue = isSplitActive
        ? t({
              message: plural(splitEntryCount, {
                  one: '# item',
                  other: '# items'
              })
          })
        : void 0;
    const splitEnabled = isAmountPositive || isSplitActive;
    const disabledHint = splitEnabled ? void 0 : t`Enter an amount to split it`;

    return (
        <GroupedListSection footer={disabledHint}>
            <TransactionFieldIcon
                icon={UserIconNameEnum.Split}
                label={t`Split`}
                value={splitValue}
                onPress={onPress}
                disabledHint={disabledHint}
                testID={TransactionFieldIconsSelector.Split}
            />
        </GroupedListSection>
    );
};
