import { useState, useEffect } from 'react';
import { ydoc } from './ydoc';
import {OnNodesChange, Node} from "@xyflow/react";

const nodesMap = ydoc.getMap<Node>('nodes');

export const useNodesStateSynced = () => {
    const [nodes, setNodes] = useState<Node[]>([{
        id: '1',
        position: { x: 0, y: 0 },
        data: { label: '1' }
    }]);

    useEffect(() => {
        setNodes(Array.from(nodesMap.values()));

        const observer = () => {
            setNodes(Array.from(nodesMap.values()));
        };

        nodesMap.observe(observer);

        return () => {
            nodesMap.unobserve(observer);
        };
    }, []);

    // Custom handler for node changes
    const onNodesChange: OnNodesChange = (changes) => {
        changes.forEach((change) => {
            console.log(change)
            const { id } = change.id;
            if (change.type === 'remove') {
                nodesMap.delete(id);
            } else if (change.type === 'dimensions') {
                const node = nodesMap.get(id);
            } else {
                nodesMap.set(id, change.item);
            }
        });
    };

    return { nodes, onNodesChange, setNodes };
};
