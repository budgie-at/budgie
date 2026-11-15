import { useLingui } from '@lingui/react/macro';

import { CreateAccountTypeRow } from '../create-account-type-row/create-account-type-row';

import type { CreateAccountManualOptionInterface } from '../../interface/create-account-manual-option.interface';

interface Props {
    readonly options: readonly CreateAccountManualOptionInterface[];
}

export const CreateAccountManualRows = ({ options }: Props) => {
    const { t } = useLingui();

    return options.map(option => (
        <CreateAccountTypeRow
            key={option.type}
            title={t(option.title)}
            description={t(option.description)}
            icon={option.icon}
            type={option.type}
        />
    ));
};
