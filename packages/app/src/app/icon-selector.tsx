import { IconPickerPanel } from '../@generic/component/icon-picker-panel/icon-picker-panel';
import { useIconSelectorModal, useIconSelectorModalParams } from '../@generic/context/icon-selector-modal.context';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';

export default function IconSelectorModal() {
    const [, resolveIconSelector, dismissIconSelector] = useIconSelectorModal();
    useModalDismiss(dismissIconSelector);
    const { selectedIcon, keywords, excludedIcons } = useIconSelectorModalParams() ?? {};

    return <IconPickerPanel selectedIcon={selectedIcon} keywords={keywords} excludedIcons={excludedIcons} onSelect={resolveIconSelector} />;
}
