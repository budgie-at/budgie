import { useLingui } from '@lingui/react/macro';
import { ReactNode, RefObject, useImperativeHandle, useState } from 'react';
import { useFormState } from 'react-hook-form';
import { LayoutChangeEvent, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { RoundedEdgeEnum } from '../../../@generic/enum/rounded-edge.enum';
import { useShakeAnimation } from '../../../@generic/hook/use-shake-animation.hook';
import { TransactionFormRowPlaceholderToneEnum } from '../../enum/transaction-form-row-placeholder-tone.enum';
import { useTransferAccountSelection } from '../../hook/use-transfer-account-selection.hook';
import { MeasuredTransferAccountPicker } from '../measured-transfer-account-picker/measured-transfer-account-picker';
import { TransactionFormRowPlaceholder } from '../transaction-form-row-placeholder/transaction-form-row-placeholder';
import { TransferQuickFormSelector } from '../transfer-quick-form/transfer-quick-form.selector';
import { TransferSwapButton } from '../transfer-swap-button/transfer-swap-button';

export interface TransactionTransferAccountsRowRef {
    shakeFrom: () => void;
    shakeTo: () => void;
}

interface Props {
    readonly ref?: RefObject<TransactionTransferAccountsRowRef | null>;
    readonly children?: ReactNode;
}

export const TransactionTransferAccountsRow = ({ ref, children }: Props) => {
    const { t } = useLingui();
    const [fromRowHeight, setFromRowHeight] = useState(0);
    const { errors } = useFormState();
    const { shake: shakeFrom, animatedStyle: fromAnimatedStyle } = useShakeAnimation();
    const { shake: shakeTo, animatedStyle: toAnimatedStyle } = useShakeAnimation();
    const { fromAccount, toAccount, handleFromPress, handleToPress, handleSwap, canSwap, hasAnyAccount } = useTransferAccountSelection();

    useImperativeHandle(ref, () => ({ shakeFrom, shakeTo }));

    const fromAccountSelectedTestID = isDefined(fromAccount) ? TransferQuickFormSelector.SelectedFromAccount(fromAccount.title) : void 0;
    const toAccountSelectedTestID = isDefined(toAccount) ? TransferQuickFormSelector.SelectedToAccount(toAccount.title) : void 0;

    const handleFromLayout = (event: LayoutChangeEvent) => void setFromRowHeight(event.nativeEvent.layout.height);
    const missingPlaceholder = (
        <TransactionFormRowPlaceholder tone={TransactionFormRowPlaceholderToneEnum.DESTRUCTIVE}>{t`Choose`}</TransactionFormRowPlaceholder>
    );
    const fromPlaceholder = isDefined(errors.root?.['fromAccountId']) ? missingPlaceholder : t`Choose`;
    const toEdge = isDefined(children) ? RoundedEdgeEnum.NONE : RoundedEdgeEnum.BOTTOM;
    const toPlaceholder = isDefined(errors.root?.['toAccountId']) ? missingPlaceholder : t`Choose`;

    return (
        <View>
            <GroupedListSection>
                <View onLayout={handleFromLayout}>
                    <MeasuredTransferAccountPicker
                        label={t({ message: 'From', context: 'transfer account' })}
                        account={fromAccount}
                        placeholder={fromPlaceholder}
                        animatedStyle={fromAnimatedStyle}
                        testID={TransferQuickFormSelector.FromAccount}
                        selectedTestID={fromAccountSelectedTestID}
                        edge={RoundedEdgeEnum.TOP}
                        onPress={handleFromPress}
                    />
                </View>
                <MeasuredTransferAccountPicker
                    label={t({ message: 'To', context: 'transfer account' })}
                    account={toAccount}
                    placeholder={toPlaceholder}
                    animatedStyle={toAnimatedStyle}
                    testID={TransferQuickFormSelector.ToAccount}
                    selectedTestID={toAccountSelectedTestID}
                    edge={toEdge}
                    onPress={handleToPress}
                />
                {children}
            </GroupedListSection>
            {hasAnyAccount ? <TransferSwapButton dividerOffset={fromRowHeight} isEnabled={canSwap} onPress={handleSwap} /> : null}
        </View>
    );
};
