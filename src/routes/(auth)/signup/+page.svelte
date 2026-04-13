<script lang="ts">
    import { goto } from "$app/navigation";

    let name = "";
    let email = "";
    let password = ""; // Scaffolded
    let errorMsg = "";

    async function handleSignup() {
        errorMsg = "";
        const res = await fetch("/api/auth/signup", {
            method: "POST",
            body: JSON.stringify({ name, email, password }),
            headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
            goto("/"); // Return to the orchestrator view
        } else {
            const data = await res.json();
            errorMsg = data.error || "Signup failed";
        }
    }
</script>

<div class="min-h-screen bg-gray-900 flex items-center justify-center p-4">
    <div
        class="bg-gray-800 p-8 rounded-lg border border-gray-700 w-full max-w-md shadow-xl text-gray-100"
    >
        <h1 class="text-2xl font-bold mb-6">Create an Account</h1>

        {#if errorMsg}
            <div
                class="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4"
            >
                {errorMsg}
            </div>
        {/if}

        <form on:submit|preventDefault={handleSignup} class="space-y-4">
            <div>
                <label
                    class="block text-sm font-medium text-gray-400 mb-1"
                    for="name">Full Name</label
                >
                <input
                    id="name"
                    type="text"
                    bind:value={name}
                    class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    required
                />
            </div>
            <div>
                <label
                    class="block text-sm font-medium text-gray-400 mb-1"
                    for="email">Email address</label
                >
                <input
                    id="email"
                    type="email"
                    bind:value={email}
                    class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    required
                />
            </div>
            <div>
                <label
                    class="block text-sm font-medium text-gray-400 mb-1"
                    for="password">Password</label
                >
                <input
                    id="password"
                    type="password"
                    bind:value={password}
                    class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    required
                />
            </div>
            <button
                type="submit"
                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
                Sign Up
            </button>
        </form>

        <div class="mt-4 text-center text-sm text-gray-400">
            Already have an account? <a
                href="/login"
                class="text-blue-400 hover:text-blue-300">Sign in</a
            >
        </div>
    </div>
</div>
