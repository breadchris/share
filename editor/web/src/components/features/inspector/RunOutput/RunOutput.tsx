import React, { useMemo } from 'react'
import { Link, MessageBar, MessageBarType, useTheme } from '@fluentui/react'

import { Console } from '~/components/features/inspector/Console'
import { connect, type StatusState } from '~/store'
import type { TerminalState } from '~/store/terminal'
import type { MonacoSettings } from '~/services/config'
import { DEFAULT_FONT, getDefaultFontFamily, getFontFamily } from '~/services/fonts'

import './RunOutput.css'
import { splitStringUrls } from './parser'
import apiClient from "~/services/api/singleton.ts";
import {editor} from "~/components/features/workspace/CodeEditor";
import {TailwindHelpers} from "~/components/features/workspace/Workspace/TailwindHelpers.tsx";

interface StateProps {
  status?: StatusState
  monaco?: MonacoSettings
  terminal: TerminalState
}

const linkStyle = {
  root: {
    // Fluent UI adds padding with :nth-child selector.
    paddingLeft: '0 !important',
  },
}

const highlightLinks = (str: string) =>
  splitStringUrls(str).map(({ isUrl, content }) =>
    isUrl ? (
      <Link key={content} styles={linkStyle} href={content} target="_blank" rel="noopener noreferrer nofollow">
        {content}
      </Link>
    ) : (
      <React.Fragment key={content}>{content}</React.Fragment>
    ),
  )

const RunOutput: React.FC<StateProps & {}> = ({ status, monaco, terminal }) => {
  const theme = useTheme()
  const { fontSize, renderingBackend } = terminal.settings
  const styles = useMemo(() => {
    const { palette } = theme
    return {
      backgroundColor: palette.neutralLight,
      color: palette.neutralDark,
      fontFamily: getDefaultFontFamily(),
    }
  }, [theme])
  const fontFamily = useMemo(() => getFontFamily(monaco?.fontFamily ?? DEFAULT_FONT), [monaco])
  const isClean = !status?.dirty

  const change = (change: string) => {
    const ed = editor;
    if (!ed) {
      return;
    }
    const pos = ed.getPosition()
    if (!pos) {
      return;
    }

    console.log(ed.getValue())
    console.log(`Cursor position: ${pos.lineNumber}:${pos.column}`)
    apiClient.modify(ed.getValue(), change, { line: pos.lineNumber, col: pos.column }).then((res) => {
      ed.setValue(res.code)
    }).catch((err) => {
      console.error(err)
    })
  }

  const changes = [
      "text-center", "text-left", "text-right", "text-justify",
  ]

  return (
    <div className="RunOutput" style={styles}>
      <div style={{
        height: "300px",
        overflowY: "scroll",
      }}>
        <TailwindHelpers />
      </div>
      {/*<div style={{*/}
      {/*  display: 'flex',*/}
      {/*  flexDirection: 'row',*/}
      {/*  justifyContent: 'center',*/}
      {/*  alignItems: 'center',*/}
      {/*  gap: '10px',*/}
      {/*  padding: '10px',*/}
      {/*}}>*/}
      {/*  {changes.map((c) => {*/}
      {/*      return (*/}
      {/*          <button className={"btn"} onClick={() => {*/}
      {/*          change(c)*/}
      {/*          }}>{c}</button>*/}
      {/*      )*/}
      {/*  })}*/}
      {/*</div>*/}
      <div className="RunOutput__content">
        {status?.lastError ? (
          <div className="RunOutput__container">
            <MessageBar messageBarType={MessageBarType.error} isMultiline={true}>
              <b className="RunOutput__label">Error</b>
              <pre className="RunOutput__errors">{highlightLinks(status.lastError)}</pre>
            </MessageBar>
          </div>
        ) : isClean ? (
          <div
            className="RunOutput__container"
            style={{
              fontFamily,
              fontSize: `${fontSize}px`,
            }}
          >
            Press &quot;Run&quot; to compile program.
          </div>
        ) : (
            <>
              <iframe
                  srcDoc={status?.events?.map((e) => e.Message).join('')} style={{height: '600px'}}>
              </iframe>
            </>
          // <Console fontFamily={fontFamily} fontSize={fontSize} status={status} backend={renderingBackend} />
        )}
      </div>
    </div>
  )
}

export const ConnectedRunOutput = connect<StateProps, {}>(({ status, monaco, terminal }) => ({
  status,
  monaco,
  terminal,
}))(RunOutput)
