import React, { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { connect } from 'react-redux'

import { dispatchPanelLayoutChange } from '../../store'
import { dispatchLoadSnippet } from '../../store/workspace'
import { Header } from './Header'
import { ConnectedWorkspace } from '../Workspace'
import { InspectorPanel } from './InspectorPanel/InspectorPanel'
import { NotificationHost } from './Notification'
import { Layout } from './Layout/Layout'
import { ConnectedStatusBar } from '../StatusBar'
import { computeSizePercentage } from './utils'

import styles from './PlaygroundPage.module.css'
import { ConfirmProvider } from './ConfirmModal'

interface PageParams {
  snippetID: string
}

export const PlaygroundPage = connect(({ panel }: any) => ({ panelProps: panel }))(({ panelProps, dispatch }: any) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { snippetID } = useParams<PageParams>()
  useEffect(() => {
    dispatch(dispatchLoadSnippet(snippetID))
  }, [snippetID, dispatch])

  return (
    <div ref={containerRef} className={styles.Playground}>
      <Header />
      <Layout layout={panelProps.layout}>
        <ConfirmProvider>
          <ConnectedWorkspace />
          <InspectorPanel
            {...panelProps}
            onLayoutChange={(layout) => {
              dispatch(dispatchPanelLayoutChange({ layout }))
            }}
            onCollapsed={(collapsed) => {
              dispatch(dispatchPanelLayoutChange({ collapsed }))
            }}
            onResize={(changes) => {
              if ('height' in changes) {
                // Height percentage is buggy on resize. Use percents only for width.
                dispatch(dispatchPanelLayoutChange(changes))
                return
              }
              const result = computeSizePercentage(changes, containerRef.current!)
              dispatch(dispatchPanelLayoutChange(result))
            }}
          />
          <NotificationHost />
        </ConfirmProvider>
      </Layout>
      <ConnectedStatusBar />
    </div>
  )
})
