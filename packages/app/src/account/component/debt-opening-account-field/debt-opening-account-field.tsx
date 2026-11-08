import { AccountTypeEnum } from '@budgie/contracts';
import { type GestureResponderEvent, View } from 'react-native';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { RoundedEdgeEnum } from '../../../@generic/enum/rounded-edge.enum';
import { useAnchoredMorphOriginPress } from '../../../@generic/hook/use-anchored-morph-origin-press.hook';
import { useAccountSelectorModal } from '../../context/account-selector-modal.context';
import { useAccountSelector } from '../../hooks/use-account-selector.hook';
import { DebtOpeningAccountRow } from '../debt-opening-account-row/debt-opening-account-row';

import type { AnchoredMorphOriginInterface } from '../../../@generic/interface/anchored-morph-origin.interface';
import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { ComponentProps } from 'react';

interface Props {
    readonly accountId: number | null;
    readonly label: string;
    readonly variant: ColorPaletteVariant;
    readonly onChange: (accountId: number | null) => void;
}

export const DebtOpeningAccountField = ({ accountId, label, variant, onChange }: Props) => {
    const [openAccountSelector] = useAccountSelectorModal();
    const { selectedAccount, formattedBalance } = useAccountSelector({
        accountId,
        excludeAccountTypes: [AccountTypeEnum.DEBT]
    });

    const handleSelect = (origin: AnchoredMorphOriginInterface) => {
        openAccountSelector(
            {
                initialAccountId: accountId,
                excludeAccountTypes: [AccountTypeEnum.DEBT],
                onlyActive: false,
                origin
            },
            selectedAccountId => {
                if (isDefined(selectedAccountId)) {
                    onChange(selectedAccountId);
                }
            }
        );
    };

    const handleClearPress = (event: GestureResponderEvent) => {
        event.stopPropagation();
        onChange(null);
    };

    const rowProps: Omit<ComponentProps<typeof DebtOpeningAccountRow>, 'onPress' | 'onClear'> = {
        account: selectedAccount,
        label,
        variant,
        formattedBalance
    };
    const ghost = <DebtOpeningAccountRow {...rowProps} onPress={emptyFn} onClear={emptyFn} />;
    const { ref, handlePress } = useAnchoredMorphOriginPress(RoundedEdgeEnum.ALL, ghost, handleSelect);

    return (
        <View ref={ref} collapsable={false}>
            <DebtOpeningAccountRow {...rowProps} onPress={handlePress} onClear={handleClearPress} />
        </View>
    );
};
