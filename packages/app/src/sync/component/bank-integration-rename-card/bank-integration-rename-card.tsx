import { BankIntegrationRepository, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { GroupedListInputRow } from '../../../@generic/component/grouped-list-input-row/grouped-list-input-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useBankIntegration } from '../../context/bank-integration.context';

export const BankIntegrationRenameCard = () => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const [name, setName] = useState(integration.label ?? '');

    const handleBlur = () => {
        const label = name.trim();

        if (!isNotEmptyString(label) || label === integration.label) {
            setName(integration.label ?? '');

            return;
        }

        void appRuntime.runPromise(
            Effect.flatMap(BankIntegrationRepository, bankIntegrationRepository =>
                bankIntegrationRepository.updateById(integration.id, { label })
            ).pipe(toastOnFailure(t`Could not rename brokerage`))
        );
    };

    return (
        <GroupedListSection title={t`Name`}>
            <GroupedListInputRow
                icon={UserIconNameEnum.Pencil}
                label={t`Brokerage name`}
                value={name}
                onChangeText={setName}
                onBlur={handleBlur}
                maxLength={60}
            />
        </GroupedListSection>
    );
};
