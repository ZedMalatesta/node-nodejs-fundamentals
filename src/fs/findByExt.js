import { readdir, access } from "fs/promises";
import { join, relative, extname, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { ERROR_TEXT, WORKSPACE_DIR_NAME } from '../consts/consts.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const findByExt = async () => {
  const args = process.argv.slice(2);
  const extIndex = args.indexOf("--ext");
  const rawExt = extIndex !== -1 ? args[extIndex + 1] : "txt";
  const ext = rawExt.startsWith(".") ? rawExt : `.${rawExt}`;

  const workspacePath = resolve(__dirname, `../../${WORKSPACE_DIR_NAME}`);

  try {
    await access(workspacePath);
  } catch {
    throw new Error(ERROR_TEXT);
  }

  try {
    const items = await readdir(workspacePath, {
      recursive: true,
      withFileTypes: true,
    });

    const results = items
      .filter((item) => item.isFile() && extname(item.name) === ext)
      .map((item) => relative(workspacePath, join(item.parentPath, item.name)).replaceAll("\\", "/"))
      .sort();

    console.log(results.join("\n"));
  } catch {
    throw new Error(ERROR_TEXT);
  }
};

await findByExt();