import React, { useState, useEffect } from 'react';
import BridgeManager from './BridgeManager';
import BridgeDetails from './BridgeDetails';
import { getApiUrl } from '../config';

export default function OVSDashboard({ token, initialBridge }) {
    const [selectedBridge, setSelectedBridge] = useState(initialBridge || '');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showAddBridge, setShowAddBridge] = useState(false);
    const [newBridgeName, setNewBridgeName] = useState('');
    const [systemStatus, setSystemStatus] = useState({ installed: true, running: true, message: '' });

    useEffect(() => {
        if (initialBridge) {
            setSelectedBridge(initialBridge);
        }
    }, [initialBridge]);

    useEffect(() => {
        const checkSystem = async () => {
            try {
                const res = await fetch(`${getApiUrl()}/api/ovs/system-status`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setSystemStatus(data);
            } catch (err) {
                console.error('Failed to check system status', err);
            }
        };
        checkSystem();
    }, [token]);

    const handleAddBridge = async (e) => {
        e.preventDefault();
        if (!newBridgeName) return;
        try {
            const res = await fetch(`${getApiUrl()}/api/ovs/bridges`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: newBridgeName }),
            });
            if (res.ok) {
                setRefreshTrigger(prev => prev + 1);
                setNewBridgeName('');
                setShowAddBridge(false);
            } else {
                alert('Failed to add bridge');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="animate-fade-in">
            {(!systemStatus.installed || !systemStatus.running) && (
                <div style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid var(--danger-color)',
                    color: 'var(--danger-color)',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '2rem',
                    textAlign: 'center'
                }}>
                    <h3>⚠️ Critical Error</h3>
                    <p>{systemStatus.message}</p>
                    {!systemStatus.installed && <p className="text-sm mt-2">Please install Open vSwitch on the server.</p>}
                    {systemStatus.installed && !systemStatus.running && <p className="text-sm mt-2">Please ensure the Open vSwitch service is running and the backend has permissions (sudo).</p>}
                </div>
            )}

            {showAddBridge && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ width: '400px' }}>
                        <h3>Create New Bridge</h3>
                        <form onSubmit={handleAddBridge} className="mt-4">
                            <input
                                value={newBridgeName}
                                onChange={e => setNewBridgeName(e.target.value)}
                                placeholder="Bridge Name (e.g. br0)"
                                autoFocus
                            />
                            <div className="flex gap-2 mt-4">
                                <button type="button" className="danger" onClick={() => setShowAddBridge(false)}>Cancel</button>
                                <button type="submit">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-4">
                <h2>OVS Dashboard</h2>
                <button onClick={() => setShowAddBridge(true)}>+ Create Bridge</button>
            </div>

            <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
                <BridgeManager
                    token={token}
                    onSelectBridge={setSelectedBridge}
                    selectedBridge={selectedBridge}
                    refreshTrigger={refreshTrigger}
                />

                {selectedBridge ? (
                    <BridgeDetails token={token} bridge={selectedBridge} />
                ) : (
                    <div className="card" style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                        <div className="text-muted">Select a bridge to view details</div>
                    </div>
                )}
            </div>
        </div>
    );
}
