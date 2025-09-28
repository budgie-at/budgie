const banks = ['Chase', 'Bank of America', 'Wells Fargo', 'Coinbase', 'Robinhood'];

export const BanksSection = () => (
    <section className="w-full py-12 border-y bg-muted/30">
        <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <p className="text-sm font-medium text-muted-foreground">Syncs with 1000+ banks and financial institutions</p>

                <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16">
                    {banks.map(bank => (
                        <div
                            className="h-8 px-4 flex items-center justify-center bg-muted/50 rounded text-sm font-medium text-muted-foreground"
                            key={bank}
                        >
                            {bank}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </section>
);
