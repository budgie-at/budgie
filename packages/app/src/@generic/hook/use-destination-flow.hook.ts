import { useState } from 'react';

export const useDestinationFlow = <TStep extends string>(listStep: TStep, createStep: TStep) => {
    const [step, setStep] = useState(listStep);
    const [createTitle, setCreateTitle] = useState('');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [search, setSearch] = useState('');

    const handleCreatePress = (defaultTitle: string) => {
        setCreateTitle(defaultTitle);
        setStep(createStep);
    };

    const handleCreated = (id: number) => {
        setSelectedId(id);
        setSearch('');
        setStep(listStep);
    };

    const handleCreateCancel = () => {
        setStep(listStep);
    };

    return {
        step,
        createTitle,
        selection: { selectedId, onSelect: setSelectedId, search, onSearchChange: setSearch },
        handleCreatePress,
        handleCreated,
        handleCreateCancel
    };
};
