import { readdir, readFile, writeFile, access } from "fs/promises";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { ERROR_TEXT, WORKSPACE_DIR_NAME, PARTS_DIR_NAME, MERGED_OUTPUT_NAME } from '../consts/consts.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const merge = async () => {
  const args = process.argv.slice(2);
  const filesIndex = args.indexOf("--files");

  const workspacePath = resolve(__dirname, `../../${WORKSPACE_DIR_NAME}`);
  const partsPath = join(workspacePath, PARTS_DIR_NAME);

  try {
    await access(partsPath);
  } catch {
    throw new Error(ERROR_TEXT);
  }

  try {
    let filenames;

    if (filesIndex !== -1) {
      filenames = args[filesIndex + 1].split(",").map((f) => f.trim());
    } else {
      const all = await readdir(partsPath);
      filenames = all.filter((f) => f.endsWith(".txt")).sort();

      if (filenames.length === 0) {
        throw new Error(ERROR_TEXT);
      }
    }

    const chunks = await Promise.all(
      filenames.map(async (filename) => {
        const filePath = join(partsPath, filename);
        try {
          return await readFile(filePath, "utf8");
        } catch {
          throw new Error(ERROR_TEXT);
        }
      })
    );

    await writeFile(join(workspacePath, MERGED_OUTPUT_NAME), chunks.join(""), "utf8");
  } catch (err) {
    if (err.message === ERROR_TEXT) throw err;
    throw new Error(ERROR_TEXT);
  }
};

await merge();