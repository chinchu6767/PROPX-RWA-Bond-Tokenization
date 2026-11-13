
import { useState } from 'react';

import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/admin/Dashboard';
import Settings from './pages/admin/Settings';

import Marketplace from './pages/investor/Marketplace';
import Investors from './pages/investor/Investors';
import Wallet from './pages/investor/Wallet';
import ReserveVerification from './pages/investor/ReserveVerification';
import Transactions from './pages/investor/Transactions';

function App() {
    const [activePage, setActivePage] = useState('Overview');

    return (
        <DashboardLayout
            activePage={activePage}
            setActivePage={setActivePage}
        >
            {activePage === 'Overview' && <Dashboard />}
            {activePage === 'Bond Marketplace' && <Marketplace />}
            {activePage === 'Investors' && <Investors />}
            {activePage === 'Wallet' && <Wallet />}
            {activePage === 'Reserve Verification' && <ReserveVerification />}
            {activePage === 'Transactions' && <Transactions />}
            {activePage === 'Settings' && <Settings />}
        </DashboardLayout>
    );
}

export default App;
