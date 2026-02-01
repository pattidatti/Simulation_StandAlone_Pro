
import fs from 'fs';

const logPath = 'c:\\Users\\Eirik\\Documents\\Simulation_StandAlone_Pro\\Feedback\\simulation_log_4800_2026-01-29T18_20_20.082Z.json';

try {
    const rawData = fs.readFileSync(logPath, 'utf-8');
    const logs = JSON.parse(rawData);

    const counts = {
        produced: 0,
        consumed: 0,
        built: 0,
        upgraded: 0,
        activity: {}
    };

    logs.forEach(log => {
        const content = log.content;

        // Production
        if (content.toLowerCase().includes('produserte')) {
            counts.produced++;
            const match = content.match(/Produserte (\d+) ([\w\s]+)/i);
            if (match) {
                const item = match[2].trim();
                counts.activity[item] = (counts.activity[item] || 0) + parseInt(match[1]);
            }
        }

        // Consumption
        if (content.toLowerCase().includes('spiste') || content.toLowerCase().includes('drakk') || content.toLowerCase().includes('brukte')) {
            counts.consumed++;
        }

        // Buildings
        if (content.toLowerCase().includes('bygde') || content.toLowerCase().includes('oppgraderte')) {
            counts.built++;
        }
    });

    console.log(`Produced Events: ${counts.produced}`);
    console.log(`Consumed Events: ${counts.consumed}`);
    console.log(`Build/Upgrade Events: ${counts.built}`);
    console.log('Production Details:', JSON.stringify(counts.activity, null, 2));

} catch (e) {
    console.error(e);
}
