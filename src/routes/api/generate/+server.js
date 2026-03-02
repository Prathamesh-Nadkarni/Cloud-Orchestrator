import { json } from '@sveltejs/kit';
import { parseCanvas } from '$lib/server/generators/index.js';

export async function POST({ request }) {
    try {
        const { nodes, edges } = await request.json();

        // Convert canvas nodes/edges to Terraform strings
        const generated = parseCanvas(nodes, edges);

        return json({ success: true, code: generated.terraform, k8s: generated.kubernetes });
    } catch (error) {
        console.error('Code generation error:', error);
        return json({ success: false, error: 'Failed to generate code.' }, { status: 500 });
    }
}
