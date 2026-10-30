import { TransactionConsolidationTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useCreateTransactionRule } from '../../hook/use-create-transaction-rule.hook';
import { TransactionActionsMenuSelector } from '../transaction-actions-menu/transaction-actions-menu.selector';
import { TransactionInfoActionRow } from '../transaction-info-action-row/transaction-info-action-row';
import { TransactionInfoGroup } from '../transaction-info-group/transaction-info-group';

import type { TransactionActionsMenuItemInterface } from '../../interface/transaction-actions-menu-item.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly items: readonly TransactionActionsMenuItemInterface[];
    readonly onRevert: () => void;
}

export const TransactionInfoActionsGroup = ({ transaction, items, onRevert }: Props) => {
    const { t } = useLingui();
    const createRule = useCreateTransactionRule(transaction);

    const conversionItems = items
        .filter(item => item.testID !== TransactionActionsMenuSelector.FeeButton)
        .sort(
            (left, right) =>
                Number(right.testID === TransactionActionsMenuSelector.ConvertToTransferButton) -
                Number(left.testID === TransactionActionsMenuSelector.ConvertToTransferButton)
        );
    const organizeItems = items.filter(item => item.testID === TransactionActionsMenuSelector.FeeButton);
    const revertLabel =
        transaction.consolidationType === TransactionConsolidationTypeEnum.REFUND ? t`Undo refund` : t`Separate transactions`;

    return (
        <View className="gap-y-3xl">
            {isNotEmptyArray(conversionItems) ? (
                <View className="gap-y-sm">
                    <Text className="px-3xl text-[13px] text-secondary-foreground">
                        <Trans>Convert</Trans>
                    </Text>
                    <TransactionInfoGroup>
                        {conversionItems.map(item => (
                            <TransactionInfoActionRow
                                key={item.key}
                                icon={item.icon}
                                label={item.label}
                                onPress={item.onPress}
                                testID={item.testID}
                            />
                        ))}
                    </TransactionInfoGroup>
                </View>
            ) : null}
            <View className="gap-y-sm">
                <Text className="px-3xl text-[13px] text-secondary-foreground">
                    <Trans>Organize</Trans>
                </Text>
                <TransactionInfoGroup>
                    <TransactionInfoActionRow
                        icon={UserIconNameEnum.Workflow}
                        label={t`Create rule`}
                        onPress={createRule}
                        testID={TransactionActionsMenuSelector.CreateRuleButton}
                    />
                    {organizeItems.map(item => (
                        <TransactionInfoActionRow
                            key={item.key}
                            icon={item.icon}
                            label={item.label}
                            onPress={item.onPress}
                            testID={item.testID}
                        />
                    ))}
                    {isDefined(transaction.consolidationType) ? (
                        <TransactionInfoActionRow
                            icon={UserIconNameEnum.RotateCcw}
                            label={revertLabel}
                            onPress={onRevert}
                            testID={TransactionActionsMenuSelector.RevertButton}
                        />
                    ) : null}
                </TransactionInfoGroup>
            </View>
        </View>
    );
};
