import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';
import { SheetTitleRow } from '../../../@generic/component/sheet-title-row/sheet-title-row';
import { useMorphingSheetCommit } from '../../../@generic/hook/use-morphing-sheet-commit.hook';
import { buildYieldKindSections } from '../../utils/build-yield-kind-sections.util';
import { YieldKindOptionRow } from '../yield-kind-option-row/yield-kind-option-row';

import type { ModalParams } from '../../../@generic/type/modal-params.type';
import type { YieldKindEnum } from '@budgie/contracts';

interface Props {
    readonly params: ModalParams<'/yield-kind'>;
    readonly onCommit: (kind: YieldKindEnum) => void;
}

export const YieldKindSelectorContent = ({ params, onCommit }: Props) => {
    const { t } = useLingui();
    const commit = useMorphingSheetCommit(onCommit);
    const sections = buildYieldKindSections(params.transactionType);

    return (
        <SheetSurface className="flex-none pt-lg" contentClassName="flex-none">
            <View className="px-xl pb-lg">
                <SheetTitleRow title={t`Kind`} trailing={<View />} />
            </View>
            <View className="gap-y-xl px-3xl pb-[32px]">
                {sections.map(section => (
                    <GroupedListSection key={section.join('-')}>
                        {section.map(kind => (
                            <YieldKindOptionRow key={kind} kind={kind} isSelected={params.selectedKind === kind} onSelect={commit} />
                        ))}
                    </GroupedListSection>
                ))}
            </View>
        </SheetSurface>
    );
};
