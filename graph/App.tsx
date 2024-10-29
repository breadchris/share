import React, { DragEvent, useCallback, useRef } from 'react';
import { ReactFlow, Node, ReactFlowProvider, Controls, useReactFlow, NodeMouseHandler } from '@xyflow/react';

import useNodesStateSynced, { nodesMap } from './useNodesStateSynced';
import useEdgesStateSynced from './useEdgesStateSynced';

/**
 * This example shows how you can use yjs to sync the nodes and edges between multiple users.
 */

const proOptions = {
  account: 'paid-pro',
  hideAttribution: true,
};

const getId = () => `dndnode_${Math.random() * 10000}`;

const onDragOver = (event: DragEvent) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
};

function ReactFlowPro() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [nodes, onNodesChange] = useNodesStateSynced();
  const [edges, onEdgesChange, onConnect] = useEdgesStateSynced();
  const { screenToFlowPosition } = useReactFlow();

  const onDrop = (event: DragEvent) => {
    event.preventDefault();

    if (wrapperRef.current) {
      const wrapperBounds = wrapperRef.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      const position = screenToFlowPosition({ x: event.clientX - wrapperBounds.x - 80, y: event.clientY - wrapperBounds.top - 20 });
      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: { label: `${type}` },
      };

      nodesMap.set(newNode.id, newNode);
    }
  };

  // We are adding a blink effect on click that we remove after 3000ms again.
  // This should help users to see that a node was clicked by another user.
  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    const currentNode = nodesMap.get(node.id);
    if (currentNode) {
      nodesMap.set(node.id, {
        ...currentNode,
        // className: styles.blink,
        className: 'blink',
      });
    }

    window.setTimeout(() => {
      const currentNode = nodesMap.get(node.id);
      if (currentNode) {
        nodesMap.set(node.id, {
          ...currentNode,
          className: undefined,
        });
      }
    }, 3000);
  }, []);

  return (
    <div>
      <div ref={wrapperRef}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onEdgesChange={onEdgesChange}
          onNodesChange={onNodesChange}
          onNodeClick={onNodeClick}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          proOptions={proOptions}
        >
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function Flow() {
  return (
    <ReactFlowProvider>
      <ReactFlowPro />
    </ReactFlowProvider>
  );
}
