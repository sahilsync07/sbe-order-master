import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import logo from '../assets/logo.svg';

export default function Layout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex flex-col h-screen bg-[#13131a] overflow-hidden">
            {/* Top Header */}
            <header className="h-14 md:h-20 bg-transparent flex items-center justify-between px-4 md:px-10 z-30 sticky top-0 w-full mx-auto shrink-0">
                <div className="flex items-center gap-2 md:gap-4">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="w-10 h-10 md:w-14 md:h-14 relative z-10 transform group-hover:scale-105 transition-transform duration-300">
                            <img src={logo} alt="OrderMaster Logo" className="w-full h-full object-contain drop-shadow-xl" />
                        </div>
                    </div>

                    <div>
                        <h1 className="font-extrabold text-lg md:text-2xl tracking-tight text-white drop-shadow-sm font-display leading-tight">
                            OrderMaster
                        </h1>
                        <p className="text-[10px] md:text-xs font-semibold text-slate-400 tracking-wide uppercase">M/S Sri Brundabana</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                        <Search size={18} className="text-slate-400" />
                        <input type="text" placeholder="Search orders..." className="bg-transparent border-none outline-none text-sm w-48 placeholder-slate-500 text-slate-200" />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden relative bg-transparent">
                <div className="h-full overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        <Outlet />
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
