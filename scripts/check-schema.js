// Checks section schemas for errors Shopify rejects on save ("FileSaveError:
// Invalid schema") that `shopify theme check` does not report. A rejected file
// is skipped by the GitHub sync, so the store silently keeps the old version.
//
// Usage: npm run check:schema

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const errors = [];
const schemas = {};

const fail = (file, message) => errors.push(`${file}: ${message}`);

// Sections placed in a section group (sections/*-group.json: header, footer).
// Shopify rejects a second link_list or page setting in their settings lists;
// other sections with two page settings save fine.
const groupSections = new Set();
for (const name of fs.readdirSync(path.join(root, 'sections')).filter((name) => name.endsWith('-group.json'))) {
  try {
    const group = JSON.parse(fs.readFileSync(path.join(root, 'sections', name), 'utf8').replace(/^\s*\/\*[\s\S]*?\*\//, ''));
    for (const section of Object.values(group.sections || {})) groupSections.add(`sections/${section.type}.liquid`);
  } catch {
    // Reported with the other JSON files below.
  }
}

// Shopify enforces these per settings list: the section's own, and each block's.
function checkSettings(file, settings = [], where) {
  const ids = new Set();
  const onlyOnce = {};

  for (const setting of settings) {
    const label = `${where} setting "${setting.id || setting.type}"`;

    if (setting.id) {
      if (ids.has(setting.id)) fail(file, `${label}: duplicate id`);
      ids.add(setting.id);
    }

    // Shopify: "setting <type> type can only be inserted once in the settings".
    // link_list: every section. page: sections in a header or footer group.
    const limited = setting.type === 'link_list' || (setting.type === 'page' && groupSections.has(file));
    if (limited && (onlyOnce[setting.type] = (onlyOnce[setting.type] || 0) + 1) === 2) {
      fail(file, `${where}: setting ${setting.type} type can only be inserted once in the settings (move the extra one into a block, or find the page by handle)`);
    }

    if ((setting.type === 'select' || setting.type === 'radio') && 'default' in setting) {
      const values = (setting.options || []).map((option) => option.value);
      if (!values.includes(setting.default)) fail(file, `${label}: default "${setting.default}" is not one of its options`);
    }

    // Shopify rejects the whole section file when an option label is over 50 characters
    // (translation keys like "t:sections…" are resolved first, so only check plain text).
    for (const option of setting.options || []) {
      if (typeof option.label === 'string' && !option.label.startsWith('t:') && option.label.length > 50) {
        fail(file, `${label}: option label "${option.label}" is ${option.label.length} characters (Shopify allows at most 50)`);
      }
    }

    if (typeof setting.unit === 'string' && setting.unit.length > 3) {
      fail(file, `${label}: unit is too long (Shopify allows at most 3 characters)`);
    }

    if (setting.type === 'range') {
      const { min, max, step = 1, default: value } = setting;
      const steps = (max - min) / step;
      if (steps > 101) fail(file, `${label}: ${Math.round(steps)} steps, Shopify allows at most 101`);
      // Shopify's "at least 3 steps" counts the values on the slider: 2–4 by 1 passes, 1–2 by 1 fails.
      if (steps + 1 < 3) fail(file, `${label}: only ${Math.round(steps + 1)} values, Shopify needs at least 3 (use a select for so few values)`);
      if (value === undefined) fail(file, `${label}: range needs a default`);
      else if (value < min || value > max) fail(file, `${label}: default ${value} is outside ${min}–${max}`);
      else if (Math.abs((value - min) / step - Math.round((value - min) / step)) > 1e-9) {
        fail(file, `${label}: default ${value} is not on a ${step} step from ${min}`);
      }
    }
  }
}

for (const dir of ['sections', 'blocks']) {
  const folder = path.join(root, dir);
  if (!fs.existsSync(folder)) continue;

  for (const name of fs.readdirSync(folder).filter((name) => name.endsWith('.liquid'))) {
    const file = `${dir}/${name}`;
    const match = fs.readFileSync(path.join(folder, name), 'utf8').match(/{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/);
    if (!match) continue;

    let schema;
    try {
      schema = JSON.parse(match[1]);
    } catch (error) {
      fail(file, `schema is not valid JSON (${error.message})`);
      continue;
    }
    if (dir === 'sections') schemas[name.replace(/\.liquid$/, '')] = schema;

    checkSettings(file, schema.settings, 'section');

    const types = new Set();
    for (const block of schema.blocks || []) {
      if (types.has(block.type)) fail(file, `block type "${block.type}" is defined twice`);
      types.add(block.type);
      if (block.type.startsWith('@')) continue;
      if (!block.name) fail(file, `block "${block.type}" needs a name`);
      checkSettings(file, block.settings, `block "${block.type}"`);
    }
  }
}

// Saved values must suit their setting: Shopify rejects `"desktop_font_weight": "900"`
// with "Setting 'desktop_font_weight' must be a valid number".
function checkValues(file, values = {}, settings = [], where) {
  for (const setting of settings || []) {
    if (!(setting.id in (values || {}))) continue;
    const value = values[setting.id];
    const label = `${where} setting "${setting.id}"`;
    if (setting.type === 'range' || setting.type === 'number') {
      if (typeof value !== 'number') fail(file, `${label}: ${JSON.stringify(value)} must be a number, not a string`);
      else if (setting.type === 'range' && (value < setting.min || value > setting.max)) fail(file, `${label}: ${value} is outside ${setting.min}–${setting.max}`);
    }
    if ((setting.type === 'select' || setting.type === 'radio') && !(setting.options || []).some((option) => option.value === value)) {
      fail(file, `${label}: "${value}" is not one of its options`);
    }
  }
}

// Saved content (JSON templates and section groups) must only use blocks its section defines.
const jsonFiles = [
  ...fs.readdirSync(path.join(root, 'templates')).filter((name) => name.endsWith('.json')).map((name) => `templates/${name}`),
  ...fs.readdirSync(path.join(root, 'sections')).filter((name) => name.endsWith('.json')).map((name) => `sections/${name}`),
];

for (const file of jsonFiles) {
  let data;
  try {
    // Shopify writes a /* ... */ notice at the top of these files.
    data = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8').replace(/^\s*\/\*[\s\S]*?\*\//, ''));
  } catch (error) {
    fail(file, `not valid JSON (${error.message})`);
    continue;
  }

  for (const [id, section] of Object.entries(data.sections || {})) {
    const schema = schemas[section.type];
    if (!schema) continue; // App sections, or a section missing from this checkout.

    checkValues(file, section.settings, schema.settings, `section "${id}"`);

    const allowed = new Set((schema.blocks || []).map((block) => block.type));
    for (const [blockId, block] of Object.entries(section.blocks || {})) {
      if (block.type.startsWith('shopify://') || allowed.has('@theme')) continue;
      if (!allowed.has(block.type)) fail(file, `section "${id}" has block "${blockId}" of type "${block.type}", which ${section.type}.liquid does not define`);
      const blockSchema = (schema.blocks || []).find((definition) => definition.type === block.type);
      checkValues(file, block.settings, blockSchema && blockSchema.settings, `section "${id}" block "${blockId}"`);
    }
    for (const blockId of section.block_order || []) {
      if (!(section.blocks || {})[blockId]) fail(file, `section "${id}" lists block "${blockId}" in block_order but not in blocks`);
    }
  }
}

// Shopify's Liquid parser rejects a filter inside another filter's arguments, e.g.
// `image_tag: alt: x | default: y | escape, loading: 'lazy'` fails with "Expected
// end_of_string but found comma". Theme check misses it. Assign the value first and pass the variable.
function checkFilterArguments(file, source) {
  // Comments, raw blocks and schemas hold text, not Liquid to run.
  const code = source.replace(/{%-?\s*(comment|raw|schema|javascript)\s*-?%}[\s\S]*?{%-?\s*end\1\s*-?%}/g, (block) => block.replace(/[^\n]/g, ' '));
  const lineAt = (index) => code.slice(0, index).split('\n').length;
  const expressions = [];

  for (const match of code.matchAll(/{{-?([\s\S]*?)-?}}/g)) expressions.push([lineAt(match.index), match[1]]);
  for (const match of code.matchAll(/{%-?\s*(\w+)([\s\S]*?)-?%}/g)) {
    const [, tag, markup] = match;
    const lines = tag === 'liquid' ? markup.split('\n') : [`${tag}${markup}`];
    lines.forEach((line, offset) => {
      const statement = line.match(/^\s*(?:assign\s+[\w.]+\s*=|echo\b)([\s\S]*)$/);
      if (statement) expressions.push([lineAt(match.index) + offset, statement[1]]);
    });
  }

  for (const [line, expression] of expressions) {
    const filters = expression.replace(/'[^']*'|"[^"]*"/g, '""').split('|').slice(1);
    for (const filter of filters) {
      if (!/^\s*[\w-]+\s*(?::|$)/.test(filter)) {
        fail(file, `line ${line}: a filter inside another filter's arguments ("|${filter.replace(/\s+/g, ' ').trim().slice(0, 40)}"). Assign the value first and pass the variable.`);
        break;
      }
    }
  }
}

for (const dir of ['sections', 'blocks', 'snippets', 'layout', 'templates']) {
  const folder = path.join(root, dir);
  if (!fs.existsSync(folder)) continue;
  for (const name of fs.readdirSync(folder).filter((name) => name.endsWith('.liquid'))) {
    checkFilterArguments(`${dir}/${name}`, fs.readFileSync(path.join(folder, name), 'utf8'));
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`\n${errors.length} schema error(s). Shopify will reject these files on save.`);
  process.exit(1);
}

console.log(`Schemas OK (${Object.keys(schemas).length} sections, ${jsonFiles.length} JSON files).`);
