const { execSync } = require('child_process');
try {
  const stdout = execSync('lsof -t -i:5000').toString();
  const pids = stdout.split('\n').filter(Boolean);
  pids.forEach(pid => {
    process.stdout.write(`Killing PID ${pid}\n`);
    process.kill(parseInt(pid), 'SIGKILL');
  });
} catch (e) {
  process.stdout.write('No process found on port 5000 or error occurred.\n');
}
