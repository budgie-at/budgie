import { Sparkles } from 'lucide-react';

export const AiDetailsHeader = () => (
    <div className="bg-linear-to-r from-primary to-secondary p-4 text-primary-foreground">
        <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="size-4" />
            </div>

            <div>
                <div className="font-medium">Budgie AI</div>

                <div className="text-xs opacity-80">On-device assistant</div>
            </div>
        </div>
    </div>
);
