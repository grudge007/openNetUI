import React, { useState } from 'react';
import { getApiUrl } from '../config';

export default function RoutesList({ token, namespace, routes, onRefresh }) {
    const [destination, setDestination] = useState('');
    const [gateway, setGateway] = useState('');
    const [device, setDevice] = useState('');

    const addRoute = async (e) => {
        e.preventDefault();
        try {
            await fetch(`${getApiUrl()}/api/routes/${namespace}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    destination,
                    gateway: gateway || undefined,
                    device: device || undefined
                }),
            });
            setDestination('');
            setGateway('');
            setDevice('');
            onRefresh();
        } catch (err) {
            console.error(err);
        }
    };

    const deleteRoute = async (routeStr) => {
        // Simple parsing to try and extract parts for deletion
        // Route string format varies, e.g., "default via 192.168.1.1 dev eth0"
        // For now, we might not support deletion via UI for complex routes safely without more parsing logic.
        // But let's try a basic attempt if the user provides the exact params or we parse them.
        // Given the complexity of parsing `ip route show` output back into params, 
        // and the user request specifically asked for "add route", I will focus on ADD for now.
        // If deletion is critical, we'd need structured route objects from the backend, not just strings.
        alert("Deletion via UI is not fully supported yet due to complex route parsing. Please use CLI.");
    };

    return (
        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
            <h4 className="mb-4 text-lg font-bold text-emerald-400">Routes</h4>

            <div className="mb-4 p-4 bg-slate-900 rounded-lg">
                <h5 className="mb-2 text-sm text-muted uppercase tracking-wider">Add Route</h5>
                <form onSubmit={addRoute} className="flex gap-2 flex-wrap items-end">
                    <div>
                        <label className="text-xs text-muted block mb-1">Destination</label>
                        <input
                            value={destination}
                            onChange={e => setDestination(e.target.value)}
                            placeholder="192.168.1.0/24"
                            className="bg-slate-800 border-slate-700 rounded px-2 py-1 text-sm w-40"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted block mb-1">Gateway (Optional)</label>
                        <input
                            value={gateway}
                            onChange={e => setGateway(e.target.value)}
                            placeholder="192.168.1.1"
                            className="bg-slate-800 border-slate-700 rounded px-2 py-1 text-sm w-32"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted block mb-1">Device (Optional)</label>
                        <input
                            value={device}
                            onChange={e => setDevice(e.target.value)}
                            placeholder="eth0"
                            className="bg-slate-800 border-slate-700 rounded px-2 py-1 text-sm w-24"
                        />
                    </div>
                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1 rounded text-sm">Add</button>
                </form>
            </div>

            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '0.85rem', color: '#cbd5e1' }}>
                {routes.map((route, i) => (
                    <div key={i} style={{ marginBottom: '0.25rem' }}>{route}</div>
                ))}
                {routes.length === 0 && <div className="text-muted">No routes found</div>}
            </div>
        </div>
    );
}
