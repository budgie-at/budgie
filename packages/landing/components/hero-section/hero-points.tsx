import { Check } from 'lucide-react';

export const HeroPoints = () => (
    <div className="flex items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
            <Check className="size-4 text-primary" />

            <span>100% Secure</span>
        </div>

        <div className="flex items-center gap-1">
            <Check className="size-4 text-primary" />

            <span>Open Source</span>
        </div>

        <div className="flex items-center gap-1">
            <Check className="size-4 text-primary" />

            <span>Privacy First</span>
        </div>
    </div>
);
