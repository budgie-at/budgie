import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { ActivityIndicator, Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/title-max-font-size-multiplier.constant';

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' as const };

interface Props {
    readonly fetchedRecordCount: number;
}

export const AccountsDownloadingState = ({ fetchedRecordCount }: Props) => {
    const { t } = useLingui();

    const itemsLabel = t({ message: plural(fetchedRecordCount, { one: '# item', other: '# items' }) });

    return (
        <View className="items-center gap-y-lg rounded-3xl bg-grouped-surface-row px-5xl py-7xl" style={CONTINUOUS_CORNERS}>
            <CircleIcon
                icon={UserIconNameEnum.CloudDownload}
                size={56}
                iconSize={26}
                radius={28}
                variant="secondary"
                border={false}
                className="bg-surface-disc"
            />

            <View className="items-center gap-y-xs">
                <Text
                    accessibilityRole="header"
                    maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                    className="text-center text-lg font-semibold text-primary"
                >
                    <Trans>Downloading your data from iCloud…</Trans>
                </Text>
                <Text maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER} className="text-center text-[15px] text-secondary-foreground">
                    {fetchedRecordCount > 0 ? itemsLabel : <Trans>This can take a moment</Trans>}
                </Text>
            </View>

            <ActivityIndicator size="small" />
        </View>
    );
};
