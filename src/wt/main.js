import { Worker } from "worker_threads";
import { readFile, access } from "fs/promises";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { cpus } from "os";
import { ERROR_TEXT } from "../consts/consts.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const kWayMerge = (sortedArrays) => {
  const result = [];
  const indices = new Array(sortedArrays.length).fill(0);

  while (true) {
    let minVal = Infinity;
    let minIdx = -1;

    for (let i = 0; i < sortedArrays.length; i++) {
      if (indices[i] < sortedArrays[i].length && sortedArrays[i][indices[i]] < minVal) {
        minVal = sortedArrays[i][indices[i]];
        minIdx = i;
      }
    }

    if (minIdx === -1) break;

    result.push(minVal);
    indices[minIdx]++;
  }

  return result;
};

const runWorker = (workerPath, chunk, index) =>
  new Promise((res, rej) => {
    const worker = new Worker(workerPath);
    worker.on("message", (sorted) => res({ index, sorted }));
    worker.on("error", rej);
    worker.postMessage(chunk);
  });

const main = async () => {
  const dataPath = resolve(__dirname, "../../data.json");

  try {
    await access(dataPath);
  } catch {
    throw new Error(ERROR_TEXT);
  }

  try {
    const raw = await readFile(dataPath, "utf8");
    const numbers = JSON.parse(raw);

    const numCores = cpus().length;
    const chunkSize = Math.ceil(numbers.length / numCores);
    const chunks = Array.from({ length: numCores }, (_, i) =>
      numbers.slice(i * chunkSize, (i + 1) * chunkSize)
    ).filter((chunk) => chunk.length > 0);

    const workerPath = join(__dirname, "worker.js");

    const results = await Promise.all(
      chunks.map((chunk, index) => runWorker(workerPath, chunk, index))
    );

    const sortedChunks = results
      .sort((a, b) => a.index - b.index)
      .map((r) => r.sorted);

    console.log(kWayMerge(sortedChunks));
  } catch (err) {
    if (err.message === ERROR_TEXT) throw err;
    throw new Error(ERROR_TEXT);
  }
};

await main();