
import { useState } from 'react';
import {
    Wallet as WalletIcon,
    Coins,
    ArrowDownLeft,
    ArrowUpRight,
    Copy,
    ExternalLink,
    ShieldCheck
} from 'lucide-react';

const transactions = [
    {
        id: 1,
        type: 'Received',
        description: 'Bond token purchase',
        amount: '+500 BOND',
        date: '10 Nov 2026',
        status: 'Completed'
    },
    {
        id: 2,
        type: 'Sent',
        description: 'Token transfer',
        amount: '-150 BOND',
        date: '08 Nov 2026',
        status: 'Completed'
    },
    {
        id: 3,
        type: 'Received',
        description: 'Interest payment',
        amount: '+75 BOND',
        date: '05 Nov 2026',
        status: 'Completed'
    },
    {
        id: 4,
        type: 'Received',
        description: 'Bond token purchase',
        amount: '+300 BOND',
        date: '02 Nov 2026',
        status: 'Pending'
    }
];

export default function Wallet() {
    const [copied, setCopied] = useState(false);

    const walletAddress = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';

    const copyAddress = async () => {
        try {
            await navigator.clipboard.writeText(walletAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div className="space-y-8">

            {/* Heading */}
            <div>
                <h1 className="text-2xl font-bold text-white">
                    My Wallet
                </h1>
                <p className="text-slate-400 mt-1">
                    Manage your digital assets and bond token holdings.
                </p>
            </div>

            {/* Wallet Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                <div className="lg:col-span-2 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-7 border border-purple-700/40">

                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-purple-200 text-sm">
                                Total Wallet Balance
                            </p>
                            <h2 className="text-4xl font-bold text-white mt-3">
                                $25,750.00
                            </h2>
                        </div>

                        <div className="bg-white/10 p-4 rounded-xl">
                            <WalletIcon size={30} />
                        </div>
                    </div>

                    <div className="mt-10">
                        <p className="text-purple-200 text-sm">
                            Connected Wallet Address
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mt-2">
                            <p className="text-white text-sm break-all">
                                {walletAddress}
                            </p>

                            <button
                                onClick={copyAddress}
                                className="bg-white/10 p-2 rounded-lg hover:bg-white/20"
                            >
                                <Copy size={16} />
                            </button>

                            <span className="text-xs text-green-300">
                                {copied ? 'Copied!' : ''}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2 items-center mt-6 text-green-300 text-sm">
                        <ShieldCheck size={17} />
                        Wallet Connected
                    </div>

                </div>

                {/* Network */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

                    <p className="text-slate-400 text-sm">
                        Blockchain Network
                    </p>

                    <h2 className="text-xl font-bold text-white mt-4">
                        Ethereum
                    </h2>

                    <span className="inline-block mt-3 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
                        Sepolia Testnet
                    </span>

                    <div className="border-t border-slate-800 mt-6 pt-5">
                        <p className="text-slate-400 text-sm">
                            Network Status
                        </p>

                        <p className="text-green-400 font-medium mt-2">
                            ● Connected
                        </p>
                    </div>

                </div>
            </div>

            {/* Asset Cards */}
            <div>
                <h2 className="text-xl font-bold text-white mb-5">
                    My Digital Assets
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                    <AssetCard
                        name="Government Bond Token"
                        symbol="GOV-BOND"
                        quantity="500"
                        value="$15,000"
                    />

                    <AssetCard
                        name="Real Estate Token"
                        symbol="RE-TOKEN"
                        quantity="250"
                        value="$8,750"
                    />

                    <AssetCard
                        name="Corporate Bond Token"
                        symbol="CORP-BOND"
                        quantity="100"
                        value="$2,000"
                    />

                </div>
            </div>

            {/* Transactions */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

                <h2 className="text-xl font-bold text-white mb-6">
                    Recent Wallet Activity
                </h2>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">

                        <thead>
                            <tr className="text-slate-400 text-sm border-b border-slate-700">
                                <th className="p-4">Activity</th>
                                <th className="p-4">Description</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="border-b border-slate-800">

                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            {tx.type === 'Received' ? (
                                                <ArrowDownLeft className="text-green-400" size={20} />
                                            ) : (
                                                <ArrowUpRight className="text-red-400" size={20} />
                                            )}

                                            <span className="text-white">
                                                {tx.type}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-4 text-slate-300">
                                        {tx.description}
                                    </td>

                                    <td className={`p-4 font-medium ${tx.type === 'Received'
                                            ? 'text-green-400'
                                            : 'text-red-400'
                                        }`}>
                                        {tx.amount}
                                    </td>

                                    <td className="p-4 text-slate-400 text-sm">
                                        {tx.date}
                                    </td>

                                    <td className="p-4">
                                        <span className={`text-xs px-3 py-1 rounded-full ${tx.status === 'Completed'
                                                ? 'bg-green-500/10 text-green-400'
                                                : 'bg-yellow-500/10 text-yellow-400'
                                            }`}>
                                            {tx.status}
                                        </span>
                                    </td>

                                </tr>
                            ))}
                        </tbody>

                    </table>
                </div>

            </div>

        </div>
    );
}

function AssetCard({ name, symbol, quantity, value }: {
    name: string;
    symbol: string;
    quantity: string;
    value: string;
}) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

            <div className="flex justify-between items-center">
                <Coins className="text-purple-400" size={25} />
                <span className="text-xs text-slate-500">
                    {symbol}
                </span>
            </div>

            <h3 className="text-white font-semibold mt-5">
                {name}
            </h3>

            <p className="text-slate-400 text-sm mt-2">
                Token Holdings
            </p>

            <h2 className="text-2xl font-bold text-white mt-1">
                {quantity}
            </h2>

            <div className="border-t border-slate-800 mt-5 pt-4">
                <p className="text-slate-400 text-xs">
                    Estimated Value
                </p>
                <p className="text-green-400 font-bold text-xl mt-1">
                    {value}
                </p>
            </div>

        </div>
    );
}
