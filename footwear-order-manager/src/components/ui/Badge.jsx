import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Badge({ children, variant = 'default', className }) {
    const variants = {
        default: 'bg-slate-100 text-slate-700',
        success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
        warning: 'bg-amber-50 text-amber-700 border border-amber-100',
        danger: 'bg-rose-50 text-rose-700 border border-rose-100',
        info: 'bg-blue-50 text-blue-700 border border-blue-100',
    };

    return (
        <span className={twMerge(clsx(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            variants[variant],
            className
        ))}>
            {children}
        </span>
    );
}
