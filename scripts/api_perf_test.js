const fs = require("fs");

const TOKEN = process.env.BEARER_TOKEN;
const API_URL = process.env.API_URL || "http://localhost:3000/api/diagnose";
const ITERATIONS = parseInt(process.env.ITERATIONS || "5", 10);

if (!TOKEN) {
    console.error("❌ Error: You must provide a valid BEARER_TOKEN environment variable.");
    console.log("Usage: cross-env BEARER_TOKEN=eyJ... API_URL=http://localhost:3000/api/diagnose node scripts/api_perf_test.js");
    process.exit(1);
}

const payload = {
    symptoms: {
        location: ["Head"],
        painType: "Throbbing",
        duration: "1 week",
        additionalNotes: "Worse in sunlight",
    },
    bayesianPriors: [
        {
            condition: "Migraine",
            bayesianScore: 85,
            matchedKeywords: ["head", "throbbing", "sunlight"],
        }
    ]
};

async function runTest() {
    console.log(`🚀 Starting Load Test against ${API_URL}`);
    console.log(`⏱️  Iterations: ${ITERATIONS}\n`);

    const latencies = [];
    let errors = 0;

    for (let i = 0; i < ITERATIONS; i++) {
        process.stdout.write(`Fetching request ${i + 1}/${ITERATIONS}... `);
        
        const start = performance.now();
        
        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${TOKEN}`
                },
                body: JSON.stringify(payload)
            });

            const end = performance.now();
            const latency = end - start;
            
            if (!res.ok) {
                console.log(`❌ Failed (${res.status}) [${latency.toFixed(0)}ms]`);
                errors++;
            } else {
                console.log(`✅ Success [${latency.toFixed(0)}ms]`);
                latencies.push(latency);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            errors++;
        }
    }

    console.log("\n📊 --- RESULTS ---");
    console.log(`Total Requests: ${ITERATIONS}`);
    console.log(`Successful: ${latencies.length}`);
    console.log(`Failed: ${errors}`);

    if (latencies.length > 0) {
        // Sort for percentiles
        latencies.sort((a, b) => a - b);

        const average = latencies.reduce((a, b) => a + b, 0) / latencies.length;
        
        const getPercentile = (p) => {
            const index = Math.ceil((p / 100) * latencies.length) - 1;
            return latencies[index >= 0 ? index : 0];
        };

        console.log(`\n⏱️  Response Times (ms):`);
        console.log(`Average: ${average.toFixed(2)} ms`);
        console.log(`P50:     ${getPercentile(50).toFixed(2)} ms`);
        console.log(`P75:     ${getPercentile(75).toFixed(2)} ms`);
        console.log(`P90:     ${getPercentile(90).toFixed(2)} ms`);
        console.log(`P95:     ${getPercentile(95).toFixed(2)} ms`);
        console.log(`Max:     ${latencies[latencies.length - 1].toFixed(2)} ms`);
        console.log(`Min:     ${latencies[0].toFixed(2)} ms`);
    } else {
        console.log("\n⚠️ No successful requests to calculate metrics.");
    }
}

runTest();
