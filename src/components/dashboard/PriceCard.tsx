// components/dashboard/PriceCard.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

interface PriceCardProps {
    title: string;
    subtitle?: string;
    price: number;
    unit: string;
    change?: number;
    icon?: string;
}

export default function PriceCard({ title, subtitle, price, unit, change, icon = "📊" }: PriceCardProps) {
    const [animatedPrice, setAnimatedPrice] = useState(price);

    useEffect(() => {
        setAnimatedPrice(price);
    }, [price]);

    const isPositive = change && change > 0;
    const isNegative = change && change < 0;

    return (
        <Card className="bg-brand-surface border-brand-border hover:border-gold/50 transition-all duration-300 p-6 group">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-brand-text-primary group-hover:text-gold transition-colors">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-sm text-brand-text-secondary mt-1">{subtitle}</p>
                    )}
                </div>
                <span className="text-3xl">{icon}</span>
            </div>

            <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gold">
                        {animatedPrice.toLocaleString("fa-IR")}
                    </span>
                    <span className="text-sm text-brand-text-secondary">{unit}</span>
                </div>

                {change !== undefined && (
                    <div className="flex items-center gap-2">
                        <span
                            className={`text-sm font-medium ${
                                isPositive ? "text-green-500" : isNegative ? "text-red-500" : "text-brand-text-secondary"
                            }`}
                        >
                            {isPositive && "↑"} {isNegative && "↓"} {Math.abs(change).toFixed(2)}%
                        </span>
                        <span className="text-xs text-brand-text-secondary">تغییرات ۲۴ ساعته</span>
                    </div>
                )}
            </div>
        </Card>
    );
}
