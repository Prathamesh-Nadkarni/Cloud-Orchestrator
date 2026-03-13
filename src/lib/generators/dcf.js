// src/lib/generators/dcf.js
/**
 * Generates Aviatrix DCF (Distributed Cloud Firewall) Terraform Code
 * from the canonical ImportedDCF model.
 */

export function generateDCF(dcf) {
    if (!dcf || (!dcf.smartGroups.length && !dcf.policies.length)) {
        return "";
    }

    let code = `\n# --- Aviatrix Distributed Cloud Firewall (DCF) ---\n\n`;

    // 1. Generate Smart Groups
    dcf.smartGroups.forEach(sg => {
        // Build the selector expression
        // Format: match_expressions { type = "..." etc }
        let matchExpressions = "";

        if (sg.matchExpressions && sg.matchExpressions.length > 0) {
            matchExpressions = sg.matchExpressions.map(expr => {
                let exprCode = `  selector {\n    match_expressions {\n`;
                exprCode += `      type = "${expr.type === 'tag' ? 'vm_tags' : expr.type === 'region' ? 'region' : 'vm_name'}"\n`;

                if (expr.type === 'tag' && expr.key) {
                    exprCode += `      tags = {\n        "${expr.key}" = "${expr.value}"\n      }\n`;
                } else if (expr.type === 'region') {
                    exprCode += `      region = "${expr.value}"\n`;
                } else {
                    // name match
                    exprCode += `      name = "${expr.value}"\n`;
                }

                exprCode += `    }\n  }\n`;
                return exprCode;
            }).join("");
        } else {
            // Default catch-all if no expressions (invalid for Aviatrix normally, but we put a placeholder)
            matchExpressions = `  selector {\n    match_expressions {\n      type = "vm_name"\n      name = "*"\n    }\n  }\n`;
        }

        code += `resource "aviatrix_smart_group" "${sg.name.replace(/[^a-zA-Z0-9_-]/g, '_')}" {\n`;
        code += `  name = "${sg.name}"\n`;
        code += matchExpressions;
        code += `}\n\n`;
    });

    // 2. Generate Policy List
    if (dcf.policies.length > 0) {
        code += `resource "aviatrix_distributed_firewalling_policy_list" "main_dcf_policies" {\n`;

        dcf.policies.forEach((policy, index) => {
            const safeName = policy.name.replace(/[^a-zA-Z0-9_-]/g, '_');
            const action = policy.action.toUpperCase(); // ALLOW or DENY
            const protocol = policy.protocol.toUpperCase(); // TCP, UDP, ICMP, ANY
            const port = policy.port || "ANY";

            // Map our UUID/names to the actual terraform references
            // Actually, in our simple JSON we use UUIDs or string names.
            // If the SmartGroup was created above, we can reference it.
            // Since we use names as identifiers in our simplified model:
            const srcGroups = policy.srcSmartGroups.map(id => {
                const sg = dcf.smartGroups.find(g => g.uuid === id);
                return sg ? `aviatrix_smart_group.${sg.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.uuid` : `"${id}"`;
            }).join(', ');

            const dstGroups = policy.dstSmartGroups.map(id => {
                const sg = dcf.smartGroups.find(g => g.uuid === id);
                return sg ? `aviatrix_smart_group.${sg.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.uuid` : `"${id}"`;
            }).join(', ');

            code += `  policies {\n`;
            code += `    name     = "${policy.name}"\n`;
            code += `    action   = "${action}"\n`;
            code += `    priority = ${policy.priority || (index + 1) * 100}\n`;
            code += `    protocol = "${protocol}"\n`;

            if (port !== "ANY") {
                code += `    port_ranges {\n`;
                code += `      lo = ${port}\n`;
                code += `      hi = ${port}\n`;
                code += `    }\n`;
            }

            // Using interpolation trick since we're building a string that might contain references
            code += `    src_smart_groups = [${srcGroups}]\n`;
            code += `    dst_smart_groups = [${dstGroups}]\n`;

            if (policy.logging) {
                code += `    logging = true\n`;
            }
            code += `  }\n\n`;
        });

        code += `}\n\n`;
    }

    return code;
}
