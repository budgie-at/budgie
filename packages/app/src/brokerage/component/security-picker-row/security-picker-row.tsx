import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { CurrencySelectorInstrumentIcon } from '../../../@generic/component/currency-selector-instrument-icon/currency-selector-instrument-icon';
import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { joinWithMiddot } from '../../../@generic/utils/join-with-middot.util';
import { BrokerageSelector } from '../../selector/brokerage.selector';

import type { YahooListingInterface } from '@budgie/market';

interface Props {
    readonly listing: YahooListingInterface | null;
    readonly onChange: (listing: YahooListingInterface) => void;
}

export const SecurityPickerRow = ({ listing, onChange }: Props) => {
    const { t } = useLingui();
    const openSecuritySelector = useOpenModal('/security-selector');

    const handlePress = () => {
        openSecuritySelector({ selectedSymbol: listing?.symbol ?? null }, selected => {
            if (isDefined(selected)) {
                onChange(selected);
            }
        });
    };

    const left = isDefined(listing) ? (
        <CurrencySelectorInstrumentIcon code={listing.symbol} symbol={listing.symbol} type={listing.type} size={36} />
    ) : (
        <GroupedListIcon icon={UserIconNameEnum.Search} />
    );
    const title = listing?.symbol ?? t`Choose security`;
    const subtitle = isDefined(listing) ? joinWithMiddot([listing.name, listing.exchange]) : t`Search by ticker, ISIN or company name.`;

    return (
        <GroupedListSection>
            <GroupedListRow left={left} title={title} subtitle={subtitle} onPress={handlePress} testID={BrokerageSelector.SecurityButton} />
        </GroupedListSection>
    );
};
