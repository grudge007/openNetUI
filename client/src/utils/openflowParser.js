export const parseOpenFlow = (output) => {
    if (!output) return [];

    // Example output line:
    // cookie=0x0, duration=123.456s, table=0, n_packets=0, n_bytes=0, priority=0 actions=NORMAL

    return output.split('\n')
        .filter(line => line.trim() !== '' && !line.startsWith('NXST_FLOW'))
        .map(line => {
            const parts = line.split(' actions=');
            if (parts.length !== 2) return null;

            const meta = parts[0];
            const actions = parts[1];

            // Extract priority
            const priorityMatch = meta.match(/priority=(\d+)/);
            const priority = priorityMatch ? priorityMatch[1] : '?';

            // Extract match (everything else in meta that isn't stats)
            // This is a simplified parser
            const match = meta.split(',').filter(p =>
                !p.includes('cookie=') &&
                !p.includes('duration=') &&
                !p.includes('table=') &&
                !p.includes('n_packets=') &&
                !p.includes('n_bytes=') &&
                !p.includes('priority=')
            ).join(', ').trim();

            return {
                priority,
                match: match || 'Any',
                actions
            };
        })
        .filter(f => f !== null);
};
