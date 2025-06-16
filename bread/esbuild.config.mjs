import { build, context } from 'esbuild';
import { promises as fs } from 'fs';
import path from 'path';

// Plugin to resolve extensionless relative imports to .ts or .tsx
const resolveExtensionPlugin = {
  name: 'resolve-extension',
  setup(build) {
    build.onResolve({ filter: /^[.][./\w-]*$/ }, async (args) => {
      // Only handle imports without an extension
      if (path.extname(args.path)) return;

      const tsPath = path.join(args.resolveDir, args.path + '.ts');
      const tsxPath = path.join(args.resolveDir, args.path + '.tsx');

      try {
        await fs.access(tsPath);
        return { path: tsPath };
      } catch {}

      try {
        await fs.access(tsxPath);
        return { path: tsxPath };
      } catch {}

      return; // Let esbuild handle as usual if not found
    });
  },
};

async function run() {
  const ctx = await context({
    entryPoints: ['./App.tsx', './styles/globals.css'],
    bundle: true,
    minify: false,
    sourcemap: 'both',
    format: 'esm',
    platform: 'browser',
    jsx: 'automatic',
    outdir: 'dist',
    plugins: [resolveExtensionPlugin],
    logLevel: 'info',
    loader: { '.css': 'css' },
  });

  await ctx.watch();
  console.log('esbuild is watching for changes...');
}

run().catch(() => process.exit(1)); 