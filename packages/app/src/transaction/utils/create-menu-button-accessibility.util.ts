export const createMenuButtonAccessibility = (label: string) => ({
    accessible: true,
    accessibilityRole: 'button' as const,
    accessibilityLabel: label,
    accessibilityShowsLargeContentViewer: true,
    accessibilityLargeContentTitle: label
});
