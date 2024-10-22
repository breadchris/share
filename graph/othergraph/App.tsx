import React from 'react';
import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import './styles.css'
import { FocusStyleManager } from '@blueprintjs/core'
import { Stage } from './Stage'
import { AddTools, LayoutTools, ResetTool } from './Tools'
import { Users } from './Users'
import { TopToolbar, StageWrap, BottomToolbar } from './Layout'
import {ReactFlowProvider} from "@xyflow/react";

FocusStyleManager.onlyShowFocusOnTabs()

export default function App() {
  return (
    <>
      <TopToolbar>
        <AddTools />
        <Users />
      </TopToolbar>
      <StageWrap>
        <ReactFlowProvider>
          <Stage />
        </ReactFlowProvider>
      </StageWrap>
      <BottomToolbar>
        <LayoutTools />
        <ResetTool />
      </BottomToolbar>
    </>
  )
}
