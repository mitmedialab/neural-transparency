import torch
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import numpy as np
import json

def load_traits(traits_file: str = "stored_persona_vectors/traits.json") -> dict:
    """Load the traits from the JSON file"""
    with open(traits_file, 'r') as f:
        return json.load(f)

def visualize_persona_vector(vector_path: str, trait_name: str, 
                            n_cols: int = None, figsize=None):
    """
    Visualize a persona vector as a rectangular heatmap
    
    Args:
        vector_path (str): Path to the .pt file containing the persona vector
        trait_name (str): Name of the trait for the title
        n_cols (int): Number of columns in the rectangular grid (if None, auto-calculated)
        figsize (tuple): Figure size for the plot (if None, auto-calculated)
    """
    # Load the persona vector
    persona_vector = torch.load(vector_path, weights_only=False)[20]
    
    # Convert to numpy for plotting
    vector_array = persona_vector.cpu().numpy()
    
    # Ensure it's 1D
    if len(vector_array.shape) > 1:
        vector_array = vector_array.flatten()
    
    # Get actual dimensions
    hidden_dim = len(vector_array)
    
    n_cols = 128
    n_rows = int(hidden_dim/128)

    # Auto-calculate figsize if not provided
    if figsize is None:
        width = min(15, n_cols / 10)
        height = max(3, n_rows / 10)
        figsize = (width, height)
    
    # Pad the vector if necessary to fill the rectangle
    padded_length = n_rows * n_cols
    if padded_length > hidden_dim:
        vector_array = np.pad(vector_array, (0, padded_length - hidden_dim), 
                             mode='constant', constant_values=np.nan)
    
    # Reshape to rectangular grid
    vector_grid = vector_array.reshape(n_rows, n_cols)
    
    # Create the continuous heatmap
    plt.figure(figsize=figsize)
    
    # Use imshow for continuous visualization
    im = plt.imshow(vector_grid, 
                    cmap='RdBu_r',
                    aspect='auto',
                    interpolation='bilinear')
    
    # Make colors more extreme by using percentile-based scaling
    # This ignores outliers and uses the bulk of the data range
    valid_data = vector_grid[~np.isnan(vector_grid)]
    vmin, vmax = np.percentile(valid_data, [2, 98])
    
    # Make it symmetric around 0 for diverging colormap
    abs_max = max(abs(vmin), abs(vmax))
    im.set_clim(-abs_max, abs_max)
    
    plt.colorbar(im, label='Activation Value')
    plt.title(f'Persona Vector: {trait_name}', fontsize=14, pad=10)
    plt.tight_layout()
    
    return plt.gcf()

def visualize_all_persona_vectors_from_traits(
    traits_file: str = "stored_persona_vectors/traits.json",
    vectors_folder: str = "stored_persona_vectors",
    save_dir: str = "persona_visualizations",
    n_cols: int = None
):
    """
    Visualize all persona vectors based on traits.json
    
    Args:
        traits_file (str): Path to the traits JSON file
        vectors_folder (str): Path to folder containing .pt files
        save_dir (str): Directory to save visualizations
        n_cols (int): Number of columns in rectangular grid (None for auto)
    """
    # Load traits
    traits_dict = load_traits(traits_file)
    
    # Create save directory if it doesn't exist
    save_path = Path(save_dir)
    save_path.mkdir(exist_ok=True)
    
    vectors_path = Path(vectors_folder)
    
    # Iterate through all traits
    for trait in traits_dict.keys():
        vector_file = vectors_path / f"{trait}.pt"
        
        if not vector_file.exists():
            print(f"Warning: Vector file not found for trait '{trait}' at {vector_file}")
            continue
        
        print(f"Visualizing {trait}...")
        
        try:
            fig = visualize_persona_vector(str(vector_file), trait, n_cols=n_cols)
            
            # Save the figure
            output_file = save_path / f"{trait}_heatmap.png"
            plt.savefig(output_file, dpi=300, bbox_inches='tight')
            plt.close()
            
            print(f"Saved to {output_file}")
        except Exception as e:
            print(f"Error visualizing {trait}: {e}")

# Example usage
if __name__ == "__main__":

    visualize_all_persona_vectors_from_traits()
    