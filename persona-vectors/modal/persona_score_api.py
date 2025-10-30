import modal
from huggingface_hub import login
from typing import Dict, Optional
from pydantic import BaseModel
from fastapi import Header, HTTPException

# Define the image with all dependencies
image = (
    modal.Image.debian_slim()
    .pip_install(
        "torch",
        "transformers",
        "huggingface_hub",
        "accelerate",
        "fastapi[standard]",
        "transformer_lens"
    )
    .add_local_dir(
        "/persona_vectors/stored_persona_vectors",  # Your local path
        remote_path="/root/stored_persona_vectors"  # Path inside container
    )
)

app = modal.App("persona-vector-api")

class SystemPrompt(BaseModel):
    system: Optional[str] = None

class PersonaVectorResponse(BaseModel):
    persona_vector_ratings: Dict[str, Dict[str, float]]

@app.cls(
    image=image,
    gpu="L40S",
    scaledown_window=300,
    timeout=200
)
class PersonaScoreAPI:
    hf_token: str = modal.parameter()
    api_key: str = modal.parameter()
    
    @modal.enter()
    def load_model(self):
        login(token=self.hf_token)
        
        model_name = "meta-llama/Llama-3.2-3B-Instruct"

        # Load hooked transformer for persona vectors
        from transformer_lens import HookedTransformer
        self.hooked_model = HookedTransformer.from_pretrained(model_name)
        
    
    @modal.method()
    def verify_api_key(self, provided_key: str) -> bool:
        """Verify the provided API key"""
        return provided_key == self.api_key
    
    @modal.method()
    def generate_persona_scores_method(self, system_prompt: str) -> Dict[str, float]:
        """Generate persona scores using the hooked model"""

        import requests
        import torch
        from huggingface_hub import login
        from pathlib import Path
        from transformer_lens import HookedTransformer
        import json
        from tqdm import tqdm
        import os

        def get_final_prompt_activation(model, prompt):
            tokens = model.to_tokens(prompt)

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

            return activation

        def vector_projection(a, b):
            """Project vector a onto vector b and return scalar magnitude"""
            dot_product = torch.dot(a, b)
            b_norm_squared = torch.dot(b, b)
            # Return the scalar coefficient, not the full projection vector
            return dot_product / torch.sqrt(b_norm_squared)

        def generate_persona_scores(model, system_prompt):

            prompt_activation = get_final_prompt_activation(model, system_prompt)

            folder_path = Path("/root/stored_persona_vectors")
            with open(folder_path / 'traits.json', 'r') as f:
                traits = json.load(f)

            # iterate through traits that have stored prompts
            persona_scores = {}
            for trait in traits.keys():
                persona_scores[trait] = {}
                persona_vector = torch.load(folder_path / f"{trait}.pt", weights_only=False)
                projection = vector_projection(prompt_activation.flatten(), persona_vector.flatten())
                # normalize it using the persona vector
                normalized_score = projection.item()/persona_vector.flatten().norm(p=2).item()

                # rescale score
                with open(folder_path / "persona_scores_scale.json", "r") as f:
                    scale = json.load(f)

                if normalized_score > 0:
                    scaled_score = normalized_score / scale["pos"][trait]

                    persona_scores[trait][traits[trait]["positive"]] = min(scaled_score, 1.0)
                    persona_scores[trait][traits[trait]["negative"]] = 0.0

                else:
                    scaled_score = normalized_score / -scale["neg"][trait]

                    persona_scores[trait][traits[trait]["positive"]] = 0.0
                    persona_scores[trait][traits[trait]["negative"]] = min(-scaled_score, 1.0)

                print(trait, normalized_score, scaled_score)

            return persona_scores

        return generate_persona_scores(self.hooked_model, system_prompt)
    
# Persona vector endpoint
@app.function(image=image)
@modal.fastapi_endpoint(method="POST")
def persona_vector_endpoint(
    request: SystemPrompt,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    try:
        persona_score_api = PersonaScoreAPI()
        
        if not x_api_key:
            raise HTTPException(status_code=401, detail="API key is required. Include X-API-Key header.")
        
        is_valid = persona_score_api.verify_api_key.remote(x_api_key)
        if not is_valid:
            raise HTTPException(status_code=403, detail="Invalid API key")
        
        # Call the method remotely
        persona_vector_ratings = persona_score_api.generate_persona_scores_method.remote(request.system)
        
        return PersonaVectorResponse(
            persona_vector_ratings=persona_vector_ratings,  # Already a dict, don't use json.dumps
            system_prompt=request.system or ""
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in persona vector endpoint: {e}")
        return {
            "error": {
                "message": f"Internal server error: {str(e)}",
                "type": "internal_error"
            }
        }