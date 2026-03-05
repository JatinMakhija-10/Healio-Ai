const https = require('https');

https.get('https://archive.org/metadata/pocketmanualhom00boergoog/files', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const result = JSON.parse(data);
            const files = result.result;
            const pdfs = files.filter(f => f.name.endsWith('.pdf'));
            const txts = files.filter(f => f.name.endsWith('.txt'));
            const epubs = files.filter(f => f.name.endsWith('.epub'));
            console.log('PDFs:', pdfs.map(f => f.name));
            console.log('TXTs:', txts.map(f => f.name));
            console.log('EPUBs:', epubs.map(f => f.name));
        } catch (e) { console.error(e); }
    });
});
