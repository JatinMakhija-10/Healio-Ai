const https = require('https');

const url = "https://code.highcharts.com/mapdata/countries/in/in-all.topo.json";

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('TopoJSON structure keys:', Object.keys(json));
            if (json.objects) {
                console.log('Objects keys:', Object.keys(json.objects));
                // Usually the first object is the main one
                const mainKey = Object.keys(json.objects)[0];
                const geometries = json.objects[mainKey].geometries;
                console.log(`Found ${geometries.length} geometries in ${mainKey}`);

                const names = geometries.map(g => g.properties['name'] || g.properties['hc-key']);
                console.log('Sample State Names:', names.slice(0, 10));
                console.log('All State Names:', names.sort());
            } else {
                console.log('No objects found in TopoJSON');
            }
        } catch (e) {
            console.error('Error parsing JSON:', e);
        }
    });
}).on('error', (e) => {
    console.error('Error fetching URL:', e);
});
