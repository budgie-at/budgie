import { HouseholdShareStateEnum } from '@budgie/cloud-sync';
import { AccountEntityInterface, ExternalSourceEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { ReactNode } from 'react';

import { EmptyFn, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { AccountDetailsField } from '../../../@generic/component/account-details-field/account-details-field';
import { FixedChromePage } from '../../../@generic/component/fixed-chrome-page/fixed-chrome-page';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { PillButtonFooter } from '../../../@generic/component/pill-button-footer/pill-button-footer';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { defaultInstrumentIdAtom } from '../../../settings/constants/settings-atoms.constant';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { ACCOUNT_KIND_TITLE } from '../../constant/account-kind-title.constant';
import { BANK_PROVIDER_TITLE } from '../../constant/bank-provider-title.constant';
import { householdAccountShareAtom } from '../../constant/household-account-share-atom.constant';
import { AccountFormBindingsInterface } from '../../interface/account-form-bindings.interface';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';
import { HouseholdSharedByOtherAccountSection } from '../household-shared-by-other-account-section/household-shared-by-other-account-section';
import { PersonalAccountSections } from '../personal-account-sections/personal-account-sections';
import { SharedByOtherAccountOptions } from '../shared-by-other-account-options/shared-by-other-account-options';

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
    const isSharedByOther =
        AsyncResult.getOrElse(useLiveAtomValue(householdAccountShareAtom(account.id)), () => null)?.state ===
        HouseholdShareStateEnum.SHARED_BY_OTHER;

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
    const sharedByOtherSection = isSharedByOther ? (
        <HouseholdSharedByOtherAccountSection isBankSynced={isDefined(account.integrationId)} />
    ) : null;
    const accountSections = isSharedByOther ? (
        <SharedByOtherAccountOptions isActive={fields.isActive} />
    ) : (
        <PersonalAccountSections accountId={account.id} fields={fields} />
    );

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
                    {sharedByOtherSection}

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

                    {accountSections}
                </FormLayoutGroup>
            </FixedChromePage>
        </GroupedSurface>
    );
};
