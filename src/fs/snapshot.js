import { readdir, stat, readFile, writeFile, access } from "fs/promises";
import { join, relative, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { ERROR_TEXT, WORKSPACE_DIR_NAME, SNAPSHOT_FILE_NAME, ENCODING_STANDARD } from '../consts/consts.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const snapshot = async () => {
  const workspacePath = resolve(__dirname, `../../${WORKSPACE_DIR_NAME}`);

  try {
    await access(workspacePath);
  } catch {
    throw new Error(ERROR_TEXT);
  }

  const workspaceStat = await stat(workspacePath).catch(() => {
    throw new Error(ERROR_TEXT);
  });

  if (!workspaceStat.isDirectory()) {
    throw new Error(ERROR_TEXT);
  }

  const entries = [];

  try {
    const items = await readdir(workspacePath, {
      recursive: true,
      withFileTypes: true,
    });

    for (const item of items) {
      const absolutePath = join(item.parentPath, item.name);
      const relativePath = relative(workspacePath, absolutePath).replaceAll("\\", "/");
      const itemStat = await stat(absolutePath);

      if (itemStat.isDirectory()) {
        entries.push({ path: relativePath, type: "directory" });
      } else if (itemStat.isFile()) {
        const buf = await readFile(absolutePath);
        const content = buf.toString(ENCODING_STANDARD);

        entries.push({
          path: relativePath,
          type: "file",
          size: itemStat.size,
          content,
        });
      }
    }
  } catch {
    throw new Error(ERROR_TEXT);
  }

  const snapshotData = { rootPath: workspacePath.replaceAll("\\", "/"), entries };
  const outputPath = join(dirname(workspacePath), SNAPSHOT_FILE_NAME);

  try {
    await writeFile(outputPath, JSON.stringify(snapshotData, null, 2), "utf8");
  } catch {
    throw new Error(ERROR_TEXT);
  }

  return snapshotData;
};

await snapshot();