import torch
from huggingface_hub import login
from pathlib import Path
from transformer_lens import HookedTransformer
import json
from tqdm import tqdm
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt
           
        
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


def calculate_r_squared_layer_20(model, system_prompts_dict):
    """
    Calculate R² values for each trait at layer 20 only
    
    Returns:
        dict: R² values for layer 20 organized by trait
        dict: layer_data for layer 20 organized by trait (for plotting)
    """
    
    results_layer_20 = {}
    all_layer_data = {}
    
    layer_idx = 20  # Only calculate for layer 20
    
    # Process each trait
    for trait in tqdm(system_prompts_dict['pos'].keys()):
        
        # Store data for layer 20 only
        layer_data = {'levels': [], 'scores': []}
        
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
                    
                    # Calculate score for layer 20 only
                    projection = vector_projection(
                        prompt_activation[layer_idx].flatten(), 
                        persona_vector[layer_idx].flatten()
                    )
                    normalized_score = projection.item() / persona_vector.flatten().norm(p=2).item()
                    
                    # Append to layer data
                    level_value = int(level) if polarity == 'pos' else -int(level)
                    layer_data['levels'].append(level_value)
                    layer_data['scores'].append(normalized_score)
        
        # Store layer data for this trait
        all_layer_data[trait] = layer_data
        
        # Calculate R² for layer 20
        # Filter to only include levels 1-5
        filtered_levels = []
        filtered_scores = []
        for level, score in zip(layer_data['levels'], layer_data['scores']):
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
        
        results_layer_20[trait] = r_squared
        
    return results_layer_20, all_layer_data


def plot_layer_20_graphs(all_layer_data, results_layer_20):
    """Create line graphs for each trait showing level vs score relationship for layer 20"""
    
    # Create output directory for plots
    output_dir = Path("layer_20_plots")
    output_dir.mkdir(exist_ok=True)
    
    for trait in tqdm(all_layer_data.keys(), desc="Creating layer 20 plots"):
        
        layer_data = all_layer_data[trait]
        levels = layer_data['levels']
        scores = layer_data['scores']
        
        # Filter to only include levels 1-5
        filtered_levels = []
        filtered_scores = []
        for level, score in zip(levels, scores):
            if 1 <= level <= 5:
                filtered_levels.append(level)
                filtered_scores.append(score)
        
        # Convert to numpy arrays
        x = np.array(filtered_levels)
        y = np.array(filtered_scores)
        
        # Calculate R² for linear fit
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
        r_squared = r_value ** 2
        
        # Create figure
        fig = plt.figure(figsize=(10, 6))
        
        # Set font to Helvetica, with fallback to Arial or sans-serif
        plt.rcParams['font.sans-serif'] = ['Helvetica', 'Arial', 'DejaVu Sans']
        plt.rcParams['font.family'] = 'sans-serif'
        
        # Plot all points in gray
        plt.scatter(filtered_levels, filtered_scores, alpha=0.8, s=40, edgecolors='none', color='gray')
        
        # Calculate confidence interval
        n = len(x)
        x_fit = np.linspace(1, 5, 100)
        y_fit = slope * x_fit + intercept
        
        # Calculate prediction interval
        predict_error = y - (slope * x + intercept)
        residual_std = np.sqrt(np.sum(predict_error**2) / (n - 2))
        
        # Standard error of prediction
        x_mean = np.mean(x)
        sxx = np.sum((x - x_mean)**2)
        se = residual_std * np.sqrt(1/n + (x_fit - x_mean)**2 / sxx)
        
        # 95% confidence interval (t-distribution)
        t_val = stats.t.ppf(0.975, n - 2)  # 95% confidence
        ci = t_val * se
        
        # Plot confidence interval
        plt.fill_between(x_fit, y_fit - ci, y_fit + ci, alpha=0.2, color='red')
        
        # Plot linear regression line
        plt.plot(x_fit, y_fit, 'r--', linewidth=3, alpha=0.8, 
                label=f'Linear fit (R² = {r_squared:.3f})')
        
        # Formatting
        plt.xlabel('Trait Expression Level', fontsize=25)
        plt.ylabel('Persona Score', fontsize=25)
        plt.title(f'{trait.replace("_", " ").title()} - Layer 20', fontsize=20, fontweight='bold')
        plt.legend(loc='upper left', fontsize=20)
        
        # Add zero line
        plt.axhline(y=0, color='black', linestyle='--', alpha=0.3)
        
        # Set x-axis to show 1-5
        plt.xlim(0.5, 5.5)
        plt.xticks([1, 2, 3, 4, 5], fontsize=20)
        plt.yticks(fontsize=20)
        
        # Save plot as image
        plt.tight_layout()
        output_path = output_dir / f"{trait}_layer20_graph.png"
        fig.savefig(output_path, dpi=300, bbox_inches='tight', format='png')
        plt.close(fig)
        
    
    print(f"\nAll layer 20 plots saved to {output_dir}/")


def print_summary_statistics(results_layer_20):
    """Print summary statistics about R² values for layer 20"""
    
    print("\n" + "="*70)
    print("R² VALUES FOR LAYER 20")
    print("="*70)
    
    # Sort traits by R² value
    sorted_traits = sorted(results_layer_20.items(), key=lambda x: x[1], reverse=True)
    
    for trait, r2 in sorted_traits:
        print(f"  {trait:30s}: {r2:.4f}")


def main():

    login(token="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")
    torch.manual_seed(42)
    
    # Make sure matplotlib doesn't try to open windows
    plt.ioff()
    
    prompts_file = Path("system_prompts_5.json")
    
    with open(prompts_file, "r") as f:
        system_prompts_dict = json.load(f)
    
    model = HookedTransformer.from_pretrained("meta-llama/Llama-3.2-3B-Instruct")
    
    results_layer_20, all_layer_data = calculate_r_squared_layer_20(model, system_prompts_dict)
    
    # Save results to JSON
    output_file = "r_squared_layer_20.json"
    with open(output_file, "w") as f:
        json.dump(results_layer_20, f, indent=2, sort_keys=True)
    
    # Create plots for layer 20
    plot_layer_20_graphs(all_layer_data, results_layer_20)
    


if __name__ == "__main__":
    main()