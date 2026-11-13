
import { useState } from 'react';
import type { ReactNode } from 'react';
import {
    Users,
    UserCheck,
    UserX,
    Search,
    ShieldCheck,
} from 'lucide-react';

interface Investor {
    id: number;
    name: string;
    email: string;
    wallet: string;
    investment: string;
    kyc: 'Verified' | 'Pending' | 'Rejected';
    joined: string;
}

const investors: Investor[] = [
    {
        id: 1,
        name: 'Rahul Sharma',
        email: 'rahul@gmail.com',
        wallet: '0x71C...92A1',
        investment: '$25,000',
        kyc: 'Verified',
        joined: '10 Oct 2026',
    },
    {
        id: 2,
        name: 'Priya Mehta',
        email: 'priya@gmail.com',
        wallet: '0x82B...31F2',
        investment: '$18,500',
        kyc: 'Verified',
        joined: '12 Oct 2026',
    },
    {
        id: 3,
        name: 'Arjun Reddy',
        email: 'arjun@gmail.com',
        wallet: '0x93D...42B3',
        investment: '$12,000',
        kyc: 'Pending',
        joined: '15 Oct 2026',
    },
    {
        id: 4,
        name: 'Sneha Rao',
        email: 'sneha@gmail.com',
        wallet: '0x54A...19C4',
        investment: '$32,000',
        kyc: 'Verified',
        joined: '18 Oct 2026',
    },
    {
        id: 5,
        name: 'Karan Patel',
        email: 'karan@gmail.com',
        wallet: '0x65E...82D5',
        investment: '$8,500',
        kyc: 'Rejected',
        joined: '20 Oct 2026',
    },
];

function Investors() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');

    const filteredInvestors = investors.filter((investor) => {
        const matchesSearch =
            investor.name.toLowerCase().includes(search.toLowerCase()) ||
            investor.email.toLowerCase().includes(search.toLowerCase());

        const matchesFilter =
            filter === 'All' || investor.kyc === filter;

        return matchesSearch && matchesFilter;
    });

    const verified = investors.filter(i => i.kyc === 'Verified').length;
    const pending = investors.filter(i => i.kyc === 'Pending').length;
    const rejected = investors.filter(i => i.kyc === 'Rejected').length;

    return (
        <div className="space-y-8">

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Investor Management
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Manage investors, KYC verification and investments.
                    </p>
                </div>

                <div className="bg-purple-500/10 text-purple-400 px-4 py-2 rounded-lg text-sm">
                    <Users size={16} className="inline mr-2" />
                    Investor Portal
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard title="Total Investors" value={investors.length.toString()} icon={<Users />} color="text-purple-400" />
                <StatCard title="Verified Investors" value={verified.toString()} icon={<UserCheck />} color="text-green-400" />
                <StatCard title="Pending KYC" value={pending.toString()} icon={<ShieldCheck />} color="text-yellow-400" />
                <StatCard title="Rejected KYC" value={rejected.toString()} icon={<UserX />} color="text-red-400" />
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

                <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            All Investors
                        </h2>
                        <p className="text-sm text-slate-400">
                            View and manage registered investors.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-3 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search investors..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white outline-none focus:border-purple-500 w-full"
                            />
                        </div>

                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none"
                        >
                            <option value="All">All Status</option>
                            <option value="Verified">Verified</option>
                            <option value="Pending">Pending</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-700 text-slate-400 text-sm">
                                <th className="p-4">Investor</th>
                                <th className="p-4">Wallet Address</th>
                                <th className="p-4">Investment</th>
                                <th className="p-4">KYC Status</th>
                                <th className="p-4">Joined Date</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredInvestors.map((investor) => (
                                <tr
                                    key={investor.id}
                                    className="border-b border-slate-800 hover:bg-slate-800/50 transition"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                                                {investor.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{investor.name}</p>
                                                <p className="text-slate-500 text-xs">{investor.email}</p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="p-4 text-slate-300 text-sm">
                                        {investor.wallet}
                                    </td>

                                    <td className="p-4 text-white font-medium">
                                        {investor.investment}
                                    </td>

                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${investor.kyc === 'Verified'
                                                ? 'bg-green-500/10 text-green-400'
                                                : investor.kyc === 'Pending'
                                                    ? 'bg-yellow-500/10 text-yellow-400'
                                                    : 'bg-red-500/10 text-red-400'
                                            }`}>
                                            {investor.kyc}
                                        </span>
                                    </td>

                                    <td className="p-4 text-slate-400 text-sm">
                                        {investor.joined}
                                    </td>
                                </tr>
                            ))}

                            {filteredInvestors.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        No investors found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <p className="text-slate-500 text-sm mt-5">
                    Showing {filteredInvestors.length} of {investors.length} investors
                </p>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    color,
}: {
    title: string;
    value: string;
    icon: ReactNode;
    color: string;
}) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex justify-between items-center">
                <p className="text-slate-400 text-sm">{title}</p>
                <div className={color}>{icon}</div>
            </div>
            <h2 className="text-3xl font-bold text-white mt-4">{value}</h2>
        </div>
    );
}

export default Investors;
