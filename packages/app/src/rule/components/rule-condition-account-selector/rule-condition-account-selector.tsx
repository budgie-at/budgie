import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { useRuleConditionValueField } from '../../hooks/use-rule-condition-value-field.hook';
import { RuleValueGlyph } from '../rule-value-glyph/rule-value-glyph';
import { RuleValuePickerButton } from '../rule-value-picker-button/rule-value-picker-button';

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

    const handleOpen = () => {
        openAccountSelector({ initialAccountId: isPositiveNumber(accountId) ? accountId : null, onlyActive: false }, selectedAccountId => {
            if (isDefined(selectedAccountId)) {
                onChange(String(selectedAccountId));
            }
        });
    };

    return (
        <RuleValuePickerButton
            value={account?.title ?? null}
            isMissing={isMissing}
            leading={<RuleValueGlyph icon={UserIconNameEnum.Wallet} variant="ghost" />}
            placeholder={t`Choose an account`}
            name={t`Account`}
            onPress={handleOpen}
            testID={testID}
        />
    );
};
