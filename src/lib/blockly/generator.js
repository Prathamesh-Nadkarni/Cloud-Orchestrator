/**
 * Terraform HCL Code Generator
 * 
 * Generates valid Terraform HCL code from Blockly blocks.
 * Supports:
 * - Multi-cloud resources (AWS, Azure, GCP)
 * - Proper handling of references (var., aws_, azurerm_, google_, data., local., module.)
 * - List fields with automatic bracket wrapping
 * - Type-aware value formatting (strings, numbers, booleans, null)
 */

import * as Blockly from 'blockly';

export const hclGenerator = new Blockly.Generator('HCL');

// --- Top Level Blocks ---
hclGenerator.forBlock['terraform_resource'] = function(block, generator) {
  const type = block.getFieldValue('TYPE');
  const name = block.getFieldValue('NAME');
  const attributes = generator.statementToCode(block, 'ATTRIBUTES');
  return `resource "${type}" "${name}" {\n${attributes}}\n\n`;
};

hclGenerator.forBlock['terraform_data'] = function(block, generator) {
  const type = block.getFieldValue('TYPE');
  const name = block.getFieldValue('NAME');
  const attributes = generator.statementToCode(block, 'ATTRIBUTES');
  return `data "${type}" "${name}" {\n${attributes}}\n\n`;
};

hclGenerator.forBlock['terraform_provider'] = function(block, generator) {
  const name = block.getFieldValue('NAME');
  const attributes = generator.statementToCode(block, 'ATTRIBUTES');
  return `provider "${name}" {\n${attributes}}\n\n`;
};

hclGenerator.forBlock['terraform_output'] = function(block, generator) {
  const name = block.getFieldValue('NAME');
  const attributes = generator.statementToCode(block, 'ATTRIBUTES');
  return `output "${name}" {\n${attributes}}\n\n`;
};

hclGenerator.forBlock['terraform_variable'] = function(block, generator) {
  const name = block.getFieldValue('NAME');
  const attributes = generator.statementToCode(block, 'ATTRIBUTES');
  return `variable "${name}" {\n${attributes}}\n\n`;
};

hclGenerator.forBlock['terraform_locals'] = function(block, generator) {
  const attributes = generator.statementToCode(block, 'ATTRIBUTES');
  // Locals block contains attribute blocks, each becoming a local value
  // Format: locals { key = value }
  if (attributes.trim()) {
    return `locals {\n${attributes}}\n\n`;
  } else {
    // Empty locals block
    return `locals {\n}\n\n`;
  }
};

hclGenerator.forBlock['terraform_module'] = function(block, generator) {
  const name = block.getFieldValue('NAME');
  const attributes = generator.statementToCode(block, 'ATTRIBUTES');
  return `module "${name}" {\n${attributes}}\n\n`;
};

// --- Sub Blocks ---
hclGenerator.forBlock['terraform_nested_block'] = function(block, generator) {
  const name = block.getFieldValue('NAME');
  const attributes = generator.statementToCode(block, 'ATTRIBUTES');
  return `  ${name} {\n${attributes}  }\n`;
};

hclGenerator.forBlock['terraform_attribute'] = function(block) {
  const key = block.getFieldValue('KEY');
  if (!key || !key.trim()) {
    return ''; // Skip empty attributes
  }
  
  let value = block.getFieldValue('VALUE');
  if (value === undefined || value === null) {
    value = '';
  }

  // 0. Strip quotes from values that might have been quoted by the parser
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  // 1. Detect if this should be a reference (supports AWS, Azure, GCP, and Terraform built-ins)
  const isReference = /^(var\.|aws_|azurerm_|google_|data\.|local\.|module\.|path\.|self\.|count\.|each\.)/.test(value);
  
  // 2. Detect if this is a List field (multi-cloud support)
  // This is a heuristic to wrap things like ["0.0.0.0/0"] correctly
  const isListField = /(_blocks|_ids|_list|groups|prefixes|ranges|tags|accounts|networks|zones|subnets|addresses)$/i.test(key) ||
                      /^(allowed|denied|source|target|address)/i.test(key);

  let formattedValue = value;

  // Quote logic (but skip for list fields, references, numbers, and booleans)
  // Also handle null values properly
  const isNumber = !isNaN(value) && value !== "" && !isNaN(parseFloat(value)) && isFinite(value);
  const isBoolean = value === "true" || value === "false";
  const isNull = value === "null" || value === "~";
  
  if (!isListField && !isReference && !isNumber && !isBoolean && !isNull) {
    formattedValue = `"${value}"`;
  }

  // List Logic: If it's a list field but doesn't have brackets, add them
  if (isListField && !value.startsWith('[')) {
    // For list fields, we need to wrap in brackets
    // If it's not a reference, quote the inner value
    if (!isReference && !formattedValue.startsWith('"') && !isNumber && !isBoolean) {
      formattedValue = `"${formattedValue}"`;
    }
    formattedValue = `[${formattedValue}]`;
  }

  // Handle empty values
  if (value === '' || value === null || value === undefined) {
    formattedValue = '""';
  }

  return `  ${key} = ${formattedValue}\n`;
};

hclGenerator.scrub_ = function(block, code, opt_thisOnly) {
  const nextBlock = block.getNextBlock();
  const nextCode = opt_thisOnly ? '' : hclGenerator.blockToCode(nextBlock);
  return code + nextCode;
};