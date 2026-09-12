import { useSetting } from '../../../settings/hook/use-setting.hook';
import { RunwayWidgetCard } from '../runway-widget-card/runway-widget-card';

export const RunwayWidget = () => {
    const isEnabled = useSetting('isRunwayWidgetEnabled');

    if (!isEnabled) {
        return null;
    }

    return <RunwayWidgetCard />;
};
