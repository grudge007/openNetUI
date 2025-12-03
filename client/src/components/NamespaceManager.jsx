import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config';
import InterfacesList from './InterfacesList';
import RoutesList from './RoutesList';
import FirewallRules from './FirewallRules';

export default function NamespaceManager({ token, onNavigateToBridge }) {
    const [namespaces, setNamespaces] = useState([]);
    const [selectedNs, setSelectedNs] = useState(null);
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchNamespaces();
    }, [token]);

    const fetchNamespaces = async () => {
        try {
            const res = await fetch(`${getApiUrl()}/api/namespaces`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setNamespaces(data.namespaces || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchDetails = async (ns) => {
        setLoading(true);
        setSelectedNs(ns);
        try {
            const res = await fetch(`${getApiUrl()}/api/namespaces/${ns}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setDetails(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <h2 className="mb-4">Namespace Management</h2>

            <div className="dashboard-grid">
                {/* Row 1: Namespaces and Interfaces */}
                <div className="card">
                    <div className="card-header">
                        <h3>Namespaces</h3>
                        <span className="badge">{namespaces.length}</span>
                    </div>
                    <div className="list">
                        {namespaces.map(ns => (
                            <div
                                key={ns}
                                className={`list-item ${selectedNs === ns ? 'active' : ''}`}
                                onClick={() => fetchDetails(ns)}
                                style={{
                                    cursor: 'pointer',
                                    background: selectedNs === ns ? 'rgba(59, 130, 246, 0.1)' : undefined,
                                    borderLeft: selectedNs === ns ? '2px solid #3b82f6' : '2px solid transparent'
                                }}
                            >
                                <span style={{ fontWeight: selectedNs === ns ? 'bold' : 'normal' }}>{ns}</span>
                                {ns === 'default' && <span className="badge" style={{ background: '#64748b' }}>System</span>}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                    {selectedNs ? (
                        <>
                            {loading ? (
                                <div className="card text-muted p-4">Loading details...</div>
                            ) : details ? (
                                <InterfacesList
                                    interfaces={details.interfaces}
                                    onNavigateToBridge={onNavigateToBridge}
                                />
                            ) : null}
                        </>
                    ) : (
                        <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <div className="text-muted">Select a namespace to view details</div>
                        </div>
                    )}
                </div>

                {/* Row 2: Firewall and Routes (Side by Side) */}
                {selectedNs && details && !loading && (
                    <>
                        <div style={{ gridColumn: 'span 1' }}>
                            <FirewallRules token={token} namespace={selectedNs} />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <RoutesList
                                token={token}
                                namespace={selectedNs}
                                routes={details.routes}
                                onRefresh={() => fetchDetails(selectedNs)}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
