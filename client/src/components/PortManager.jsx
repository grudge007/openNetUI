import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config';

export default function PortManager({ token }) {
    const [bridges, setBridges] = useState([]);
    const [selectedBridge, setSelectedBridge] = useState('');
    const [ports, setPorts] = useState([]);
    const [flows, setFlows] = useState('');
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [portName, setPortName] = useState('');
    const [type, setType] = useState('normal');
    const [vlan, setVlan] = useState('');
    const [remoteIp, setRemoteIp] = useState('');
    const [vxlanKey, setVxlanKey] = useState('');

    const fetchBridges = async () => {
        try {
            const res = await fetch(`${getApiUrl()}/api/ovs/bridges`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setBridges(data.bridges || []);
                if (!selectedBridge && (data.bridges || []).length > 0) {
                    setSelectedBridge(data.bridges[0]);
                }
                setError('');
            } else {
                setError(data.error || 'Failed to fetch bridges');
            }
        } catch (err) {
            console.error(err);
            setError('Network error or server unreachable');
        }
    };

    const fetchPorts = async () => {
        if (!selectedBridge) return;
        try {
            const res = await fetch(`${getApiUrl()}/api/ovs/ports/${selectedBridge}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.ports) {
                setPorts(data.ports);
                setSelected(prev => prev.filter(p => data.ports.includes(p)));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchFlows = async () => {
        if (!selectedBridge) return;
        try {
            const res = await fetch(`${getApiUrl()}/api/ovs/flows/${selectedBridge}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.output) setFlows(data.output);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchBridges();
        const interval = setInterval(() => {
            fetchBridges();
            if (selectedBridge) {
                fetchPorts();
                fetchFlows();
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [token, selectedBridge]);

    useEffect(() => {
        fetchPorts();
        fetchFlows();
        setSelected([]); // Reset selection when bridge changes
    }, [selectedBridge]);

    const addPort = async (e) => {
        e.preventDefault();
        if (!selectedBridge || !portName) return;

        const body = {
            bridge: selectedBridge,
            port: portName,
            type,
            vlan: vlan || undefined,
            remoteIp: type === 'vxlan' ? remoteIp : undefined,
            key: type === 'vxlan' ? vxlanKey : undefined
        };

        try {
            await fetch(`${getApiUrl()}/api/ovs/ports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body),
            });
            setPortName('');
            setVlan('');
            setRemoteIp('');
            setVxlanKey('');
            fetchPorts();
        } catch (err) {
            console.error(err);
        }
    };

    const deletePort = async (port) => {
        try {
            await fetch(`${getApiUrl()}/api/ovs/ports/${selectedBridge}/${port}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (port) => {
        if (!confirm(`Delete port ${port}?`)) return;
        await deletePort(port);
        fetchPorts();
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selected.length} selected ports?`)) return;
        setLoading(true);
        for (const port of selected) {
            await deletePort(port);
        }
        setSelected([]);
        fetchPorts();
        setLoading(false);
    };

    const handleDeleteAll = async () => {
        if (!confirm(`WARNING: This will delete ALL ${ports.length} ports on ${selectedBridge}. Are you sure?`)) return;
        setLoading(true);
        for (const port of ports) {
            await deletePort(port);
        }
        setSelected([]);
        fetchPorts();
        setLoading(false);
    };

    const toggleSelect = (port) => {
        setSelected(prev =>
            prev.includes(port) ? prev.filter(i => i !== port) : [...prev, port]
        );
    };

    const toggleSelectAll = () => {
        if (selected.length === ports.length) {
            setSelected([]);
        } else {
            setSelected(ports);
        }
    };

    return (
        <div className="card animate-fade-in" style={{ gridColumn: 'span 2' }}>
            <div className="card-header">
                <h3>Port Management</h3>
                <select
                    value={selectedBridge}
                    onChange={(e) => setSelectedBridge(e.target.value)}
                    style={{ width: 'auto', marginBottom: 0 }}
                >
                    {bridges.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
            </div>

            {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: '0.5rem' }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                    <h4>Add Port / Interface</h4>
                    <form onSubmit={addPort} className="mt-4">
                        <input
                            value={portName}
                            onChange={e => setPortName(e.target.value)}
                            placeholder="Port Name (e.g. eth1, vxlan0)"
                            required
                        />

                        <div className="flex gap-2">
                            <select value={type} onChange={e => setType(e.target.value)}>
                                <option value="normal">Normal Port</option>
                                <option value="vxlan">VXLAN Tunnel</option>
                            </select>
                            <input
                                type="number"
                                value={vlan}
                                onChange={e => setVlan(e.target.value)}
                                placeholder="VLAN Tag (Optional)"
                            />
                        </div>

                        {type === 'vxlan' && (
                            <div className="flex gap-2">
                                <input
                                    value={remoteIp}
                                    onChange={e => setRemoteIp(e.target.value)}
                                    placeholder="Remote IP"
                                    required
                                />
                                <input
                                    value={vxlanKey}
                                    onChange={e => setVxlanKey(e.target.value)}
                                    placeholder="VNI / Key"
                                    required
                                />
                            </div>
                        )}

                        <button type="submit" className="w-full mt-2">Add Port</button>
                    </form>

                    <h4 className="mt-4">Existing Ports</h4>

                    <div className="flex gap-2 mt-2" style={{ marginBottom: '0.5rem' }}>
                        <button
                            className="danger"
                            disabled={selected.length === 0 || loading}
                            onClick={handleBulkDelete}
                            style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        >
                            Delete Selected ({selected.length})
                        </button>
                        <button
                            className="danger"
                            disabled={ports.length === 0 || loading}
                            onClick={handleDeleteAll}
                            style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        >
                            Delete All
                        </button>
                    </div>

                    <div className="list">
                        <div className="list-item" style={{ background: 'rgba(255,255,255,0.05)', fontWeight: 'bold' }}>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="checkbox"
                                    checked={ports.length > 0 && selected.length === ports.length}
                                    onChange={toggleSelectAll}
                                    style={{ width: 'auto', margin: 0 }}
                                />
                                <span>Port Name</span>
                            </div>
                            <span>Actions</span>
                        </div>
                        {ports.map(p => (
                            <div key={p} className="list-item">
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(p)}
                                        onChange={() => toggleSelect(p)}
                                        style={{ width: 'auto', margin: 0 }}
                                    />
                                    <span>{p}</span>
                                </div>
                                <button className="danger icon-btn" onClick={() => handleDelete(p)}>🗑️</button>
                            </div>
                        ))}
                        {ports.length === 0 && <div className="text-muted text-sm" style={{ padding: '1rem' }}>No ports on this bridge</div>}
                    </div>
                </div>

                <div>
                    <h4>OpenFlow Flows</h4>
                    <div style={{
                        background: '#0f172a',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        marginTop: '1rem',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '400px',
                        overflowY: 'auto'
                    }}>
                        {flows || 'No flows or bridge not selected'}
                    </div>
                </div>
            </div>
        </div>
    );
}
