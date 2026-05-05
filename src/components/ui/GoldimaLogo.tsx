import { Gem } from 'lucide-react';

export const GoldimaLogo = () => {
  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      <Gem className="h-8 w-8 text-gold" />
      <h1 className="text-3xl font-bold text-brand-text-primary tracking-tight">
        Goldima
      </h1>
    </div>
  );
};
