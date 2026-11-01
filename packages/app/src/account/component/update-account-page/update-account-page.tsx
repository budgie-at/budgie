import { AccountEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { AccountDetailsField } from '../../../@generic/component/account-details-field/account-details-field';
import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { PillButtonFooter } from '../../../@generic/component/pill-button-footer/pill-button-footer';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { ACCOUNT_KIND_TITLE } from '../../constant/account-kind-title.constant';
import { BANK_PROVIDER_TITLE } from '../../constant/bank-provider-title.constant';
import { AccountSwitchFieldKindEnum } from '../../enum/account-switch-field-kind.enum';
import { AccountFormBindingsInterface } from '../../interface/account-form-bindings.interface';
import { AccountSwitchField } from '../account-switch-field/account-switch-field';
import { ArchiveAccount } from '../archive-account/archive-account';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';

interface Props {
    readonly account: AccountEntityInterface;
    readonly fields: Pick<AccountFormBindingsInterface, 'title' | 'icon' | 'isActive' | 'includeInNetWorth'>;
    readonly hero: ReactNode;
    readonly children?: ReactNode;
    readonly onSubmit: EmptyFn;
    readonly isSubmitting?: boolean;
}

export const UpdateAccountPage = ({ account, fields, hero, children, onSubmit, isSubmitting }: Props) => {
    const { t } = useLingui();
    const { instrument } = useGetInstrumentByIdQuery(account.instrumentId);

    const providerTitle = isDefined(account.externalSource) ? BANK_PROVIDER_TITLE[account.externalSource] : null;
    const kindLabel = isDefined(providerTitle) ? t(providerTitle) : t(ACCOUNT_KIND_TITLE[account.type]);
    const currencyLabel = isDefined(instrument) ? instrument.name : null;
    const detailsFooter = [kindLabel, currencyLabel].filter(isDefined).join(' · ');

    return (
        <CollapsibleChromePage
            title={t`Edit Account`}
            leading={<HeaderBackButton />}
            testID={CreateAccountScreenSelector.ScrollView}
            footer={
                <PillButtonFooter
                    label={t`Save changes`}
                    isLoading={isSubmitting}
                    testID={CreateAccountScreenSelector.SubmitButton}
                    onPress={onSubmit}
                />
            }
        >
            {hero}

            <FormLayoutGroup>
                <GroupedListSection title={t`Details`} footer={detailsFooter}>
                    <AccountDetailsField
                        titleBinding={fields.title}
                        iconBinding={fields.icon}
                        variant={ACCOUNT_COLOR[account.type]}
                        placeholder={t`Account name`}
                        nameInputTestID={CreateAccountScreenSelector.NameInput}
                        selectNameOnFocus
                    />
                </GroupedListSection>

                {children}

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

                <GroupedListSection footer={t`Hidden from Home and totals. Restore it in Settings.`}>
                    <ArchiveAccount accountId={account.id} />
                </GroupedListSection>
            </FormLayoutGroup>
        </CollapsibleChromePage>
    );
};
