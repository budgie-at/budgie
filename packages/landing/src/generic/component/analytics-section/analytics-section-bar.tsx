import { AlertTriangle } from 'lucide-react';

interface Props {
    label: string;
    value: string;
    width: string;
    color: string;
    hasWarning?: boolean;
    warningColor?: string;
}

export const AnalyticsSectionBar = ({ label, value, width, color, hasWarning, warningColor }: Props) => {
    const barStyle = { width };

    return (
        <div>
            <div className="flex items-center justify-between text-sm mb-1">
                <div className="flex items-center gap-1">
                    <span>{label}</span>

                    {hasWarning ? <AlertTriangle className={`size-3 ${warningColor}`} /> : null}
                </div>

                <span className={`font-medium ${hasWarning ? warningColor : ''}`}>{value}</span>
            </div>

            <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={barStyle} />
            </div>
        </div>
    );
};
