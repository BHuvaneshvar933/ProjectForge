const http = require('http');

async function runBenchmark() {
  const fetchApi = () => new Promise((resolve, reject) => {
    const start = performance.now();
    http.get('http://localhost:5001/api/projects', (res) => {
      res.on('data', () => {});
      res.on('end', () => resolve(performance.now() - start));
    }).on('error', reject);
  });

  let times = [];
  for (let i = 0; i < 20; i++) {
    const time = await fetchApi();
    times.push(time);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const p95 = [...times].sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
  
  console.log(`Optimized API Average: ${avg.toFixed(2)} ms`);
  console.log(`Optimized API p95: ${p95.toFixed(2)} ms`);
}

runBenchmark().catch(console.error);
