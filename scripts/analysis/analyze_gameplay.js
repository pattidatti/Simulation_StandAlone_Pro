
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const logPath = 'c:\\Users\\Eirik\\Documents\\Simulation_StandAlone_Pro\\Feedback\\simulation_log_4800_2026-01-29T18_20_20.082Z.json';
const outputPath = 'c:\\Users\\Eirik\\Documents\\Simulation_StandAlone_Pro\\Feedback\\gameplay_report.json';

try {
    const rawData = fs.readFileSync(logPath, 'utf-8');
    const logs = JSON.parse(rawData);

    // Trackers
    const production = {};
    const consumption = {};
    const sales = {};
    const purchases = {};
    const upgrades = {};
    const roles = [];

    logs.forEach(log => {
        const content = log.content;

        // 1. Production
        if (content.match(/^\[.*\] Produserte/i)) {
            const match = content.match(/Produserte (\d+) (.+)/i);
            if (match) {
                const qty = parseInt(match[1]);
                let item = match[2].trim();
                item = item.replace(/\.$/, '').trim();
                production[item] = (production[item] || 0) + qty;
            }
        }

        // 2. Consumption
        if (content.match(/^\[.*\] (Spiste|Drakk|Brukte)/i)) {
            const match = content.match(/(Spiste|Drakk|Brukte) (.+?)(\.|\s|$)/i);
            if (match) {
                const item = match[2].trim();
                consumption[item] = (consumption[item] || 0) + 1;
            }
        }

        // 3. Trade (Popularity)
        if (content.includes('Kjøpte') || content.includes('Solgte')) {
            const match = content.match(/(Kjøpte|Solgte) (\d+) (.+) for/i);
            if (match) {
                const action = match[1];
                const qty = parseInt(match[2]);
                const item = match[3].trim();

                if (action === 'Kjøpte') purchases[item] = (purchases[item] || 0) + qty;
                if (action === 'Solgte') sales[item] = (sales[item] || 0) + qty;
            }
        }

        // 4. Upgrades / Buildings
        if (content.includes('Oppgraderte') || content.includes('Bygde')) {
            upgrades[content] = (upgrades[content] || 0) + 1;
        }

        // 5. Roles
        if (content.match(/utnevnt|konge|baron|adlet|valget/i) && !content.includes('System')) {
            if (!roles.includes(content)) roles.push(content);
        }
    });

    const report = {
        production,
        consumption,
        sales,
        purchases,
        upgrades,
        roles: roles.sort()
    };

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
    console.log("Written to " + outputPath);

} catch (e) {
    console.error(e);
}
