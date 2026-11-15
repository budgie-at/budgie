import { ExternalSourceEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { GroupLabel } from '../../../@generic/component/group-label/group-label';
import { isInstitutionGroup } from '../../type-guard/is-institution-group.type-guard';

interface Props {
    readonly items: readonly object[];
}

export const HomeProviderGroupLabel = ({ items }: Props) => {
    const { t } = useLingui();

    const providers = items.filter(isInstitutionGroup).filter(institution => institution.isHoldingProvider);
    const providersCount = providers.length;
    const isBrokers = providers.every(institution => institution.provider === ExternalSourceEnum.MANUAL);
    const isExchanges = providers.every(institution => institution.provider !== ExternalSourceEnum.MANUAL);
    const exchangesTitle = isExchanges ? t`Exchanges · ${providersCount}` : t`Accounts · ${providersCount}`;
    const title = isBrokers ? t`Brokers · ${providersCount}` : exchangesTitle;

    return <GroupLabel title={title} className="mb-lg px-3xl" />;
};
