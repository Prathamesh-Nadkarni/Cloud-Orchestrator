<script lang="ts">
    import { onMount } from "svelte";
    export let data; // User data injected via layout server load

    let tenantId = "00000000-0000-0000-0000-000000000001"; // Mock dev tenant UUID

    let connections: any[] = [];
    let errorMsg = "";
    let provider = "AWS";
    let displayName = "";
    let plaintextSecret = ""; // Required, but will never be saved plaintext by the backend

    async function createConnection() {
        errorMsg = "";
        const res = await fetch("/api/connections", {
            method: "POST",
            body: JSON.stringify({
                tenantId,
                provider,
                displayName,
                connectionMode: "SEALED_SECRET",
                bootstrapMode: "MANUAL",
                allowedActionScopes: ["ec2:*", "iam:*", "vpc:*"], // Scaffolded
                allowedRegions: ["us-east-1"], // Scaffolded
                allowedEnvironments: ["dev"], // Scaffolded
                plaintextSecret,
            }),
            headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
            displayName = "";
            plaintextSecret = "";
            await fetchConnections();
        } else {
            const result = await res.json();
            errorMsg = result.error || "Failed to create connection";
        }
    }

    async function fetchConnections() {
        // Scaffold UI logic, actual GET endpoint needs implementing
        connections = [
            {
                id: "123",
                provider: "AWS",
                displayName: "Dev Root",
                state: "SEALED",
                lastActivatedAt: "never",
            },
        ];
    }

    onMount(() => {
        fetchConnections();
    });
</script>

<div class="p-6 bg-gray-900 min-h-screen text-gray-200">
    <h1 class="text-2xl font-bold mb-6 border-b border-gray-700 pb-2">
        Cloud Connections
    </h1>

    {#if errorMsg}
        <div
            class="bg-red-900/50 text-red-200 border border-red-500 p-3 rounded mb-4"
        >
            {errorMsg}
        </div>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- ADD CONNECTION FORM -->
        <div class="bg-gray-800 p-6 rounded border border-gray-700">
            <h2 class="text-lg font-semibold mb-4">Add New Connection</h2>
            <form on:submit|preventDefault={createConnection} class="space-y-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-1"
                        >Provider</label
                    >
                    <select
                        bind:value={provider}
                        class="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:border-blue-500 outline-none"
                    >
                        <option value="AWS">AWS</option>
                        <option value="AZURE">Azure</option>
                        <option value="GCP">GCP</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm text-gray-400 mb-1"
                        >Display Name</label
                    >
                    <input
                        type="text"
                        bind:value={displayName}
                        class="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:border-blue-500 outline-none"
                        placeholder="e.g. Production AWS Account"
                        required
                    />
                </div>

                <div>
                    <label class="block text-sm text-gray-400 mb-1"
                        >Secret Access Key / Service Principal (Sealed
                        Intransit)</label
                    >
                    <input
                        type="password"
                        bind:value={plaintextSecret}
                        class="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:border-blue-500 outline-none"
                        placeholder="Sensitive access string..."
                        required
                    />
                    <p class="text-xs text-gray-500 mt-1">
                        Material never returned to UI, enveloped upon intake.
                    </p>
                </div>

                <button
                    type="submit"
                    class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-medium w-full"
                >
                    Seal & Store Connection
                </button>
            </form>
        </div>

        <!-- LIST CONNECTIONS -->
        <div class="bg-gray-800 p-6 rounded border border-gray-700">
            <h2 class="text-lg font-semibold mb-4">Active Connections</h2>
            {#if connections.length === 0}
                <p class="text-gray-400 text-sm">No connections found.</p>
            {:else}
                <ul class="space-y-3">
                    {#each connections as conn}
                        <li
                            class="p-3 bg-gray-900 rounded border border-gray-700 flex justify-between items-center"
                        >
                            <div>
                                <p class="font-medium">
                                    {conn.displayName}
                                    <span class="text-xs ml-2 text-blue-400"
                                        >{conn.provider}</span
                                    >
                                </p>
                                <p class="text-xs text-gray-500 mt-1">
                                    State: <span class="text-yellow-500"
                                        >{conn.state}</span
                                    >
                                </p>
                            </div>
                            <button
                                class="bg-indigo-600 hover:bg-indigo-700 text-xs px-3 py-1 rounded"
                                >Activate (Requires MFA)</button
                            >
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    </div>
</div>
