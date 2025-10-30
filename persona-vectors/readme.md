## Overview

/generation - code to generate persona vectors based on selected traits
generate_prompts.py - Use Claude to generate constrastive system prompts, situation questions, and evaluation prompt
generate_persona_vectors.py - Use Llama and created prompts to create persona vectors


/evaluation - code to create scaling for interface, evaluate persona vectors with linear regression, create graphs
activations_viz.py - visualize values of activations in persona vector
create_regression_data.py - create synthetic system prompts for linear regression analysis
create_scale.py - create synthetic system prompts for finding scale for persona scores
eval_layers_regression.py - do linear regression on each of the layers of the persona vector and compare average R squared
eval_and_graph_regression - do linear regression using synthetic system prompts and create graphs

/modal - contains code to launch chat and persona score generation endpoints

