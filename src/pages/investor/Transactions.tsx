
import { useState } from 'react';
import {
    ArrowDownLeft,
    ArrowUpRight,
    ArrowLeftRight,
    Search,
    Download,
    ExternalLink,
    Clock,
    CheckCircle,
    XCircle,
    Coins,
    Activity
} from 'lucide-react';

interface Transaction {
    id: number;
    investor: string;
    type: string;
    asset: string;
    amount: string;
    date: string;
    status: 'Completed' | 'Pending' | 'Failed';
    hash: string;
}

const transactions: Transaction[] = [
    {
        id: 1,
        investor: 'Rahul Sharma',
        type: 'Purchase',
        asset: 'Government Bond',
        amount: '$5,000',
        date: '10 Nov 2026',
        status: 'Completed',
        hash: '0x71ac92f31b8e'
    },
    {
        id: 2,
        investor: 'Priya Mehta',
        type: 'Sale',
        asset: 'Real Estate Token',
        amount: '$2,500',
        date: '09 Nov 2026',
        status: 'Completed',
        hash: '0x82bd31f42c9a'
    },
    {
        id: 3,
        investor: 'Arjun Reddy',
        type: 'Transfer',
        asset: 'Corporate Bond',
        amount: '$1,200',
        date: '08 Nov 2026',
        status: 'Pending',
        hash: '0x93de42b35a1c'
    },
    {
        id: 4,
        investor: 'Sneha Rao',
        type: 'Interest',
        asset: 'Government Bond',
        amount: '$750',
        date: '07 Nov 2026',
        status: 'Completed',
        hash: '0x54af19c46d2e'
    },
    {
        id: 5,
        investor: 'Karan Patel',
        type: 'Purchase',
        asset: 'Real Estate Token',
        amount: '$3,000',
        date: '06 Nov 2026',
        status: 'Failed',
        hash: '0x65be82d57f3a'
    },
    {
        id: 6,
        investor: 'Ananya Rao',
        type: 'Purchase',
        asset: 'Corporate Bond',
        amount: '$4,500',
        date: '05 Nov 2026',
        status: 'Completed',
        hash: '0x76cf93e68a4b'
    }
];

export default function Transactions() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');
    const [selected, setSelected] = useState<Transaction | null>(null);

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch =
            tx.investor.toLowerCase().includes(search.toLowerCase()) ||
            tx.asset.toLowerCase().includes(search.toLowerCase()) ||
            tx.hash.toLowerCase().includes(search.toLowerCase());

        const matchesFilter =
            filter === 'All' || tx.status === filter;

        return matchesSearch && matchesFilter;
    });

    const completed = transactions.filter(tx => tx.status === 'Completed').length;
    const pending = transactions.filter(tx => tx.status === 'Pending').length;
    const failed = transactions.filter(tx => tx.status === 'Failed').length;

    const downloadCSV = () => {
        const headers = ['Investor', 'Type', 'Asset', 'Amount', 'Date', 'Status', 'Hash'];

        const rows = filteredTransactions.map(tx => [
            tx.investor,
            tx.type,
            tx.asset,
            tx.amount,
            tx.date,
            tx.status,
            tx.hash
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csv], {
            type: 'text/csv;charset=utf-8;'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'transactions.csv';
        link.click();

        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8">

            {/* Heading */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Transactions
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Monitor and manage all platform transactions.
                    </p>
                </div>

                <button
                    onClick={downloadCSV}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                >
                    <Download size={18} />
                    Export CSV
                </button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                <StatCard
                    title="Total Transactions"
                    value={transactions.length.toString()}
                    icon={<Activity size={23} />}
                    color="text-blue-400"
                />

                <StatCard
                    title="Completed"
                    value={completed.toString()}
                    icon={<CheckCircle size={23} />}
                    color="text-green-400"
                />

                <StatCard
                    title="Pending"
                    value={pending.toString()}
                    icon={<Clock size={23} />}
                    color="text-yellow-400"
                />

                <StatCard
                    title="Failed"
                    value={failed.toString()}
                    icon={<XCircle size={23} />}
                    color="text-red-400"
                />

            </div>

            {/* Transaction Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-500/10 p-3 rounded-lg">
                            <ArrowDownLeft className="text-green-400" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">
                                Total Completed Volume
                            </p>
                            <h2 className="text-2xl font-bold text-white mt-1">
                                $12,750
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-500/10 p-3 rounded-lg">
                            <Coins className="text-purple-400" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">
                                Total Bond Activities
                            </p>
                            <h2 className="text-2xl font-bold text-white mt-1">
                                6 Transactions
                            </h2>
                        </div>
                    </div>
                </div>

            </div>

            {/* Transaction Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            Transaction History
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            View all investor transactions.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">

                        <div className="relative">
                            <Search
                                size={18}
                                className="absolute left-3 top-3 text-slate-500"
                            />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white outline-none focus:border-blue-500 w-full"
                            />
                        </div>

                        <select
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none"
                        >
                            <option value="All">All Status</option>
                            <option value="Completed">Completed</option>
                            <option value="Pending">Pending</option>
                            <option value="Failed">Failed</option>
                        </select>

                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">

                        <thead>
                            <tr className="border-b border-slate-700 text-slate-400 text-sm">
                                <th className="p-4">Investor</th>
                                <th className="p-4">Transaction</th>
                                <th className="p-4">Asset</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Details</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredTransactions.map(tx => (
                                <tr
                                    key={tx.id}
                                    className="border-b border-slate-800 hover:bg-slate-800/40"
                                >

                                    <td className="p-4 text-white font-medium">
                                        {tx.investor}
                                    </td>

                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            {tx.type === 'Purchase' && <ArrowDownLeft size={17} className="text-green-400" />}
                                            {tx.type === 'Sale' && <ArrowUpRight size={17} className="text-red-400" />}
                                            {tx.type === 'Transfer' && <ArrowLeftRight size={17} className="text-blue-400" />}
                                            {tx.type === 'Interest' && <Coins size={17} className="text-purple-400" />}
                                            {tx.type}
                                        </div>
                                    </td>

                                    <td className="p-4 text-slate-300 text-sm">
                                        {tx.asset}
                                    </td>

                                    <td className="p-4 text-white font-medium">
                                        {tx.amount}
                                    </td>

                                    <td className="p-4 text-slate-400 text-sm">
                                        {tx.date}
                                    </td>

                                    <td className="p-4">
                                        <StatusBadge status={tx.status} />
                                    </td>

                                    <td className="p-4">
                                        <button
                                            onClick={() => setSelected(tx)}
                                            className="text-blue-400 hover:text-blue-300 text-sm"
                                        >
                                            View
                                        </button>
                                    </td>

                                </tr>
                            ))}

                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400">
                                        No transactions found.
                                    </td>
                                </tr>
                            )}

                        </tbody>

                    </table>
                </div>

                <p className="text-slate-500 text-sm mt-5">
                    Showing {filteredTransactions.length} of {transactions.length} transactions
                </p>

            </div>

            {/* Transaction Details */}
            {selected && (
                <div className="bg-slate-900 border border-blue-500/40 rounded-xl p-6">

                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">
                            Transaction Details
                        </h2>

                        <button
                            onClick={() => setSelected(null)}
                            className="text-slate-400 hover:text-white"
                        >
                            Close ✕
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">

                        <Detail label="Investor" value={selected.investor} />
                        <Detail label="Transaction Type" value={selected.type} />
                        <Detail label="Asset" value={selected.asset} />
                        <Detail label="Amount" value={selected.amount} />
                        <Detail label="Date" value={selected.date} />
                        <Detail label="Status" value={selected.status} />

                    </div>

                    <div className="mt-5 bg-slate-800 rounded-lg p-4">
                        <p className="text-slate-400 text-xs mb-2">
                            Transaction Hash (Demo)
                        </p>

                        <div className="flex flex-wrap justify-between gap-3">
                            <code className="text-blue-400 text-sm break-all">
                                {selected.hash}
                            </code>
                            <ExternalLink size={17} className="text-slate-400" />
                        </div>
                    </div>

                </div>
            )}

        </div>
    );
}

function StatCard({ title, value, icon, color }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
}) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex justify-between items-center">
                <p className="text-slate-400 text-sm">{title}</p>
                <div className={color}>{icon}</div>
            </div>
            <h2 className="text-3xl font-bold text-white mt-4">
                {value}
            </h2>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        Completed: 'bg-green-500/10 text-green-400',
        Pending: 'bg-yellow-500/10 text-yellow-400',
        Failed: 'bg-red-500/10 text-red-400'
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs ${styles[status]}`}>
            {status}
        </span>
    );
}

function Detail({ label, value }: {
    label: string;
    value: string;
}) {
    return (
        <div className="bg-slate-800/60 rounded-lg p-4">
            <p className="text-slate-400 text-xs">{label}</p>
            <p className="text-white font-medium mt-2">{value}</p>
        </div>
    );
}
