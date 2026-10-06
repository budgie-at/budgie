import { AccountEntityInterface } from '@budgie/contracts';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { useStickyDefinedValue } from '../../../@generic/hook/use-sticky-defined-value.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { InstallmentPlanCountField } from '../../../installment-plan/component/installment-plan-count-field/installment-plan-count-field';
import { InstallmentPlanPaidSummary } from '../../../installment-plan/component/installment-plan-paid-summary/installment-plan-paid-summary';
import { InstallmentPlanTotalField } from '../../../installment-plan/component/installment-plan-total-field/installment-plan-total-field';
import { InstallmentPlanUpdateFormSchema } from '../../../installment-plan/constant/installment-plan-update-form-schema.constant';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { useAccountEntityForm } from '../../hooks/use-account-entity-form.hook';
import { DebtAccountService } from '../../service/debt-account.service';
import { IncludeInNetWorthField } from '../include-in-net-worth-field/include-in-net-worth-field';
import { UpdateAccountPage } from '../update-account-page/update-account-page';

import type { InstallmentPlanUpdateFormValues } from '../../../installment-plan/constant/installment-plan-update-form-schema.constant';

interface Props {
    readonly account: AccountEntityInterface;
}

const FALLBACK_INSTALLMENT_COUNT = 3;

export const UpdateInstallmentPlanAccount = ({ account }: Props) => {
    const { instrument } = useGetInstrumentByIdQuery(account.instrumentId);
    const stickyInstrument = useStickyDefinedValue(instrument);
    const { control, handleSubmit, isSubmitting } = useAccountEntityForm(
        standardSchemaResolver(Schema.toStandardSchemaV1(InstallmentPlanUpdateFormSchema)),
        {
            icon: account.icon,
            title: account.title,
            targetBalance: convertFromMicroUnits(account.targetBalance),
            installmentCount: account.installmentCount ?? FALLBACK_INSTALLMENT_COUNT,
            includeInNetWorth: account.includeInNetWorth,
            isActive: account.isActive
        },
        (values: InstallmentPlanUpdateFormValues) =>
            appRuntime.runPromise(
                Effect.flatMap(DebtAccountService, debtAccountService => debtAccountService.updateDebtById(account.id, values))
            )
    );

    if (!isDefined(stickyInstrument)) {
        return <EmptyScreen />;
    }

    return (
        <UpdateAccountPage
            account={account}
            control={control}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            hero={
                <View>
                    <InstallmentPlanTotalField control={control} instrumentSymbol={stickyInstrument.symbol} />
                    <InstallmentPlanPaidSummary accountId={account.id} instrumentSymbol={stickyInstrument.symbol} />
                </View>
            }
        >
            <InstallmentPlanCountField control={control} />
            <IncludeInNetWorthField control={control} />
        </UpdateAccountPage>
    );
};
