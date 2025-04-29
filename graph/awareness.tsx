import * as React from "react";
import { WebsocketProvider } from "y-websocket";
import { useUsers } from "y-presence";
import {ComponentProps, useEffect, useState} from "react";
import "./styles.css";
import {yprovider} from "./ydoc";

interface CursorProps {
    cursor: {
        x: number;
        y: number;
    };
    color: string;
    name: string;
}


function Room() {
    const users = useUsers(awareness);

    const handlePointMove = React.useCallback((e: React.PointerEvent) => {
        awareness.setLocalStateField("cursor", {
            x: e.clientX,
            y: e.clientY
        });
    }, []);

    return (
        <div className="room" onPointerMove={handlePointMove}>
            <div className="info">Number of connected users: {users.size}</div>

            {Array.from(users.entries()).map(([key, value]) => {
                if (key === awareness.clientID) return null;

                if (!value.cursor || !value.color || !value.name) return null;
                return (
                    <Cursor
                        key={key}
                        cursor={value.cursor as ComponentProps<typeof Cursor>["cursor"]}
                        color={value.color as ComponentProps<typeof Cursor>["color"]}
                        name={value.name as ComponentProps<typeof Cursor>["name"]}
                    />
                );
            })}
        </div>
    );
}

function Link() {
    return (
        <div className="link">
            <a
                className="y-presence"
                href="https://github.com/nimeshnayaju/y-presence"
                target="_blank"
                rel="noreferrer"
            >
                y-presence
            </a>
        </div>
    );
}

const Cursor = React.memo(({ cursor, color, name }: CursorProps) => {
    const { x, y } = cursor;

    return (
        <div
            style={{
                position: "absolute",
                pointerEvents: "none",
                userSelect: "none",
                left: 0,
                top: 0,
                transition: "transform 0.5s cubic-bezier(.17,.93,.38,1)",
                transform: `translateX(${x}px) translateY(${y}px)`
            }}
        >
            <svg
                className="cursor"
                width="24"
                height="36"
                viewBox="0 0 24 36"
                fill="none"
                stroke="white"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                    fill={color}
                />
            </svg>

            <div
                style={{
                    backgroundColor: color,
                    borderRadius: 4,
                    position: "absolute",
                    top: 20,
                    left: 10,
                    padding: "5px 10px"
                }}
            >
                <p
                    style={{
                        whiteSpace: "nowrap",
                        fontSize: 13,
                        color: "white"
                    }}
                >
                    {name}
                </p>
            </div>
        </div>
    );
});


function Author() {
    return (
        <a
            className="author"
            href="https://twitter.com/nayajunimesh"
            target="_blank"
            rel="noreferrer"
        >
            @nayajunimesh
        </a>
    );
}

export const USER_COLORS = [
    "#1a1c2c",
    "#E57373",
    "#9575CD",
    "#4FC3F7",
    "#81C784",
    "#144cb5",
    "#FF8A65",
    "#F06292",
    "#7986CB"
];

export const USER_NAMES = [
    "Daniel",
    "John",
    "Mary",
    "Harry",
    "Nico",
    "Ricky",
    "Sam",
    "Tom"
];


const VERSION = 1;

const provider = yprovider;
export const awareness = yprovider.awareness;

const random = (arr: string[]): string => {
    return arr[Math.floor(Math.random() * arr.length)];
};

const name = random(USER_NAMES);
const color = random(USER_COLORS);

awareness.setLocalState({ name, color });

export function App() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const onSync = (isSynced: boolean) => {
            if (isSynced) {
                setLoading(false);
            }
        };

        provider.on("sync", onSync);

        return () => provider.off("sync", onSync);
    }, []);

    if (loading) return <p>Loading...</p>;

    return (
        <div className="App">
            <Link />
            <Author />
            <Room />
        </div>
    );
}
