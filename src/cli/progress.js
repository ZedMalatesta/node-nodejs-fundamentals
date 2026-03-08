import { setTimeout as sleep } from "timers/promises";

const args = process.argv.slice(2);

const getArg = (flag, defaultValue) => {
  const index = args.indexOf(flag);
  return index !== -1 ? args[index + 1] : defaultValue;
};

const duration = Number(getArg("--duration", 5000));
const interval = Number(getArg("--interval", 100));
const length = Number(getArg("--length", 30));
const rawColor = getArg("--color", null);

const parseHexColor = (hex) => {
  if (!hex) return null;
  const match = hex.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
  if (!match) return null;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
};

const rgb = parseHexColor(rawColor);
const colorStart = rgb ? `\x1b[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m` : "";
const colorReset = rgb ? "\x1b[0m" : "";

const progress = async () => {
  const steps = Math.floor(duration / interval);

  for (let i = 0; i <= steps; i++) {
    const percent = Math.round((i / steps) * 100);
    const filled = Math.round((i / steps) * length);
    const empty = length - filled;

    const bar = `${colorStart}${"█".repeat(filled)}${colorReset}${" ".repeat(empty)}`;
    process.stdout.write(`\r[${bar}] ${percent}%`);

    if (i < steps) await sleep(interval);
  }

  console.log("\nDone!");
};

await progress();