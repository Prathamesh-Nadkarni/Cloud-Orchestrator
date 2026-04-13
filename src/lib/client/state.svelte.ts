export const globalState = $state({
    dcfModeEnabled: false,
    currentDiagramId: null as string | null,
    /** Active drag context — set by Sidebar on dragstart, cleared on dragend/drop */
    dragContext: null as { type: string; provider: string } | null,
    /** IDs of container nodes that are valid drop targets for the current drag */
    validDropTargets: [] as string[],
    /** Whether the current drag can be dropped on the open canvas (no parent) */
    canDropOnCanvas: false,
});

export function toggleDCFMode() {
    globalState.dcfModeEnabled = !globalState.dcfModeEnabled;
}

export function clearDragState() {
    globalState.dragContext = null;
    globalState.validDropTargets = [];
    globalState.canDropOnCanvas = false;
}
