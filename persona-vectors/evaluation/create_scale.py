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

def get_final_prompt_activation(model, prompt):
    tokens = model.to_tokens(prompt)
    length = tokens.shape[1]

    num_layers = 26
    with torch.no_grad():
        # Get activations from original model
        _, cache = model.run_with_cache(tokens)

        activations = []
        for layer_idx in range(num_layers):
            # get activation of predicted token
            activations.append(cache[f"blocks.{layer_idx}.hook_resid_mid"][:, -1, :])
        # concatenate across layers
        activation = torch.cat(activations, dim=0) # (26, 2304)

    return activation, length

def vector_projection(a, b):
    """Project vector a onto vector b and return scalar magnitude"""
    dot_product = torch.dot(a, b)
    b_norm_squared = torch.dot(b, b)
    # Return the scalar coefficient, not the full projection vector
    return dot_product / torch.sqrt(b_norm_squared)


def generate_persona_scores(model, system_prompt):

    prompt_activation = get_final_prompt_activation(model, system_prompt)

    folder_path = Path("/root/persona_vectors/stored_persona_vectors")
    # iterate through traits that have stored prompts
    persona_scores = {}
    for vector in folder_path.glob("*.pt"):
        persona_vector = torch.load(vector, weights_only=False)
        projection = vector_projection(prompt_activation[20].flatten(), persona_vector[20].flatten())
        # normalize it using the persona vector
        normalized_score = projection.item()/persona_vector.flatten().norm(p=2).item()
        persona_scores[vector.stem] = normalized_score

    return persona_scores

def main():

    login(token="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")
    torch.manual_seed(42)
    api_key = "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"
    claude = ClaudeAPI(api_key)

    folder_path = Path("stored_persona_vectors")
    prompts_file = Path("system_prompts.json")
    
    print("File already exists:", prompts_file.exists())

    if prompts_file.exists():
        with open(prompts_file, "r") as f:
            system_prompts_dict = json.load(f)
    else:
        system_prompts_dict = {
            'pos': {},
            'neg': {}
        }
        
        for vector in tqdm(list(folder_path.glob("*.pt")), desc="Generating prompts"):
            trait = vector.stem

            # Initialize lists for this trait
            system_prompts_dict['pos'][trait] = {}
            system_prompts_dict['neg'][trait] = {}

            prompt_id = 0

            # Generate 10 variations
            for i in range(10):
                # Generate positive prompt
                for j in range(1, 6):
                    prompt = f"Write a system prompt for an AI assistant that would be extremely {trait} in {j} sentence{'s' if j > 1 else ''}."

                    response = claude.send_message(
                        prompt,
                        model="claude-3-5-haiku-20241022", 
                        temperature=0.8,
                        max_tokens=1024,
                    )

                    message_content = ""
                    if response and response.get("content"):
                        message_content = response["content"][0].get("text", "")

                    system_prompts_dict['pos'][trait][str(prompt_id)] = message_content

                    # Generate negative prompt
                    prompt = f"Write a system prompt for an AI assistant that would be the opposite of {trait} to an extreme degree in {j} sentence{'s' if j > 1 else ''}."

                    response = claude.send_message(
                        prompt,
                        model="claude-3-5-haiku-20241022", 
                        temperature=0.8,
                        max_tokens=1024,
                    )

                    message_content = ""
                    if response and response.get("content"):
                        message_content = response["content"][0].get("text", "")

                    system_prompts_dict['neg'][trait][str(prompt_id)] = message_content
                    prompt_id += 1

            # Save to JSON file
            with open(prompts_file, "w") as f:
                json.dump(system_prompts_dict, f, indent=2)

    
    model = HookedTransformer.from_pretrained("meta-llama/Llama-3.2-3B-Instruct")

    # take max
    results_dict = {
        'pos': {},
        'neg': {}
    }

    layer = 20
    for polarity in ['pos', 'neg']:
        for key in system_prompts_dict[polarity].keys():
            
            # Initialize with negative infinity if not exists
            if key not in results_dict[polarity]:
                results_dict[polarity][key] = 0
            
            # Iterate through indices 0-9
            for idx in system_prompts_dict[polarity][key].keys():
                
                system_prompt = system_prompts_dict[polarity][key][idx]

                prompt_activation, _ = get_final_prompt_activation(model, system_prompt)

                persona_vector = torch.load(f"stored_persona_vectors/{key}.pt", weights_only=False)
                projection = vector_projection(prompt_activation[layer].flatten(), persona_vector[layer].flatten())
                
                # normalize it using the persona vector
                normalized_score = projection.item()/persona_vector.flatten().norm(p=2).item()

                # only keep most extreme score
                if polarity == "pos":
                    if normalized_score > results_dict[polarity][key]:
                        results_dict[polarity][key] = normalized_score
                else:
                    if normalized_score < results_dict[polarity][key]:
                        results_dict[polarity][key] = normalized_score

    with open("persona_scores_scale.json", "w") as f:
        json.dump(results_dict, f, indent=2)


if __name__ == "__main__":
    main()







