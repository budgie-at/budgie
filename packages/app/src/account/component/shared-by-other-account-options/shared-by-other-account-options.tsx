import { useLingui } from '@lingui/react/macro';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { AccountSwitchFieldKindEnum } from '../../enum/account-switch-field-kind.enum';
import { AccountFormBindingsInterface } from '../../interface/account-form-bindings.interface';
import { AccountSwitchField } from '../account-switch-field/account-switch-field';

interface Props {
    readonly isActive: AccountFormBindingsInterface['isActive'];
}

export const SharedByOtherAccountOptions = ({ isActive }: Props) => {
    const { t } = useLingui();

    return (
        <GroupedListSection title={t`Options`} footer={t`Applies to everyone in your family.`}>
            <AccountSwitchField
                kind={AccountSwitchFieldKindEnum.SHOW_ON_HOME}
                value={isActive.field.value}
                onChange={isActive.field.onChange}
            />
        </GroupedListSection>
    );
};
