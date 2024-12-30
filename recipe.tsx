import JsonView from '@uiw/react-json-view';
import React from "react";
import { createRoot } from 'react-dom/client';
import Sortable from 'sortablejs';

// const st = new Sortable(document.getElementById('type-list'), {
//     group: {
//         name: 'shared',
//         pull: 'clone',
//         put: false
//     },
//     animation: 150,
//     sort: false
// });
// console.log(st);
//
// const sc = new Sortable(document.getElementById('struct-list'), {
//     group: 'shared',
//     animation: 150
// });
// console.log(sc);

const avatar = 'https://i.imgur.com/MK3eW3As.jpg';
const longArray = new Array(1000).fill(1);
const example = {
    avatar,
    string: 'Lorem ipsum dolor sit amet',
    integer: 42,
    float: 114.514,
    bigint: 10086n,
    null: null,
    undefined,
    timer: 0,
    date: new Date('Tue Sep 13 2022 14:07:44 GMT-0500 (Central Daylight Time)'),
    array: [19, 100.86, 'test', NaN, Infinity],
    nestedArray: [
        [1, 2],
        [3, 4],
    ],
    object: {
        'first-child': true,
        'second-child': false,
        'last-child': null,
    },
    longArray,
    string_number: '1234',
};

const s = document.getElementById('json-viewer');
if (s) {
    const r = createRoot(s);
    const value = s.getAttribute('data-value');
    r.render(<JsonView value={JSON.parse(value)} />);
}
