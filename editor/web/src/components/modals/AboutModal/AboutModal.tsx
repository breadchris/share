import React, {useMemo, useState} from 'react'
import {
  MotionAnimations,
  MotionDurations,
  IconButton,
  FontWeights,
  FontSizes,
  mergeStyleSets,
  useTheme,
  Stack,
  DefaultButton,
} from '@fluentui/react'
import { Modal } from '@fluentui/react/lib/Modal'
import client from '~/services/api'

import { getContentStyles, getIconButtonStyles } from '~/styles/modal'
import environment from '~/environment'

const TITLE_ID = 'AboutTitle'

interface AboutModalProps {
  isOpen?: boolean
  onClose: () => void
}

export const AboutModal: React.FC<AboutModalProps> = (props: AboutModalProps) => {
  const theme = useTheme()
  const contentStyles = getContentStyles(theme)
  const iconButtonStyles = getIconButtonStyles(theme)

  const [state, setState] = useState({
      html: "",
      code: "",
      error: ""
  });

  const modalStyles = useMemo(
    () =>
      mergeStyleSets({
        container: {
          animation: MotionAnimations.slideDownIn,
          animationDuration: MotionDurations.duration3,
        },
        main: {
          maxWidth: '640px',
        },
        title: {
          fontWeight: FontWeights.semibold,
          fontSize: FontSizes.xxLargePlus,
          padding: '1em 0 2em',
          color: 'transparent',
          background:
            'linear-gradient(to right, rgb(10,97,244) 0%, rgb(16, 187, 187) 100%) repeat scroll 0% 0% / auto padding-box text',
          textAlign: 'center',
        },
        info: {
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        footer: {
          marginTop: '2em',
          backgroundColor: theme.semanticColors.bodyStandoutBackground,
          padding: '.3rem 24px 24px',
          margin: '24px -24px -24px',
        },
      }),
    [theme],
  )

  return (
    <Modal
      titleAriaId={TITLE_ID}
      isOpen={props.isOpen}
      onDismiss={props.onClose}
      styles={modalStyles}
      containerClassName={modalStyles.container}
    >
      <div className={contentStyles.header}>
        <IconButton
          iconProps={{ iconName: 'Cancel' }}
          styles={iconButtonStyles}
          ariaLabel="Close popup modal"
          onClick={props.onClose as any}
        />
      </div>
      <div className={contentStyles.body}>
        <textarea style={{width: "100%"}} className="textarea" placeholder="html" value={state.html} onChange={(e) => {
            setState((prev) => ({
                ...prev,
                html: e.target.value
            }))
        }}></textarea>
        <button className={"btn"} onClick={() => {
            client.convert(state.html).then((res) => {
                setState((prev) => ({
                    ...prev,
                    code: res.code
                }))
            }).catch((err) => {
                setState((prev) => ({
                    ...prev,
                    error: err.toString()
                }))
            });
        }}>submit</button>
        <textarea style={{width: "100%"}} className="textarea" placeholder="code" value={state.code} readOnly></textarea>
        <textarea style={{width: "100%"}} className="textarea" placeholder="error" value={state.error} readOnly></textarea>
      </div>
    </Modal>
  )
}
