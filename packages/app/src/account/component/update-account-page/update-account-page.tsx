import { AccountEntityInterface, ExternalSourceEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';

import { EmptyFn, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { AccountDetailsField } from '../../../@generic/component/account-details-field/account-details-field';
import { FixedChromePage } from '../../../@generic/component/fixed-chrome-page/fixed-chrome-page';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { PillButtonFooter } from '../../../@generic/component/pill-button-footer/pill-button-footer';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { defaultInstrumentIdAtom } from '../../../settings/constants/settings-atoms.constant';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { ACCOUNT_KIND_TITLE } from '../../constant/account-kind-title.constant';
import { BANK_PROVIDER_TITLE } from '../../constant/bank-provider-title.constant';
import { AccountSwitchFieldKindEnum } from '../../enum/account-switch-field-kind.enum';
import { AccountFormBindingsInterface } from '../../interface/account-form-bindings.interface';
import { AccountNetWorthField } from '../account-net-worth-field/account-net-worth-field';
import { AccountSwitchField } from '../account-switch-field/account-switch-field';
import { ArchiveAccount } from '../archive-account/archive-account';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';
import { HouseholdShareAccountSection } from '../household-share-account-section/household-share-account-section';

interface Props {
    readonly account: AccountEntityInterface;
    readonly fields: Pick<AccountFormBindingsInterface, 'title' | 'icon' | 'isActive' | 'includeInNetWorth'>;
    readonly hero: ReactNode;
    readonly detailsFooter?: string | null;
    readonly children?: ReactNode;
    readonly onSubmit: EmptyFn;
    readonly isSubmitting?: boolean;
}

export const UpdateAccountPage = ({ account, fields, hero, detailsFooter, children, onSubmit, isSubmitting }: Props) => {
    const { t } = useLingui();
    const { instrument } = useGetInstrumentByIdQuery(account.instrumentId);
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);

    const providerTitle = isDefined(account.externalSource) ? BANK_PROVIDER_TITLE[account.externalSource] : null;
    const kindLabel = isDefined(providerTitle) ? t(providerTitle) : t(ACCOUNT_KIND_TITLE[account.type]);
    const currencyLabel = isDefined(instrument) && instrument.id !== defaultInstrumentId ? instrument.name : null;
    const accountTitle = account.title;
    const lowerCaseTitle = accountTitle.toLocaleLowerCase();
    const kindFooter = [kindLabel, currencyLabel]
        .filter(isDefined)
        .filter(label => !lowerCaseTitle.includes(label.toLocaleLowerCase()))
        .join(' · ');
    const detailsIconVariant = account.externalSource === ExternalSourceEnum.INZHUR ? 'secondary' : ACCOUNT_COLOR[account.type];
    const detailsSectionFooter = detailsFooter ?? (isNotEmptyString(kindFooter) ? kindFooter : null);

    return (
        <GroupedSurface>
            <FixedChromePage
                title={t`Edit ${accountTitle}`}
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
                    <GroupedListSection title={t`Details`} footer={detailsSectionFooter}>
                        <AccountDetailsField
                            titleBinding={fields.title}
                            iconBinding={fields.icon}
                            variant={detailsIconVariant}
                            placeholder={t`Account name`}
                            nameInputTestID={CreateAccountScreenSelector.NameInput}
                            selectNameOnFocus
                        />
                    </GroupedListSection>

                    {children}

                    <GroupedListSection title={t`Options`}>
                        <AccountNetWorthField
                            accountId={account.id}
                            value={fields.includeInNetWorth.field.value}
                            onChange={fields.includeInNetWorth.field.onChange}
                        />
                        <AccountSwitchField
                            kind={AccountSwitchFieldKindEnum.SHOW_ON_HOME}
                            value={fields.isActive.field.value}
                            onChange={fields.isActive.field.onChange}
                        />
                    </GroupedListSection>

                    <HouseholdShareAccountSection accountId={account.id} isBankSynced={isDefined(account.integrationId)} />

                    <GroupedListSection footer={t`Hidden from Home, totals and budgets until restored.`}>
                        <ArchiveAccount accountId={account.id} />
                    </GroupedListSection>
                </FormLayoutGroup>
            </FixedChromePage>
        </GroupedSurface>
    );
};
