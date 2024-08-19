import React from 'react';
import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import './styles.css'
import { ReactFlowProvider } from 'reactflow'
import { FocusStyleManager } from '@blueprintjs/core'
import { Stage } from './Stage'
import { AddTools, LayoutTools, ResetTool } from './Tools'
import { Users } from './Users'
import { TopToolbar, StageWrap, BottomToolbar } from './Layout'

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
