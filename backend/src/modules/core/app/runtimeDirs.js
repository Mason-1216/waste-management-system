import fs from 'fs';

export const ensureDir = (dirPath) => {
  if (fs.existsSync(dirPath)) {
    return;
  }
  fs.mkdirSync(dirPath, { recursive: true });
};
