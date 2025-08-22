import { useEffect, useRef } from 'react'
import { Download, Loader2, Brain } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { generateMindMap } from '../../services/api'
import { useMutation } from '@tanstack/react-query'
// Import only needed D3 modules to reduce bundle size
import { select } from 'd3-selection'
import { hierarchy, tree } from 'd3-hierarchy'
import * as d3 from 'd3'
import { linkHorizontal } from 'd3-shape'

interface MindMapNode {
  name: string
  children?: MindMapNode[]
}

interface MindMapStudioProps {
  selectedModel: string
}

export function MindMapStudio({ selectedModel }: MindMapStudioProps) {
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
    const svg = select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current!.clientWidth
    const height = svgRef.current!.clientHeight

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`)

    const treeLayout = tree<MindMapNode>()
      .size([2 * Math.PI, Math.min(width, height) / 2 - 100])
      .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth)

    const root = hierarchy(data)
    treeLayout(root as any)

    // Links - using simplified linear links instead of radial for better performance
    g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', linkHorizontal<any, any>()
        .x(d => d.y * Math.cos(d.x - Math.PI / 2))
        .y(d => d.y * Math.sin(d.x - Math.PI / 2)))
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
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Study Guide</h3>
            <p className="text-gray-600 mb-4">
              Visualize key concepts and relationships from your sources using local models
            </p>
            
            {/* Model Info */}
            <div className="flex items-center space-x-4 text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
              <div className="flex items-center space-x-1">
                <span className="font-medium">Model:</span>
                <span className="font-mono text-xs">{selectedModel.split('/').pop()}</span>
              </div>
            </div>
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
      </div>
    </div>
  )
}