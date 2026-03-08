import { createReadStream } from "fs";
import { createHash } from "crypto";
import { pipeline } from "stream";
import { promisify } from "util";
import { writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { CHECKSUM_FILE_NAME } from "../consts/consts.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pipelineAsync = promisify(pipeline);

const files = ["file1.txt", "file2.txt"];
const result = {};

for (const file of files) {
  const hash = createHash("sha256");
  await pipelineAsync(createReadStream(resolve(__dirname, `../../${file}`)), hash);
  result[file] = hash.digest("hex");
}

await writeFile(resolve(__dirname, `../../${CHECKSUM_FILE_NAME}`), JSON.stringify(result, null, 2), "utf8");
console.log(JSON.stringify(result, null, 2));