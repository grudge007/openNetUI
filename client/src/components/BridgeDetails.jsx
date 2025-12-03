import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config';
import { parseOpenFlow } from '../utils/openflowParser';

export default function BridgeDetails({ token, bridge }) {
    const [ports, setPorts] = useState([]);
    const [flows, setFlows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [portName, setPortName] = useState('');
    const [type, setType] = useState('normal');
    const [vlan, setVlan] = useState('');
    const [remoteIp, setRemoteIp] = useState('');
    const [vxlanKey, setVxlanKey] = useState('');

    const fetchPorts = async () => {
        if (!bridge) return;
        try {
            const res = await fetch(`${getApiUrl()}/api/ovs/bridge-details/${bridge}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.ports) {
                setPorts(data.ports);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to fetch ports');
        }
    };

    const fetchFlows = async () => {
        if (!bridge) return;
        try {
            const res = await fetch(`${getApiUrl()}/api/ovs/flows/${bridge}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.output) {
                setFlows(parseOpenFlow(data.output));
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchPorts();
        fetchFlows();
        const interval = setInterval(() => {
            fetchPorts();
            fetchFlows();
        }, 10000);
        return () => clearInterval(interval);
    }, [bridge, token]);

    const addPort = async (e) => {
        e.preventDefault();
        if (!bridge || !portName) return;

        const body = {
            bridge: bridge,
            port: portName,
            type,
            vlan: vlan || undefined,
            remoteIp: type === 'vxlan' ? remoteIp : undefined,
            key: type === 'vxlan' ? vxlanKey : undefined
        };

        try {
            const res = await fetch(`${getApiUrl()}/api/ovs/ports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to add port');
            }

            setPortName('');
            setVlan('');
            setRemoteIp('');
            setVxlanKey('');
            fetchPorts();
            setError('');
        } catch (err) {
            console.error(err);
            setError(err.message);
        }
    };

    const deletePort = async (port) => {
        try {
            await fetch(`${getApiUrl()}/api/ovs/ports/${bridge}/${port}`, {
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

    return (
        <div className="card animate-fade-in" style={{ gridColumn: 'span 2' }}>
            <div className="card-header">
                <h3>Bridge: {bridge}</h3>
                <span className="badge">{ports.length} Ports</span>
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

                    <h4 className="mt-4">Ports</h4>
                    <div className="list">
                        {ports.map(p => (
                            <div key={p.name} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <div className="flex justify-between w-full items-center">
                                    <span style={{ fontWeight: 'bold' }}>{p.name}</span>
                                    <button className="danger icon-btn" onClick={() => handleDelete(p.name)}>🗑️</button>
                                </div>
                                <div className="flex gap-2 text-xs">
                                    {p.type === 'vxlan' && <span className="badge" style={{ background: '#8b5cf6' }}>VXLAN</span>}
                                    {p.vlan !== 'default' && <span className="badge" style={{ background: '#059669', color: '#fff' }}>VLAN {p.vlan}</span>}
                                    {p.type === 'trunk/normal' && <span className="badge" style={{ background: '#64748b' }}>Normal</span>}
                                </div>
                                {p.type === 'vxlan' && p.vxlan && (
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '0.25rem', width: '100%' }}>
                                        <div>Remote IP: {p.vxlan.remote_ip}</div>
                                        <div>Key: {p.vxlan.key}</div>
                                    </div>
                                )}
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
                        maxHeight: '400px',
                        overflowY: 'auto'
                    }}>
                        {flows.length > 0 ? (
                            <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: '#94a3b8' }}>
                                        <th>Priority</th>
                                        <th>Match</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {flows.map((f, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                            <td style={{ padding: '0.5rem 0' }}>{f.priority}</td>
                                            <td style={{ padding: '0.5rem 0' }}>{f.match}</td>
                                            <td style={{ padding: '0.5rem 0' }}>{f.actions}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-muted">No flows found</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
