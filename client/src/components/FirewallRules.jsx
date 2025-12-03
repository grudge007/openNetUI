import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config';

export default function FirewallRules({ token, namespace }) {
    const [firewall, setFirewall] = useState({ filter: [], nat: [] });
    const [fwTable, setFwTable] = useState('filter');

    // Form state
    const [chain, setChain] = useState('INPUT');
    const [protocol, setProtocol] = useState('tcp');
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [target, setTarget] = useState('ACCEPT');
    const [priority, setPriority] = useState('1');

    useEffect(() => {
        if (namespace) {
            fetchFirewall();
        }
    }, [namespace, token]);

    const fetchFirewall = async () => {
        try {
            const res = await fetch(`${getApiUrl()}/api/firewall/${namespace}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setFirewall(data);
        } catch (err) {
            console.error(err);
        }
    };

    const addRule = async (e) => {
        e.preventDefault();
        try {
            await fetch(`${getApiUrl()}/api/firewall/${namespace}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    table: fwTable,
                    chain,
                    protocol,
                    source: source || undefined,
                    destination: destination || undefined,
                    target,
                    priority
                }),
            });
            fetchFirewall();
            setSource('');
            setDestination('');
        } catch (err) {
            console.error(err);
        }
    };

    const deleteRule = async (chain, num) => {
        if (!confirm(`Delete rule ${num} from ${chain}?`)) return;
        try {
            await fetch(`${getApiUrl()}/api/firewall/${namespace}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ table: fwTable, chain, num }),
            });
            fetchFirewall();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <h4 className="mb-4 text-lg font-bold text-amber-400">Firewall Rules</h4>

            <div className="flex gap-2 mb-4">
                <button
                    className={`badge ${fwTable === 'filter' ? 'bg-amber-600' : 'bg-gray-700'}`}
                    onClick={() => setFwTable('filter')}
                    style={{ cursor: 'pointer', border: 'none' }}
                >
                    Filter Table
                </button>
                <button
                    className={`badge ${fwTable === 'nat' ? 'bg-amber-600' : 'bg-gray-700'}`}
                    onClick={() => setFwTable('nat')}
                    style={{ cursor: 'pointer', border: 'none' }}
                >
                    NAT Table
                </button>
            </div>

            <div className="mb-6 p-4 bg-slate-900 rounded-lg">
                <h5 className="mb-2 text-sm text-muted uppercase tracking-wider">Add Rule ({fwTable})</h5>
                <form onSubmit={addRule} className="flex gap-2 flex-wrap items-end">
                    <div>
                        <label className="text-xs text-muted block mb-1">Chain</label>
                        <select value={chain} onChange={e => setChain(e.target.value)} className="bg-slate-800 border-slate-700 rounded px-2 py-1 text-sm">
                            <option value="INPUT">INPUT</option>
                            <option value="OUTPUT">OUTPUT</option>
                            <option value="FORWARD">FORWARD</option>
                            {fwTable === 'nat' && <option value="PREROUTING">PREROUTING</option>}
                            {fwTable === 'nat' && <option value="POSTROUTING">POSTROUTING</option>}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-muted block mb-1">Protocol</label>
                        <select value={protocol} onChange={e => setProtocol(e.target.value)} className="bg-slate-800 border-slate-700 rounded px-2 py-1 text-sm">
                            <option value="tcp">TCP</option>
                            <option value="udp">UDP</option>
                            <option value="icmp">ICMP</option>
                            <option value="all">ALL</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-muted block mb-1">Source</label>
                        <input value={source} onChange={e => setSource(e.target.value)} placeholder="0.0.0.0/0" className="bg-slate-800 border-slate-700 rounded px-2 py-1 text-sm w-32" />
                    </div>
                    <div>
                        <label className="text-xs text-muted block mb-1">Dest</label>
                        <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="0.0.0.0/0" className="bg-slate-800 border-slate-700 rounded px-2 py-1 text-sm w-32" />
                    </div>
                    <div>
                        <label className="text-xs text-muted block mb-1">Target</label>
                        <select value={target} onChange={e => setTarget(e.target.value)} className="bg-slate-800 border-slate-700 rounded px-2 py-1 text-sm">
                            <option value="ACCEPT">ACCEPT</option>
                            <option value="DROP">DROP</option>
                            <option value="REJECT">REJECT</option>
                            {fwTable === 'nat' && <option value="MASQUERADE">MASQUERADE</option>}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-muted block mb-1">Priority</label>
                        <input type="number" value={priority} onChange={e => setPriority(e.target.value)} className="bg-slate-800 border-slate-700 rounded px-2 py-1 text-sm w-16" />
                    </div>
                    <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1 rounded text-sm">Add</button>
                </form>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ padding: '0.5rem' }}>Chain</th>
                            <th style={{ padding: '0.5rem' }}>Num</th>
                            <th style={{ padding: '0.5rem' }}>Proto</th>
                            <th style={{ padding: '0.5rem' }}>Source</th>
                            <th style={{ padding: '0.5rem' }}>Dest</th>
                            <th style={{ padding: '0.5rem' }}>Target</th>
                            <th style={{ padding: '0.5rem' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {firewall[fwTable]?.map((rule, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.5rem' }}>{rule.chain}</td>
                                <td style={{ padding: '0.5rem' }}>{rule.num}</td>
                                <td style={{ padding: '0.5rem' }}>{rule.prot}</td>
                                <td style={{ padding: '0.5rem' }}>{rule.source}</td>
                                <td style={{ padding: '0.5rem' }}>{rule.destination}</td>
                                <td style={{ padding: '0.5rem' }}>
                                    <span className={`badge ${rule.target === 'ACCEPT' ? 'bg-green-600' : rule.target === 'DROP' ? 'bg-red-600' : 'bg-gray-600'}`}>
                                        {rule.target}
                                    </span>
                                </td>
                                <td style={{ padding: '0.5rem' }}>
                                    <button className="danger icon-btn" onClick={() => deleteRule(rule.chain, rule.num)}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                        {(!firewall[fwTable] || firewall[fwTable].length === 0) && (
                            <tr><td colSpan="7" className="text-center p-4 text-muted">No rules found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
