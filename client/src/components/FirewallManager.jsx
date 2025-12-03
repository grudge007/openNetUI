import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config';
import InterfacesList from './InterfacesList';
import RoutesList from './RoutesList';
import FirewallRules from './FirewallRules';

export default function FirewallManager({ token }) {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDetails();
    }, [token]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${getApiUrl()}/api/namespaces/default`, {
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
            <h2 className="mb-4">Host Firewall & Networking</h2>

            {loading ? (
                <div className="text-muted">Loading host details...</div>
            ) : details ? (
                <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div style={{ minWidth: 0 }}>
                        <InterfacesList interfaces={details.interfaces} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <FirewallRules token={token} namespace="default" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <RoutesList
                            token={token}
                            namespace="default"
                            routes={details.routes}
                            onRefresh={fetchDetails}
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
}
