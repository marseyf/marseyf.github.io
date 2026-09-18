// Keep the original verification command usable after the portfolio redesign.
import { spawnSync } from 'node:child_process';
const result = spawnSync('python3', ['tools/verify-site.py'], { stdio: 'inherit' });
process.exit(result.status ?? 1);
