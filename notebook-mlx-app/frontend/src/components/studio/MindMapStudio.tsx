import { useEffect, useRef } from 'react'
import { Download, Loader2, Brain } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { generateMindMap } from '../../services/api'
import { useMutation } from '@tanstack/react-query'
import * as d3 from 'd3'

interface MindMapNode {
  name: string
  children?: MindMapNode[]
}

export function MindMapStudio() {
  const svgRef = useRef<SVGSVGElement>(null)
  const { selectedSources, mindmapData, setMindmapData } = useStore()

  const generateMutation = useMutation({
    mutationFn: () => generateMindMap(selectedSources),
    onSuccess: (data) => {
      setMindmapData(data)
    },
  })

  useEffect(() => {
    if (mindmapData && svgRef.current) {
      renderMindMap(mindmapData)
    }
  }, [mindmapData])

  const renderMindMap = (data: MindMapNode) => {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current!.clientWidth
    const height = svgRef.current!.clientHeight

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`)

    const tree = d3.tree<MindMapNode>()
      .size([2 * Math.PI, Math.min(width, height) / 2 - 100])
      .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth)

    const root = d3.hierarchy(data)
    tree(root as any)

    // Links
    g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkRadial<any, any>()
        .angle(d => d.x)
        .radius(d => d.y))
      .style('fill', 'none')
      .style('stroke', '#4a5568')
      .style('stroke-width', 1.5)

    // Nodes
    const node = g.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `
        rotate(${(d.x * 180 / Math.PI - 90)})
        translate(${d.y},0)
      `)

    node.append('circle')
      .attr('r', 4)
      .style('fill', '#3b82f6')

    node.append('text')
      .attr('dy', '0.31em')
      .attr('x', (d: any) => d.x < Math.PI === !d.children ? 6 : -6)
      .attr('text-anchor', (d: any) => d.x < Math.PI === !d.children ? 'start' : 'end')
      .attr('transform', (d: any) => d.x >= Math.PI ? 'rotate(180)' : null)
      .text((d: any) => d.data.name)
      .style('font-size', '12px')
      .style('fill', '#e2e8f0')

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom as any)
  }

  const downloadMindMap = () => {
    if (!svgRef.current) return

    const svgData = new XMLSerializer().serializeToString(svgRef.current)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'mindmap.svg'
    link.click()
    
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4">Generate Mind Map</h3>
        <p className="text-muted-foreground">
          Visualize key concepts and relationships from your sources
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => generateMutation.mutate()}
          disabled={selectedSources.length === 0 || generateMutation.isPending}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Brain className="w-5 h-5" />
              <span>Generate Mind Map</span>
            </>
          )}
        </button>

        {mindmapData && (
          <button
            onClick={downloadMindMap}
            className="px-6 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download SVG</span>
          </button>
        )}
      </div>

      {/* Mind Map Visualization */}
      <div className="flex-1 bg-secondary rounded-lg p-4">
        {mindmapData ? (
          <svg
            ref={svgRef}
            className="w-full h-full"
            style={{ cursor: 'move' }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {selectedSources.length === 0 ? (
              <p>Select sources to generate a mind map</p>
            ) : (
              <p>Click "Generate Mind Map" to visualize concepts</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}