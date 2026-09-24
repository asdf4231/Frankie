import { useEffect, useMemo, useRef, useState } from 'react'
import type { Data, Layout, Config } from 'plotly.js'
import Plotly from 'plotly.js-basic-dist-min'
import createPlotlyComponent from 'react-plotly.js/factory'
import './LabPlot.css'

const Plot = createPlotlyComponent(Plotly)

export type LabSeries = {
  name: string
  y: readonly number[]
  mode?: 'lines' | 'markers' | 'lines+markers'
  color?: string
}

type ReferenceLine = { x0: number; y0: number; x1: number; y1: number }

type LabPlotProps = {
  x: readonly number[]
  series: readonly LabSeries[]
  xLabel: string
  yLabel: string
  ariaLabel: string
  zeroBaseline?: boolean
  referenceLines?: readonly ReferenceLine[]
}

const config: Partial<Config> = {
  displayModeBar: false,
  scrollZoom: false,
  doubleClick: false,
}

const plotStyle = { width: '100%', height: '270px' }

function readPlotTheme() {
  const styles = getComputedStyle(document.documentElement)
  const color = (token: string) => styles.getPropertyValue(token).trim()
  return {
    text: color('--text'),
    secondary: color('--text-2'),
    grid: color('--border'),
    hoverBackground: color('--bg-elevated'),
    hoverBorder: color('--border-strong'),
    palette: [color('--accent'), color('--success'), color('--warning'), color('--danger')],
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
export default function LabPlot({ x, series, xLabel, yLabel, ariaLabel, zeroBaseline = false, referenceLines }: LabPlotProps) {
  const colors = usePlotTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const plotRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => {
      if (plotRef.current) Plotly.Plots.resize(plotRef.current)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])
  const showLegend = series.length > 1
  const data = useMemo<Data[]>(() => series.map((item, index) => ({
    type: 'scatter',
    mode: item.mode ?? (item.y.length === 1 ? 'markers' : 'lines'),
    name: item.name,
    x: [...x],
    y: [...item.y],
    line: { color: item.color ?? colors.palette[index % colors.palette.length], width: 2.4 },
    marker: { color: item.color ?? colors.palette[index % colors.palette.length], size: 7 },
    hovertemplate: '%{x}, %{y:.2f}<extra></extra>',
  })), [x, series, colors])
  const layout = useMemo<Partial<Layout>>(() => ({
    autosize: true,
    height: 270,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: colors.font, color: colors.secondary, size: 12 },
    margin: { l: 56, r: 14, t: showLegend ? 38 : 14, b: 54 },
    xaxis: {
      title: { text: xLabel, font: { color: colors.text, size: 13 }, standoff: 8 },
      gridcolor: colors.grid,
      linecolor: colors.secondary,
      showline: true,
      zeroline: false,
      rangemode: 'tozero',
      fixedrange: true,
      automargin: true,
      nticks: 6,
    },
    yaxis: {
      title: { text: yLabel, font: { color: colors.text, size: 13 }, standoff: 8 },
      gridcolor: colors.grid,
      linecolor: colors.secondary,
      showline: true,
      zeroline: false,
      rangemode: zeroBaseline ? 'tozero' : 'normal',
      fixedrange: true,
      automargin: true,
      nticks: 5,
    },
    showlegend: showLegend,
    legend: { orientation: 'h', x: 0, y: 1.18, font: { color: colors.text } },
    hovermode: 'closest',
    hoverlabel: {
      bgcolor: colors.hoverBackground,
      bordercolor: colors.hoverBorder,
      font: { family: colors.font, color: colors.text, size: 12 },
    },
    dragmode: false,
    shapes: referenceLines?.map((line) => ({
      type: 'line' as const,
      ...line,
      line: { color: colors.secondary, width: 1, dash: 'dash' as const },
    })) ?? [],
  }), [colors, showLegend, xLabel, yLabel, zeroBaseline, referenceLines])

  return (
    <div ref={containerRef} className="lab-plot" role="group" aria-label={ariaLabel}>
      <Plot ref={plotRef} data={data} layout={layout} config={config} style={plotStyle} />
    </div>
  )
}
