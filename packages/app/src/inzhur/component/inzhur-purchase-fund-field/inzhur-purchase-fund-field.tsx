import { useLingui } from '@lingui/react/macro';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useInzhurFundOptions } from '../../hook/use-inzhur-fund-options.hook';
import { InzhurPurchaseFundOption } from '../inzhur-purchase-fund-option/inzhur-purchase-fund-option';

export const InzhurPurchaseFundField = () => {
    const { t } = useLingui();
    const { fundOptions } = useInzhurFundOptions();

    return (
        <GroupedListSection title={t`Fund`}>
            {fundOptions.map(fund => (
                <InzhurPurchaseFundOption key={fund.name} fund={fund} />
            ))}
        </GroupedListSection>
    );
};
