import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs'
import { PodcastStudio } from './studio/PodcastStudio'
import { MindMapStudio } from './studio/MindMapStudio'
import { VoiceStudio } from './studio/VoiceStudio'
import { VideoStudio } from './studio/VideoStudio'

export function StudioPanel() {
  const [activeTab, setActiveTab] = useState('podcast')

  return (
    <div className="h-full p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
        <TabsList className="grid w-full max-w-lg mx-auto grid-cols-4">
          <TabsTrigger value="podcast">Podcast</TabsTrigger>
          <TabsTrigger value="mindmap">Mind Map</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="video">Video</TabsTrigger>
        </TabsList>
        
        <TabsContent value="podcast" className="h-[calc(100%-3rem)]">
          <PodcastStudio />
        </TabsContent>
        
        <TabsContent value="mindmap" className="h-[calc(100%-3rem)]">
          <MindMapStudio />
        </TabsContent>
        
        <TabsContent value="voice" className="h-[calc(100%-3rem)]">
          <VoiceStudio />
        </TabsContent>
        
        <TabsContent value="video" className="h-[calc(100%-3rem)]">
          <VideoStudio />
        </TabsContent>
      </Tabs>
    </div>
  )
}