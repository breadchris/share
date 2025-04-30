import { useCallback, useEffect, useState } from 'react';
import {
  applyNodeChanges, Edge,
  getConnectedEdges,
  Node,
  NodeAddChange,
  NodeChange, NodeReplaceChange,
  OnNodesChange,
} from '@xyflow/react';

import {XmlFragment} from "yjs";
import {YMap} from "yjs/dist/src/types/YMap";

// We are using nodesMap as the one source of truth for the nodes.
// This means that we are doing all changes to the nodes in the map object.
// Whenever the map changes, we update the nodes state.
// export const nodesMap = ydoc.getMap<Node>('nodes');

const isNodeAddChange = (change: NodeChange): change is NodeAddChange => change.type === 'add';
const isNodeResetChange = (change: NodeChange): change is NodeReplaceChange => change.type === 'replace';

function useNodesStateSynced(nodesMap: YMap<Node>, edgesMap: YMap<Edge>): [Node[], OnNodesChange] {
  const [nodes, setNodes] = useState<Node[]>([]);

  // The onNodesChange callback updates nodesMap.
  // When the changes are applied to the map, the observer will be triggered and updates the nodes state.
  const onNodesChanges: OnNodesChange = useCallback((changes) => {
    const nodes = Array.from(nodesMap.values());

    const nextNodes = applyNodeChanges(changes, nodes);
    changes.forEach((change: NodeChange) => {
      if (!isNodeAddChange(change) && !isNodeResetChange(change)) {
        const node = nextNodes.find((n) => n.id === change.id);

        if (node && change.type !== 'remove') {
          nodesMap.set(change.id, node);
        } else if (change.type === 'remove') {
          const deletedNode = nodesMap.get(change.id);
          nodesMap.delete(change.id);
          // when a node is removed, we also need to remove the connected edges
          const edges = Array.from(edgesMap.values()).map((e) => e);
          const connectedEdges = getConnectedEdges(deletedNode ? [deletedNode] : [], edges);
          connectedEdges.forEach((edge) => edgesMap.delete(edge.id));
        }
      }
    });
  }, []);

  // here we are observing the nodesMap and updating the nodes state whenever the map changes.
  useEffect(() => {
    const observer = () => {
      setNodes(Array.from(nodesMap.values()));
    };

    setNodes(Array.from(nodesMap.values()));
    nodesMap.observe(observer);

    return () => nodesMap.unobserve(observer);
  }, [setNodes]);

  return [nodes.filter((n) => n), onNodesChanges];
}

export default useNodesStateSynced;
