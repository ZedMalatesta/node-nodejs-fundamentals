import { createReadStream } from "fs";
import { access, readFile } from "fs/promises";
import { createHash } from "crypto";
import { pipeline } from "stream";
import { promisify } from "util";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { ERROR_TEXT, CHECKSUM_FILE_NAME } from "../consts/consts.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pipelineAsync = promisify(pipeline);

const hashFile = async (filePath) => {
  const hash = createHash("sha256");

  await pipelineAsync(createReadStream(filePath), hash);

  return hash.digest("hex");
};

const verify = async () => {
  const checksumsPath = resolve(__dirname, `../../${CHECKSUM_FILE_NAME}`);

  try {
    await access(checksumsPath);
  } catch {
    throw new Error(ERROR_TEXT);
  }

  const raw = await readFile(checksumsPath, "utf8").catch(() => {
    throw new Error(ERROR_TEXT);
  });

  const checksums = JSON.parse(raw);

  for (const [filename, expectedHash] of Object.entries(checksums)) {
    const filePath = resolve(__dirname, `../../${filename}`);

    try {
      const actualHash = await hashFile(filePath);
      const status = actualHash === expectedHash ? "OK" : "FAIL";
      console.log(`${filename} — ${status}`);
    } catch {
      console.log(`${filename} — FAIL`);
    }
  }
};

await verify();