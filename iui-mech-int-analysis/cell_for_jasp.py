import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

df = pd.read_csv('model_data/persona_prediction.csv')

# Define all traits with poles
trait_poles = [
    ('empathy', 'empathy', 'empathetic', 'Empathetic'),
    ('empathy', 'empathy', 'unempathetic', 'Unempathetic'),
    ('encouraging', 'encouraging', 'encouraging', 'Encouraging'),
    ('encouraging', 'encouraging', 'discouraging', 'Discouraging'),
    ('formality', 'formality', 'casual', 'Casual'),
    ('formality', 'formality', 'formal', 'Formal'),
    ('funniness', 'funniness', 'funny', 'Funny'),
    ('funniness', 'funniness', 'serious', 'Serious'),
    ('hallucination', 'hallucination', 'factual', 'Factual'),
    ('hallucination', 'hallucination', 'hallucinatory', 'Hallucinatory'),
    ('sycophancy', 'honesty', 'honest', 'Honest'),
    ('sycophancy', 'honesty', 'sycophantic', 'Sycophantic'),
    ('sociality', 'sociality', 'social', 'Social'),
    ('sociality', 'sociality', 'antisocial', 'Antisocial'),
    ('toxicity', 'toxicity', 'respectful', 'Respectful'),
    ('toxicity', 'toxicity', 'toxic', 'Toxic'),
]

# Prepare data for JASP - create dataframe with mean predicted and mean actual for each pole
jasp_summary = []

for trait_act, trait_norm, pole, label in trait_poles:
    pred_col = f'{trait_norm}_{pole}_norm_polar'
    act_col = f'{trait_act}_{pole}_polar'
    
    mean_pred = df[pred_col].abs().mean()
    mean_act = df[act_col].abs().mean()
    
    jasp_summary.append({
        'trait_pole': label,
        'trait': trait_norm,
        'pole': pole,
        'mean_predicted': mean_pred,
        'mean_actual': mean_act,
        'difference': mean_act - mean_pred,  # positive = underestimated, negative = overestimated
        'abs_difference': abs(mean_act - mean_pred)
    })

jasp_df = pd.DataFrame(jasp_summary)

# Save for JASP
jasp_df.to_csv('model_data/trait_poles_for_jasp.csv', index=False)

print("=" * 80)
print("SUMMARY DATA FOR JASP (n=16 trait poles)")
print("=" * 80)
print(jasp_df.to_string(index=False))

print("\n" + "=" * 80)
print("OVERALL STATISTICS")
print("=" * 80)
print(f"Mean predicted activation: {jasp_df['mean_predicted'].mean():.4f}")
print(f"Mean actual activation:    {jasp_df['mean_actual'].mean():.4f}")
print(f"Mean difference (actual - predicted): {jasp_df['difference'].mean():.4f}")
print(f"  → {'UNDERESTIMATION' if jasp_df['difference'].mean() > 0 else 'OVERESTIMATION'}")

print("\n" + "=" * 80)
print("SAVED: model_data/trait_poles_for_jasp.csv")
print("=" * 80)

