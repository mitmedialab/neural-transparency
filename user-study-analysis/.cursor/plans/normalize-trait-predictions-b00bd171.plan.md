<!-- b00bd171-0ebf-487f-85c6-108ffb6b453f 9134638a-c92f-4c42-a492-89b69d007e0a -->
# Normalize Trait Predictions to Match Activation Space

## Overview

Convert predicted trait ratings (0-10 scale) to normalized activations (0-1 scale) to enable comparison with actual persona vector activations.

## Transformation Logic

For each trait with value on 0-10 scale where 5 is neutral:

- **If prediction > 5**: Right pole activation = (prediction - 5) / 5, Left pole = 0
- **If prediction < 5**: Left pole activation = (5 - prediction) / 5, Right pole = 0  
- **If prediction = 5**: Both poles = 0

## Trait Pole Mappings

Based on slider orientations:

1. **Empathy**: Unempathetic (left/0) ↔ Empathetic (right/10)
2. **Encouraging**: Discouraging (left/0) ↔ Encouraging (right/10)
3. **Sociality**: Antisocial (left/0) ↔ Social (right/10)
4. **Honesty**: Sycophantic (left/0) ↔ Honest (right/10)
5. **Hallucination**: Hallucinatory (left/0) ↔ Factual (right/10)
6. **Toxicity**: Toxic (left/0) ↔ Respectful (right/10)
7. **Funniness**: Serious (left/0) ↔ Funny (right/10)
8. **Formality**: Formal (left/0) ↔ Casual (right/10)

## Implementation

### File: `unpack_data.ipynb`

Add new cell after cell 27 (after the display of expected vs actual traits):

1. Create normalization function that converts 0-10 predictions to two normalized 0-1 values (one per pole)

2. Apply transformation to create new normalized columns in `df_expected_vs_actual`:

- `empathy_empathetic_norm`, `empathy_unempathetic_norm`
- `encouraging_encouraging_norm`, `encouraging_discouraging_norm`
- `formality_casual_norm`, `formality_formal_norm`
- `funniness_funny_norm`, `funniness_serious_norm`
- `hallucination_factual_norm`, `hallucination_hallucinatory_norm`
- `honesty_honest_norm`, `honesty_sycophantic_norm`
- `sociality_social_norm`, `sociality_antisocial_norm`
- `toxicity_respectful_norm`, `toxicity_toxic_norm`

3. Display comparison showing original predictions alongside normalized activations and actual activations

4. Save updated dataframe to `data_clean/persona_prediction_normalized.csv`

## Output

The normalized predictions will enable direct comparison between:

- User's predicted trait activations (now 0-1 scale)
- Actual persona vector activations (already 0-1 scale)