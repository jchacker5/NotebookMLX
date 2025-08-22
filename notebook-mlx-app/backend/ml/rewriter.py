"""
Rewriter Module
Makes transcripts more dramatic using Qwen3-8B model
"""
from typing import List, Tuple, Optional
import ast
from mlx_lm import load, generate

DEFAULT_MODEL = "mlx-community/Qwen3-8B-4bit"
DEFAULT_QUANTIZATION = "4bit"  # Options: "4bit", "8bit", None

SYSTEM_PROMPT = """
You are an Emmy-winning podcast editor renowned for your ability to transform good conversations into absolutely riveting audio experiences. Your superpower is taking natural dialogue and enhancing it with perfect timing, emotion, and those little human moments that make listeners feel like they're right there in the room.

Your task is to take this podcast transcript and elevate it. Keep the core content intact, but add:

1. Natural interruptions and reactions ("Oh!", "Wait, what?", "Hmm...", gasps, laughs)
2. Overlapping dialogue where speakers get excited
3. Thoughtful pauses (marked as "...")  
4. Emotional variations - excitement, confusion, awe, skepticism
5. More dynamic pacing - some rapid exchanges, some slower contemplative moments
6. Natural speech patterns like trailing off, restarting sentences, verbal fillers when thinking
7. Physical reactions that would be audible (leaning forward, sitting back, shuffling papers)

The goal is to make this feel like the best conversation the listeners have ever overheard - engaging, dynamic, and impossibly natural.

IMPORTANT: 
- Output ONLY the enhanced dialogue in the exact same format as the input
- Preserve the [("Speaker 1", "..."), ("Speaker 2", "...")] structure
- Make it feel like a real, unscripted conversation between two people who are genuinely engaged
"""

class Rewriter:
    def __init__(self, model_name: str = DEFAULT_MODEL, quantization: Optional[str] = DEFAULT_QUANTIZATION):
        self.model_name = model_name
        self.quantization = quantization
        self.model = None
        self.tokenizer = None
    
    def load_model(self):
        """Load the MLX model for rewriting"""
        if self.model is None:
            self.model, self.tokenizer = load(self.model_name)
    
    def rewrite_transcript(self, transcript_segments: List[Tuple[str, str]], temperature: float = 0.9) -> str:
        """Rewrite transcript to make it more dramatic"""
        self.load_model()
        
        # Convert segments to string format for model
        transcript_str = str(transcript_segments)
        
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": transcript_str},
        ]
        
        prompt = self.tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        
        rewritten = generate(
            model=self.model,
            tokenizer=self.tokenizer,
            prompt=prompt,
            max_tokens=8192,
            temp=temperature,
        )
        
        return rewritten
    
    def parse_rewritten_transcript(self, rewritten_text: str) -> List[Tuple[str, str]]:
        """Parse the rewritten transcript back into segments"""
        try:
            # Try to parse as Python literal
            segments = ast.literal_eval(rewritten_text)
            return segments
        except:
            # Fallback parsing if literal_eval fails
            segments = []
            lines = rewritten_text.split('\n')
            
            for line in lines:
                line = line.strip()
                if 'Speaker 1' in line and ':' in line:
                    text = line.split(':', 1)[1].strip().strip('"\'')
                    segments.append(('Speaker 1', text))
                elif 'Speaker 2' in line and ':' in line:
                    text = line.split(':', 1)[1].strip().strip('"\'')
                    segments.append(('Speaker 2', text))
            
            return segments
    
    def enhance_transcript(self, transcript_segments: List[Tuple[str, str]]) -> List[Tuple[str, str]]:
        """Main method to enhance a transcript"""
        rewritten_text = self.rewrite_transcript(transcript_segments)
        enhanced_segments = self.parse_rewritten_transcript(rewritten_text)
        
        # If parsing failed, return original
        if not enhanced_segments:
            return transcript_segments
        
        return enhanced_segments