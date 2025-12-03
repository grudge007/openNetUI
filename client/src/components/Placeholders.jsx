import React from 'react';

export const PlaceholderPage = ({ title, description }) => (
    <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
        <h2>{title}</h2>
        <p className="text-muted" style={{ maxWidth: '400px', margin: '0 auto' }}>
            {description || 'This module is currently under development and will be available in a future update.'}
        </p>
    </div>
);

export const IPAM = () => <PlaceholderPage title="IP Address Management" description="Manage IP pools, subnets, and allocations." />;
export const Firewall = () => <PlaceholderPage title="Firewall Management" description="Configure iptables rules and security policies." />;
export const Namespaces = () => <PlaceholderPage title="Network Namespaces" description="Isolate network environments using Linux namespaces." />;
