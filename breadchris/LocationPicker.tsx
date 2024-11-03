import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {MapContainer, TileLayer, Marker, useMap} from 'react-leaflet';
import L, { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LocationPicker.css';
import { createReactBlockSpec } from "@blocknote/react";
import { BlockNoteEditor, insertOrUpdateBlock } from "@blocknote/core";
import { MdCode } from "react-icons/md";

const TYPE = "location";

export const LocationBlock = createReactBlockSpec(
    {
        type: TYPE,
        propSchema: {
            data: {},
        },
        content: "none",
    },
    {
        render: ({ block, editor }) => {
            const { data } = block?.props;
            const onInputChange = (val: string) => {
                editor.updateBlock(block, {
                    //@ts-ignore
                    props: { ...block.props, data: val },
                });
            };

            return (
                <LocationPicker onSelectLocation={(location) => {
                    onInputChange(JSON.stringify(location));
                }} />
            );
        },
        toExternalHTML: ({ block }) => {
            return (
                <pre>
                  <code>{block?.props?.data}</code>
                </pre>
            );
        },
    }
);

export const insertLocation = () => ({
    title: "Location",
    group: "Other",
    onItemClick: (editor: BlockNoteEditor) => {
        insertOrUpdateBlock(editor, {
            //@ts-ignore
            type: TYPE,
        });
    },
    aliases: ["location"],
    icon: <MdCode />,
    subtext: "Insert a location.",
});

// Fixing default icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface LocationPickerProps {
    onSelectLocation: (location: { lat: number; lng: number }) => void;
}

const MapCenter = ({ position }) => {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.setView(position, 13, { animate: true });
        }
    }, [position, map]);

    return null;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ onSelectLocation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [markerPosition, setMarkerPosition] = useState<LatLng | null>(null);

    // request location permission
    useEffect(() => {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            const newMarkerPosition = new L.LatLng(latitude, longitude);
            setMarkerPosition(newMarkerPosition);
            onSelectLocation({ lat: latitude, lng: longitude });
        });
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                    searchQuery
                )}&format=json&addressdetails=1&limit=1`
            );

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            if (data.length > 0) {
                const { lat, lon } = data[0];
                const newMarkerPosition = new L.LatLng(parseFloat(lat), parseFloat(lon));
                setMarkerPosition(newMarkerPosition);
                onSelectLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
            } else {
                alert('No results found');
            }
        } catch (error) {
            console.error("Error fetching location data:", error);
        }
    };

    return (
        <div className="location-picker">
            <div className="search-box">
                <input
                    type="text"
                    placeholder="Search for a place or address"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <a className={"btn"} onClick={handleSearch}>Search</a>
            </div>
            <MapContainer
                center={markerPosition || [51.505, -0.09]} // Default to London if no position
                zoom={13}
                style={{ height: '400px', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {markerPosition && <Marker position={markerPosition}></Marker>}
                <MapCenter position={markerPosition} />
            </MapContainer>
        </div>
    );
};
