import React from 'react';
import {
  BaseEdge,
  EdgeProps,
  ConnectionLineComponentProps,
  getStraightPath,
} from 'reactflow'
import * as T from './types'

export function CustomEdgePoints({
  label,
  labelStyle,
  labelShowBg,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
  style,
  markerStart,
  markerEnd,
  interactionWidth,
  data,
}: EdgeProps<T.EdgeData>) {
  const edgePath = (data?.points || [])
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  return (
    <BaseEdge
      label={label}
      labelStyle={labelStyle}
      labelShowBg={labelShowBg}
      labelBgStyle={labelBgStyle}
      labelBgPadding={labelBgPadding}
      labelBgBorderRadius={labelBgBorderRadius}
      labelX={0}
      labelY={0}
      path={edgePath}
      style={style}
      markerStart={markerStart}
      markerEnd={markerEnd}
      interactionWidth={interactionWidth}
    />
  )
}

export function CustomEdgePointsStraight({
  label,
  labelStyle,
  labelShowBg,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
  style,
  markerStart,
  markerEnd,
  interactionWidth,
  data,
}: EdgeProps<T.EdgeData>) {
  const points = data?.points || []
  const lastIndex = points.length - 1
  const startAndEnd = [points[0], points[lastIndex]]
  const edgePath = startAndEnd
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  return (
    <BaseEdge
      label={label}
      labelStyle={labelStyle}
      labelShowBg={labelShowBg}
      labelBgStyle={labelBgStyle}
      labelBgPadding={labelBgPadding}
      labelBgBorderRadius={labelBgBorderRadius}
      labelX={0}
      labelY={0}
      path={edgePath}
      style={style}
      markerStart={markerStart}
      markerEnd={markerEnd}
      interactionWidth={interactionWidth}
    />
  )
}

export function CustomConnectLine(props: ConnectionLineComponentProps) {
  const { fromX, fromY, toX, toY } = props

  const [path] = getStraightPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  })

  return (
    <g>
      <path fill="none" d={path} stroke="yellow" strokeWidth={4.5} />
      <path fill="none" d={path} stroke="black" strokeWidth={1.5} />
      <circle
        cx={toX}
        cy={toY}
        fill="black"
        r={1.5}
        stroke="black"
        strokeWidth={1.5}
      />
    </g>
  )
}
