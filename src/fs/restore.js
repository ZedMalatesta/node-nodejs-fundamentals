import { readFile, writeFile, mkdir, access } from "fs/promises";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { ERROR_TEXT, SNAPSHOT_FILE_NAME, RESTORED_DIR_NAME } from '../consts/consts.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const restore = async () => {
  const snapshotPath = resolve(__dirname, `../../${SNAPSHOT_FILE_NAME}`);
  const restorePath = resolve(__dirname, `../../${RESTORED_DIR_NAME}`);

  try {
    await access(snapshotPath);
  } catch {
    throw new Error(ERROR_TEXT);
  }

  try {
    await access(restorePath);
    throw new Error(ERROR_TEXT);
  } catch (err) {
    if (err.message === ERROR_TEXT) throw err;
  }

  try {
    const raw = await readFile(snapshotPath, "utf8");
    const { entries } = JSON.parse(raw);

    await mkdir(restorePath);

    for (const entry of entries) {
      const destPath = join(restorePath, entry.path);

      if (entry.type === "directory") {
        await mkdir(destPath, { recursive: true });
      } else if (entry.type === "file") {
        await mkdir(dirname(destPath), { recursive: true });
        await writeFile(destPath, Buffer.from(entry.content, "base64"));
      }
    }
  } catch (err) {
    if (err.message === ERROR_TEXT) throw err;
    throw new Error(ERROR_TEXT);
  }
};

await restore();