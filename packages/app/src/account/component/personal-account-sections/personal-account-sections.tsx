import { useLingui } from '@lingui/react/macro';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { AccountSwitchFieldKindEnum } from '../../enum/account-switch-field-kind.enum';
import { AccountFormBindingsInterface } from '../../interface/account-form-bindings.interface';
import { AccountSwitchField } from '../account-switch-field/account-switch-field';
import { ArchiveAccount } from '../archive-account/archive-account';
import { HouseholdShareAccountSection } from '../household-share-account-section/household-share-account-section';

interface Props {
    readonly accountId: number;
    readonly fields: Pick<AccountFormBindingsInterface, 'isActive' | 'includeInNetWorth'>;
}

export const PersonalAccountSections = ({ accountId, fields }: Props) => {
    const { t } = useLingui();

    return (
        <>
            <GroupedListSection title={t`Options`}>
                <AccountSwitchField
                    kind={AccountSwitchFieldKindEnum.INCLUDE_IN_NET_WORTH}
                    value={fields.includeInNetWorth.field.value}
                    onChange={fields.includeInNetWorth.field.onChange}
                />
                <AccountSwitchField
                    kind={AccountSwitchFieldKindEnum.SHOW_ON_HOME}
                    value={fields.isActive.field.value}
                    onChange={fields.isActive.field.onChange}
                />
            </GroupedListSection>

            <HouseholdShareAccountSection accountId={accountId} />

            <GroupedListSection footer={t`Hidden from Home, totals and budgets until restored.`}>
                <ArchiveAccount accountId={accountId} />
            </GroupedListSection>
        </>
    );
};
