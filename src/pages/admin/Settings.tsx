
import { useState } from 'react';
import {
    User, Shield, Bell, Globe, Wallet,
    Save, Lock, Mail, Smartphone
} from 'lucide-react';

function Settings() {
    const [name, setName] = useState('Admin User');
    const [email, setEmail] = useState('admin@propx.com');
    const [network, setNetwork] = useState('Ethereum Sepolia');
    const [notifications, setNotifications] = useState({
        investments: true,
        transactions: true,
        security: true,
        updates: false,
    });
    const [saved, setSaved] = useState(false);

    const toggleNotification = (key: keyof typeof notifications) => {
        setNotifications(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
        setSaved(false);
    };

    const handleSave = () => {
        setSaved(true);
    };

    return (
        <div className="space-y-6 text-white">

            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-gray-400 mt-1">
                    Manage your platform preferences and account settings.
                </p>
            </div>

            {/* Profile Settings */}
            <section className="bg-[#171426] border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <User className="text-purple-400" />
                    <div>
                        <h2 className="font-semibold text-lg">Profile Information</h2>
                        <p className="text-gray-400 text-sm">Manage your admin details</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                    <div>
                        <label className="text-sm text-gray-400">Full Name</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full mt-2 bg-[#211d35] border border-white/10 rounded-lg p-3 outline-none focus:border-purple-500"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-400">Email Address</label>
                        <input
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full mt-2 bg-[#211d35] border border-white/10 rounded-lg p-3 outline-none focus:border-purple-500"
                        />
                    </div>
                </div>
            </section>

            {/* Security */}
            <section className="bg-[#171426] border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-5">
                    <Shield className="text-purple-400" />
                    <div>
                        <h2 className="font-semibold text-lg">Security</h2>
                        <p className="text-gray-400 text-sm">Account security preferences</p>
                    </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <Lock className="text-gray-400" />
                        <div>
                            <p>Two-Factor Authentication</p>
                            <p className="text-gray-400 text-sm">Additional login protection</p>
                        </div>
                    </div>
                    <span className="text-yellow-400 text-sm">Not enabled</span>
                </div>

                <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-3">
                        <Mail className="text-gray-400" />
                        <div>
                            <p>Account Verification</p>
                            <p className="text-gray-400 text-sm">Admin email verification status</p>
                        </div>
                    </div>
                    <span className="text-green-400 text-sm">Verified</span>
                </div>
            </section>

            {/* Notifications */}
            <section className="bg-[#171426] border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-5">
                    <Bell className="text-purple-400" />
                    <div>
                        <h2 className="font-semibold text-lg">Notifications</h2>
                        <p className="text-gray-400 text-sm">Choose which alerts you want to receive</p>
                    </div>
                </div>

                {([
                    ['investments', 'Investment Alerts', 'Notifications about new investments'],
                    ['transactions', 'Transaction Updates', 'Updates on token purchases and transfers'],
                    ['security', 'Security Alerts', 'Important account security notifications'],
                    ['updates', 'Platform Updates', 'New features and platform announcements'],
                ] as const).map(([key, title, description]) => (
                    <div key={key} className="flex items-center justify-between py-4 border-b border-white/10 last:border-0">
                        <div>
                            <p>{title}</p>
                            <p className="text-gray-400 text-sm">{description}</p>
                        </div>
                        <button
                            onClick={() => toggleNotification(key)}
                            className={`w-12 h-6 rounded-full p-1 transition ${notifications[key] ? 'bg-purple-600' : 'bg-gray-600'
                                }`}
                        >
                            <span className={`block w-4 h-4 rounded-full bg-white transition ${notifications[key] ? 'translate-x-6' : 'translate-x-0'
                                }`} />
                        </button>
                    </div>
                ))}
            </section>

            {/* Network */}
            <section className="bg-[#171426] border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-5">
                    <Globe className="text-purple-400" />
                    <div>
                        <h2 className="font-semibold text-lg">Blockchain Network</h2>
                        <p className="text-gray-400 text-sm">Select your preferred blockchain network</p>
                    </div>
                </div>

                <label className="text-sm text-gray-400">Network</label>
                <select
                    value={network}
                    onChange={e => setNetwork(e.target.value)}
                    className="w-full mt-2 bg-[#211d35] border border-white/10 rounded-lg p-3 outline-none"
                >
                    <option>Ethereum Sepolia</option>
                    <option>Polygon Amoy</option>
                    <option>Ethereum Mainnet</option>
                </select>
                <p className="text-gray-500 text-xs mt-2">
                    Demo preference only. No blockchain network is connected yet.
                </p>
            </section>

            {/* Save */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                    {saved ? 'Settings updated in this demo.' : 'Review your changes before saving.'}
                </p>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium"
                >
                    <Save size={18} />
                    Save Changes
                </button>
            </div>

        </div>
    );
}

export default Settings;
