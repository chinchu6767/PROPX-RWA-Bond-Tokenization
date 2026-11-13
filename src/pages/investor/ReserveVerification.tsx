
import { useState } from 'react';
import {
    ShieldCheck,
    Landmark,
    Coins,
    TrendingUp,
    CheckCircle,
    Clock,
    FileText,
    Search,
    Eye
} from 'lucide-react';

const assets = [
    {
        id: 1,
        name: 'Government Bonds',
        type: 'Government Securities',
        value: '$2,500,000',
        tokens: '2,000,000',
        status: 'Verified',
        date: '10 Nov 2026',
        coverage: '125%'
    },
    {
        id: 2,
        name: 'Commercial Property',
        type: 'Real Estate',
        value: '$1,800,000',
        tokens: '1,500,000',
        status: 'Verified',
        date: '09 Nov 2026',
        coverage: '120%'
    },
    {
        id: 3,
        name: 'Corporate Bonds',
        type: 'Corporate Securities',
        value: '$700,000',
        tokens: '500,000',
        status: 'Pending',
        date: '08 Nov 2026',
        coverage: '140%'
    }
];

export default function ReserveVerification() {
    const [search, setSearch] = useState('');
    const [selectedAsset, setSelectedAsset] = useState<number | null>(null);

    const filteredAssets = assets.filter(asset =>
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.type.toLowerCase().includes(search.toLowerCase())
    );

    const selected = assets.find(asset => asset.id === selectedAsset);

    return (
        <div className="space-y-8">

            {/* Heading */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Reserve Verification
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Monitor asset backing and proof of reserves.
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-lg text-sm">
                    <ShieldCheck size={18} />
                    Reserve Monitoring
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                <StatCard
                    title="Total Asset Reserves"
                    value="$5,000,000"
                    icon={<Landmark size={24} />}
                    color="text-blue-400"
                />

                <StatCard
                    title="Tokens Issued"
                    value="$4,000,000"
                    icon={<Coins size={24} />}
                    color="text-purple-400"
                />

                <StatCard
                    title="Reserve Coverage"
                    value="125%"
                    icon={<TrendingUp size={24} />}
                    color="text-green-400"
                />

                <StatCard
                    title="Verified Assets"
                    value="2 / 3"
                    icon={<ShieldCheck size={24} />}
                    color="text-yellow-400"
                />

            </div>

            {/* Coverage Overview */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

                <div className="flex justify-between items-center flex-wrap gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            Reserve Coverage Overview
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Asset value compared with issued token value.
                        </p>
                    </div>

                    <span className="text-green-400 bg-green-500/10 px-3 py-1 rounded-full text-sm">
                        125% Coverage
                    </span>
                </div>

                <div className="mt-6">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Token value backed by assets</span>
                        <span className="text-white font-medium">100% of issued value</span>
                    </div>

                    <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full rounded-full w-4/5" />
                    </div>

                    <div className="flex justify-between mt-4 text-sm">
                        <div>
                            <p className="text-slate-400">Asset Reserves</p>
                            <p className="text-white font-semibold">$5.0M</p>
                        </div>

                        <div className="text-right">
                            <p className="text-slate-400">Issued Tokens</p>
                            <p className="text-white font-semibold">$4.0M</p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Asset Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            Asset Verification Records
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Details of assets backing tokenized investments.
                        </p>
                    </div>

                    <div className="relative">
                        <Search
                            size={18}
                            className="absolute left-3 top-3 text-slate-500"
                        />

                        <input
                            type="text"
                            placeholder="Search assets..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">

                        <thead>
                            <tr className="text-slate-400 text-sm border-b border-slate-700">
                                <th className="p-4">Asset Name</th>
                                <th className="p-4">Asset Value</th>
                                <th className="p-4">Tokens Issued</th>
                                <th className="p-4">Coverage</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredAssets.map(asset => (
                                <tr
                                    key={asset.id}
                                    className="border-b border-slate-800 hover:bg-slate-800/40"
                                >
                                    <td className="p-4">
                                        <p className="text-white font-medium">
                                            {asset.name}
                                        </p>
                                        <p className="text-slate-500 text-xs mt-1">
                                            {asset.type}
                                        </p>
                                    </td>

                                    <td className="p-4 text-white">
                                        {asset.value}
                                    </td>

                                    <td className="p-4 text-slate-300">
                                        {asset.tokens}
                                    </td>

                                    <td className="p-4 text-green-400">
                                        {asset.coverage}
                                    </td>

                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs ${asset.status === 'Verified'
                                                ? 'bg-green-500/10 text-green-400'
                                                : 'bg-yellow-500/10 text-yellow-400'
                                            }`}>
                                            {asset.status}
                                        </span>
                                    </td>

                                    <td className="p-4">
                                        <button
                                            onClick={() => setSelectedAsset(asset.id)}
                                            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                                        >
                                            <Eye size={16} />
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {filteredAssets.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400">
                                        No assets found.
                                    </td>
                                </tr>
                            )}
                        </tbody>

                    </table>
                </div>

            </div>

            {/* Verification History */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

                <h2 className="text-xl font-bold text-white mb-6">
                    Verification History
                </h2>

                <div className="space-y-5">

                    <HistoryItem
                        title="Government Bonds"
                        description="Reserve verification completed successfully."
                        date="10 Nov 2026"
                        verified
                    />

                    <HistoryItem
                        title="Commercial Property"
                        description="Property reserve documents verified."
                        date="09 Nov 2026"
                        verified
                    />

                    <HistoryItem
                        title="Corporate Bonds"
                        description="Verification documents awaiting review."
                        date="08 Nov 2026"
                        verified={false}
                    />

                </div>
            </div>

            {/* Asset Details */}
            {selected && (
                <div className="bg-slate-900 border border-blue-500/40 rounded-xl p-6">

                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">
                            Asset Details
                        </h2>

                        <button
                            onClick={() => setSelectedAsset(null)}
                            className="text-slate-400 hover:text-white"
                        >
                            Close ✕
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">

                        <Detail label="Asset Name" value={selected.name} />
                        <Detail label="Asset Type" value={selected.type} />
                        <Detail label="Asset Value" value={selected.value} />
                        <Detail label="Tokens Issued" value={selected.tokens} />
                        <Detail label="Reserve Coverage" value={selected.coverage} />
                        <Detail label="Last Verification" value={selected.date} />

                    </div>

                    <div className="mt-5 flex items-center gap-2 text-sm">
                        {selected.status === 'Verified' ? (
                            <span className="text-green-400 flex items-center gap-2">
                                <CheckCircle size={18} />
                                Verification completed
                            </span>
                        ) : (
                            <span className="text-yellow-400 flex items-center gap-2">
                                <Clock size={18} />
                                Verification pending
                            </span>
                        )}
                    </div>

                </div>
            )}

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 flex gap-3">
                <FileText className="text-blue-400 shrink-0" size={22} />
                <div>
                    <h3 className="text-white font-semibold">
                        Proof of Reserve Information
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">
                        Proof of Reserve helps establish whether the assets
                        backing issued tokens are sufficient. In the live
                        system, verified reserve data can be supplied through
                        authorized auditors and blockchain oracles.
                    </p>
                </div>
            </div>

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

function HistoryItem({ title, description, date, verified }: {
    title: string;
    description: string;
    date: string;
    verified: boolean;
}) {
    return (
        <div className="flex gap-4 items-start">
            <div className={`mt-1 ${verified ? 'text-green-400' : 'text-yellow-400'}`}>
                {verified ? <CheckCircle size={20} /> : <Clock size={20} />}
            </div>
            <div className="flex-1">
                <div className="flex justify-between flex-wrap gap-2">
                    <p className="text-white font-medium">{title}</p>
                    <p className="text-slate-500 text-xs">{date}</p>
                </div>
                <p className="text-slate-400 text-sm mt-1">{description}</p>
            </div>
        </div>
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
