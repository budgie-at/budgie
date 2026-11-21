import { UserIconNameEnum } from '@budgie/contracts';
import { YIELD_GROUP_BY_KIND, YieldRangeEnum } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { router } from 'expo-router';
import { Text } from 'react-native';
import Animated from 'react-native-reanimated';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { PRESENCE_ENTERING } from '../../../@generic/constant/presence-motion.constant';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { defaultInstrumentIdAtom } from '../../../settings/constants/settings-atoms.constant';
import { yieldSummaryFamily } from '../../constant/yield-summary-family-atom.constant';
import { useYieldEntrySubtitle } from '../../hook/use-yield-entry-subtitle.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldGroupIcon } from '../yield-group-icon/yield-group-icon';
import { YieldRowSubtitle } from '../yield-row-subtitle/yield-row-subtitle';
import { YieldRow } from '../yield-row/yield-row';

import type { YieldScopeInterface } from '@budgie/contracts';

interface Props {
    readonly scope: YieldScopeInterface;
}

export const YieldEntryRowContent = ({ scope }: Props) => {
    const { t } = useLingui();
    const baseInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const summary = AsyncResult.getOrElse(
        useLiveAtomValue(yieldSummaryFamily({ range: YieldRangeEnum.YEAR, ...scope, group: null, baseInstrumentId })),
        () => null
    );

    const { positionAccountId, instrumentId } = scope;
    const isAccount = isDefined(positionAccountId);
    const mainKind = summary?.positions.at(0)?.kind ?? null;
    const entryGroup = isDefined(mainKind) ? YIELD_GROUP_BY_KIND[mainKind] : null;
    const { subtitle, earned } = useYieldEntrySubtitle(summary, isAccount);

    const handlePress = () =>
        void router.push({
            pathname: '/passive-income',
            params: isAccount
                ? { position: String(positionAccountId), from: `account-${positionAccountId}` }
                : { instrument: String(instrumentId), from: `instrument-${instrumentId}` }
        });

    if (!isDefined(summary)) {
        return null;
    }

    const icon = isDefined(entryGroup) ? (
        <YieldGroupIcon group={entryGroup} icon={UserIconNameEnum.Sprout} />
    ) : (
        <GroupedListIcon icon={UserIconNameEnum.Sprout} />
    );

    const trailing = isNotEmptyString(earned) ? (
        <Text className="text-[17px] font-semibold tabular-nums text-primary">{earned}</Text>
    ) : null;

    return (
        <Animated.View entering={PRESENCE_ENTERING}>
            <GroupedListSection>
                <YieldRow
                    left={icon}
                    title={t`Passive income`}
                    subtitle={<YieldRowSubtitle subtitle={subtitle} lines={1} />}
                    trailing={trailing}
                    accessibilityLabel={t`Passive income, ${subtitle}`}
                    onPress={handlePress}
                    testID={PassiveIncomeSelector.EntryRow}
                />
            </GroupedListSection>
        </Animated.View>
    );
};
