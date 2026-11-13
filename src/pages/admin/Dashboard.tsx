
import {
    Landmark,
    Users,
    Wallet,
    ShieldCheck,
    TrendingUp,
    ArrowUpRight,
    Clock,
    CircleCheck,
    Activity,
    Coins,
} from 'lucide-react';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

// Demo asset growth data
const chartData = [
    { month: 'May', value: 850000 },
    { month: 'Jun', value: 1100000 },
    { month: 'Jul', value: 980000 },
    { month: 'Aug', value: 1450000 },
    { month: 'Sep', value: 1800000 },
    { month: 'Oct', value: 2100000 },
    { month: 'Nov', value: 2400000 },
];

// Demo transactions
const transactions = [
    {
        id: 'TXN001',
        name: 'Government Bond #001',
        type: 'Token Minting',
        amount: '$25,000',
        status: 'Completed',
        date: 'Nov 10, 2026',
    },
    {
        id: 'TXN002',
        name: 'Corporate Bond #024',
        type: 'Bond Registration',
        amount: '$50,000',
        status: 'Pending',
        date: 'Nov 09, 2026',
    },
    {
        id: 'TXN003',
        name: 'Infrastructure Bond #012',
        type: 'Reserve Verification',
        amount: '$100,000',
        status: 'Completed',
        date: 'Nov 08, 2026',
    },
    {
        id: 'TXN004',
        name: 'Municipal Bond #018',
        type: 'Token Transfer',
        amount: '$12,500',
        status: 'Completed',
        date: 'Nov 07, 2026',
    },
];

const stats = [
    {
        title: 'Total Tokenized Assets',
        value: '$2.4M',
        change: '+12.8%',
        icon: Landmark,
    },
    {
        title: 'Active Investors',
        value: '156',
        change: '+8.2%',
        icon: Users,
    },
    {
        title: 'Total Transactions',
        value: '1,284',
        change: '+18.5%',
        icon: Wallet,
    },
    {
        title: 'Verified Reserves',
        value: '94.8%',
        change: '+4.3%',
        icon: ShieldCheck,
    },
];

export default function Dashboard() {
    return (
        <div className="space-y-8">

            {/* Welcome */}
            <section>
                <p className="text-purple-400 text-sm font-semibold mb-2">
                    PLATFORM OVERVIEW
                </p>

                <h1 className="text-3xl font-bold text-white">
                    Welcome back, Admin 👋
                </h1>

                <p className="text-slate-400 mt-2">
                    Monitor tokenized assets, investors and blockchain transactions.
                </p>
            </section>

            {/* Statistics */}
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <div
                            key={stat.title}
                            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/50 transition"
                        >
                            <div className="flex justify-between items-center">
                                <div className="p-3 bg-purple-500/10 rounded-xl">
                                    <Icon className="text-purple-400" size={23} />
                                </div>

                                <span className="text-emerald-400 text-sm flex items-center gap-1">
                                    <ArrowUpRight size={15} />
                                    {stat.change}
                                </span>
                            </div>

                            <p className="text-slate-400 text-sm mt-5">
                                {stat.title}
                            </p>

                            <h2 className="text-3xl font-bold text-white mt-2">
                                {stat.value}
                            </h2>
                        </div>
                    );
                })}
            </section>

            {/* Chart and Reserve */}
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Asset Growth Chart */}
                <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">

                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-white">
                                Asset Growth
                            </h2>

                            <p className="text-sm text-slate-400 mt-1">
                                Total tokenized asset value
                            </p>
                        </div>

                        <span className="text-emerald-400 text-sm flex items-center gap-1">
                            <TrendingUp size={16} />
                            Growing
                        </span>
                    </div>

                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient
                                        id="assetGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#1e293b"
                                />

                                <XAxis dataKey="month" stroke="#64748b" />

                                <YAxis
                                    stroke="#64748b"
                                    tickFormatter={(value) => `$${value / 1000000}M`}
                                />

                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '12px',
                                        color: '#fff',
                                    }}
                                    formatter={(value) => [
                                        `$${Number(value).toLocaleString()}`,
                                        'Asset Value',
                                    ]}
                                />

                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#a855f7"
                                    strokeWidth={3}
                                    fill="url(#assetGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Reserve Status */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

                    <h2 className="text-lg font-semibold text-white">
                        Reserve Verification
                    </h2>

                    <p className="text-sm text-slate-400 mt-1">
                        Sample platform reserve overview
                    </p>

                    <div className="flex flex-col items-center py-8">
                        <div className="w-36 h-36 rounded-full border-[12px] border-emerald-500 flex items-center justify-center">
                            <div className="text-center">
                                <h3 className="text-3xl font-bold text-white">
                                    94.8%
                                </h3>

                                <p className="text-xs text-slate-400">
                                    Demo indicator
                                </p>
                            </div>
                        </div>

                        <span className="mt-5 flex items-center gap-2 text-emerald-400 text-sm">
                            <ShieldCheck size={18} />
                            Sample verification status
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Verified assets</span>
                            <span className="text-white">$2.27M</span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Pending review</span>
                            <span className="text-amber-400">$130K</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Recent Transactions */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            Recent Transactions
                        </h2>

                        <p className="text-sm text-slate-400 mt-1">
                            Latest platform activities
                        </p>
                    </div>

                    <Activity className="text-purple-400" />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[650px]">

                        <thead>
                            <tr className="text-slate-400 text-sm border-b border-slate-800">
                                <th className="py-4">Transaction ID</th>
                                <th>Asset</th>
                                <th>Transaction</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {transactions.map((tx) => (
                                <tr
                                    key={tx.id}
                                    className="border-b border-slate-800/70 text-sm"
                                >
                                    <td className="py-5 text-purple-400">
                                        {tx.id}
                                    </td>

                                    <td className="text-white font-medium">
                                        {tx.name}
                                    </td>

                                    <td className="text-slate-400">
                                        {tx.type}
                                    </td>

                                    <td className="text-white">
                                        {tx.amount}
                                    </td>

                                    <td>
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${tx.status === 'Completed'
                                                    ? 'bg-emerald-500/10 text-emerald-400'
                                                    : 'bg-amber-500/10 text-amber-400'
                                                }`}
                                        >
                                            {tx.status === 'Completed'
                                                ? <CircleCheck size={13} />
                                                : <Clock size={13} />
                                            }

                                            {tx.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>

                    </table>
                </div>
            </section>

            <p className="text-xs text-slate-500">
                PROPХ RWA Platform · Dashboard Preview · Sample data only
            </p>

        </div>
    );
}
