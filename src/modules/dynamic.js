import { dirname, join } from "path"
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dynamic = async () => {
  const pluginName = process.argv[2];

  if (!pluginName) {
    console.error("Plugin not found");
    process.exit(1);
  }

  const pluginPath = join(__dirname, "plugins", `${pluginName}.js`);
  const pluginUrl = pathToFileURL(pluginPath).href;

  try {
    const plugin = await import(pluginUrl);

    const run = plugin.run ?? plugin.default?.run;
    if (typeof run !== "function") {
      console.error("Plugin not found");
      process.exit(1);
    }

    console.log(run());
  } catch {
    console.error("Plugin not found");
    process.exit(1);
  }
};

await dynamic();