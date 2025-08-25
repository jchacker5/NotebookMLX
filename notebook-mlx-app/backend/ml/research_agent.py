"""
MLX-based Research Agent with Web Search Capabilities
Runs entirely on-device using Apple's MLX framework
"""
import os
import json
import asyncio
import aiohttp
from typing import List, Dict, Optional, Any
from datetime import datetime
import mlx.core as mx
import mlx.nn as nn
from mlx_lm import load, generate
import urllib.parse
import re
from bs4 import BeautifulSoup
import feedparser
from pathlib import Path

class MLXResearchAgent:
    """Local MLX-powered research agent with web search capabilities"""
    
    def __init__(self, model_name: str = "mlx-community/Qwen3-8B-4bit"):
        self.model_name = model_name
        self.model = None
        self.tokenizer = None
        
        # Research configuration
        self.max_search_results = 10
        self.max_content_length = 8000
        self.research_depth = 3  # Number of follow-up searches
        
        # Web search engines and sources
        self.search_engines = {
            "duckduckgo": "https://html.duckduckgo.com/html/",
            "searx": "https://searx.org/search",
            "arxiv": "http://export.arxiv.org/api/query"
        }
        
        # Research prompts
        self.search_prompt = """
        You are a research assistant tasked with generating effective search queries.
        Given a research topic, generate 3-5 specific search queries that will help gather comprehensive information.
        
        Topic: {topic}
        
        Generate search queries in this format:
        1. [specific technical query]
        2. [recent developments query]
        3. [practical applications query]
        4. [academic research query]
        5. [industry trends query]
        
        Search queries:
        """
        
        self.analysis_prompt = """
        You are an expert researcher analyzing web search results.
        Your task is to synthesize information from multiple sources into a comprehensive research summary.
        
        Research Topic: {topic}
        
        Sources:
        {sources}
        
        Please provide:
        1. Key Findings (3-5 main points)
        2. Current State of Research
        3. Recent Developments
        4. Practical Applications
        5. Future Directions
        6. Important Sources and References
        
        Write a comprehensive research summary:
        """
        
    async def initialize(self):
        """Initialize the MLX model"""
        if self.model is None:
            print(f"Loading MLX model: {self.model_name}")
            self.model, self.tokenizer = load(self.model_name)
            print("MLX model loaded successfully")
    
    def generate_search_queries(self, topic: str) -> List[str]:
        """Generate targeted search queries using MLX model"""
        prompt = self.search_prompt.format(topic=topic)
        
        response = generate(
            model=self.model,
            tokenizer=self.tokenizer,
            prompt=prompt,
            max_tokens=300,
            temp=0.7
        )
        
        # Extract search queries from response
        queries = []
        lines = response.split('\n')
        for line in lines:
            line = line.strip()
            if re.match(r'^\d+\.', line):
                query = re.sub(r'^\d+\.\s*\[?', '', line).rstrip(']')
                if query:
                    queries.append(query)
        
        return queries[:5]  # Return max 5 queries
    
    async def search_web(self, query: str, engine: str = "duckduckgo") -> List[Dict]:
        """Perform web search using specified engine"""
        results = []
        
        try:
            if engine == "duckduckgo":
                results = await self._search_duckduckgo(query)
            elif engine == "arxiv":
                results = await self._search_arxiv(query)
            elif engine == "searx":
                results = await self._search_searx(query)
                
        except Exception as e:
            print(f"Search failed for query '{query}': {e}")
            
        return results
    
    async def _search_duckduckgo(self, query: str) -> List[Dict]:
        """Search using DuckDuckGo"""
        results = []
        
        try:
            async with aiohttp.ClientSession() as session:
                params = {
                    'q': query,
                    'format': 'json',
                    'no_html': '1',
                    'skip_disambig': '1'
                }
                
                # Use DuckDuckGo's instant answer API
                async with session.get(
                    "https://api.duckduckgo.com/",
                    params=params,
                    timeout=10
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Extract results from DuckDuckGo response
                        if data.get('RelatedTopics'):
                            for topic in data['RelatedTopics'][:self.max_search_results]:
                                if isinstance(topic, dict) and 'Text' in topic:
                                    results.append({
                                        'title': topic.get('Text', '')[:100],
                                        'url': topic.get('FirstURL', ''),
                                        'snippet': topic.get('Text', ''),
                                        'source': 'DuckDuckGo'
                                    })
                        
                        # Add abstract if available
                        if data.get('Abstract'):
                            results.insert(0, {
                                'title': data.get('Heading', query),
                                'url': data.get('AbstractURL', ''),
                                'snippet': data.get('Abstract', ''),
                                'source': 'DuckDuckGo Abstract'
                            })
                            
        except Exception as e:
            print(f"DuckDuckGo search error: {e}")
            
        return results
    
    async def _search_arxiv(self, query: str) -> List[Dict]:
        """Search arXiv for academic papers"""
        results = []
        
        try:
            params = {
                'search_query': f'all:{query}',
                'start': 0,
                'max_results': self.max_search_results,
                'sortBy': 'relevance',
                'sortOrder': 'descending'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    self.search_engines["arxiv"],
                    params=params,
                    timeout=15
                ) as response:
                    if response.status == 200:
                        content = await response.text()
                        
                        # Parse arXiv RSS feed
                        feed = feedparser.parse(content)
                        
                        for entry in feed.entries:
                            results.append({
                                'title': entry.title,
                                'url': entry.link,
                                'snippet': entry.summary[:300] + '...' if len(entry.summary) > 300 else entry.summary,
                                'authors': ', '.join([author.name for author in entry.authors]) if hasattr(entry, 'authors') else '',
                                'published': entry.published if hasattr(entry, 'published') else '',
                                'source': 'arXiv'
                            })
                            
        except Exception as e:
            print(f"arXiv search error: {e}")
            
        return results
    
    async def _search_searx(self, query: str) -> List[Dict]:
        """Search using SearX metasearch engine"""
        results = []
        
        try:
            params = {
                'q': query,
                'format': 'json',
                'engines': 'google,bing,wikipedia',
                'safesearch': '1'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    "https://searx.be/search",  # Public SearX instance
                    params=params,
                    timeout=15
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        for result in data.get('results', [])[:self.max_search_results]:
                            results.append({
                                'title': result.get('title', ''),
                                'url': result.get('url', ''),
                                'snippet': result.get('content', ''),
                                'engine': result.get('engine', ''),
                                'source': 'SearX'
                            })
                            
        except Exception as e:
            print(f"SearX search error: {e}")
            
        return results
    
    async def extract_content(self, url: str) -> Optional[str]:
        """Extract content from a webpage"""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
                
                async with session.get(url, headers=headers, timeout=10) as response:
                    if response.status == 200:
                        html = await response.text()
                        
                        # Parse HTML and extract text
                        soup = BeautifulSoup(html, 'html.parser')
                        
                        # Remove script and style elements
                        for script in soup(["script", "style"]):
                            script.decompose()
                        
                        # Extract text content
                        text = soup.get_text()
                        
                        # Clean up text
                        lines = (line.strip() for line in text.splitlines())
                        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                        text = ' '.join(chunk for chunk in chunks if chunk)
                        
                        # Limit content length
                        if len(text) > self.max_content_length:
                            text = text[:self.max_content_length] + "..."
                        
                        return text
                        
        except Exception as e:
            print(f"Content extraction failed for {url}: {e}")
            
        return None
    
    def analyze_research_results(self, topic: str, all_results: List[Dict]) -> str:
        """Analyze research results using MLX model"""
        
        # Prepare sources text
        sources_text = ""
        for i, result in enumerate(all_results, 1):
            sources_text += f"\n{i}. {result['title']}\n"
            sources_text += f"   Source: {result['source']}\n"
            sources_text += f"   URL: {result.get('url', 'N/A')}\n"
            sources_text += f"   Content: {result['snippet']}\n"
            if result.get('authors'):
                sources_text += f"   Authors: {result['authors']}\n"
            if result.get('published'):
                sources_text += f"   Published: {result['published']}\n"
            sources_text += "\n"
        
        # Generate analysis using MLX model
        prompt = self.analysis_prompt.format(topic=topic, sources=sources_text)
        
        analysis = generate(
            model=self.model,
            tokenizer=self.tokenizer,
            prompt=prompt,
            max_tokens=2048,
            temp=0.7
        )
        
        return analysis
    
    async def conduct_research(self, topic: str, deep_search: bool = True) -> Dict:
        """Conduct comprehensive research on a topic"""
        await self.initialize()
        
        print(f"Starting research on: {topic}")
        start_time = datetime.now()
        
        # Step 1: Generate search queries
        print("Generating search queries...")
        queries = self.generate_search_queries(topic)
        print(f"Generated {len(queries)} search queries")
        
        # Step 2: Perform searches across multiple engines
        all_results = []
        
        for query in queries:
            print(f"Searching: {query}")
            
            # Search multiple engines
            duckduckgo_results = await self.search_web(query, "duckduckgo")
            arxiv_results = await self.search_web(query, "arxiv")
            searx_results = await self.search_web(query, "searx")
            
            all_results.extend(duckduckgo_results)
            all_results.extend(arxiv_results)
            all_results.extend(searx_results)
            
            # Add delay to be respectful to servers
            await asyncio.sleep(1)
        
        # Remove duplicates based on URL
        unique_results = []
        seen_urls = set()
        for result in all_results:
            url = result.get('url', '')
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_results.append(result)
        
        print(f"Found {len(unique_results)} unique results")
        
        # Step 3: Deep content extraction (if enabled)
        if deep_search:
            print("Extracting detailed content...")
            for result in unique_results[:5]:  # Extract content from top 5 results
                content = await self.extract_content(result['url'])
                if content:
                    result['full_content'] = content
        
        # Step 4: Analyze results using MLX
        print("Analyzing research results...")
        analysis = self.analyze_research_results(topic, unique_results)
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        # Compile final research report
        research_report = {
            'topic': topic,
            'timestamp': start_time.isoformat(),
            'duration_seconds': duration,
            'search_queries': queries,
            'total_results': len(unique_results),
            'sources': unique_results,
            'analysis': analysis,
            'metadata': {
                'model_used': self.model_name,
                'search_engines': list(self.search_engines.keys()),
                'deep_search_enabled': deep_search
            }
        }
        
        print(f"Research completed in {duration:.2f} seconds")
        
        return research_report
    
    def save_research_report(self, report: Dict, output_dir: str = "data/research"):
        """Save research report to file"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"research_{timestamp}.json"
        filepath = output_path / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"Research report saved to: {filepath}")
        return str(filepath)

# Global instance
research_agent = MLXResearchAgent()