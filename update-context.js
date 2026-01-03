#!/usr/bin/env node

/**
 * Auto-update CONTEXT.md
 * - refresh last-updated date
 * - regenerate the full interface list section
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = __dirname;
const ROUTES_FILE = path.join(PROJECT_ROOT, 'backend/src/routes/index.js');
const MODELS_DIR = path.join(PROJECT_ROOT, 'backend/src/models');
const CONTEXT_FILE = path.join(PROJECT_ROOT, 'CONTEXT.md');

function extractRoutes() {
  if (!fs.existsSync(ROUTES_FILE)) {
    console.warn(`Routes file not found: ${ROUTES_FILE}`);
    return [];
  }

  const content = fs.readFileSync(ROUTES_FILE, 'utf-8');
  const routes = [];
  const routeRegex = /router\.(get|post|put|delete|patch)\s*\(\s*['"`"]([^'"`"]+)['"`"]?/gi;
  let match;

  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    let routePath = match[2];

    if (!routePath.startsWith('/api')) {
      routePath = '/api' + routePath;
    }

    routes.push({ method, path: routePath });
  }

  return Array.from(
    new Map(routes.map(r => [`${r.method} ${r.path}`, r])).values()
  ).sort((a, b) => {
    if (a.path !== b.path) return a.path.localeCompare(b.path);
    return a.method.localeCompare(b.method);
  });
}

function extractModels() {
  if (!fs.existsSync(MODELS_DIR)) return [];
  const models = [];
  const files = fs.readdirSync(MODELS_DIR);

  for (const file of files) {
    if (file === 'index.js' || !file.endsWith('.js')) continue;
    const filePath = path.join(MODELS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    let tableName = null;
    const tableNameMatch = content.match(/tableName:\s*['"`"]([^'"`"]+)['"`"]?/);
    if (tableNameMatch) {
      tableName = tableNameMatch[1];
    } else {
      const modelName = file.replace('.js', '');
      tableName = modelName
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .replace(/^_/, '');
    }

    const modelName = file.replace('.js', '');
    models.push({ name: modelName, table: tableName });
  }

  return models.sort((a, b) => a.name.localeCompare(b.name));
}

function updateContext(routes) {
  if (!fs.existsSync(CONTEXT_FILE)) {
    console.error(`CONTEXT.md not found: ${CONTEXT_FILE}`);
    return;
  }

  let content = fs.readFileSync(CONTEXT_FILE, 'utf-8');
  const today = new Date().toISOString().split('T')[0];
  const dateRegex = /> 最后更新 \d{4}-\d{2}-\d{2}/;

  if (dateRegex.test(content)) {
    content = content.replace(dateRegex, `> 最后更新 ${today}`);
  } else {
    content = content.replace(
      /^# .*上下文摘要/m,
      match => `${match}\n> 最后更新 ${today}`
    );
  }

  const interfaceHeader = '## 接口清单（全量，自动提取）';
  const interfaceStart = content.indexOf(interfaceHeader);
  if (interfaceStart !== -1) {
    const nextSectionStart = content.indexOf('##', interfaceStart + 1);
    const sectionEnd = nextSectionStart !== -1 ? nextSectionStart : content.length;
    const newInterfaceList = `${interfaceHeader}\n${routes
      .map(r => `- ${r.method} ${r.path}`)
      .join('\n')}\n`;
    const before = content.substring(0, interfaceStart);
    const after = content.substring(sectionEnd);
    content = before + newInterfaceList + '\n' + after;
  }

  fs.writeFileSync(CONTEXT_FILE, content, 'utf-8');
}

function main() {
  console.log('Updating CONTEXT.md...');
  const routes = extractRoutes();
  extractModels();
  updateContext(routes);
  console.log(`Done. Routes: ${routes.length}`);
}

main();
