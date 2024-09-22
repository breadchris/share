## Todo

- [x] test basic Dagre auto-layout in Reactflow
- [x] test basic Elk auto-layout in Reactflow
- [x] test nested Elk auto-layout in Reactflow
- [x] test nested Elk auto-layout with nested edges in Reactflow
- [x] test custom Nodes with dynamic Handle positions using elk auto-layout
- [x] fix nested group-level connection positions
- [x] try rounding values to nearest 25 for snapgrid
- [x] create custom node for groups
- [x] on node drag, identify node intersection of deepest layer
- [x] on node drop, move element to new location and re-layout
- [x] try out node positioning transitions
- [x] fix edge positioning between nodes in different containers without nesting
- [x] try again with Dagre compount multigraph settings
- [x] dagre: distribute node handles evenly on each side
- [x] dagre: custom edge using dagre edge points
- [x] dynamic node width based on label
- [x] tools for switching configuration
- [x] fix moving group with nested group inside
- [x] expand/collapse Groups (expand/collapse all)
- [x] dynamic width/height node using name with spaces
- [x] click + drag + drop for new comps and groups
- [x] fix group move into other groups (inmost calculation)
- [x] selected state + onDelete elements edit and reLayout
- [x] fix deleted connections after group removed that used to contain comps
- [x] hover edge of node and highlight for edge creation
- [x] on border click/drag, show temp edge
- [x] create new connection and re-layout
- [x] standardize node order (sort) to avoid divergent re-layouts
- [x] inline component name update
- [x] investigate yjs recursive state management
- [x] basic integration with yjs dev websocket server for node/edge creation
- [x] use yjs awareness to display other connected users
- [x] add reactflow background with grid
- [x] be able to edit group names inline
- [x] add a design reset button
- [x] show user-selected node
- [x] show editing indicator when user is editing comp
- [x] fix: selected user tags sometimes get out of sync (on node generation)
- [x] fix: group drag into other group is messed up
- [x] show ghost node drag when other user is dragging
- [x] lock down component when being dragged
- [ ] add user mark to dragged ghost node
- [ ] undo/redo management
- [ ] show user cursor positions
- [ ] toggle edge highlight when selected
- [ ] edge deletion
- [ ] sketch plan for interfaces/connections/transports/topics

## Notes

- How do we handle windowed configuration in a collaborative context?

  - Ex: I am editing the interface of CompA, someone else deletes CompA
  - Ex: Layout is changing even though my panel is open to edit CompA

- Are Groups only organizational, or can they have more meaning
  - Ex:
