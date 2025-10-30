import requests
from typing import List, Dict, Optional
from typing import List, Dict, Optional
import torch
from huggingface_hub import login
from pathlib import Path
from transformer_lens import HookedTransformer
import json
from tqdm import tqdm
import os
import time
import argparse

def parse_args():
    parser = argparse.ArgumentParser(description='Generate persona vectors from contrastive prompts')
    parser.add_argument('--trait', type=str, help='Comma-separated list of traits (e.g., empathy,sycophancy,humor)')
    return parser.parse_args()

class OpenAIAPI:
    def __init__(self, api_key: str):
        """
        Initialize OpenAI API client
        
        Args:
            api_key (str): Your OpenAI API key
        """
        self.api_key = api_key
        self.base_url = "https://api.openai.com/v1/chat/completions"
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
    
    def send_message(self, 
                    message: str, 
                    model: str = "gpt-4.1-mini",  # Updated to gpt-4.1-mini
                    max_tokens: int = 1000,
                    temperature: float = 0.2,
                    system_prompt: Optional[str] = None) -> dict:
        """
        Send a message to GPT-4
        
        Args:
            message (str): The message to send to GPT-4
            model (str): Model to use (gpt-4, gpt-4-turbo, gpt-3.5-turbo, etc.)
            max_tokens (int): Maximum tokens in response
            system_prompt (str): Optional system prompt
            
        Returns:
            dict: API response
        """
        
        # Prepare the messages
        messages = []
        
        # Add system prompt if provided
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        # Add user message
        messages.append({"role": "user", "content": message})
        
        # Prepare the payload
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,  # Fixed: Changed from max_completion_tokens
            "temperature": temperature
        }
        
        try:
            response = requests.post(
                self.base_url,
                headers=self.headers,
                json=payload,
                timeout=60  # Increased timeout
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

def save_json(data: dict, filepath: str):
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

def get_mean_response_activation(model, system_prompt, prompt, max_length, num_rollouts):
    # full_prompt = f"You are an AI assistant. {system_prompt} Answer the following question with a few sentences. {prompt}"

    messages = [
        {"role": "system", "content": f"You are an AI assistant. {system_prompt}"},
        {"role": "user", "content": f"Answer the following question with a few sentences. {prompt}"}
    ]
    full_prompt = model.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)


    tokens = model.to_tokens(full_prompt)
    instruction_length = len(full_prompt)

    batch_tokens = tokens.repeat(num_rollouts, 1)

    temperature = 0.8
    all_activations = []
    for _ in range(max_length):
        num_layers = 26
        with torch.no_grad():
            # Get activations from original model
            logits, cache = model.run_with_cache(batch_tokens)

            activations = []
            for layer_idx in range(num_layers):
                # get activation of predicted token
                activations.append(cache[f"blocks.{layer_idx}.hook_resid_post"][:, -1, :]) 
            # concatenate across layers
            activations = torch.stack(activations, dim=1) 
            all_activations.append(activations)

            # sample
            top_10_logits, top_10_logit_indices = torch.topk(logits[:, -1, :], k=10, dim=-1)
            sampled_tokens = torch.multinomial(torch.softmax(top_10_logits/temperature, dim=-1), 1)
            next_token = top_10_logit_indices[torch.arange(num_rollouts), sampled_tokens.squeeze(-1)]

            batch_tokens = torch.cat((batch_tokens, next_token.unsqueeze(1)), dim=1)

    responses = []
    for i in range(batch_tokens.shape[0]):

        response = model.to_string(batch_tokens[i:i+1, :])[0][instruction_length+len("end_header_id|>\n\n"):]
        eot_index = response.find("<|eot_id|>") 

        if eot_index != -1:
            response = response[:eot_index]

        responses.append(response)

    all_activations_tensor = torch.stack(all_activations) # (seq_length, 26, 3072)
    mean_activations = all_activations_tensor.mean(dim=0)

    return responses, mean_activations


def main():
    login(token=os.environ.get('HF_API_KEY'))
    openai = OpenAIAPI(api_key=os.environ.get('ANTHROPIC_API_KEY'))
    torch.manual_seed(42)
    args = parse_args()

    model = HookedTransformer.from_pretrained("meta-llama/Llama-3.2-3B-Instruct")

    folder_path = Path("stored_prompts/")
    num_instructions = 5
    num_questions = 40
    num_rollouts = 1
    max_length = 150
    # ~90 min on A100

    print("total completions:", 2*num_instructions*num_questions*num_rollouts)
    total = 0
    # iterate through traits that have stored prompts
    for folder in folder_path.iterdir():
        trait = folder.name
        if trait == args.trait:
            print("trait: " + trait)  

            # Initialize responses dictionary for this trait
            all_responses = {
                "pos": [],
                "neg": []
            }

            contrastive_system_prompt = load_json(f"stored_prompts/{trait}/contrastive_system_prompt.json")
            question_generation_prompt = load_json(f"stored_prompts/{trait}/question_generation_prompt.json")
            trait_evaluation_prompt = load_json(f"stored_prompts/{trait}/trait_evaluation_prompt.json")

            # calculate persona vector
            positive_mean_activations_total = []
            negative_mean_activations_total = []
            for instruction in contrastive_system_prompt["instruction"][:num_instructions]:

                # generate positive responses
                positive_system_prompt = instruction["pos"]
                for question in question_generation_prompt["questions"][:num_questions]:

                    start = time.time()
                    # get response and mean activation of response
                    responses, pos_mean_activations = get_mean_response_activation(model, positive_system_prompt, question, max_length, num_rollouts)

                    for rollout_index in range(num_rollouts):

                        # Save positive response
                        all_responses["pos"].append({
                            "response": responses[rollout_index]
                        })

                        openai_response = openai.send_message(
                            trait_evaluation_prompt["eval_prompt"] + "RESPONSE:" + responses[rollout_index],
                            model="gpt-4.1-mini",
                            temperature=1,
                            max_tokens=500,
                        )
                    
                        evaluation = openai_response.get("choices", [{}])[0].get("message", {}).get("content", "")

                        # print('RESPONSE', responses[rollout_index])
                        # print("EVAL", evaluation)

                        total += 1

                        try:
                            if int(evaluation) >= 50:
                                positive_mean_activations_total.append(pos_mean_activations[rollout_index])
                        except:
                            continue

                # generate negative responses
                negative_system_prompt = instruction["neg"]
                for question in question_generation_prompt["questions"][:num_questions]:

                    # get response and mean activation of response
                    responses, neg_mean_activations = get_mean_response_activation(model, negative_system_prompt, question, max_length, num_rollouts)

                    for rollout_index in range(num_rollouts):

                        # Save negative response
                        all_responses["neg"].append({
                            "response": responses[rollout_index]
                        })

                        openai_response = openai.send_message(
                            trait_evaluation_prompt["eval_prompt"] + "RESPONSE:" + responses[rollout_index],
                            model="gpt-4.1-mini",
                            temperature=1,
                            max_tokens=500,
                        )
                    
                        evaluation = openai_response.get("choices", [{}])[0].get("message", {}).get("content", "")                   

                        # print('RESPONSE', responses[rollout_index])
                        # print("EVAL", evaluation)

                        total += 1

                        try:
                            if int(evaluation) <= 50:
                                negative_mean_activations_total.append(neg_mean_activations[rollout_index])
                        except:
                            continue

                    print(total)

            print("number of positive responses: ", len(positive_mean_activations_total))
            print("number of negative responses: ", len(negative_mean_activations_total))

            mean_positive_activation = torch.stack(positive_mean_activations_total).mean(dim=0)
            mean_negative_activation = torch.stack(negative_mean_activations_total).mean(dim=0)

            persona_vector = mean_positive_activation - mean_negative_activation

            os.makedirs("persona_vectors", exist_ok=True)
            torch.save(persona_vector, f"persona_vectors/{trait}_persona_vector.pt")
            print(f"{trait}_persona_vector.pt saved")

            os.makedirs("llama_responses", exist_ok=True)
            save_json(all_responses, f"llama_responses/{trait}_responses.json")
            print(f"Saved responses to llama_responses/{trait}_responses.json")

if __name__ == "__main__":
    main()