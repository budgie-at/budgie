import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ListRowDetail } from '../../../@generic/component/list-row-detail/list-row-detail';
import { ListRow } from '../../../@generic/component/list-row/list-row';
import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { NeutralIconTile } from '../../../@generic/component/neutral-icon-tile/neutral-icon-tile';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';

import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly label: string;
    readonly caption?: string;
    readonly amount: number;
    readonly instrumentSymbol: string;
    readonly icon?: UserIconType;
    readonly iconClassName?: string;
}

export const InzhurMoneyRow = ({ label, caption, amount, instrumentSymbol, icon, iconClassName }: Props) => {
    const captionSegments = isDefined(caption) ? [caption] : [];

    return (
        <View accessible>
            <ListRow
                {...(isDefined(icon) && { leading: <NeutralIconTile icon={icon} iconClassName={iconClassName} /> })}
                title={<Text className="text-[17px] font-semibold text-primary">{label}</Text>}
                trailing={<MoneyText amount={amount} instrumentSymbol={instrumentSymbol} variant={MoneyTextVariantEnum.ROW} />}
                {...(isDefined(caption) && { detail: <ListRowDetail segments={captionSegments} /> })}
            />
        </View>
    );
};
