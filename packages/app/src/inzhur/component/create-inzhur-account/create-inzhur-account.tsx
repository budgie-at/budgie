import { InzhurSetupService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { PillButtonFooter } from '../../../@generic/component/pill-button-footer/pill-button-footer';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { AccountBalanceField } from '../../../account/component/account-balance-field/account-balance-field';
import { useHryvniaInstrumentQuery } from '../../query/use-hryvnia-instrument.query';
import { InzhurSelector } from '../../selector/inzhur.selector';

export const CreateInzhurAccount = () => {
    const { t } = useLingui();
    const { isLoading, run } = useSingleFlight();
    const [openingBalance, setOpeningBalance] = useState(0);
    const hryvnia = useHryvniaInstrumentQuery();
    const instrumentSymbol = isDefined(hryvnia) ? hryvnia.symbol : '';

    const handleAdd = () =>
        run(
            Effect.flatMap(InzhurSetupService, inzhurSetupService => inzhurSetupService.setup(openingBalance)).pipe(
                toastOnFailure(t`Could not add Inzhur`)
            )
        );

    return (
        <CollapsibleChromePage
            title={t`Add Inzhur`}
            subtitle={t`Enter the cash balance shown in the Inzhur app. Budgie takes it from there.`}
            leading={<HeaderBackButton />}
            testID={InzhurSelector.CreatePage}
            footer={<PillButtonFooter label={t`Add Inzhur`} isLoading={isLoading} testID={InzhurSelector.AddButton} onPress={handleAdd} />}
        >
            <FormLayoutGroup>
                <AccountBalanceField
                    label={t`Inzhur cash balance`}
                    instrumentSymbol={instrumentSymbol}
                    value={openingBalance}
                    onChange={setOpeningBalance}
                />
            </FormLayoutGroup>
        </CollapsibleChromePage>
    );
};
