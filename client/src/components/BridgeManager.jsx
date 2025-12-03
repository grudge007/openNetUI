import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config';

export default function BridgeManager({ token, onSelectBridge, selectedBridge, refreshTrigger }) {
    const [bridges, setBridges] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState([]);
    const [error, setError] = useState('');

    const fetchBridges = async () => {
        try {
            const res = await fetch(`${getApiUrl()}/api/ovs/bridges`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setBridges(data.bridges || []);
                setSelected(prev => prev.filter(p => (data.bridges || []).includes(p)));
                setError('');
            } else {
                setError(data.error || 'Failed to fetch bridges');
            }
        } catch (err) {
            console.error(err);
            setError('Network error or server unreachable');
        }
    };

    useEffect(() => {
        fetchBridges();
        const interval = setInterval(fetchBridges, 10000);
        return () => clearInterval(interval);
    }, [token]);

    useEffect(() => {
        fetchBridges();
    }, [refreshTrigger]);

    const deleteBridge = async (name) => {
        try {
            await fetch(`${getApiUrl()}/api/ovs/bridges/${name}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selected.length} selected bridges?`)) return;
        setLoading(true);
        for (const name of selected) {
            await deleteBridge(name);
        }
        setSelected([]);
        fetchBridges();
        setLoading(false);
    };

    const handleDelete = async (name) => {
        if (!confirm(`Delete bridge ${name}?`)) return;
        await deleteBridge(name);
        fetchBridges();
    };

    const toggleSelect = (name) => {
        setSelected(prev =>
            prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
        );
    };

    const toggleSelectAll = () => {
        if (selected.length === bridges.length) {
            setSelected([]);
        } else {
            setSelected(bridges);
        }
    };

    return (
        <div className="card animate-fade-in">
            <div className="card-header">
                <h3>Bridges</h3>
                <span className="badge">{bridges.length} Active</span>
            </div>

            {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: '0.5rem' }}>{error}</div>}

            <div className="flex gap-2" style={{ marginBottom: '1rem' }}>
                <button
                    className="danger"
                    disabled={selected.length === 0 || loading}
                    onClick={handleBulkDelete}
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                >
                    Delete Selected ({selected.length})
                </button>
            </div>

            <div className="list">
                <div className="list-item" style={{ background: 'rgba(255,255,255,0.05)', fontWeight: 'bold' }}>
                    <div className="flex gap-2 items-center">
                        <input
                            type="checkbox"
                            checked={bridges.length > 0 && selected.length === bridges.length}
                            onChange={toggleSelectAll}
                            style={{ width: 'auto', margin: 0 }}
                        />
                        <span>Bridge Name</span>
                    </div>
                    <span>Actions</span>
                </div>
                {bridges.map(bridge => (
                    <div
                        key={bridge}
                        className={`list-item ${selectedBridge === bridge ? 'active' : ''}`}
                        onClick={() => onSelectBridge(bridge)}
                        style={{
                            cursor: 'pointer',
                            background: selectedBridge === bridge ? 'rgba(59, 130, 246, 0.1)' : undefined,
                            borderLeft: selectedBridge === bridge ? '2px solid #3b82f6' : '2px solid transparent'
                        }}
                    >
                        <div className="flex gap-2 items-center" onClick={e => e.stopPropagation()}>
                            <input
                                type="checkbox"
                                checked={selected.includes(bridge)}
                                onChange={() => toggleSelect(bridge)}
                                style={{ width: 'auto', margin: 0 }}
                            />
                            <span style={{ fontWeight: selectedBridge === bridge ? 'bold' : 'normal' }}>{bridge}</span>
                        </div>
                        <button className="danger icon-btn" onClick={(e) => { e.stopPropagation(); handleDelete(bridge); }}>🗑️</button>
                    </div>
                ))}
                {bridges.length === 0 && <div className="text-muted text-sm" style={{ padding: '1rem' }}>No bridges found</div>}
            </div>
        </div>
    );
}
