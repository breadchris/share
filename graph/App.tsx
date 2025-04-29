import React, {DragEvent, useCallback, useEffect, useMemo, useRef} from 'react';
import {ReactFlow, Node, ReactFlowProvider, Controls, useReactFlow, NodeMouseHandler, useKeyPress} from '@xyflow/react';

import useNodesStateSynced, { nodesMap } from './useNodesStateSynced';
import useEdgesStateSynced from './useEdgesStateSynced';
import {Node as NodePB} from './rpc/node_pb';
import {EditorNode} from "./graph";

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

  const nodeTypes = useMemo(() => {
    return {
      node: EditorNode,
    }
  }, []);

  const cmdAndNPressed = useKeyPress(['Meta+i', 'Strg+i']);

  useEffect(() => {
    if (!cmdAndNPressed) {
      return;
    }
    
    const type = 'node';
    const position = screenToFlowPosition({ x: 100, y: 100 });
    const id = getId();
    const newNode: Node = {
      id: id,
      type,
      position,
      data: new NodePB({
        id: id,
        name: "asdf",
        type: {
          case: "text",
          value: "text"
        }
      }).toJson(),
    };

    nodesMap.set(newNode.id, newNode);
  }, [cmdAndNPressed]);


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
          nodeTypes={nodeTypes}
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
