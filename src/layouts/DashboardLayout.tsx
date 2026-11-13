
import { ReactNode } from 'react';
import {
    LayoutDashboard,
    Landmark,
    Users,
    Wallet,
    ShieldCheck,
    ArrowLeftRight,
    Settings,
    LogOut
} from 'lucide-react';

import WalletConnect from '../components/WalletConnect';

interface DashboardLayoutProps {
    children: ReactNode;
    activePage: string;
    setActivePage: (page: string) => void;
}

export default function DashboardLayout({
    children,
    activePage,
    setActivePage
}: DashboardLayoutProps) {

    const menu = [
        { name: 'Overview', icon: LayoutDashboard },
        { name: 'Bond Marketplace', icon: Landmark },
        { name: 'Investors', icon: Users },
        { name: 'Wallet', icon: Wallet },
        { name: 'Reserve Verification', icon: ShieldCheck },
        { name: 'Transactions', icon: ArrowLeftRight },
        { name: 'Settings', icon: Settings }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white flex">

            <aside className="w-64 bg-slate-900 border-r border-slate-800 p-5">

                <h1 className="text-3xl font-extrabold text-blue-400 mb-10">
                    PROPX
                </h1>

                <nav className="space-y-3">
                    {menu.map((item) => {
                        const Icon = item.icon;
                        const isActive = activePage === item.name;

                        return (
                            <button
                                key={item.name}
                                onClick={() => setActivePage(item.name)}
                                className={`flex items-center gap-3 w-full p-3 rounded-lg transition ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <Icon size={20} />
                                {item.name}
                            </button>
                        );
                    })}
                </nav>

                <button className="flex items-center gap-3 text-red-400 mt-16 p-3">
                    <LogOut size={20} />
                    Logout
                </button>

            </aside>

            <main className="flex-1 p-8">

                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h2 className="text-2xl font-bold">
                            {activePage}
                        </h2>

                        <p className="text-slate-400">
                            Real World Asset Tokenization Platform
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="bg-slate-800 px-4 py-2 rounded-lg text-sm">
                            Admin Portal
                        </span>

                        <WalletConnect />
                    </div>
                </header>

                {children}

            </main>
        </div>
    );
}
