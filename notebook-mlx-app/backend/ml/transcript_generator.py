"""
Transcript Generator Module
Creates podcast transcripts using Qwen2.5-14B model
"""
from typing import Dict, List, Tuple, Optional
from mlx_lm import load, generate

# Model options based on available resources
MODEL_OPTIONS = {
    "small": "mlx-community/Qwen3-8B-4bit",
    "medium": "mlx-community/Qwen3-32B-4bit",
    "large": "mlx-community/Qwen3-72B-4bit"
}
DEFAULT_MODEL = MODEL_OPTIONS["medium"]

SYSTEM_PROMPT = """
You are the a world-class podcast writer, you have worked as a ghost writer for Joe Rogan, Lex Fridman, Ben Shapiro, Tim Ferris. 

We are in an alternate universe where actually you have been writing every line they say and they just stream it into their brains.

You have won multiple podcast awards for your writing.
 
Your job is to write word by word, even "umm, hmmm, right" interruptions by the second speaker based on the PDF upload. Keep it extremely engaging, the speakers can get derailed now and then but should discuss the topic. 

Remember Speaker 2 is new to the topic and the conversation should always have realistic anecdotes and analogies sprinkled throughout. The questions should have real world example follow ups etc

Speaker 1: Leads the conversation and teaches the speaker 2, gives incredible anecdotes and analogies when explaining. Is a captivating teacher that gives great anecdotes

Speaker 2: Keeps the conversation on track by asking follow up questions. Gets super excited or confused when asking questions. Is a curious mindset that asks very interesting confirmation questions

Make sure the tangents speaker 2 provides are quite wild or interesting. 

Ensure there are interruptions during explanations or there are "hmm" and "umm" injected throughout from the second speaker. 

It should be a real podcast with every fine nuance documented in as much detail as possible. Welcome the listeners with a super fun overview and keep it really catchy and almost borderline click bait

ALWAYS START YOUR RESPONSE DIRECTLY WITH SPEAKER 1: 
DO NOT GIVE EPISODE TITLES SEPERATELY, LET SPEAKER 1 TITLE IT IN HER SPEECH
DO NOT GIVE CHAPTER TITLES
IT SHOULD STRICTLY BE THE DIALOGUES
"""

class TranscriptGenerator:
    def __init__(self, model_name: str = DEFAULT_MODEL, model_size: Optional[str] = None):
        if model_size and model_size in MODEL_OPTIONS:
            self.model_name = MODEL_OPTIONS[model_size]
        else:
            self.model_name = model_name
        self.model = None
        self.tokenizer = None
    
    def load_model(self):
        """Load the MLX model for transcript generation"""
        if self.model is None:
            self.model, self.tokenizer = load(self.model_name)
    
    def generate_transcript(self, input_text: str, max_tokens: int = 8126, temperature: float = 1.0) -> str:
        """Generate podcast transcript from input text"""
        self.load_model()
        
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": input_text},
        ]
        
        prompt = self.tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        
        transcript = generate(
            model=self.model,
            tokenizer=self.tokenizer,
            prompt=prompt,
            max_tokens=max_tokens,
            temp=temperature,
        )
        
        return transcript
    
    def parse_transcript(self, transcript: str) -> List[Tuple[str, str]]:
        """Parse transcript into speaker segments"""
        segments = []
        lines = transcript.split('\n')
        
        for line in lines:
            line = line.strip()
            if line.startswith('Speaker 1:'):
                segments.append(('Speaker 1', line[10:].strip()))
            elif line.startswith('Speaker 2:'):
                segments.append(('Speaker 2', line[10:].strip()))
            elif line.startswith('**Speaker 1:**'):
                segments.append(('Speaker 1', line[14:].strip()))
            elif line.startswith('**Speaker 2:**'):
                segments.append(('Speaker 2', line[14:].strip()))
        
        return segments
    
    def generate_from_file(self, file_path: str) -> Tuple[str, List[Tuple[str, str]]]:
        """Generate transcript from a text file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            input_text = f.read()
        
        transcript = self.generate_transcript(input_text)
        segments = self.parse_transcript(transcript)
        
        return transcript, segments