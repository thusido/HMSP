// Reproduces icon placement from the user-provided source dir (HMSP_user_icon).
// Exact files are copied; derived PNGs are resized with macOS `sips` (falls back to a warning elsewhere).
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'HMSP_user_icon');

function copy(from, to) {
  if (!existsSync(from)) {
    console.warn(`skip (missing): ${from}`);
    return false;
  }
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  console.log(`copied: ${from} -> ${to}`);
  return true;
}

function resize(from, size, to) {
  if (!existsSync(from)) {
    console.warn(`skip (missing): ${from}`);
    return false;
  }
  try {
    mkdirSync(dirname(to), { recursive: true });
    execFileSync('sips', ['-z', String(size), String(size), from, '--out', to], { stdio: 'ignore' });
    console.log(`resized ${size}x${size}: ${to}`);
    return true;
  } catch {
    console.warn(`skip (sips unavailable, macOS only): ${to}`);
    return false;
  }
}

const Fav = join(src, 'Web_Favicon');
const Master = join(src, '원본', 'HMSP.png');

let n = 0;
n += copy(join(src, 'icns', 'HMSP.icns'), join(root, 'src-tauri/icons/icon.icns')) ? 1 : 0;
n += copy(join(src, 'ico', 'HMSP.ico'), join(root, 'src-tauri/icons/icon.ico')) ? 1 : 0;
n += copy(Master, join(root, 'src-tauri/icons/icon.png')) ? 1 : 0;
n += resize(Master, 32, join(root, 'src-tauri/icons/32x32.png')) ? 1 : 0;
n += copy(join(Fav, 'HMSP-16x16.png'), join(root, 'public/icons/16x16.png')) ? 1 : 0;
n += copy(join(Fav, 'HMSP-32x32.png'), join(root, 'public/icons/32x32.png')) ? 1 : 0;
n += resize(Master, 180, join(root, 'public/icons/180x180.png')) ? 1 : 0;
n += resize(Master, 192, join(root, 'public/icons/192x192.png')) ? 1 : 0;
n += resize(Master, 512, join(root, 'public/icons/512x512.png')) ? 1 : 0;
console.log(n === 0 ? 'No icons copied.' : `Done (${n} files).`);
