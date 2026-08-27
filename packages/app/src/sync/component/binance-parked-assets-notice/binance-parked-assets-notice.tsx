import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { SyncAccountPreviewInterface } from '../../interface/sync-account-preview.interface';

interface Props {
    readonly parkedPreviews: SyncAccountPreviewInterface[];
}

export const BinanceParkedAssetsNotice = ({ parkedPreviews }: Props) => {
    if (!isNotEmptyArray(parkedPreviews)) {
        return null;
    }

    const parkedAssets = parkedPreviews.map(preview => preview.currencyCode).join(', ');

    return (
        <View className="gap-y-md pt-md">
            <Text className="text-secondary-foreground text-sm px-md">
                <Trans>Valuation unavailable</Trans>
            </Text>

            <SimpleHorizontalCell
                left={<CircleIcon icon={UserIconNameEnum.TriangleAlert} variant="warning" size={15} iconSize={15} />}
                size="lg"
                variant="warning"
                title={parkedAssets}
            />
        </View>
    );
};
