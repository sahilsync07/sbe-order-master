import React, { forwardRef } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Input = forwardRef(({
    label,
    error,
    className,
    containerClassName,
    ...props
}, ref) => {
    return (
        <div className={clsx("flex flex-col gap-1.5", containerClassName)}>
            {label && (
                <label className="text-sm font-medium text-slate-700">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                className={twMerge(clsx(
                    "px-4 py-2.5 rounded-xl border bg-slate-50 text-slate-900 placeholder-slate-400 transition-all duration-200 outline-none",
                    "focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900",
                    error ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "border-slate-200",
                    className
                ))}
                {...props}
            />
            {error && (
                <p className="text-xs text-red-500 font-medium">{error}</p>
            )}
        </div>
    );
});

export function Select({ label, error, className, options = [], ...props }) {
    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label className="text-sm font-medium text-slate-700">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    className={twMerge(clsx(
                        "w-full px-4 py-2.5 rounded-xl border bg-slate-50 text-slate-900 transition-all duration-200 outline-none appearance-none",
                        "focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900",
                        error ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "border-slate-200",
                        className
                    ))}
                    {...props}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
            {error && (
                <p className="text-xs text-red-500 font-medium">{error}</p>
            )}
        </div>
    )
}
