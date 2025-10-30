import torch
from huggingface_hub import login
from pathlib import Path
from transformer_lens import HookedTransformer
import json
from tqdm import tqdm
import numpy as np
from scipy import stats
           
        
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
            activations.append(cache[f"blocks.{layer_idx}.hook_resid_post"][:, -1, :])
        # concatenate across layers
        activation = torch.cat(activations, dim=0) # (26, 2304)

    return activation, length

def vector_projection(a, b):
    """Project vector a onto vector b and return scalar magnitude"""
    dot_product = torch.dot(a, b)
    b_norm_squared = torch.dot(b, b)
    # Return the scalar coefficient, not the full projection vector
    return dot_product / torch.sqrt(b_norm_squared)


def calculate_r_squared_by_layer(model, system_prompts_dict):
    """
    Calculate R² values for each trait across all 26 layers
    
    Returns:
        dict: R² values organized by trait and layer
    """
    
    results_by_layer = {}
    
    # Process each trait
    for trait in tqdm(system_prompts_dict['pos'].keys()):
        
        # Store data for all layers
        layer_data = {layer: {'levels': [], 'scores': []} for layer in range(26)}
        
        for polarity in ['pos', 'neg']:
            
            # Iterate through levels 1-5
            for level in system_prompts_dict[polarity][trait].keys():
                
                # Iterate through indices 0-9
                for idx in system_prompts_dict[polarity][trait][level].keys():
                    
                    system_prompt = system_prompts_dict[polarity][trait][level][idx]
                    
                    # Get activation for this prompt
                    prompt_activation, _ = get_final_prompt_activation(model, system_prompt)
                    
                    # Load persona vector
                    persona_vector = torch.load(f"stored_persona_vectors/{trait}.pt", weights_only=False)
                    
                    # Calculate score for each layer
                    for layer_idx in range(26):
                        projection = vector_projection(
                            prompt_activation[layer_idx].flatten(), 
                            persona_vector[layer_idx].flatten()
                        )
                        normalized_score = projection.item() / persona_vector.flatten().norm(p=2).item()
                        
                        # Append to layer data
                        level_value = int(level) if polarity == 'pos' else -int(level)
                        layer_data[layer_idx]['levels'].append(level_value)
                        layer_data[layer_idx]['scores'].append(normalized_score)
        
        # Calculate R² for each layer
        trait_r_squared = {}
        for layer_idx in range(26):
            # Filter to only include levels 1-5
            filtered_levels = []
            filtered_scores = []
            for level, score in zip(layer_data[layer_idx]['levels'], layer_data[layer_idx]['scores']):
                if 1 <= level <= 5:
                    filtered_levels.append(level)
                    filtered_scores.append(score)
            
            # Convert to numpy arrays
            x = np.array(filtered_levels)
            y = np.array(filtered_scores)
            
            # Calculate R² for linear fit
            if len(x) > 2:  # Need at least 3 points for regression
                slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
                r_squared = r_value ** 2
            else:
                r_squared = 0.0
            
            trait_r_squared[f"layer_{layer_idx}"] = r_squared
        
        results_by_layer[trait] = trait_r_squared
        
    return results_by_layer


def print_summary_statistics(results_by_layer):
    """Print summary statistics about R² values across layers"""
    
    # Calculate average R² for each layer across all traits
    layer_averages = {}
    for layer_idx in range(26):
        layer_key = f"layer_{layer_idx}"
        r2_values = [results_by_layer[trait][layer_key] for trait in results_by_layer.keys()]
        layer_averages[layer_idx] = np.mean(r2_values)
    
    print("\nAverage R² across all traits:")
    for layer_idx in range(26):
        print(f"  Layer {layer_idx:2d}: {layer_averages[layer_idx]:.4f}")
    
    print(f"\nBest layer: Layer {max(layer_averages, key=layer_averages.get)} (R² = {max(layer_averages.values()):.4f})")


def main():

    login(token="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")
    torch.manual_seed(42)
    
    prompts_file = Path("system_prompts_5.json")
    
    with open(prompts_file, "r") as f:
        system_prompts_dict = json.load(f)
    
    model = HookedTransformer.from_pretrained("meta-llama/Llama-3.2-3B-Instruct")
    
    print("\nCalculating R² values across all layers...")
    results_by_layer = calculate_r_squared_by_layer(model, system_prompts_dict)
    
    # Save results to JSON
    output_file = "r_squared_by_layer.json"
    with open(output_file, "w") as f:
        json.dump(results_by_layer, f, indent=2)
    
    # Print summary statistics
    print_summary_statistics(results_by_layer)


if __name__ == "__main__":
    main()