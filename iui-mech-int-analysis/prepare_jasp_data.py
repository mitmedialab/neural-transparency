import pandas as pd
import numpy as np

# Load the data
df = pd.read_csv('model_data/persona_prediction.csv')

# Define all traits
traits = [
    ('empathy', 'empathy', 'empathetic', 'unempathetic'),
    ('encouraging', 'encouraging', 'encouraging', 'discouraging'),
    ('formality', 'formality', 'casual', 'formal'),
    ('funniness', 'funniness', 'funny', 'serious'),
    ('hallucination', 'hallucination', 'factual', 'hallucinatory'),
    ('sycophancy', 'honesty', 'honest', 'sycophantic'),
    ('sociality', 'sociality', 'social', 'antisocial'),
    ('toxicity', 'toxicity', 'respectful', 'toxic'),
]

# Create long-format data for JASP analysis
rows = []

for idx in range(len(df)):
    participant_id = df.loc[idx, 'prolific_id']
    condition = df.loc[idx, 'condition_name']
    
    for trait_act, trait_norm, pos_pole, neg_pole in traits:
        # Positive pole
        pred_pos = df.loc[idx, f'{trait_norm}_{pos_pole}_norm_polar']
        act_pos = df.loc[idx, f'{trait_act}_{pos_pole}_polar']
        
        rows.append({
            'participant_id': participant_id,
            'condition': condition,
            'trait': trait_norm,
            'pole': pos_pole,
            'predicted': abs(pred_pos),
            'actual': abs(act_pos),
            'difference': abs(pred_pos) - abs(act_pos),  # positive = over-prediction
        })
        
        # Negative pole
        pred_neg = df.loc[idx, f'{trait_norm}_{neg_pole}_norm_polar']
        act_neg = df.loc[idx, f'{trait_act}_{neg_pole}_polar']
        
        rows.append({
            'participant_id': participant_id,
            'condition': condition,
            'trait': trait_norm,
            'pole': neg_pole,
            'predicted': abs(pred_neg),
            'actual': abs(act_neg),
            'difference': abs(pred_neg) - abs(act_neg),  # positive = over-prediction
        })

# Create dataframe
jasp_data = pd.DataFrame(rows)

# Save to CSV for JASP
jasp_data.to_csv('model_data/overprediction_analysis.csv', index=False)

print("=" * 80)
print("DATA PREPARED FOR JASP ANALYSIS")
print("=" * 80)
print(f"\nFile saved: model_data/overprediction_analysis.csv")
print(f"\nTotal rows: {len(jasp_data)}")
print(f"Participants: {jasp_data['participant_id'].nunique()}")
print(f"Traits: {jasp_data['trait'].nunique()}")

print("\n" + "=" * 80)
print("SUMMARY STATISTICS")
print("=" * 80)
print(jasp_data[['predicted', 'actual', 'difference']].describe())

print("\n" + "=" * 80)
print("KEY FINDINGS")
print("=" * 80)
mean_diff = jasp_data['difference'].mean()
print(f"Mean difference (predicted - actual): {mean_diff:.4f}")
print(f"→ {'OVER-prediction' if mean_diff > 0 else 'UNDER-prediction'}")
print(f"\n% of over-predictions: {(jasp_data['difference'] > 0).mean() * 100:.1f}%")
print(f"% of under-predictions: {(jasp_data['difference'] < 0).mean() * 100:.1f}%")
print(f"% of exact predictions: {(jasp_data['difference'] == 0).mean() * 100:.1f}%")

print("\n" + "=" * 80)
print("BREAKDOWN BY TRAIT")
print("=" * 80)
trait_summary = jasp_data.groupby('trait')['difference'].agg(['mean', 'std', 'count'])
trait_summary = trait_summary.sort_values('mean', ascending=False)
print(trait_summary)

print("\n" + "=" * 80)
print("BREAKDOWN BY CONDITION")
print("=" * 80)
condition_summary = jasp_data.groupby('condition')['difference'].agg(['mean', 'std', 'count'])
print(condition_summary)

print("\n" + "=" * 80)
print("FIRST 20 ROWS OF DATA")
print("=" * 80)
print(jasp_data.head(20))

print("\n" + "=" * 80)
print("INSTRUCTIONS FOR JASP")
print("=" * 80)
print("""
1. Open JASP
2. File → Open → Select 'model_data/overprediction_analysis.csv'
3. For one-sample t-test testing if difference ≠ 0:
   - T-Tests → Classical → One Sample T-Test
   - Move 'difference' to Variables
   - Test value: 0
   - Check 'Descriptives'
   - Check 'Effect size' (Cohen's d)
   
4. For paired samples t-test (predicted vs actual):
   - T-Tests → Classical → Paired Samples T-Test
   - Move 'predicted' and 'actual' as a pair
   - Check 'Descriptives'
   - Check 'Effect size'

5. To test by trait:
   - Use 'trait' as a grouping/split variable
   - Descriptives → Descriptives → Split by 'trait'

6. To test by condition (control vs experimental):
   - Use 'condition' as a grouping variable
   - Independent Samples T-Test with 'difference' as DV
""")

