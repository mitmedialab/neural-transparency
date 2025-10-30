import pandas as pd
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt

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

# Collect ALL prediction-activation pairs (16 poles total, each with n participants)
all_predictions = []
all_activations = []
all_differences = []  # predicted - actual (positive = overprediction)

for trait_act, trait_norm, pos_pole, neg_pole in traits:
    # Positive pole
    pred_pos = df[f'{trait_norm}_{pos_pole}_norm_polar'].abs()
    act_pos = df[f'{trait_act}_{pos_pole}_polar'].abs()
    
    # Negative pole
    pred_neg = df[f'{trait_norm}_{neg_pole}_norm_polar'].abs()
    act_neg = df[f'{trait_act}_{neg_pole}_polar'].abs()
    
    # Combine
    all_predictions.extend(pred_pos.tolist() + pred_neg.tolist())
    all_activations.extend(act_pos.tolist() + act_neg.tolist())
    all_differences.extend((pred_pos - act_pos).tolist() + (pred_neg - act_neg).tolist())

all_predictions = np.array(all_predictions)
all_activations = np.array(all_activations)
all_differences = np.array(all_differences)

print("=" * 80)
print("SYSTEMATIC OVER-PREDICTION TEST")
print("=" * 80)
print("\nResearch Question: Do people systematically over-predict model behavior?")
print("\nH0: predicted = actual (no systematic bias)")
print("H1: predicted > actual (systematic over-prediction)\n")

# Overall statistics
mean_pred = all_predictions.mean()
mean_act = all_activations.mean()
mean_diff = all_differences.mean()
std_diff = all_differences.std()

print(f"\n1. DESCRIPTIVE STATISTICS (across all {len(all_predictions)} prediction-activation pairs)")
print("-" * 80)
print(f"   Mean Predicted Activation:  {mean_pred:.4f}")
print(f"   Mean Actual Activation:     {mean_act:.4f}")
print(f"   Mean Difference (pred-act): {mean_diff:.4f}")
print(f"   Std Dev of Difference:      {std_diff:.4f}")
print(f"   → {('OVER-prediction' if mean_diff > 0 else 'UNDER-prediction')}: "
      f"predictions are {abs(mean_diff):.4f} units "
      f"{'higher' if mean_diff > 0 else 'lower'} than actual on average")

# One-sample t-test: Is mean difference significantly different from 0?
t_stat, t_pval_two = stats.ttest_1samp(all_differences, 0)
t_pval_one = t_pval_two / 2 if mean_diff > 0 else 1 - (t_pval_two / 2)  # one-tailed

print(f"\n2. ONE-SAMPLE T-TEST (difference vs 0)")
print("-" * 80)
print(f"   t-statistic:    {t_stat:.4f}")
print(f"   p-value (two-tailed): {t_pval_two:.6f} {'***' if t_pval_two < 0.001 else '**' if t_pval_two < 0.01 else '*' if t_pval_two < 0.05 else 'n.s.'}")
print(f"   p-value (one-tailed): {t_pval_one:.6f} {'***' if t_pval_one < 0.001 else '**' if t_pval_one < 0.01 else '*' if t_pval_one < 0.05 else 'n.s.'}")
print(f"   Cohen's d:      {mean_diff / std_diff:.4f} "
      f"({'small' if abs(mean_diff/std_diff) < 0.5 else 'medium' if abs(mean_diff/std_diff) < 0.8 else 'large'} effect)")

# Wilcoxon signed-rank test (non-parametric)
wilcoxon_stat, wilcoxon_pval = stats.wilcoxon(all_differences)

print(f"\n3. WILCOXON SIGNED-RANK TEST (non-parametric)")
print("-" * 80)
print(f"   W-statistic:    {wilcoxon_stat:.0f}")
print(f"   p-value:        {wilcoxon_pval:.6f} {'***' if wilcoxon_pval < 0.001 else '**' if wilcoxon_pval < 0.01 else '*' if wilcoxon_pval < 0.05 else 'n.s.'}")

# Proportion over-predicting
n_over = (all_differences > 0).sum()
n_under = (all_differences < 0).sum()
n_exact = (all_differences == 0).sum()
prop_over = n_over / len(all_differences)

print(f"\n4. PROPORTION ANALYSIS")
print("-" * 80)
print(f"   Over-predictions:  {n_over:5d} ({prop_over*100:.1f}%)")
print(f"   Under-predictions: {n_under:5d} ({(n_under/len(all_differences))*100:.1f}%)")
print(f"   Exact predictions: {n_exact:5d} ({(n_exact/len(all_differences))*100:.1f}%)")

# Binomial test: Is proportion of over-predictions > 50%?
binom_pval = stats.binom_test(n_over, n_over + n_under, 0.5, alternative='greater')
print(f"   Binomial test (H1: p > 0.5): p = {binom_pval:.6f} {'***' if binom_pval < 0.001 else '**' if binom_pval < 0.01 else '*' if binom_pval < 0.05 else 'n.s.'}")

# Effect size (percentage of predictions that are over-predictions)
print(f"\n5. PRACTICAL SIGNIFICANCE")
print("-" * 80)
print(f"   Relative difference: {(mean_diff/mean_act)*100:.1f}% ")
print(f"   (predictions are {abs((mean_diff/mean_act)*100):.1f}% {'higher' if mean_diff > 0 else 'lower'} than actual)")

print("\n" + "=" * 80)
print("CONCLUSION:")
print("=" * 80)
if t_pval_one < 0.001 and mean_diff > 0:
    print("✓ YES - People SIGNIFICANTLY OVER-PREDICT model behavior (p < 0.001)")
    print(f"  Predictions are {mean_diff:.3f} units higher than actual activations on average.")
    print(f"  This represents a {abs((mean_diff/mean_act)*100):.1f}% overestimation.")
    print(f"  {prop_over*100:.1f}% of all predictions are over-predictions.")
elif mean_diff > 0:
    print(f"✓ YES - People over-predict model behavior (p = {t_pval_one:.4f})")
else:
    print("✗ NO - People do not systematically over-predict model behavior")
print("=" * 80)

# ============================================================================
# BY TRAIT ANALYSIS
# ============================================================================
print("\n\n" + "=" * 80)
print("BREAKDOWN BY TRAIT")
print("=" * 80)

trait_results = []
for trait_act, trait_norm, pos_pole, neg_pole in traits:
    # Combine both poles for this trait
    pred = pd.concat([
        df[f'{trait_norm}_{pos_pole}_norm_polar'].abs(),
        df[f'{trait_norm}_{neg_pole}_norm_polar'].abs()
    ])
    act = pd.concat([
        df[f'{trait_act}_{pos_pole}_polar'].abs(),
        df[f'{trait_act}_{neg_pole}_polar'].abs()
    ])
    diff = pred - act
    
    t, p = stats.ttest_1samp(diff, 0)
    
    trait_results.append({
        'Trait': trait_norm.capitalize(),
        'Mean_Diff': diff.mean(),
        't_stat': t,
        'p_value': p,
        'Direction': 'OVER' if diff.mean() > 0 else 'UNDER',
        'Significant': '***' if p < 0.001 else '**' if p < 0.01 else '*' if p < 0.05 else 'n.s.'
    })

trait_df = pd.DataFrame(trait_results)
trait_df = trait_df.sort_values('Mean_Diff', ascending=False)

print("\nAll 8 traits ranked by over/under-prediction:")
print("-" * 80)
for _, row in trait_df.iterrows():
    direction_symbol = "↑" if row['Direction'] == 'OVER' else "↓"
    print(f"  {row['Trait']:15s} {direction_symbol} {row['Mean_Diff']:+.4f}  "
          f"(t={row['t_stat']:+.3f}, p={row['p_value']:.5f}) {row['Significant']}")

print("\n" + "=" * 80)
print(f"Summary: {(trait_df['Direction'] == 'OVER').sum()}/8 traits are over-predicted")
print("=" * 80)

