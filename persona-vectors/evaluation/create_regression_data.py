import requests
import torch
from huggingface_hub import login
from pathlib import Path
from transformer_lens import HookedTransformer
import json
from tqdm import tqdm
import os
from typing import Optional
           
class ClaudeAPI:
    def __init__(self, api_key: str):
        """
        Initialize Claude API client
        
        Args:
            api_key (str): Your Anthropic API key
        """
        self.api_key = api_key
        self.base_url = "https://api.anthropic.com/v1/messages"
        self.headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01"
        }
    
    def send_message(self, 
                    message: str, 
                    model: str = "claude-3-5-sonnet-20241022",
                    max_tokens: int = 1000,
                    temperature: float = 0.2,
                    system_prompt: Optional[str] = None) -> dict:
        """
        Send a message to Claude
        
        Args:
            message (str): The message to send to Claude
            model (str): Model to use (claude-3-5-haiku-20241022, etc.)
            max_tokens (int): Maximum tokens in response
            temperature (float): Controls randomness (0.0-1.0)
            system_prompt (str): Optional system prompt
            
        Returns:
            dict: API response
        """
        
        # Prepare the messages
        messages = [{"role": "user", "content": message}]
        
        # Prepare the payload
        payload = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": messages
        }
        
        # Add system prompt if provided
        if system_prompt:
            payload["system"] = system_prompt
        
        try:
            response = requests.post(
                self.base_url,
                headers=self.headers,
                json=payload,
                timeout=60
            )
            
            # Check if request was successful
            response.raise_for_status()
            
            return response.json()
            
        except requests.exceptions.RequestException as e:
            print(f"Error making API request: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response content: {e.response.text}")
            return None
        
def load_json(filepath: str) -> dict:
    with open(filepath, 'r') as f:
        return json.load(f)

def main():

    login(token="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")
    torch.manual_seed(42)
    api_key = "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"
    claude = ClaudeAPI(api_key)

    traits_file = Path("../persona_vectors/stored_persona_vectors/traits.json")
    prompts_file = Path("system_prompts_5.json")
    
    print("File already exists:", prompts_file.exists())
    with open(traits_file, "r") as f:
        traits_dict = json.load(f)

    if prompts_file.exists():
        with open(prompts_file, "r") as f:
            system_prompts_dict = json.load(f)
    else:
        system_prompts_dict = {
            'pos': {},
            'neg': {}
        }
        
        for trait in tqdm(traits_dict.keys()):
            # Initialize lists for this trait
            system_prompts_dict['pos'][trait] = {}
            system_prompts_dict['neg'][trait] = {}

            # Generate 10 variations for each level
            for level in range(1, 6):  # Levels 1-10
                # Initialize level dictionaries
                system_prompts_dict['pos'][trait][str(level)] = {}
                system_prompts_dict['neg'][trait][str(level)] = {}
                
                for i in range(10): 
                    # Generate positive prompt
                    prompt = f"Write a system prompt for an AI assistant that would express {trait} at a level of {level} on a scale of 1-5 in three sentences."

                    response = claude.send_message(
                        prompt,
                        model= "claude-sonnet-3-5",
                        temperature=0.8,
                        max_tokens=1024,
                    )
                    message_content = response.get("content", [{}])[0].get("text", "")
                    
                    system_prompts_dict['pos'][trait][str(level)][str(i)] = message_content

                    # Save to JSON file
                    with open(prompts_file, "w") as f:
                        json.dump(system_prompts_dict, f, indent=2)

if __name__ == "__main__":
    main()







