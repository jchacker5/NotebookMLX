"""
PDF Processing Module
Converts PDFs to clean text using Qwen2.5-1.5B model
"""
import os
from typing import Optional, List
import PyPDF2
from mlx_lm import load, generate
from tqdm import tqdm

DEFAULT_MODEL = "mlx-community/Qwen3-8B-4bit"
DEFAULT_QUANTIZATION = "4bit"  # Options: "4bit", "8bit", None

SYS_PROMPT = """
You are a world class text pre-processor, here is the raw data from a PDF, please parse and return it in a way that is crispy and usable to send to a podcast writer.

The raw data is messed up with new lines, Latex math and you will see fluff that we can remove completely. Basically take away any details that you think might be useless in a podcast author's transcript.

Remember, the podcast could be on any topic whatsoever so the issues listed above are not exhaustive

Please be smart with what you remove and be creative ok?

Remember DO NOT START SUMMARIZING THIS, YOU ARE ONLY CLEANING UP THE TEXT AND RE-WRITING WHEN NEEDED

Be very smart and aggressive with removing details, you will get a running portion of the text and keep returning the processed text.

PLEASE DO NOT ADD MARKDOWN FORMATTING, STOP ADDING SPECIAL CHARACTERS THAT MARKDOWN CAPATILISATION ETC LIKES

ALWAYS start your response directly with processed text and NO ACKNOWLEDGEMENTS about my questions ok?
Here is the text:
"""

class PDFProcessor:
    def __init__(self, model_name: str = DEFAULT_MODEL, quantization: Optional[str] = DEFAULT_QUANTIZATION):
        self.model_name = model_name
        self.quantization = quantization
        self.model = None
        self.tokenizer = None
        
    def load_model(self):
        """Load the MLX model for text processing"""
        if self.model is None:
            # Adjust model name based on quantization
            model_id = self.model_name
            if self.quantization and not model_id.endswith(f"-{self.quantization}"):
                model_id = model_id.replace("-4bit", "").replace("-8bit", "")
                model_id = f"{model_id}-{self.quantization}"
            self.model, self.tokenizer = load(model_id)
    
    def validate_pdf(self, file_path: str) -> bool:
        """Validate if the file is a valid PDF"""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        if not file_path.lower().endswith('.pdf'):
            raise ValueError("File is not a PDF")
        return True
    
    def extract_text_from_pdf(self, file_path: str, max_chars: int = 100000) -> Optional[str]:
        """Extract text from PDF file"""
        self.validate_pdf(file_path)
        
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                num_pages = len(pdf_reader.pages)
                
                extracted_text = []
                total_chars = 0
                
                for page_num in range(num_pages):
                    page = pdf_reader.pages[page_num]
                    text = page.extract_text()
                    
                    if total_chars + len(text) > max_chars:
                        remaining_chars = max_chars - total_chars
                        extracted_text.append(text[:remaining_chars])
                        break
                    
                    extracted_text.append(text)
                    total_chars += len(text)
                
                return '\n'.join(extracted_text)
                
        except PyPDF2.PdfReadError:
            raise ValueError("Invalid or corrupted PDF file")
    
    def create_word_bounded_chunks(self, text: str, target_chunk_size: int = 1000) -> List[str]:
        """Split text into chunks at word boundaries"""
        words = text.split()
        chunks = []
        current_chunk = []
        current_length = 0
        
        for word in words:
            word_length = len(word) + 1
            if current_length + word_length > target_chunk_size and current_chunk:
                chunks.append(' '.join(current_chunk))
                current_chunk = [word]
                current_length = word_length
            else:
                current_chunk.append(word)
                current_length += word_length
        
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks
    
    def process_chunk(self, text_chunk: str) -> str:
        """Process a chunk of text using the model"""
        conversation = [
            {"role": "system", "content": SYS_PROMPT},
            {"role": "user", "content": text_chunk},
        ]
        
        prompt = self.tokenizer.apply_chat_template(
            conversation, tokenize=False, add_generation_prompt=True
        )
        
        processed_text = generate(
            model=self.model,
            tokenizer=self.tokenizer,
            prompt=prompt,
            max_tokens=512,
            temp=0.7,
        )
        
        return processed_text
    
    def process_pdf(self, file_path: str, output_path: Optional[str] = None) -> str:
        """Main method to process PDF file"""
        self.load_model()
        
        # Extract text from PDF
        raw_text = self.extract_text_from_pdf(file_path)
        if not raw_text:
            raise ValueError("No text extracted from PDF")
        
        # Chunk the text
        chunks = self.create_word_bounded_chunks(raw_text)
        
        # Process each chunk
        processed_chunks = []
        for chunk in tqdm(chunks, desc="Processing chunks"):
            processed_chunk = self.process_chunk(chunk)
            processed_chunks.append(processed_chunk)
        
        # Combine processed text
        final_text = '\n'.join(processed_chunks)
        
        # Save if output path provided
        if output_path:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(final_text)
        
        return final_text