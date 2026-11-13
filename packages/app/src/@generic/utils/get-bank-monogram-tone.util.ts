const MONOGRAM_TONES = [
    { tileClassName: 'bg-[#007AFF]/15 dark:bg-[#0A84FF]/25', letterClassName: 'text-[#007AFF] dark:text-[#0A84FF]' },
    { tileClassName: 'bg-[#34C759]/15 dark:bg-[#30D158]/25', letterClassName: 'text-[#248A3D] dark:text-[#30D158]' },
    { tileClassName: 'bg-[#FF9500]/15 dark:bg-[#FF9F0A]/25', letterClassName: 'text-[#C93400] dark:text-[#FF9F0A]' },
    { tileClassName: 'bg-[#AF52DE]/15 dark:bg-[#BF5AF2]/25', letterClassName: 'text-[#8944AB] dark:text-[#BF5AF2]' },
    { tileClassName: 'bg-[#FF2D55]/15 dark:bg-[#FF375F]/25', letterClassName: 'text-[#D30F45] dark:text-[#FF375F]' },
    { tileClassName: 'bg-[#30B0C7]/15 dark:bg-[#40C8E0]/25', letterClassName: 'text-[#0071A4] dark:text-[#40C8E0]' },
    { tileClassName: 'bg-[#5856D6]/15 dark:bg-[#5E5CE6]/25', letterClassName: 'text-[#3634A3] dark:text-[#7D7AFF]' }
] as const;

export const getBankMonogramTone = (bankName: string): (typeof MONOGRAM_TONES)[number] => {
    const hash = Array.from(bankName).reduce((sum, character) => sum + (character.codePointAt(0) ?? 0), 0);

    return MONOGRAM_TONES[hash % MONOGRAM_TONES.length] ?? MONOGRAM_TONES[0];
};
