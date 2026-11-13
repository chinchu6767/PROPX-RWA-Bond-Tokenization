
import { useState } from 'react';
import {
    Search,
    Landmark,
    CalendarDays,
    TrendingUp,
    ArrowUpRight,
    ShieldCheck,
    X,
    Coins,
    Wallet,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

interface Bond {
    id: string;
    name: string;
    category: string;
    issuer: string;
    rate: string;
    price: string;
    minimum: string;
    maturity: string;
    available: string;
    risk: string;
}

const bonds: Bond[] = [
    {
        id: 'BND-001',
        name: 'Government Infrastructure Bond',
        category: 'Government',
        issuer: 'National Infrastructure Authority',
        rate: '8.5%',
        price: '$1,000',
        minimum: '$1,000',
        maturity: '10 Nov 2030',
        available: '25,000',
        risk: 'Low'
    },
    {
        id: 'BND-002',
        name: 'Corporate Growth Bond',
        category: 'Corporate',
        issuer: 'Propx Corporate Finance',
        rate: '10.2%',
        price: '$500',
        minimum: '$500',
        maturity: '15 Jun 2029',
        available: '12,500',
        risk: 'Medium'
    },
    {
        id: 'BND-003',
        name: 'Renewable Energy Bond',
        category: 'Green Energy',
        issuer: 'Green Energy Holdings',
        rate: '9.4%',
        price: '$1,000',
        minimum: '$1,000',
        maturity: '20 Dec 2031',
        available: '8,000',
        risk: 'Medium'
    },
    {
        id: 'BND-004',
        name: 'Municipal Development Bond',
        category: 'Municipal',
        issuer: 'City Development Corporation',
        rate: '7.8%',
        price: '$250',
        minimum: '$250',
        maturity: '01 Mar 2028',
        available: '30,000',
        risk: 'Low'
    }
];

export default function Marketplace() {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');

    const [selectedBond, setSelectedBond] = useState<Bond | null>(null);
    const [amount, setAmount] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [error, setError] = useState('');

    const filteredBonds = bonds.filter((bond) => {
        const matchesSearch =
            bond.name.toLowerCase().includes(search.toLowerCase()) ||
            bond.issuer.toLowerCase().includes(search.toLowerCase());

        const matchesCategory =
            category === 'All' || bond.category === category;

        return matchesSearch && matchesCategory;
    });

    const tokenPrice = selectedBond
        ? Number(selectedBond.price.replace(/[$,]/g, ''))
        : 0;

    const minimumInvestment = selectedBond
        ? Number(selectedBond.minimum.replace(/[$,]/g, ''))
        : 0;

    const investmentAmount = Number(amount) || 0;

    const tokenQuantity = tokenPrice > 0
        ? Math.floor(investmentAmount / tokenPrice)
        : 0;

    const annualReturn = selectedBond
        ? investmentAmount * (Number(selectedBond.rate.replace('%', '')) / 100)
        : 0;

    const openInvestment = (bond: Bond) => {
        setSelectedBond(bond);
        setAmount('');
        setConfirmed(false);
        setError('');
    };

    const closeInvestment = () => {
        setSelectedBond(null);
        setAmount('');
        setConfirmed(false);
        setError('');
    };

    const handleInvestment = () => {
        if (!selectedBond) return;

        if (!amount || investmentAmount <= 0) {
            setError('Please enter a valid investment amount.');
            return;
        }

        if (investmentAmount < minimumInvestment) {
            setError(`Minimum investment is ${selectedBond.minimum}.`);
            return;
        }

        if (tokenQuantity <= 0) {
            setError('Your investment is not enough to purchase a token.');
            return;
        }

        if (tokenQuantity > Number(selectedBond.available.replace(/,/g, ''))) {
            setError('Not enough tokens are available for this investment.');
            return;
        }

        setError('');
        setConfirmed(true);
    };

    return (
        <div className="space-y-8">

            {/* Header */}
            <div>
                <p className="text-purple-400 text-sm font-semibold">
                    INVESTMENT OPPORTUNITIES
                </p>

                <h1 className="text-3xl font-bold text-white mt-2">
                    Bond Marketplace
                </h1>

                <p className="text-slate-400 mt-2">
                    Explore and invest in tokenized real-world bond opportunities.
                </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                <StatCard
                    icon={<Landmark />}
                    title="Available Bonds"
                    value={String(bonds.length)}
                    color="text-purple-400"
                />

                <StatCard
                    icon={<TrendingUp />}
                    title="Highest Indicative Yield"
                    value="10.2%"
                    color="text-emerald-400"
                />

                <StatCard
                    icon={<ShieldCheck />}
                    title="Platform"
                    value="Propx RWA"
                    color="text-purple-400"
                />

            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4">

                <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-xl px-4 flex-1">
                    <Search className="text-slate-400" size={20} />

                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search bonds or issuers..."
                        className="bg-transparent outline-none text-white py-4 w-full"
                    />
                </div>

                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white"
                >
                    <option value="All">All Categories</option>
                    <option value="Government">Government</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Green Energy">Green Energy</option>
                    <option value="Municipal">Municipal</option>
                </select>

            </div>

            {/* Bond Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {filteredBonds.map((bond) => (

                    <div
                        key={bond.id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/60 transition"
                    >

                        <div className="flex justify-between items-start gap-3">

                            <div className="flex gap-3">

                                <div className="bg-purple-500/10 p-3 rounded-xl h-fit">
                                    <Landmark className="text-purple-400" size={24} />
                                </div>

                                <div>
                                    <h2 className="font-semibold text-white text-lg">
                                        {bond.name}
                                    </h2>

                                    <p className="text-slate-400 text-sm mt-1">
                                        {bond.issuer}
                                    </p>

                                    <p className="text-slate-500 text-xs mt-1">
                                        {bond.id}
                                    </p>
                                </div>

                            </div>

                            <span className="text-xs text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full whitespace-nowrap">
                                {bond.category}
                            </span>

                        </div>

                        <div className="grid grid-cols-2 gap-5 my-7">

                            <div>
                                <p className="text-slate-400 text-sm">
                                    Indicative Yield
                                </p>

                                <p className="text-2xl text-emerald-400 font-bold mt-1">
                                    {bond.rate}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-400 text-sm">
                                    Token Price
                                </p>

                                <p className="text-2xl text-white font-bold mt-1">
                                    {bond.price}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-400 text-sm">
                                    Minimum Investment
                                </p>

                                <p className="text-white font-semibold mt-1">
                                    {bond.minimum}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-400 text-sm">
                                    Maturity Date
                                </p>

                                <p className="text-white font-semibold mt-1 flex gap-2 items-center">
                                    <CalendarDays size={15} />
                                    {bond.maturity}
                                </p>
                            </div>

                        </div>

                        <div className="flex justify-between text-sm border-t border-slate-800 pt-4">
                            <span className="text-slate-400">
                                Available units: {bond.available}
                            </span>

                            <span className="text-slate-300">
                                Risk: {bond.risk}
                            </span>
                        </div>

                        <button
                            onClick={() => openInvestment(bond)}
                            className="w-full mt-5 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl transition"
                        >
                            View Investment Details
                            <ArrowUpRight size={18} />
                        </button>

                    </div>

                ))}

            </div>

            {filteredBonds.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    No bonds found. Try another search.
                </div>
            )}

            <p className="text-xs text-slate-500">
                Demonstration data only. These are not verified or live investment offers.
            </p>

            {/* Investment Details Modal */}
            {selectedBond && (

                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">

                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6">

                        <div className="flex justify-between items-start mb-6">

                            <div>
                                <p className="text-purple-400 text-sm font-semibold">
                                    INVESTMENT DETAILS
                                </p>

                                <h2 className="text-xl font-bold text-white mt-2">
                                    {selectedBond.name}
                                </h2>

                                <p className="text-slate-400 text-sm mt-1">
                                    {selectedBond.id} · {selectedBond.issuer}
                                </p>
                            </div>

                            <button
                                onClick={closeInvestment}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={22} />
                            </button>

                        </div>

                        {!confirmed ? (

                            <div className="space-y-5">

                                <div className="grid grid-cols-2 gap-4">

                                    <DetailBox
                                        title="Token Price"
                                        value={selectedBond.price}
                                    />

                                    <DetailBox
                                        title="Indicative Yield"
                                        value={selectedBond.rate}
                                    />

                                    <DetailBox
                                        title="Minimum Investment"
                                        value={selectedBond.minimum}
                                    />

                                    <DetailBox
                                        title="Maturity"
                                        value={selectedBond.maturity}
                                    />

                                </div>

                                <div>
                                    <label className="text-slate-300 text-sm font-medium">
                                        Enter Investment Amount (USD)
                                    </label>

                                    <input
                                        type="number"
                                        min={minimumInvestment}
                                        value={amount}
                                        onChange={(e) => {
                                            setAmount(e.target.value);
                                            setError('');
                                        }}
                                        placeholder={`Minimum ${selectedBond.minimum}`}
                                        className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white outline-none focus:border-purple-500"
                                    />
                                </div>

                                {/* Investment Calculation */}
                                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-5 space-y-4">

                                    <h3 className="text-white font-semibold">
                                        Investment Preview
                                    </h3>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">
                                            Investment Amount
                                        </span>

                                        <span className="text-white font-semibold">
                                            ${investmentAmount.toLocaleString('en-US')}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">
                                            Tokens You Receive
                                        </span>

                                        <span className="text-purple-400 font-bold">
                                            {tokenQuantity.toLocaleString('en-US')} Tokens
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">
                                            Estimated Annual Return
                                        </span>

                                        <span className="text-emerald-400 font-bold">
                                            ${annualReturn.toLocaleString('en-US', {
                                                maximumFractionDigits: 2
                                            })}
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-400">
                                        Estimates are illustrative and assume the displayed yield applies for a full year.
                                    </p>

                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-400 text-sm">
                                        <AlertCircle size={17} />
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleInvestment}
                                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                                >
                                    <Wallet size={18} />
                                    Preview Demo Investment
                                </button>

                            </div>

                        ) : (

                            <div className="text-center py-6 space-y-5">

                                <div className="flex justify-center">
                                    <div className="bg-emerald-500/10 p-5 rounded-full">
                                        <CheckCircle2
                                            size={48}
                                            className="text-emerald-400"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-2xl font-bold text-white">
                                        Demo Investment Confirmed!
                                    </h3>

                                    <p className="text-slate-400 text-sm mt-2">
                                        Your investment preview has been completed successfully.
                                    </p>
                                </div>

                                <div className="bg-slate-800 rounded-xl p-5 space-y-3 text-left">

                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">
                                            Bond
                                        </span>

                                        <span className="text-white">
                                            {selectedBond.id}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">
                                            Amount
                                        </span>

                                        <span className="text-white font-semibold">
                                            ${investmentAmount.toLocaleString('en-US')}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">
                                            Tokens
                                        </span>

                                        <span className="text-purple-400 font-semibold">
                                            {tokenQuantity}
                                        </span>
                                    </div>

                                </div>

                                <p className="text-amber-400 text-xs">
                                    Demo only: No money was transferred and no blockchain transaction was executed.
                                </p>

                                <button
                                    onClick={closeInvestment}
                                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl"
                                >
                                    Done
                                </button>

                            </div>

                        )}

                    </div>

                </div>

            )}

        </div>
    );
}

function StatCard({
    icon,
    title,
    value,
    color
}: {
    icon: React.ReactNode;
    title: string;
    value: string;
    color: string;
}) {
    return (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className={`${color} mb-3`}>
                {icon}
            </div>

            <p className="text-slate-400 text-sm">
                {title}
            </p>

            <h2 className="text-2xl font-bold text-white mt-1">
                {value}
            </h2>
        </div>
    );
}

function DetailBox({
    title,
    value
}: {
    title: string;
    value: string;
}) {
    return (
        <div className="bg-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-xs">
                {title}
            </p>

            <p className="text-white font-semibold mt-2">
                {value}
            </p>
        </div>
    );
}
