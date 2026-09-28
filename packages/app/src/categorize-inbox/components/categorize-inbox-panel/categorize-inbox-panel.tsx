import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Footer } from '../../../@generic/component/footer/footer';
import { AiProgressBar } from '../../../settings/components/ai-progress-bar/ai-progress-bar';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxUndoBar } from '../categorize-inbox-undo-bar/categorize-inbox-undo-bar';

import { CategorizeInboxPanelSelector } from './categorize-inbox-panel.selector';

import type { CategorizeInboxAssignmentInterface } from '../../interface/categorize-inbox-assignment.interface';
import type { CategorizeInboxLastWriteInterface } from '../../interface/categorize-inbox-last-write.interface';

interface Props {
    readonly remainingCount: number;
    readonly categorizedCount: number;
    readonly acceptableAssignments: CategorizeInboxAssignmentInterface[];
    readonly lastWrite: CategorizeInboxLastWriteInterface | null;
    readonly onUndo: (lastWrite: CategorizeInboxLastWriteInterface) => void;
    readonly onFollowUp: (lastWrite: CategorizeInboxLastWriteInterface) => Promise<void>;
}

export const CategorizeInboxPanel = ({ remainingCount, categorizedCount, acceptableAssignments, lastWrite, onUndo, onFollowUp }: Props) => {
    const { t } = useLingui();
    const { assign } = useCategorizeInboxContext();

    const handleAcceptAllPress = (): void => void assign(acceptableAssignments);

    const totalCount = remainingCount + categorizedCount;
    const progress = isPositiveNumber(totalCount) ? (categorizedCount / totalCount) * 100 : 0;
    const progressText = [
        t({ message: plural(remainingCount, { one: '# left', other: '# left' }) }),
        t({ message: plural(categorizedCount, { one: '# done', other: '# done' }) })
    ].join(' · ');
    const accessibilityValue = { min: 0, max: totalCount, now: categorizedCount, text: progressText };
    const rowCount = acceptableAssignments.reduce((total, assignment) => total + assignment.rows.length, 0);
    const acceptAllText = t({ message: plural(rowCount, { one: 'Accept # suggestion', other: 'Accept # suggestions' }) });
    const acceptAll = isNotEmptyArray(acceptableAssignments) ? (
        <Button
            variant="cta"
            size="md"
            leftIcon={UserIconNameEnum.CheckCheck}
            content={acceptAllText}
            onPress={handleAcceptAllPress}
            testID={CategorizeInboxPanelSelector.AcceptAllButton}
        />
    ) : (
        <Text className="text-center text-sm font-medium text-secondary-foreground" numberOfLines={1}>
            <Trans>Tap a suggestion to accept it</Trans>
        </Text>
    );

    return (
        <Footer>
            <View className="gap-y-lg pb-md" testID={CategorizeInboxPanelSelector.Panel}>
                <View
                    className="gap-y-md"
                    accessible
                    accessibilityRole="progressbar"
                    accessibilityValue={accessibilityValue}
                    testID={CategorizeInboxPanelSelector.Progress}
                >
                    <Text className="text-xs font-medium text-secondary-foreground" numberOfLines={1}>
                        {progressText}
                    </Text>
                    <AiProgressBar progress={progress} />
                </View>

                <View className="h-14 justify-center">
                    {isDefined(lastWrite) ? (
                        <CategorizeInboxUndoBar lastWrite={lastWrite} onUndo={onUndo} onFollowUp={onFollowUp} />
                    ) : (
                        acceptAll
                    )}
                </View>
            </View>
        </Footer>
    );
};
