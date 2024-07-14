import { type RefObject } from 'react';
type UseDragParams = {
    nodeRef: RefObject<HTMLDivElement>;
    disabled?: boolean;
    noDragClassName?: string;
    handleSelector?: string;
    nodeId?: string;
    isSelectable?: boolean;
};
/**
 * Hook for calling XYDrag helper from @xyflow/system.
 *
 * @internal
 */
export declare function useDrag({ nodeRef, disabled, noDragClassName, handleSelector, nodeId, isSelectable, }: UseDragParams): boolean;
export {};
//# sourceMappingURL=useDrag.d.ts.map