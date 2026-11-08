import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { emptyFn, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { RoundedEdgeEnum } from '../../../@generic/enum/rounded-edge.enum';
import { useAnchoredMorphOriginPress } from '../../../@generic/hook/use-anchored-morph-origin-press.hook';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { useRuleConditionValueField } from '../../hooks/use-rule-condition-value-field.hook';
import { RuleValueGlyph } from '../rule-value-glyph/rule-value-glyph';
import { RuleValuePickerButton } from '../rule-value-picker-button/rule-value-picker-button';

import type { AnchoredMorphOriginInterface } from '../../../@generic/interface/anchored-morph-origin.interface';
import type { ComponentProps } from 'react';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const RuleConditionAccountSelector = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { value, onChange, isMissing } = useRuleConditionValueField(index);
    const [openAccountSelector] = useAccountSelectorModal();
    const parsedAccountId = Number.parseInt(value, 10);
    const accountId = isPositiveNumber(parsedAccountId) ? parsedAccountId : 0;
    const { account } = useGetAccountByIdQuery(accountId);

    const handleSelect = (origin: AnchoredMorphOriginInterface) => {
        openAccountSelector(
            { initialAccountId: isPositiveNumber(accountId) ? accountId : null, onlyActive: false, origin },
            selectedAccountId => {
                if (isDefined(selectedAccountId)) {
                    onChange(String(selectedAccountId));
                }
            }
        );
    };

    const pickerProps: Omit<ComponentProps<typeof RuleValuePickerButton>, 'onPress'> = {
        value: account?.title ?? null,
        isMissing,
        leading: <RuleValueGlyph icon={UserIconNameEnum.Wallet} variant="ghost" />,
        placeholder: t`Choose an account`,
        name: t`Account`,
        testID
    };
    const ghost = <RuleValuePickerButton {...pickerProps} onPress={emptyFn} />;
    const { ref, handlePress } = useAnchoredMorphOriginPress(RoundedEdgeEnum.ALL, ghost, handleSelect);

    return (
        <View ref={ref} collapsable={false}>
            <RuleValuePickerButton {...pickerProps} onPress={handlePress} />
        </View>
    );
};
