"use client";

import {usePresence, usePresenceSetter} from "@y-sweet/react";
import { useEffect, useState } from "react";
import { randomColor } from "@/lib/colors";
import { Todos } from "./Todos";
import Image from "next/image";
import GraphApp from "@/components/graph";
import {ReactFlowProvider} from "@xyflow/react";

export function App() {
    return (
        <ReactFlowProvider>
            <GraphApp />
        </ReactFlowProvider>
    )
  // return (
    // <div className="min-h-screen flex flex-col justify-between max-w-[60rem] mx-auto before:content-[''] before:block before:absolute before:top-0 before:left-0 before:right-0 before:border-t-4 before:border-[#fc5c86]">
    //   <header className="flex flex-col gap-8 p-12">
    //     <Hero />
    //   </header>
    //
    //   <Presence />
    //
    //   <Todos />
    //   <Footer />
    // </div>
  // );
}

function Footer() {
    return (
        <footer className="p-8">
            <ul className="flex justify-center gap-8">
                <li>
                    <a className="text-xs text-gray-500" href="https://jamsocket.com">
                        <span>Jamsocket</span>
                    </a>
                </li>
                <li>
                    <a
                        className="text-xs text-gray-500"
                        href="https://docs.jamsocket.com/y-sweet/"
                    >
                        <span>Y-Sweet</span>
                    </a>
                </li>
                <li>
                    <a className="text-xs text-gray-500" href="https://docs.yjs.dev">
                        <span>Yjs</span>
                    </a>
                </li>
                <li>
                    <a
                        className="text-xs text-gray-500"
                        href="https://github.com/jamsocket/y-sweet"
                    >
                        <span>Source</span>
                    </a>
                </li>
                <li>
                    <a
                        className="text-xs text-gray-500"
                        href="https://discord.gg/RFrDbMVKxv"
                    >
                        <span>Get Help</span>
                    </a>
                </li>
            </ul>
        </footer>
    );
}

export function Hero() {
    return (
        <>
            <div className="flex justify-center items-center gap-6">
                <Image src="/y-sweet.svg" alt="Y-Sweet" width="116" height="38" />
                +
                <Image src="/next.svg" alt="Next.js" width="98" height="20" />
            </div>

            <div className="max-w-2xl mx-auto flex flex-col gap-4">
                <h1 className="text-center text-3xl text-balance ">
                    Y-Sweet is an open-source Yjs server by{" "}
                    <strong>
                        <a href="https://jamsocket.com" target="_blank">
                            Jamsocket
                        </a>
                    </strong>{" "}
                    for building <strong>collaborative apps</strong>.
                </h1>
                <p className="text-lg text-center text-gray-500 text-balance">
                    Everything on this website automatically syncs!
                    <br />
                    Open multiple windows to see more bubbles appear.
                </p>
            </div>
        </>
    );
}

export function Presence() {
    const setPresence = usePresenceSetter();
    const presence = usePresence();

    const [self, setSelf] = useState(() => ({ color: randomColor() }));
    useEffect(() => setPresence(self), [setPresence, self]);

    const others = Array.from(presence.entries());

    return (
        <div className="inline-block relative mx-auto pb-[102px]">
            <ul className="flex justify-center items-center gap-2">
                <li
                    className="flex rounded-full border border-dashed p-0.5"
                    style={{ borderColor: self.color }}
                >
                    <label
                        className="block appearance-none w-6 h-6 rounded-full"
                        style={{ backgroundColor: self.color }}
                    >
                        <input
                            className="invisible"
                            type="color"
                            value={self.color}
                            onChange={(e) => setSelf({ ...self, color: e.target.value })}
                        />
                    </label>
                </li>
                {others.map(([id, peer]) => (
                    <li
                        key={id}
                        className="rounded-full w-6 h-6"
                        style={{ backgroundColor: peer.color }}
                    ></li>
                ))}
            </ul>
            <img
                className="absolute max-w-none mt-[4px] -left-6"
                src="/tip.svg"
                alt=""
                width="116"
                height="98"
            />
        </div>
    );
}
