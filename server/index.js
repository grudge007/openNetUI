const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// Basic Auth Middleware (Simple password check)
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_PASSWORD || 'admin'}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Input Validation
const validateInput = (input) => {
    if (typeof input !== 'string') return false;
    // Allow alphanumeric, dashes, underscores, dots, colons, and spaces (for arguments)
    // But be careful with spaces if we are constructing commands.
    // Actually, for bridge/port names, we should be stricter.
    // Let's create a strict validator for names.
    return /^[a-zA-Z0-9\-\._:]+$/.test(input);
};

// Helper to execute shell commands
const executeCommand = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${command}`, error);
                return reject({ error, stderr });
            }
            resolve(stdout.trim());
        });
    });
};

// Login Endpoint
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === (process.env.ADMIN_PASSWORD || 'admin')) {
        res.json({ token: process.env.ADMIN_PASSWORD || 'admin' });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

// OVS Endpoints

// Show OVS Status
app.get('/api/ovs/summary', authMiddleware, async (req, res) => {
    try {
        const output = await executeCommand('ovs-vsctl show');
        res.json({ output });
    } catch (err) {
        res.status(500).json({ error: err.stderr || err.error.message });
    }
});

// List Bridges
app.get('/api/ovs/bridges', authMiddleware, async (req, res) => {
    try {
        const output = await executeCommand('ovs-vsctl list-br');
        const bridges = output.split('\n').filter(line => line.trim() !== '');
        res.json({ bridges });
    } catch (err) {
        res.status(500).json({ error: err.stderr || err.error.message });
    }
});

// Add Bridge
app.post('/api/ovs/bridges', authMiddleware, async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Bridge name required' });
    if (!validateInput(name)) return res.status(400).json({ error: 'Invalid bridge name' });
    try {
        await executeCommand(`ovs-vsctl add-br ${name}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.stderr || err.error.message });
    }
});

// Delete Bridge
app.delete('/api/ovs/bridges/:name', authMiddleware, async (req, res) => {
    const { name } = req.params;
    if (!validateInput(name)) return res.status(400).json({ error: 'Invalid bridge name' });
    try {
        await executeCommand(`ovs-vsctl del-br ${name}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.stderr || err.error.message });
    }
});

// List Ports on a Bridge
app.get('/api/ovs/ports/:bridge', authMiddleware, async (req, res) => {
    const { bridge } = req.params;
    if (!validateInput(bridge)) return res.status(400).json({ error: 'Invalid bridge name' });
    try {
        const output = await executeCommand(`ovs-vsctl list-ports ${bridge}`);
        const ports = output.split('\n').filter(line => line.trim() !== '');
        res.json({ ports });
    } catch (err) {
        res.status(500).json({ error: err.stderr || err.error.message });
    }
});

// Add Port
app.post('/api/ovs/ports', authMiddleware, async (req, res) => {
    const { bridge, port, type, vlan, remoteIp, key } = req.body;
    if (!bridge || !port) return res.status(400).json({ error: 'Bridge and Port name required' });

    if (!validateInput(bridge) || !validateInput(port)) return res.status(400).json({ error: 'Invalid input' });
    if (vlan && !/^\d+$/.test(vlan)) return res.status(400).json({ error: 'Invalid VLAN' });
    if (remoteIp && !validateInput(remoteIp)) return res.status(400).json({ error: 'Invalid Remote IP' });
    if (key && !validateInput(key)) return res.status(400).json({ error: 'Invalid Key' });

    let command = `ovs-vsctl add-port ${bridge} ${port}`;

    if (vlan) {
        command += ` tag=${vlan}`;
    }

    if (type === 'vxlan') {
        command += ` -- set interface ${port} type=vxlan`;
        if (remoteIp) command += ` options:remote_ip=${remoteIp}`;
        if (key) command += ` options:key=${key}`;
    }

    try {
        await executeCommand(command);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.stderr || err.error.message });
    }
});

// Delete Port
app.delete('/api/ovs/ports/:bridge/:port', authMiddleware, async (req, res) => {
    const { bridge, port } = req.params;
    if (!validateInput(bridge) || !validateInput(port)) return res.status(400).json({ error: 'Invalid input' });
    try {
        await executeCommand(`ovs-vsctl del-port ${bridge} ${port}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.stderr || err.error.message });
    }
});

// Dump Flows
app.get('/api/ovs/flows/:bridge', authMiddleware, async (req, res) => {
    const { bridge } = req.params;
    if (!validateInput(bridge)) return res.status(400).json({ error: 'Invalid bridge name' });
    try {
        const output = await executeCommand(`ovs-ofctl dump-flows ${bridge}`);
        res.json({ output });
    } catch (err) {
        res.status(500).json({ error: err.stderr || err.error.message });
    }
});

// System Status Check
app.get('/api/ovs/system-status', authMiddleware, async (req, res) => {
    try {
        // Check if installed
        await executeCommand('which ovs-vsctl');

        // Check if running
        try {
            await executeCommand('ovs-vsctl show');
            res.json({ installed: true, running: true, message: 'OVS is operational' });
        } catch (e) {
            res.json({ installed: true, running: false, message: 'OVS is installed but not running or permission denied' });
        }
    } catch (e) {
        res.json({ installed: false, running: false, message: 'Open vSwitch is not installed' });
    }
});

// Helper to get VXLAN details
async function getVxlanPortsSimple(bridgeName) {
    const vxlanPorts = [];
    try {
        const portsOutput = await executeCommand(`ovs-vsctl list-ports ${bridgeName}`);
        const ports = portsOutput.trim().split('\n').filter(p => p.length > 0);

        for (const port of ports) {
            try {
                const portType = await executeCommand(`ovs-vsctl get Interface ${port} type`);
                if (portType.includes('vxlan')) {
                    const optionsOutput = await executeCommand(`ovs-vsctl list Interface ${port} | grep options`);
                    const options = {};
                    if (optionsOutput) {
                        const match = optionsOutput.match(/options\s*:\s*{(.*)}/); // Adjusted regex for OVS output format {key=value}
                        if (match && match[1]) {
                            const pairs = match[1].split(',');
                            pairs.forEach(pair => {
                                const [key, value] = pair.split('=');
                                if (key && value) {
                                    options[key.trim()] = value.trim().replace(/"/g, '');
                                }
                            });
                        }
                    }
                    vxlanPorts.push({ port: port, options: options });
                }
            } catch (error) {
                continue;
            }
        }
    } catch (e) {
        console.error('Error fetching VXLAN ports:', e);
    }
    return vxlanPorts;
}

// Get Detailed Bridge Info (Ports + VLANs + VXLANs)
app.get('/api/ovs/bridge-details/:bridge', authMiddleware, async (req, res) => {
    const { bridge } = req.params;
    if (!validateInput(bridge)) return res.status(400).json({ error: 'Invalid bridge name' });

    try {
        // Get list of ports
        const portsOutput = await executeCommand(`ovs-vsctl list-ports ${bridge}`);
        const bridgeports = portsOutput.trim().split('\n').filter(port => port.length > 0);

        // Get VLANs in parallel
        const portPromises = bridgeports.map(async (bridgeport) => {
            try {
                const tagOutput = await executeCommand(`ovs-vsctl get Port ${bridgeport} tag`);
                const tag = tagOutput.trim();
                return {
                    port: bridgeport,
                    vlan: (tag === '[]' || tag === '') ? 'default' : parseInt(tag.trim())
                };
            } catch (tagError) {
                return { port: bridgeport, vlan: 'default' };
            }
        });

        const portVlanResults = await Promise.all(portPromises);
        const portVlanMap = {};
        portVlanResults.forEach(result => {
            portVlanMap[result.port] = result.vlan;
        });

        // Get VXLAN details
        const vxlanPorts = await getVxlanPortsSimple(bridge);
        const vxlanMap = {};
        vxlanPorts.forEach(v => {
            vxlanMap[v.port] = v.options;
        });

        // Combine data
        const detailedPorts = bridgeports.map(port => ({
            name: port,
            vlan: portVlanMap[port],
            type: vxlanMap[port] ? 'vxlan' : (portVlanMap[port] !== 'default' ? 'access' : 'trunk/normal'),
            vxlan: vxlanMap[port] || null
        }));

        res.json({ bridge, ports: detailedPorts });

    } catch (error) {
        console.error('Error fetching bridge details:', error);
        res.status(500).json({ error: 'Failed to retrieve bridge information' });
    }
});

// Namespace Helpers
async function getNetworkNamespaces() {
    try {
        const stdout = await executeCommand('ip netns ls');
        const namespaces = stdout
            .trim()
            .split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => line.split(/\s+/)[0]);
        // Exclude default from list as it will be shown in Firewall page
        return namespaces;
    } catch (error) {
        console.error('Failed to get network namespaces:', error.message);
        return [];
    }
}

async function getIptablesRules(namespace) {
    const rules = { filter: [], nat: [] };

    const tables = ['filter', 'nat'];
    for (const table of tables) {
        try {
            const cmd = namespace === 'default'
                ? `iptables -t ${table} -vnL --line-numbers`
                : `ip netns exec ${namespace} iptables -t ${table} -vnL --line-numbers`;

            const output = await executeCommand(cmd);
            const lines = output.split('\n');
            let currentChain = null;

            for (const line of lines) {
                if (line.startsWith('Chain')) {
                    currentChain = line.split(' ')[1];
                    continue;
                }
                if (line.trim().startsWith('num') || line.trim() === '') continue;

                if (currentChain) {
                    // Parse line: num pkts bytes target prot opt in out source destination [options]
                    // Example: 1 0 0 ACCEPT all -- lo * 0.0.0.0/0 0.0.0.0/0
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 10) {
                        rules[table].push({
                            chain: currentChain,
                            num: parts[0],
                            pkts: parts[1],
                            bytes: parts[2],
                            target: parts[3],
                            prot: parts[4],
                            opt: parts[5],
                            in: parts[6],
                            out: parts[7],
                            source: parts[8],
                            destination: parts[9],
                            options: parts.slice(10).join(' ')
                        });
                    }
                }
            }
        } catch (e) {
            console.error(`Failed to get ${table} table for ${namespace}:`, e.message);
        }
    }
    return rules;
}

async function getNamespaceInfo(namespace) {
    try {
        if (namespace !== 'default') {
            const nsList = await executeCommand('ip netns list');
            if (!nsList.includes(namespace)) {
                throw new Error(`Namespace '${namespace}' not found`);
            }
        }

        const cmd = namespace === 'default' ? 'ip link' : `ip netns exec ${namespace} ip link`;
        const interfacesOutput = await executeCommand(cmd);

        const interfaces = [];
        const lines = interfacesOutput.split('\n');

        for (const line of lines) {
            if (line.includes('mtu') && !line.includes('link') && !line.includes('lo:')) {
                const match = line.match(/\d+:\s+([^:]+):/);
                if (match) {
                    interfaces.push(match[1].trim());
                }
            }
        }

        const routeCmd = namespace === 'default' ? 'ip route show' : `ip netns exec ${namespace} ip route show`;
        const routesOutput = await executeCommand(routeCmd);

        const routes = routesOutput.split('\n')
            .filter(route => route.trim())
            .map(route => route
                .replace(/\s+proto\s+\w+/g, '')
                .replace(/\s+kernel/g, '')
                .replace(/\s+link/g, '')
                .replace(/\s+scope\s+\w+/g, '')
                .trim()
            );

        const interfaceDetails = await Promise.all(
            interfaces.map(async (iface) => {
                try {
                    const bridgeOutput = await executeCommand(`ovs-vsctl port-to-br ${iface} 2>/dev/null || echo "N/A"`);
                    const bridge = bridgeOutput.trim();

                    return {
                        interface: iface,
                        ovs_bridge: bridge === 'N/A' ? null : bridge,
                        belongs_to: bridge === 'N/A' ? 'Not an OVS port' : `${iface} belongs to ${bridge}`
                    };
                } catch (error) {
                    return {
                        interface: iface,
                        ovs_bridge: null,
                        belongs_to: 'Error checking OVS'
                    };
                }
            })
        );

        return {
            namespace,
            interfaces: interfaceDetails,
            routes,
            count: interfaces.length
        };

    } catch (error) {
        throw new Error(`Failed to get namespace info: ${error.message}`);
    }
}

// Namespace Endpoints
app.get('/api/namespaces', authMiddleware, async (req, res) => {
    try {
        const namespaces = await getNetworkNamespaces();
        res.json({ namespaces });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/namespaces/:name', authMiddleware, async (req, res) => {
    try {
        const info = await getNamespaceInfo(req.params.name);
        res.json(info);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Firewall Endpoints
app.get('/api/firewall/:namespace', authMiddleware, async (req, res) => {
    try {
        const rules = await getIptablesRules(req.params.namespace);
        res.json(rules);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/firewall/:namespace', authMiddleware, async (req, res) => {
    const { namespace } = req.params;
    const { table, chain, protocol, source, destination, target, priority } = req.body;

    if (!validateInput(namespace) || !validateInput(chain) || !validateInput(target)) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        // Construct iptables command
        // iptables -t [table] -I [chain] [priority] -p [protocol] -s [source] -d [destination] -j [target]
        let cmd = namespace === 'default' ? 'iptables' : `ip netns exec ${namespace} iptables`;
        cmd += ` -t ${table || 'filter'} -I ${chain} ${priority || 1}`;
        if (protocol) cmd += ` -p ${protocol}`;
        if (source) cmd += ` -s ${source}`;
        if (destination) cmd += ` -d ${destination}`;
        cmd += ` -j ${target}`;

        await executeCommand(cmd);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/firewall/:namespace', authMiddleware, async (req, res) => {
    const { namespace } = req.params;
    const { table, chain, num } = req.body;

    try {
        let cmd = namespace === 'default' ? 'iptables' : `ip netns exec ${namespace} iptables`;
        cmd += ` -t ${table || 'filter'} -D ${chain} ${num}`;

        await executeCommand(cmd);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
