import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { SyncGuideStep } from '../sync-guide-step/sync-guide-step';

interface Props {
    readonly title: string;
    readonly steps: readonly string[];
    readonly footer?: string;
}

export const SyncGuideSteps = ({ title, steps, footer }: Props) => (
    <GroupedListSection title={title} footer={footer}>
        {steps.map((step, index) => (
            <SyncGuideStep key={step} number={index + 1}>
                {step}
            </SyncGuideStep>
        ))}
    </GroupedListSection>
);
