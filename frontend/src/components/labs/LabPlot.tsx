import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Data, Layout, Config } from 'plotly.js'
import Plotly from 'plotly.js-basic-dist-min'
import createPlotlyComponent from 'react-plotly.js/factory'
import LabMath from './LabMath'
import './LabPlot.css'

const Plot = createPlotlyComponent(Plotly)

export type LabSeries = {
  name: string
  y: readonly number[]
  x?: readonly number[]
  mode?: 'lines' | 'markers' | 'lines+markers' | 'none'
  fill?: 'tozeroy'
  color?: 0 | 1 | 2 | 3 | 'muted'
  dash?: 'solid' | 'dash' | 'dot'
  width?: number
  opacity?: number
  markerSymbol?: 'circle' | 'circle-open'
  showLegend?: boolean
  hover?: boolean
  labelOnHover?: boolean
}

type ReferenceLine = { x0: number; y0: number; x1: number; y1: number }

export type LabAnnotation = {
  x: number
  y: number
  text?: string
  tex?: string
  ax?: number
  ay?: number
  color?: 0 | 1 | 2 | 3
  opacity?: number
  xshift?: number
  yshift?: number
  xanchor?: 'left' | 'center' | 'right'
  yanchor?: 'top' | 'middle' | 'bottom'
}

type LabPlotProps = {
  x: readonly number[]
  series: readonly LabSeries[]
  xLabel: string | { tex: string }
  yLabel: string | { tex: string }
  ariaLabel: string
  zeroBaseline?: boolean
  height?: number
  annotations?: readonly LabAnnotation[]
  xRange?: readonly [number, number]
  yRange?: readonly [number, number]
  equalAspect?: boolean
  referenceLines?: readonly ReferenceLine[]
}

type AxisGeometry = { _offset: number; _length: number; range: [number, number] }
type PlotGeometry = { left: number; top: number; width: number; height: number; xMin: number; xMax: number; yMin: number; yMax: number }

const config: Partial<Config> = {
  displayModeBar: false,
  scrollZoom: false,
  doubleClick: false,
}

function readPlotTheme() {
  const styles = getComputedStyle(document.documentElement)
  const color = (token: string) => styles.getPropertyValue(token).trim()
  return {
    text: color('--text'),
    secondary: color('--text-2'),
    grid: color('--border'),
    axis: color('--border-strong'),
    hoverBackground: color('--bg-elevated'),
    palette: [color('--chart-1'), color('--chart-2'), color('--chart-3'), color('--chart-4')],
    font: getComputedStyle(document.body).fontFamily,
  }
}

function usePlotTheme() {
  const [colors, setColors] = useState(readPlotTheme)
  useEffect(() => {
    const observer = new MutationObserver(() => setColors(readPlotTheme()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])
  return colors
}

/** XY plots for teaching labs; the solver owns the data and Plotly only draws it. */
export default function LabPlot({ x, series, xLabel, yLabel, ariaLabel, zeroBaseline = false, height = 270, annotations, xRange, yRange, equalAspect = false, referenceLines }: LabPlotProps) {
  const colors = usePlotTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const plotRef = useRef<HTMLDivElement>(null)
  const [geometry, setGeometry] = useState<PlotGeometry | null>(null)
  const hasMath = typeof xLabel !== 'string' || typeof yLabel !== 'string' || annotations?.some((annotation) => annotation.tex)
  // KaTeX stays in HTML, positioned from Plotly's final axes after drawing/resizing.
  // The computed axes account for equal-aspect domains and wrapped legends.
  const syncGeometry = useCallback((_: unknown, graph: HTMLElement) => {
    if (!hasMath) return
    const { xaxis, yaxis } = (graph as HTMLElement & {
      _fullLayout: { xaxis: AxisGeometry; yaxis: AxisGeometry }
    })._fullLayout
    const next: PlotGeometry = {
      left: xaxis._offset, top: yaxis._offset,
      width: xaxis._length, height: yaxis._length,
      xMin: xaxis.range[0], xMax: xaxis.range[1], yMin: yaxis.range[0], yMax: yaxis.range[1],
    }
    setGeometry((current) => current && Object.entries(next).every(([key, value]) => current[key as keyof PlotGeometry] === value) ? current : next)
  }, [hasMath])
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => {
      if (plotRef.current) Plotly.Plots.resize(plotRef.current)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])
  const showLegend = series.some((item) => item.showLegend === true) || series.filter((item) => item.showLegend !== false).length > 1
  const data = useMemo<Data[]>(() => series.map((item, index) => {
    const color = item.color === 'muted' ? colors.secondary : colors.palette[item.color ?? index % colors.palette.length]
    return {
      type: 'scatter',
      mode: item.mode ?? (item.y.length === 1 ? 'markers' : 'lines'),
      name: item.name,
      x: [...(item.x ?? x)],
      y: [...item.y],
      line: { color, width: item.width ?? 2.2, dash: item.dash },
      marker: { color, size: 6, symbol: item.markerSymbol },
      opacity: item.opacity ?? 0.9,
      fill: item.fill,
      // Plotly does not apply scatter opacity to fills; theme colours are six-digit hex.
      fillcolor: item.fill ? `rgba(${[1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)).join(',')},0.1)` : undefined,
      showlegend: item.showLegend ?? true,
      hoverinfo: item.hover === false ? 'skip' : undefined,
      hovertemplate: item.hover === false ? undefined : `${item.labelOnHover ? '<b>%{fullData.name}</b><br>' : ''}(%{x:.4~g}, %{y:.4~g})<extra></extra>`,
    }
  }), [x, series, colors])
  const layout = useMemo<Partial<Layout>>(() => ({
    autosize: true,
    height,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: colors.font, color: colors.secondary, size: 12 },
    margin: { l: 56, r: 14, t: showLegend ? 54 : 14, b: 54 },
    xaxis: {
      title: { text: typeof xLabel === 'string' ? xLabel : '', font: { color: colors.text, size: 13 }, standoff: 8 },
      gridcolor: colors.grid,
      linecolor: colors.axis,
      showline: true,
      zeroline: false,
      rangemode: 'tozero',
      range: xRange ? [...xRange] : undefined,
      constrain: equalAspect ? 'domain' : undefined,
      fixedrange: true,
      automargin: true,
      nticks: 6,
    },
    yaxis: {
      title: { text: typeof yLabel === 'string' ? yLabel : '', font: { color: colors.text, size: 13 }, standoff: 8 },
      gridcolor: colors.grid,
      linecolor: colors.axis,
      showline: true,
      zeroline: false,
      rangemode: zeroBaseline ? 'tozero' : 'normal',
      range: yRange ? [...yRange] : undefined,
      scaleanchor: equalAspect ? 'x' : undefined,
      scaleratio: equalAspect ? 1 : undefined,
      constrain: equalAspect ? 'domain' : undefined,
      fixedrange: true,
      automargin: true,
      nticks: 5,
    },
    showlegend: showLegend,
    legend: { orientation: 'h', x: 0, y: 1.04, yanchor: 'bottom', font: { color: colors.text }, itemclick: false, itemdoubleclick: false },
    hovermode: 'closest',
    hoverlabel: {
      bgcolor: colors.hoverBackground,
      bordercolor: colors.hoverBackground,
      align: 'left',
      font: { family: colors.font, color: colors.text, size: 12 },
    },
    dragmode: false,
    annotations: annotations?.map(({ color, tex, ...annotation }) => ({
      ...annotation,
      text: tex ? '' : annotation.text,
      xref: 'x' as const, yref: 'y' as const,
      axref: 'x' as const, ayref: 'y' as const,
      showarrow: annotation.ax !== undefined && annotation.ay !== undefined,
      arrowhead: 2, arrowsize: 1, arrowwidth: 1.6,
      arrowcolor: color === undefined ? colors.secondary : colors.palette[color],
      font: { family: colors.font, color: colors.text, size: 11 },
    })) ?? [],
    shapes: referenceLines?.map((line) => ({
      type: 'line' as const,
      ...line,
      line: { color: colors.secondary, width: 0.9, dash: 'dash' as const },
      opacity: 0.9,
    })) ?? [],
  }), [colors, showLegend, xLabel, yLabel, zeroBaseline, height, annotations, xRange, yRange, equalAspect, referenceLines])

  return (
    <div ref={containerRef} className="lab-plot" role="group" aria-label={ariaLabel}>
      <Plot ref={plotRef} data={data} layout={layout} config={config} onInitialized={syncGeometry} onUpdate={syncGeometry} style={{ width: '100%', height: `${height}px` }} />
      {geometry && <>
        {typeof xLabel !== 'string' && <span className="lab-plot-math lab-plot-x-math" style={{ left: geometry.left + geometry.width / 2, top: geometry.top + geometry.height + 30 }}><LabMath tex={xLabel.tex} /></span>}
        {typeof yLabel !== 'string' && <span className="lab-plot-math lab-plot-y-math" style={{ left: geometry.left - 40, top: geometry.top + geometry.height / 2 }}><LabMath tex={yLabel.tex} /></span>}
        {annotations?.map((annotation, index) => {
          if (!annotation.tex) return null
          const left = geometry.left + (annotation.x - geometry.xMin) / (geometry.xMax - geometry.xMin) * geometry.width + (annotation.xshift ?? 0)
          const top = geometry.top + (geometry.yMax - annotation.y) / (geometry.yMax - geometry.yMin) * geometry.height - (annotation.yshift ?? 0)
          const dx = annotation.xanchor === 'left' ? 0 : annotation.xanchor === 'right' ? -100 : -50
          const dy = annotation.yanchor === 'top' ? 0 : annotation.yanchor === 'bottom' ? -100 : -50
          return <span key={index} className="lab-plot-math" style={{ left, top, transform: `translate(${dx}%, ${dy}%)`, opacity: annotation.opacity, color: annotation.color === undefined ? undefined : colors.palette[annotation.color] }}><LabMath tex={annotation.tex} /></span>
        })}
      </>}
    </div>
  )
}
