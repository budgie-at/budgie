import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CurrencySelectorInstrumentIcon } from '../../../@generic/component/currency-selector-instrument-icon/currency-selector-instrument-icon';
import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { GROUPED_LIST_SUBTITLE_CLASSNAME } from '../../../@generic/constant/grouped-list-subtitle-class-name.constant';
import { GROUPED_LIST_TITLE_CLASS_NAME } from '../../../@generic/constant/grouped-list-title-class-name.constant';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { cn } from '../../../@generic/utils/cn.util';
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
    const title = listing?.name ?? t`Choose security`;
    const subtitle = isDefined(listing) ? joinWithMiddot([listing.symbol, listing.exchange]) : t`Search by ticker, ISIN or company name.`;

    return (
        <GroupedListSection>
            <GroupedListRow
                left={left}
                title={
                    <Text
                        className={cn('text-primary', GROUPED_LIST_TITLE_CLASS_NAME)}
                        numberOfLines={2}
                        maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                    >
                        {title}
                    </Text>
                }
                subtitle={
                    <Text
                        className={cn('text-secondary-foreground', GROUPED_LIST_SUBTITLE_CLASSNAME)}
                        numberOfLines={3}
                        maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                    >
                        {subtitle}
                    </Text>
                }
                onPress={handlePress}
                testID={BrokerageSelector.SecurityButton}
            />
        </GroupedListSection>
    );
};
