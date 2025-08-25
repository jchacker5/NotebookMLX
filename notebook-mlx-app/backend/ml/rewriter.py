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
        """Parse the rewritten transcript back into segments with enhanced security"""
        import re
        
        # Input validation and sanitization
        if not rewritten_text or len(rewritten_text) > 100000:  # 100KB limit
            return []
        
        # Remove potentially dangerous characters
        safe_text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x84\x86-\x9f]', '', rewritten_text)
        
        try:
            # SECURITY: Safe parsing without eval - only allow list of tuples
            # Parse manually instead of using ast.literal_eval for better control
            segments = self._safe_parse_transcript(safe_text)
            return segments
        except Exception as e:
            logger.warning(f"Failed to parse rewritten transcript safely: {e}")
            # Fallback parsing with strict validation
            return self._fallback_parse_transcript(safe_text)
    
    def _safe_parse_transcript(self, text: str) -> List[Tuple[str, str]]:
        """Safely parse transcript using regex instead of eval"""
        import re
        
        segments = []
        # Pattern to match tuple format: ('Speaker X', 'text content')
        pattern = r"\(\s*['\"]Speaker\s+[12]['\"]\s*,\s*['\"]([^'\"]*)['\"]\s*\)"
        
        for match in re.finditer(pattern, text):
            speaker_match = re.search(r"Speaker\s+([12])", match.group(0))
            if speaker_match:
                speaker = f"Speaker {speaker_match.group(1)}"
                content = match.group(1).strip()
                # Validate content length and characters
                if len(content) <= 1000 and content:
                    segments.append((speaker, content))
        
        return segments
    
    def _fallback_parse_transcript(self, text: str) -> List[Tuple[str, str]]:
        """Fallback parsing with strict validation"""
        import re
        
        segments = []
        lines = text.split('\n')
        
        for line in lines[:1000]:  # Limit processing to 1000 lines
            line = line.strip()
            if len(line) > 2000:  # Skip overly long lines
                continue
                
            # Safe speaker detection with strict patterns
            speaker_pattern = r'^(Speaker\s+[12])\s*:\s*(.*)$'
            match = re.match(speaker_pattern, line)
            
            if match:
                speaker = match.group(1).strip()
                text_content = match.group(2).strip().strip('"\'')
                # Additional validation
                if len(text_content) <= 1000 and text_content:
                    segments.append((speaker, text_content))
        
        return segments
    
    def enhance_transcript(self, transcript_segments: List[Tuple[str, str]]) -> List[Tuple[str, str]]:
        """Main method to enhance a transcript"""
        rewritten_text = self.rewrite_transcript(transcript_segments)
        enhanced_segments = self.parse_rewritten_transcript(rewritten_text)
        
        # If parsing failed, return original
        if not enhanced_segments:
            return transcript_segments
        
        return enhanced_segments