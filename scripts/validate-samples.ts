/**
 * Sample Validation Script
 * Validates all security sample architectures for correctness
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SAMPLES_DIR = './samples/security';

interface ValidationResult {
  file: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateSample(filePath: string): ValidationResult {
  const result: ValidationResult = {
    file: filePath,
    valid: true,
    errors: [],
    warnings: []
  };

  try {
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    // Validate structure
    if (!data.nodes || !Array.isArray(data.nodes)) {
      result.errors.push('Missing or invalid nodes array');
      result.valid = false;
    }

    if (!data.edges || !Array.isArray(data.edges)) {
      result.errors.push('Missing or invalid edges array');
      result.valid = false;
    }

    if (!result.valid) return result;

    // Validate nodes
    const nodeIds = new Set<string>();
    for (const node of data.nodes) {
      // Check required fields
      if (!node.id) {
        result.errors.push(`Node missing id: ${JSON.stringify(node)}`);
        result.valid = false;
      } else {
        if (nodeIds.has(node.id)) {
          result.errors.push(`Duplicate node id: ${node.id}`);
          result.valid = false;
        }
        nodeIds.add(node.id);
      }

      if (!node.type) {
        result.errors.push(`Node ${node.id} missing type`);
        result.valid = false;
      }

      if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
        result.errors.push(`Node ${node.id} has invalid position`);
        result.valid = false;
      }

      if (!node.data) {
        result.errors.push(`Node ${node.id} missing data`);
        result.valid = false;
      }

      // Validate vendor nodes
      if (node.type === 'vendor') {
        if (!node.data.vendor) {
          result.errors.push(`Vendor node ${node.id} missing vendor name`);
          result.valid = false;
        }

        if (!node.data.label) {
          result.errors.push(`Vendor node ${node.id} missing label`);
          result.valid = false;
        }

        if (!node.data.category) {
          result.warnings.push(`Vendor node ${node.id} missing category`);
        }

        if (!node.data.integrationMode) {
          result.warnings.push(`Vendor node ${node.id} missing integrationMode`);
        }

        // Check for cluster-level products
        const clusterLevelProducts = ['kubehound', 'defender for containers'];
        const isClusterLevel = clusterLevelProducts.some(p => 
          node.data.label?.toLowerCase().includes(p)
        );

        if (isClusterLevel) {
          // Should NOT have parentId (shouldn't be nested in a node)
          if (node.parentId) {
            result.warnings.push(
              `Cluster-level product ${node.data.label} should not be nested. It should analyze entire cluster.`
            );
          }

          // Should have cluster-level deployment type
          if (node.data.configuration?.deploymentType !== 'cluster-level' &&
              node.data.integrationMode !== 'cluster_analysis') {
            result.warnings.push(
              `Cluster-level product ${node.data.label} should have deploymentType: 'cluster-level' or integrationMode: 'cluster_analysis'`
            );
          }
        }
      }

      // Validate parent relationships
      if (node.parentId && !nodeIds.has(node.parentId)) {
        // Parent might be defined later, check at end
        result.warnings.push(`Node ${node.id} references parent ${node.parentId} which doesn't exist (yet)`);
      }
    }

    // Validate edges
    for (const edge of data.edges) {
      if (!edge.id) {
        result.errors.push('Edge missing id');
        result.valid = false;
      }

      if (!edge.source) {
        result.errors.push(`Edge ${edge.id} missing source`);
        result.valid = false;
      } else if (!nodeIds.has(edge.source)) {
        result.errors.push(`Edge ${edge.id} references non-existent source: ${edge.source}`);
        result.valid = false;
      }

      if (!edge.target) {
        result.errors.push(`Edge ${edge.id} missing target`);
        result.valid = false;
      } else if (!nodeIds.has(edge.target)) {
        result.errors.push(`Edge ${edge.id} references non-existent target: ${edge.target}`);
        result.valid = false;
      }
    }

    // Validate Aviatrix architecture if present
    const hasAviatrix = data.nodes.some((n: any) => n.data.provider === 'aviatrix');
    if (hasAviatrix) {
      const transitGateways = data.nodes.filter((n: any) => 
        n.data.provider === 'aviatrix' && n.data.type === 'transit'
      );
      const spokeGateways = data.nodes.filter((n: any) => 
        n.data.provider === 'aviatrix' && n.data.type === 'spoke'
      );

      if (transitGateways.length > 0 && spokeGateways.length === 0) {
        result.warnings.push('Has Aviatrix transit but no spoke gateways');
      }

      // Spoke gateways should be inside VPCs/VNets
      for (const spoke of spokeGateways) {
        if (!spoke.parentId) {
          result.warnings.push(`Spoke gateway ${spoke.id} should be nested inside a VPC/VNet`);
        }
      }
    }

  } catch (error: any) {
    result.errors.push(`Failed to parse JSON: ${error.message}`);
    result.valid = false;
  }

  return result;
}

// Run validation
console.log('🔍 Validating Security Samples...\n');

const samplesDir = SAMPLES_DIR;
let totalSamples = 0;
let validSamples = 0;
let totalErrors = 0;
let totalWarnings = 0;

try {
  const files = readdirSync(samplesDir).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    const filePath = join(samplesDir, file);
    const result = validateSample(filePath);
    
    totalSamples++;
    if (result.valid) validSamples++;
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;

    // Print results
    const status = result.valid ? '✅' : '❌';
    console.log(`${status} ${file}`);
    
    if (result.errors.length > 0) {
      console.log('  Errors:');
      result.errors.forEach(err => console.log(`    - ${err}`));
    }
    
    if (result.warnings.length > 0) {
      console.log('  Warnings:');
      result.warnings.forEach(warn => console.log(`    - ${warn}`));
    }
    
    console.log('');
  }

  // Summary
  console.log('═'.repeat(60));
  console.log(`📊 Validation Summary:`);
  console.log(`   Total Samples: ${totalSamples}`);
  console.log(`   Valid: ${validSamples} ✅`);
  console.log(`   Invalid: ${totalSamples - validSamples} ❌`);
  console.log(`   Total Errors: ${totalErrors}`);
  console.log(`   Total Warnings: ${totalWarnings}`);
  console.log('═'.repeat(60));

  if (validSamples === totalSamples && totalErrors === 0) {
    console.log('\n🎉 All samples are valid!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some samples have issues. Please review above.');
    process.exit(totalErrors > 0 ? 1 : 0);
  }

} catch (error: any) {
  console.error(`❌ Failed to read samples directory: ${error.message}`);
  process.exit(1);
}
