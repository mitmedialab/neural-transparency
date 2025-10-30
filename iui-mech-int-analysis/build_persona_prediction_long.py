import sys
from pathlib import Path
import pandas as pd


def main() -> int:
    project_root = Path('/Users/sheerkarny/Documents/iui-mech-int-analysis')
    input_csv = project_root / 'model_data' / 'persona_prediction.csv'
    output_csv = project_root / 'model_data' / 'persona_prediction_long.csv'

    if not input_csv.exists():
        print(f"ERROR: Input file not found: {input_csv}")
        return 1

    df = pd.read_csv(input_csv)

    # Define traits: (actual_trait_prefix, predicted_trait_prefix, pos_pole, neg_pole, title)
    traits = [
        ('empathy', 'empathy', 'empathetic', 'unempathetic', 'Empathy'),
        ('encouraging', 'encouraging', 'encouraging', 'discouraging', 'Encouraging'),
        ('formality', 'formality', 'casual', 'formal', 'Formality'),
        ('funniness', 'funniness', 'funny', 'serious', 'Funniness'),
        ('hallucination', 'hallucination', 'factual', 'hallucinatory', 'Hallucination'),
        ('sycophancy', 'honesty', 'honest', 'sycophantic', 'Honesty'),
        ('sociality', 'sociality', 'social', 'antisocial', 'Sociality'),
        ('toxicity', 'toxicity', 'respectful', 'toxic', 'Toxicity'),
    ]

    # Validate required columns exist
    required_cols = []
    for trait_act, trait_norm, pos_pole, neg_pole, _ in traits:
        for pole in (pos_pole, neg_pole):
            required_cols.append(f'{trait_act}_{pole}_polar')
            required_cols.append(f'{trait_norm}_{pole}_norm_polar')

    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        print('ERROR: Missing expected columns in input CSV:')
        for c in missing:
            print(f'  - {c}')
        return 2

    # Use row index as an id
    df = df.reset_index().rename(columns={'index': 'row_id'})

    # Build long format by stacking both poles per trait
    rows = []
    for trait_act, trait_norm, pos_pole, neg_pole, title in traits:
        for pole in (pos_pole, neg_pole):
            act_col = f'{trait_act}_{pole}_polar'
            pred_col = f'{trait_norm}_{pole}_norm_polar'
            tmp = df[['row_id', act_col, pred_col]].copy()
            tmp['trait'] = title
            tmp['pole'] = pole
            tmp = tmp.rename(columns={act_col: 'actual_polar', pred_col: 'predicted_polar'})
            tmp['difference'] = tmp['actual_polar'] - tmp['predicted_polar']
            rows.append(tmp)

    long_df = pd.concat(rows, ignore_index=True)
    output_csv.parent.mkdir(parents=True, exist_ok=True)
    long_df.to_csv(output_csv, index=False)

    # Minimal summary
    n_traits = long_df['trait'].nunique()
    n_rows = len(long_df)
    print(f'Wrote {output_csv} (rows={n_rows}, traits={n_traits})')
    return 0


if __name__ == '__main__':
    sys.exit(main())


