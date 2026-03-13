<script lang="ts">
    import {
        Shield,
        Plus,
        X,
        Server,
        Box,
        Search,
        Trash2,
        Cpu,
    } from "lucide-svelte";
    import type { SmartGroup, DCFPolicy } from "$lib/utils/securitySimulator";

    export let importedDCF: {
        smartGroups: SmartGroup[];
        policies: DCFPolicy[];
    } | null;
    export let onApplyDCF: (dcf: {
        smartGroups: SmartGroup[];
        policies: DCFPolicy[];
    }) => void;

    let smartGroups: SmartGroup[] = importedDCF
        ? [...importedDCF.smartGroups]
        : [];
    let policies: DCFPolicy[] = importedDCF ? [...importedDCF.policies] : [];

    let isBuilderOpen = false;

    // Smart Group Editor State
    let editingSgId: string | null = null;
    let sgForm = {
        name: "",
        resourceType: "virtual_machine",
        provider: "any",
        aiRole: "none",
        regions: "",
        tags: "",
        matchExpr: "",
    };

    function openNewSmartGroup() {
        editingSgId = crypto.randomUUID();
        sgForm = {
            name: "New Smart Group",
            resourceType: "virtual_machine",
            provider: "any",
            aiRole: "none",
            regions: "",
            tags: "",
            matchExpr: "",
        };
    }

    function saveSmartGroup() {
        const newSg: SmartGroup = {
            uuid: editingSgId!,
            name: sgForm.name,
            matchExpressions: [],
            // Adding canonical fields
            resourceType: sgForm.resourceType,
            provider: sgForm.provider === "any" ? undefined : sgForm.provider,
            aiRole:
                sgForm.aiRole === "none" ? undefined : (sgForm.aiRole as any),
        };

        if (sgForm.regions) {
            newSg.matchExpressions!.push({
                type: "region",
                operator: "EQUALS",
                value: sgForm.regions,
            });
        }
        if (sgForm.tags) {
            const [k, v] = sgForm.tags.split("=");
            if (k && v) {
                newSg.tags = { [k]: v };
            }
        }
        if (sgForm.matchExpr) {
            newSg.matchExpressions!.push({
                type: "name",
                operator: "CONTAINS",
                value: sgForm.matchExpr,
            });
        }

        const idx = smartGroups.findIndex((sg) => sg.uuid === editingSgId);
        if (idx >= 0) {
            smartGroups[idx] = newSg;
        } else {
            smartGroups = [...smartGroups, newSg];
        }
        editingSgId = null;
    }

    function deleteSmartGroup(uuid: string) {
        smartGroups = smartGroups.filter((sg) => sg.uuid !== uuid);
        policies = policies.filter(
            (p) =>
                !p.srcSmartGroups.includes(uuid) &&
                !p.dstSmartGroups.includes(uuid),
        );
    }

    // Policy Editor State
    let editingPolicyId: string | null = null;
    let policyForm = {
        name: "",
        action: "allow",
        src: "",
        dst: "",
        protocol: "any",
        port: "",
        priority: 100,
        logging: false,
    };

    function openNewPolicy() {
        editingPolicyId = crypto.randomUUID();
        policyForm = {
            name: "New DCF Rule",
            action: "allow",
            src: "",
            dst: "",
            protocol: "any",
            port: "",
            priority: 100,
            logging: true,
        };
    }

    function savePolicy() {
        const newPolicy: DCFPolicy = {
            uuid: editingPolicyId!,
            name: policyForm.name,
            action: policyForm.action.toUpperCase() as "ALLOW" | "DENY",
            srcSmartGroups: [policyForm.src],
            dstSmartGroups: [policyForm.dst],
            protocol: policyForm.protocol,
            port: policyForm.port ? policyForm.port : "any",
            priority: policyForm.priority,
            logging: policyForm.logging,
        };

        const idx = policies.findIndex((p) => p.uuid === editingPolicyId);
        if (idx >= 0) {
            policies[idx] = newPolicy;
        } else {
            policies = [...policies, newPolicy];
        }
        editingPolicyId = null;
    }

    function deletePolicy(uuid: string) {
        policies = policies.filter((p) => p.uuid !== uuid);
    }

    function applyChanges() {
        onApplyDCF({ smartGroups, policies });
        // isBuilderOpen = false;
    }
</script>

<div class="dcf-builder-panel glass-panel">
    <div class="panel-header">
        <Shield size={20} color="var(--accent-avx)" />
        <h3>DCF Policy Builder</h3>
        <button class="btn-apply" on:click={applyChanges}
            >Apply to Simulator</button
        >
    </div>

    <div class="panel-content">
        <div class="column">
            <div class="section-title">
                <h4>Smart Groups</h4>
                <button class="btn-icon" on:click={openNewSmartGroup}
                    ><Plus size={16} /></button
                >
            </div>

            {#if editingSgId}
                <div class="editor-card glass-panel">
                    <h5>
                        {smartGroups.find((s) => s.uuid === editingSgId)
                            ? "Edit"
                            : "New"} Smart Group
                    </h5>
                    <input
                        type="text"
                        bind:value={sgForm.name}
                        placeholder="Group Name e.g. prod-web-servers"
                    />

                    <select bind:value={sgForm.resourceType}>
                        <option value="virtual_machine">Virtual Machines</option
                        >
                        <option value="kubernetes_cluster"
                            >Kubernetes Clusters</option
                        >
                        <option value="database">Databases</option>
                        <option value="storage_bucket">Storage Buckets</option>
                    </select>

                    <select bind:value={sgForm.aiRole}>
                        <option value="none">No AI Role</option>
                        <option value="modelServing">Model Serving</option>
                        <option value="vectorDB">Vector DB</option>
                        <option value="trainingCluster">Training Cluster</option
                        >
                        <option value="aiGateway">AI Gateway</option>
                    </select>

                    <input
                        type="text"
                        bind:value={sgForm.regions}
                        placeholder="Region e.g. us-east-1"
                    />
                    <input
                        type="text"
                        bind:value={sgForm.tags}
                        placeholder="Tag e.g. env=prod"
                    />
                    <input
                        type="text"
                        bind:value={sgForm.matchExpr}
                        placeholder="Name Match e.g. *web*"
                    />

                    <div class="actions">
                        <button
                            class="btn-cancel"
                            on:click={() => (editingSgId = null)}>Cancel</button
                        >
                        <button class="btn-save" on:click={saveSmartGroup}
                            >Save</button
                        >
                    </div>
                </div>
            {/if}

            <div class="list">
                {#each smartGroups as sg}
                    <div class="list-item">
                        <div class="item-info">
                            <strong>{sg.name}</strong>
                            <small
                                >{sg.resourceType}
                                {sg.aiRole ? `(${sg.aiRole})` : ""}</small
                            >
                        </div>
                        <button
                            class="btn-icon delete"
                            on:click={() => deleteSmartGroup(sg.uuid)}
                            ><Trash2 size={14} /></button
                        >
                    </div>
                {/each}
            </div>
        </div>

        <div class="column">
            <div class="section-title">
                <h4>DCF Policies</h4>
                <button
                    class="btn-icon"
                    on:click={openNewPolicy}
                    disabled={smartGroups.length === 0}
                    ><Plus size={16} /></button
                >
            </div>

            {#if editingPolicyId}
                <div class="editor-card glass-panel">
                    <h5>
                        {policies.find((p) => p.uuid === editingPolicyId)
                            ? "Edit"
                            : "New"} Policy
                    </h5>
                    <input
                        type="text"
                        bind:value={policyForm.name}
                        placeholder="Rule Name"
                    />

                    <div class="row">
                        <select bind:value={policyForm.src}>
                            <option value="" disabled>Source Group</option>
                            {#each smartGroups as sg}
                                <option value={sg.uuid}>{sg.name}</option>
                            {/each}
                        </select>
                        <span>&rarr;</span>
                        <select bind:value={policyForm.dst}>
                            <option value="" disabled>Destination Group</option>
                            {#each smartGroups as sg}
                                <option value={sg.uuid}>{sg.name}</option>
                            {/each}
                        </select>
                    </div>

                    <div class="row">
                        <select bind:value={policyForm.protocol}>
                            <option value="any">ANY Protocol</option>
                            <option value="tcp">TCP</option>
                            <option value="udp">UDP</option>
                            <option value="icmp">ICMP</option>
                        </select>
                        <input
                            type="text"
                            bind:value={policyForm.port}
                            placeholder="Port (e.g. 443, 8080)"
                        />
                    </div>

                    <div class="row">
                        <select bind:value={policyForm.action}>
                            <option value="allow">ALLOW</option>
                            <option value="deny">DENY</option>
                        </select>
                        <label
                            ><input
                                type="checkbox"
                                bind:checked={policyForm.logging}
                            /> Log Traffic</label
                        >
                    </div>

                    <div class="actions">
                        <button
                            class="btn-cancel"
                            on:click={() => (editingPolicyId = null)}
                            >Cancel</button
                        >
                        <button
                            class="btn-save"
                            on:click={savePolicy}
                            disabled={!policyForm.src || !policyForm.dst}
                            >Save</button
                        >
                    </div>
                </div>
            {/if}

            <div class="list">
                {#each policies as p}
                    <div class="list-item">
                        <div class="item-info">
                            <strong>{p.name}</strong>
                            <small>
                                {smartGroups.find(
                                    (g) => g.uuid === p.srcSmartGroups[0],
                                )?.name}
                                &rarr;
                                {smartGroups.find(
                                    (g) => g.uuid === p.dstSmartGroups[0],
                                )?.name}
                                [{p.action.toUpperCase()}]
                            </small>
                        </div>
                        <button
                            class="btn-icon delete"
                            on:click={() => deletePolicy(p.uuid)}
                            ><Trash2 size={14} /></button
                        >
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>

<style>
    .dcf-builder-panel {
        background: var(--bg-panel);
        border-right: 1px solid var(--border-color);
        width: 350px;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
    }

    .panel-header {
        padding: 15px;
        display: flex;
        align-items: center;
        gap: 10px;
        border-bottom: 1px solid var(--border-color);
        background: var(--bg-panel-hover);
    }

    .panel-header h3 {
        margin: 0;
        flex: 1;
        font-size: 1.1rem;
        color: var(--text-main);
    }

    .btn-apply {
        background: var(--accent-avx);
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 0.8rem;
        cursor: pointer;
        font-weight: 500;
    }

    .panel-content {
        display: flex;
        flex-direction: column;
        padding: 15px;
        gap: 20px;
    }

    .column {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .section-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 5px;
    }

    .section-title h4 {
        margin: 0;
        color: var(--text-muted);
        font-size: 0.9rem;
    }

    .btn-icon {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
    }
    .btn-icon:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-main);
    }
    .btn-icon.delete:hover {
        color: #ef4444;
    }

    .editor-card {
        background: rgba(0, 0, 0, 0.2);
        padding: 12px;
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        border: 1px solid var(--accent-avx);
    }

    .editor-card h5 {
        margin: 0 0 5px 0;
        color: var(--accent-avx);
    }

    input[type="text"],
    select {
        background: #0d0d0d;
        border: 1px solid var(--border-color);
        color: var(--text-main);
        padding: 6px 8px;
        border-radius: 4px;
        font-size: 0.85rem;
        width: 100%;
    }

    .row {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 5px;
    }

    .btn-cancel,
    .btn-save {
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 0.8rem;
        cursor: pointer;
        border: none;
    }

    .btn-cancel {
        background: transparent;
        color: var(--text-muted);
    }

    .btn-cancel:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    .btn-save {
        background: #10b981;
        color: white;
    }
    .btn-save:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .list {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 10px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 4px;
        border-left: 3px solid var(--accent-primary);
    }

    .item-info {
        display: flex;
        flex-direction: column;
    }

    .item-info strong {
        font-size: 0.9rem;
        color: var(--text-main);
    }

    .item-info small {
        font-size: 0.75rem;
        color: var(--text-muted);
    }
</style>
