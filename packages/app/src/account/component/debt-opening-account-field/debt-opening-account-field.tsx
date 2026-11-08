import { AccountTypeEnum } from '@budgie/contracts';
import { type GestureResponderEvent } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { AnchoredMorphTrigger } from '../../../@generic/component/anchored-morph-trigger/anchored-morph-trigger';
import { RoundedEdgeEnum } from '../../../@generic/enum/rounded-edge.enum';
import { useAccountSelectorModal } from '../../context/account-selector-modal.context';
import { useAccountSelector } from '../../hooks/use-account-selector.hook';
import { DebtOpeningAccountRow } from '../debt-opening-account-row/debt-opening-account-row';

import type { AnchoredMorphOriginInterface } from '../../../@generic/interface/anchored-morph-origin.interface';
import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

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

    return (
        <AnchoredMorphTrigger
            edge={RoundedEdgeEnum.ALL}
            radiusClassName="rounded-2xl"
            colorClassName="bg-secondary-background"
            onPress={handleSelect}
        >
            {handlePress => (
                <DebtOpeningAccountRow
                    account={selectedAccount}
                    label={label}
                    variant={variant}
                    formattedBalance={formattedBalance}
                    onPress={handlePress}
                    onClear={handleClearPress}
                />
            )}
        </AnchoredMorphTrigger>
    );
};
