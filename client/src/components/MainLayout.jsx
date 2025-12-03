import React, { useState } from 'react';
import OVSDashboard from './OVSDashboard';
import NamespaceManager from './NamespaceManager';
import FirewallManager from './FirewallManager';
import { IPAM } from './Placeholders';

export default function MainLayout({ token, onLogout }) {
    const [activeModule, setActiveModule] = useState('ovs');
    const [targetBridge, setTargetBridge] = useState(null);

    const handleNavigateToBridge = (bridge) => {
        setTargetBridge(bridge);
        setActiveModule('ovs');
    };

    const renderModule = () => {
        switch (activeModule) {
            case 'ovs': return <OVSDashboard token={token} initialBridge={targetBridge} />;
            case 'namespaces': return <NamespaceManager token={token} onNavigateToBridge={handleNavigateToBridge} />;
            case 'ipam': return <IPAM />;
            case 'firewall': return <FirewallManager token={token} />;
            default: return <OVSDashboard token={token} />;
        }
    };

    const NavItem = ({ id, label, icon }) => (
        <button
            className={`nav-item ${activeModule === id ? 'active' : ''}`}
            onClick={() => setActiveModule(id)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
                padding: '0.75rem 1rem',
                background: activeModule === id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                border: 'none',
                borderLeft: activeModule === id ? '3px solid #3b82f6' : '3px solid transparent',
                color: activeModule === id ? '#fff' : '#94a3b8',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
        >
            <span>{icon}</span>
            <span>{label}</span>
        </button>
    );

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {/* Sidebar */}
            <aside style={{
                width: '260px',
                background: '#0f172a',
                borderRight: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        NetworkManager
                    </h2>
                    <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>v1.0.0</div>
                </div>

                <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
                    <div style={{ padding: '0 1rem 0.5rem', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Core
                    </div>
                    <NavItem id="ovs" label="OVS Dashboard" icon="⚡" />

                    <div style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Modules
                    </div>
                    <NavItem id="ipam" label="IPAM" icon="🌐" />
                    <NavItem id="firewall" label="Firewall" icon="🛡️" />
                    <NavItem id="namespaces" label="Namespaces" icon="📦" />
                </nav>

                <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button
                        onClick={onLogout}
                        className="danger"
                        style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <span>🚪</span> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, overflowY: 'auto', background: '#020617' }}>
                <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                    {renderModule()}
                </div>
            </main>
        </div>
    );
}
