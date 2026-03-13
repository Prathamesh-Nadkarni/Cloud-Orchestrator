/**
 * Terraform Infrastructure Diagram Generator
 * Generates Mermaid diagrams from Terraform HCL code
 */

// @ts-ignore
import HCL from 'js-hcl-parser';
import { getResourceColor, getResourceCategory, getVendorFromResourceType, ALLOWED_VENDORS, RESOURCE_CATEGORIES } from './resource-schema.js';

/**
 * Extract resource references from a value
 */
function extractReferences(value: any) {
  const refs: any[] = [];
  if (typeof value === 'string') {
    // Match patterns like aws_security_group.instance.id, azurerm_virtual_network.main.id, etc.
    // This captures the full resource type (e.g., aws_security_group) and the resource name (e.g., instance)
    const refPattern = /((?:aws_|azurerm_|google_|aviatrix_)[a-z0-9_]+)\.([a-z0-9_]+)(?:\.[a-z0-9_]+)*/g;
    let match;
    while ((match = refPattern.exec(value)) !== null) {
      const resourceType = match[1]; // Full type like aws_security_group
      const resourceName = match[2]; // Resource name like instance
      refs.push({ type: resourceType, name: resourceName });
    }
  }
  return refs;
}

/**
 * Recursively extract all resource references from an object
 */
function extractAllReferences(obj: any, refs: any[] = []) {
  if (typeof obj === 'string') {
    refs.push(...extractReferences(obj));
  } else if (Array.isArray(obj)) {
    obj.forEach(item => extractAllReferences(item, refs));
  } else if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach(key => extractAllReferences(obj[key], refs));
  }
  return refs;
}

/**
 * Get provider color based on resource type (vendor color)
 */
function getProviderColor(resourceType: string) {
  const vendor = getVendorFromResourceType(resourceType);
  if (vendor && ALLOWED_VENDORS[vendor as keyof typeof ALLOWED_VENDORS]) {
    return ALLOWED_VENDORS[vendor as keyof typeof ALLOWED_VENDORS].color;
  }
  return '#666666';
}

/**
 * Get provider name from resource type
 */
function getProviderName(resourceType: string) {
  const vendor = getVendorFromResourceType(resourceType);
  if (vendor && ALLOWED_VENDORS[vendor as keyof typeof ALLOWED_VENDORS]) {
    return ALLOWED_VENDORS[vendor as keyof typeof ALLOWED_VENDORS].name;
  }
  return 'Other';
}

/**
 * Generate Mermaid diagram from Terraform JSON
 */
export function generateDiagram(hclString: any) {
  try {
    // Try to parse the HCL
    const cleaned = hclString.trim();
    if (!cleaned) {
      return { valid: false, error: 'Empty Terraform code' };
    }

    // Use a simplified parser approach - extract resources using regex
    // This is more forgiving than full HCL parsing
    const resources: any[] = [];
    const relationships: any[] = [];

    // Extract resource blocks using regex with brace counting for nested blocks
    const resourcePattern = /resource\s+"([^"]+)"\s+"([^"]+)"\s*\{/g;
    let match;
    const resourceMatches = [];

    // First pass: find all resource declarations
    while ((match = resourcePattern.exec(hclString)) !== null) {
      const startPos = match.index;
      const resourceType = match[1];
      const resourceName = match[2];
      const braceStart = hclString.indexOf('{', match.index + match[0].length);

      // Count braces to find the matching closing brace
      let braceCount = 1;
      let endPos = braceStart + 1;
      while (braceCount > 0 && endPos < hclString.length) {
        if (hclString[endPos] === '{') braceCount++;
        if (hclString[endPos] === '}') braceCount--;
        if (braceCount > 0) endPos++;
      }

      const resourceBody = hclString.substring(braceStart + 1, endPos);

      resourceMatches.push({
        type: resourceType,
        name: resourceName,
        body: resourceBody,
        startPos,
        endPos
      });
    }

    // Process each resource - first collect all resources
    resourceMatches.forEach(resource => {
      const category = getResourceCategory(resource.type);
      const categoryColor = RESOURCE_CATEGORIES[category as keyof typeof RESOURCE_CATEGORIES]?.color || '#999999';

      resources.push({
        type: resource.type,
        name: resource.name,
        provider: getProviderName(resource.type),
        vendorColor: getProviderColor(resource.type),
        categoryColor: categoryColor,
        category: category,
        body: resource.body
      });
    });

    // Second pass: extract relationships
    resources.forEach(resource => {
      // Extract references from the resource body
      const refs = extractAllReferences(resource.body);
      refs.forEach(ref => {
        // Find the referenced resource - match by exact type and name
        const referencedResource = resources.find(r =>
          r.type === ref.type && r.name === ref.name
        );

        if (referencedResource && referencedResource !== resource) {
          // Avoid duplicate relationships
          const relExists = relationships.some(rel =>
            rel.from === `${resource.type}.${resource.name}` &&
            rel.to === `${referencedResource.type}.${referencedResource.name}`
          );

          if (!relExists) {
            relationships.push({
              from: `${resource.type}.${resource.name}`,
              to: `${referencedResource.type}.${referencedResource.name}`,
              label: 'uses'
            });
          }
        }
      });
    });

    if (resources.length === 0) {
      return { valid: true, diagram: null, message: 'No resources found in Terraform code' };
    }

    // Generate Mermaid diagram
    let mermaidCode = 'graph TB\n';

    // Group resources by provider
    const resourcesByProvider: Record<string, any[]> = {};
    resources.forEach(resource => {
      if (!resourcesByProvider[resource.provider]) {
        resourcesByProvider[resource.provider] = [];
      }
      resourcesByProvider[resource.provider].push(resource);
    });

    // Add subgraphs for each provider
    Object.keys(resourcesByProvider).forEach((provider, idx) => {
      const providerResources = resourcesByProvider[provider];
      const subgraphId = `subgraph${idx}`;
      const vendorType = getVendorFromResourceType(providerResources[0].type);
      const vendorConfig = vendorType ? ALLOWED_VENDORS[vendorType as keyof typeof ALLOWED_VENDORS] : null;
      const providerColor = vendorConfig ? vendorConfig.color : '#666666';

      mermaidCode += `    subgraph ${subgraphId}["${provider}"]\n`;
      mermaidCode += `        style ${subgraphId} fill:${providerColor}20,stroke:${providerColor},stroke-width:3px\n`;

      providerResources.forEach(resource => {
        const nodeId = `${resource.type.replace(/[^a-zA-Z0-9]/g, '_')}_${resource.name}`;
        const categoryName = RESOURCE_CATEGORIES[resource.category as keyof typeof RESOURCE_CATEGORIES]?.name || 'Other';
        const displayName = `${resource.type}<br/><b>${resource.name}</b><br/><small>${categoryName}</small>`;
        mermaidCode += `        ${nodeId}["${displayName}"]\n`;
        // Use category color for nodes, with vendor border
        mermaidCode += `        style ${nodeId} fill:${resource.categoryColor},stroke:${resource.vendorColor},stroke-width:3px,color:#fff\n`;
      });

      mermaidCode += `    end\n`;
    });

    // Add relationships
    relationships.forEach(rel => {
      const fromId = rel.from.replace(/[^a-zA-Z0-9]/g, '_');
      const toId = rel.to.replace(/[^a-zA-Z0-9]/g, '_');
      mermaidCode += `    ${fromId} -->|${rel.label}| ${toId}\n`;
    });

    return { valid: true, diagram: mermaidCode, resources: resources.length };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

/**
 * Clean HCL code for parsing (simplified version for validation)
 */
function cleanHCLForValidation(hclString: any) {
  let cleaned = hclString;

  // 1. Remove comments (but preserve structure)
  cleaned = cleaned.replace(/(^|\s)(#|\/\/).*$/gm, '$1');

  // 2. Fix HCL v2 bare keywords (type = string -> type = "string")
  // Handle: type = string, type    = string, type=string
  // Match type followed by optional whitespace, =, optional whitespace, then a word
  cleaned = cleaned.replace(/type\s*=\s*([a-z]+)(?=\s|$|})/gm, 'type = "$1"');

  // 3. Quote variable references that aren't already quoted
  // The parser needs var.region to be "var.region" in some contexts
  // But we need to be careful - only quote standalone var references, not ones already in quotes
  cleaned = cleaned.replace(/(=\s+)(var\.[a-zA-Z0-9_]+)(\s*$)/gm, '$1"$2"$3');

  // 4. Fix quoted var references (unquote them first, then re-quote if needed)
  cleaned = cleaned.replace(/"var"\s*\.\s*/g, 'var.');
  cleaned = cleaned.replace(/(=\s*)"var\.([^"]+)"/g, '$1"var.$2"');

  // 5. Fix quoted resource references (but not in strings)
  // Unquote them first
  cleaned = cleaned.replace(/(=\s*)"(aws_[^"]+)"/g, '$1"$2"');
  cleaned = cleaned.replace(/(=\s*)"(azurerm_[^"]+)"/g, '$1"$2"');
  cleaned = cleaned.replace(/(=\s*)"(google_[^"]+)"/g, '$1"$2"');
  cleaned = cleaned.replace(/(=\s*)"(aviatrix_[^"]+)"/g, '$1"$2"');

  // 6. Fix numeric values that might be quoted (but preserve in strings)
  cleaned = cleaned.replace(/(default|value|from_port|to_port|port)\s*=\s*"(\d+(?:\.\d+)?)"(?=\s|$|})/g, '$1 = $2');

  // 7. Fix boolean values
  cleaned = cleaned.replace(/(enabled|sensitive|required|nullable)\s*=\s*"(true|false)"(?=\s|$|})/g, '$1 = $2');

  // 8. Remove terraform {} block if present (it can cause parsing issues)
  const terraformBlockStart = cleaned.indexOf('terraform {');
  if (terraformBlockStart !== -1) {
    let braceCount = 0;
    let endPos = terraformBlockStart;
    for (let i = terraformBlockStart; i < cleaned.length; i++) {
      if (cleaned[i] === '{') braceCount++;
      if (cleaned[i] === '}') braceCount--;
      if (braceCount === 0 && i > terraformBlockStart) {
        endPos = i + 1;
        break;
      }
    }
    cleaned = cleaned.substring(0, terraformBlockStart) + cleaned.substring(endPos);
  }

  // 9. Handle empty provider blocks - ensure they have at least an empty features block or something
  cleaned = cleaned.replace(/provider\s+"[^"]+"\s*\{\s*\}/g, (match: string) => {
    // If it's azurerm, add features {}
    if (match.includes('azurerm')) {
      return match.replace(/\{\s*\}/, '{\n  features {}\n}');
    }
    // Otherwise just ensure it's not completely empty
    return match.replace(/\{\s*\}/, '{\n}');
  });

  return cleaned.trim();
}

/**
 * Validate Terraform code is compilable
 */
export function validateTerraform(hclString: any) {
  try {
    let cleaned = hclString.trim();
    if (!cleaned) {
      return { valid: false, error: 'Empty Terraform code' };
    }

    // Clean the HCL code before parsing
    cleaned = cleanHCLForValidation(cleaned);

    // Try to parse with HCL parser
    try {
      const result = HCL.parse(cleaned);
      if (result && result.startsWith && result.startsWith('unable to')) {
        // Parsing failed, but check if it's just a parser limitation
        // Many valid Terraform files can't be parsed by js-hcl-parser
        // So we'll do structural validation instead
        return validateStructure(cleaned, result);
      }
      // If we can parse it, it's valid
      return { valid: true };
    } catch (parseError: any) {
      // If parsing fails, do structural validation
      return validateStructure(cleaned, parseError.message);
    }
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

/**
 * Validate Terraform structure when parser fails
 * This is more lenient and checks for basic structural correctness
 */
function validateStructure(cleaned: any, parseError: any) {
  // Check for balanced braces
  const openBraces = (cleaned.match(/\{/g) || []).length;
  const closeBraces = (cleaned.match(/\}/g) || []).length;

  if (openBraces !== closeBraces) {
    return { valid: false, error: `Unbalanced braces: ${openBraces} open, ${closeBraces} close` };
  }

  // Check for balanced brackets
  const openBrackets = (cleaned.match(/\[/g) || []).length;
  const closeBrackets = (cleaned.match(/\]/g) || []).length;

  if (openBrackets !== closeBrackets) {
    return { valid: false, error: `Unbalanced brackets: ${openBrackets} open, ${closeBrackets} close` };
  }

  // Check for balanced parentheses
  const openParens = (cleaned.match(/\(/g) || []).length;
  const closeParens = (cleaned.match(/\)/g) || []).length;

  if (openParens !== closeParens) {
    return { valid: false, error: `Unbalanced parentheses: ${openParens} open, ${closeParens} close` };
  }

  // Check for basic Terraform structure
  const hasResources = /resource\s+"[^"]+"\s+"[^"]+"/.test(cleaned);
  const hasProviders = /provider\s+"[^"]+"/.test(cleaned);
  const hasVariables = /variable\s+"[^"]+"/.test(cleaned);
  const hasData = /data\s+"[^"]+"\s+"[^"]+"/.test(cleaned);

  if (!hasResources && !hasProviders && !hasVariables && !hasData) {
    return { valid: false, error: 'No Terraform resources, providers, variables, or data sources found' };
  }

  // Check for common syntax errors
  // Unclosed quotes
  const quoteCount = (cleaned.match(/"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    return { valid: false, error: 'Unclosed quotes detected' };
  }

  // If all structural checks pass, consider it valid
  // The parser might have limitations, but the structure looks good
  // Real validation will happen when Terraform runs
  return { valid: true, warning: 'Parser had issues but structure appears valid' };
}
