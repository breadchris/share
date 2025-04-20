import {Handle, Position, useReactFlow} from "@xyflow/react";
import React, {useCallback, useRef} from "react";
import ReactPlayer from "react-player/youtube";
import {defaultLayoutPlugin} from "@react-pdf-viewer/default-layout";
import {ScrollMode, Viewer, Worker} from "@react-pdf-viewer/core";
import {EpubReader} from "./graph";

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
        const random = Math.random() * 16 | 0;
        const value = char === 'x' ? random : (random & 0x3 | 0x8);
        return value.toString(16);
    });
}

function EvidenceNode({ data }) {
    return (
        <>
            <Handle type="target" position={Position.Top} />
            <div className={"p-6"}>
                {data.label}
            </div>
            <Handle type="source" position={Position.Bottom} id="a" />
        </>
    );
}

function URLNode({ data }) {
    return (
        <>
            <Handle type="target" position={Position.Top} />
            <div className={"p-12"}>
                <iframe src={data.url} style={{height: "500px", width: "700px"}}></iframe>
            </div>
            <Handle type="source" position={Position.Bottom} id="a" />
        </>
    );
}

function YoutubeNode(data) {
    const reactFlowInstance = useReactFlow();
    const playerRef = useRef(null);

    const handleMarkTimestamp = () => {
        const currentTime = playerRef.current.getCurrentTime();
        const timestampNodeId = generateUUID();

        const newNode = {
            id: timestampNodeId,
            position: {
                x: data.positionAbsoluteX + 200,  // Position the new node to the right of the current node
                y: data.positionAbsoluteY,
            },
            data: {
                label: `Timestamp: ${currentTime.toFixed(2)}s`,
                timestamp: currentTime,
                parentNodeId: data.id,
            },
        };

        reactFlowInstance.setNodes((nds) => nds.concat(newNode));
        reactFlowInstance.setEdges((eds) => eds.concat({
            id: `e${data.id}-${timestampNodeId}`,
            source: data.id,
            target: timestampNodeId
        }));
    };

    const handleSeekToTimestamp = (timestamp) => {
        playerRef.current.seekTo(timestamp, 'seconds');
    };

    return (
        <>
            <Handle type="target" position={Position.Top} />
            <div style={{ width: '600px', padding: '20px' }}>
                <ReactPlayer ref={playerRef} url='https://www.youtube.com/watch?v=LXb3EKWsInQ' />
                <button onClick={handleMarkTimestamp}>Mark Timestamp</button>
            </div>
            <Handle type="source" position={Position.Bottom} id="a" />
        </>
    );
}

// https://react-pdf-viewer.dev/docs/options/
function PDFNode({ data }) {
    const defaultLayoutPluginInstance = defaultLayoutPlugin();
    return (
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
            <div
                style={{
                    border: '1px solid rgba(0, 0, 0, 0.3)',
                    height: '400px',
                    width: '300px',
                }}
            >
                <Viewer plugins={[defaultLayoutPluginInstance]} scrollMode={ScrollMode.Page} fileUrl="/books/Hypermedia Systems.pdf" />
            </div>
        </Worker>
    )
}


function EpubNode({ data }) {
    const onChange = useCallback((evt) => {
        console.log(evt.target.value);
    }, []);


    return (
        <>
            <Handle type="target" position={Position.Top} />
            <div style={{
                width: '600px',
            }}>
                <EpubReader url={"http://localhost:8080/data/uploads/8b595048-889b-4d45-9d75-2b7ec0f27a5a.epub"} />
            </div>
            <Handle type="source" position={Position.Bottom} id="a" />
        </>
    );
}
