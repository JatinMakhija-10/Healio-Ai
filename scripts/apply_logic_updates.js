const fs = require('fs');

// 1. Modify AI_PHASE_CONFIG temperature
const configFile = 'src/lib/ai/config.ts';
if (fs.existsSync(configFile)) {
    let configStr = fs.readFileSync(configFile, 'utf8');
    configStr = configStr.replace(/temperature:\s*0\.[0-9]+/, 'temperature: 0.15');
    fs.writeFileSync(configFile, configStr, 'utf8');
    console.log('Fixed temperature.');
}

// 2. Modify route.ts
const routeFile = 'src/app/api/chat/route.ts';
if (fs.existsSync(routeFile)) {
    let routeStr = fs.readFileSync(routeFile, 'utf8');

    // Add stop array
    if (!routeStr.includes('stop: ["\\n\\nUser:", "\\n\\nHuman:"]')) {
        routeStr = routeStr.replace('stream: true,', 'stream: true,\n                        stop: ["\\n\\nUser:", "\\n\\nHuman:"],');
        console.log('Added stop sequence.');
    }

    // Adjust sliding window
    routeStr = routeStr.replace(
        /processedMessages = \[\s*messages\[0\],\s*\.\.\.messages\.slice\([^)]+\)\s*\];/,
        `processedMessages = [\n                messages[0], \n                messages[1],\n                ...messages.slice(messages.length - dynamicMaxMessages + 2)\n            ].filter(Boolean);`
    );
    
    fs.writeFileSync(routeFile, routeStr, 'utf8');
    console.log('Modified route.ts logic.');
}
