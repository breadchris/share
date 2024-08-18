// useEdgesStateSynced.ts
import { useState, useEffect } from 'react';
import * as Y from 'yjs';
import { ydoc } from './ydoc';
import {Edge, OnEdgesChange} from '@xyflow/react';

const edgesMap = ydoc.getMap<Edge>('edges');

export const useEdgesStateSynced = () => {
    const [edges, setEdges] = useState<Edge[]>([]);

    useEffect(() => {
        // Initialize local state from the Yjs map
        setEdges(Array.from(edgesMap.values()));

        // Observer function to sync local state with the Yjs map
        const observer = () => {
            setEdges(Array.from(edgesMap.values()));
        };

        edgesMap.observe(observer);

        // Cleanup observer on unmount
        return () => {
            edgesMap.unobserve(observer);
        };
    }, []);

    // Custom handler for edge changes
    const onEdgesChange: OnEdgesChange = (changes) => {
        changes.forEach((change) => {
            const { id } = change.item;
            if (change.type === 'remove') {
                edgesMap.delete(id);
            } else {
                edgesMap.set(id, change.item);
            }
        });
    };

    return { edges, onEdgesChange, setEdges };
};
