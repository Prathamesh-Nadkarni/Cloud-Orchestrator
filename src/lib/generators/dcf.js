// src/lib/generators/dcf.js
/**
 * Generates Aviatrix DCF (Distributed Cloud Firewall) Terraform Code
 * from the canonical ImportedDCF model.
 */

export function generateDCF(dcf) {
    if (!dcf || (!dcf.smartGroups?.length && !dcf.policies?.length && !dcf.normalizedRules?.length)) {
        return "";
    }

    let code = `\n# --- Aviatrix Distributed Cloud Firewall (DCF) ---\n\n`;

    // 1. Generate Smart Groups
    if (dcf.smartGroups) {
        dcf.smartGroups.forEach(sg => {
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
                        exprCode += `      name = "${expr.value}"\n`;
                    }
                    exprCode += `    }\n  }\n`;
                    return exprCode;
                }).join("");
            } else {
                matchExpressions = `  selector {\n    match_expressions {\n      type = "vm_name"\n      name = "*"\n    }\n  }\n`;
            }

            code += `resource "aviatrix_smart_group" "${sg.name.replace(/[^a-zA-Z0-9_-]/g, '_')}" {\n`;
            code += `  name = "${sg.name}"\n`;
            code += matchExpressions;
            code += `}\n\n`;
        });
    }

    // 2. Generate Policy List (supporting legacy and normalized formats)
    const policiesToGenerate = dcf.normalizedRules
        ? dcf.normalizedRules.map(r => ({
            name: r.name,
            action: r.action,
            priority: r.priority,
            protocol: r.protocol,
            port: r.ports?.[0] || "ANY",
            srcSmartGroups: r.srcMatch?.values || [],
            dstSmartGroups: r.dstMatch?.values || [],
            logging: true
        }))
        : (dcf.policies || []);

    if (policiesToGenerate.length > 0) {
        code += `resource "aviatrix_distributed_firewalling_policy_list" "main_dcf_policies" {\n`;

        policiesToGenerate.forEach((policy, index) => {
            const action = policy.action.toUpperCase();
            const protocol = policy.protocol.toUpperCase();
            const port = policy.port || "ANY";

            const formatRef = (id) => {
                const sg = dcf.smartGroups?.find(g => g.uuid === id || g.name === id);
                return sg ? `aviatrix_smart_group.${sg.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.uuid` : `"${id}"`;
            };

            const srcGroups = policy.srcSmartGroups?.map(formatRef).join(', ') || "";
            const dstGroups = policy.dstSmartGroups?.map(formatRef).join(', ') || "";

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
