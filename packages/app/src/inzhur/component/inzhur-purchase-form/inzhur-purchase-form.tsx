import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useLingui } from '@lingui/react/macro';
import * as Schema from 'effect/Schema';
import { FormProvider, useForm } from 'react-hook-form';

import { FixedChromePage } from '../../../@generic/component/fixed-chrome-page/fixed-chrome-page';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { InzhurPurchaseFormSchema } from '../../constant/inzhur-purchase-form-schema.constant';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { buildInzhurPurchaseDefaults } from '../../utils/build-inzhur-purchase-defaults.util';
import { InzhurPurchaseAmountField } from '../inzhur-purchase-amount-field/inzhur-purchase-amount-field';
import { InzhurPurchaseCertificatesField } from '../inzhur-purchase-certificates-field/inzhur-purchase-certificates-field';
import { InzhurPurchaseDateField } from '../inzhur-purchase-date-field/inzhur-purchase-date-field';
import { InzhurPurchaseFooter } from '../inzhur-purchase-footer/inzhur-purchase-footer';
import { InzhurPurchaseFundField } from '../inzhur-purchase-fund-field/inzhur-purchase-fund-field';

import type { InzhurPurchaseFormValues } from '../../constant/inzhur-purchase-form-schema.constant';
import type { InzhurPendingTopUpInterface } from '@budgie/sync';

interface Props {
    readonly topUp: InzhurPendingTopUpInterface;
    readonly defaultFundName: string;
}

export const InzhurPurchaseForm = ({ topUp, defaultFundName }: Props) => {
    const { t } = useLingui();
    const form = useForm<InzhurPurchaseFormValues>({
        mode: 'onChange',
        resolver: standardSchemaResolver(Schema.toStandardSchemaV1(InzhurPurchaseFormSchema)),
        defaultValues: buildInzhurPurchaseDefaults(topUp, defaultFundName)
    });

    return (
        <GroupedSurface>
            <FormProvider {...form}>
                <FixedChromePage
                    title={t`Enter purchase`}
                    leading={<HeaderBackButton />}
                    testID={InzhurSelector.PurchasePage}
                    footer={<InzhurPurchaseFooter topUp={topUp} />}
                >
                    <FormLayoutGroup>
                        <InzhurPurchaseFundField />
                        <InzhurPurchaseCertificatesField />
                        <InzhurPurchaseAmountField />
                        <InzhurPurchaseDateField />
                    </FormLayoutGroup>
                </FixedChromePage>
            </FormProvider>
        </GroupedSurface>
    );
};
