import React from 'react';

export default function InterfacesList({ interfaces, onNavigateToBridge }) {
    return (
        <div className="card" style={{ borderLeft: '4px solid #3b82f6', height: '100%' }}>
            <h4 className="mb-4 text-lg font-bold text-blue-400">Interfaces</h4>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ padding: '0.75rem' }}>Interface</th>
                            <th style={{ padding: '0.75rem' }}>OVS Bridge</th>
                            <th style={{ padding: '0.75rem' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {interfaces.map(iface => (
                            <tr key={iface.interface} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.75rem' }}>{iface.interface}</td>
                                <td style={{ padding: '0.75rem' }}>
                                    {iface.ovs_bridge ? (
                                        <button
                                            className="badge"
                                            style={{ background: '#3b82f6', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                            onClick={() => onNavigateToBridge && onNavigateToBridge(iface.ovs_bridge)}
                                        >
                                            {iface.ovs_bridge} ↗
                                        </button>
                                    ) : <span className="text-muted">-</span>}
                                </td>
                                <td style={{ padding: '0.75rem' }} className="text-muted">{iface.belongs_to}</td>
                            </tr>
                        ))}
                        {interfaces.length === 0 && (
                            <tr><td colSpan="3" className="text-center p-4 text-muted">No interfaces found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
