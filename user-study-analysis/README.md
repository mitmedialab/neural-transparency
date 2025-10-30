# Data Analysis Pipeline

Analysis tools and notebooks for the neural transparency research study.

## Overview

This directory contains statistical analysis, data processing, and visualization tools for analyzing human-AI interaction study data.

## Structure

```
user-study-analysis/
├── data_clean/              # Cleaned datasets (CSV)
├── model_data/              # Processed model outputs (CSV)
├── figures/                 # Generated visualizations (PNG)
├── json/                    # Raw data exports (JSON)
└── *.ipynb                  # Analysis notebooks
```

## Getting Started

**Install dependencies:**
```bash
pip install pandas numpy matplotlib seaborn scipy jupyter
```

**Run analysis:**
```bash
cd user-study-analysis
jupyter notebook
```

## Key Notebooks

**Start here:**
- `unpack_data.ipynb` - **Data cleaning pipeline** - Unpacks Firebase JSON into clean CSV files

**Then run:**
- `feature_building.ipynb` - Extract behavioral features
- `user_engagement_analysis.ipynb` - Analyze interaction patterns
- `open-ended.ipynb` - Qualitative coding

## Python Scripts

- `apply_qualitative_classifiers.py` - Automated text classification
- `baseline_equivalence_analysis.py` - Statistical tests
- Additional utility scripts for data processing

## Output

Analysis results are saved to:
- **CSV files**: `data_clean/` and `model_data/`
- **Figures**: `figures/`
- **Raw exports**: `json/`

## Notes

Data files (CSV, JSON, PNG) are excluded from git. Run the analysis notebooks to generate them.

### Clearing Notebook Outputs

Before committing notebooks, clear all cell outputs to avoid committing data:

**In Jupyter:**
- Click "Kernel" → "Restart & Clear Output"
- Or use "Cell" → "All Output" → "Clear"

**Command line:**
```bash
# Install nbstripout (one-time setup)
pip install nbstripout

# Clear outputs from a notebook
jupyter nbconvert --clear-output --inplace *.ipynb

# Or use nbstripout
nbstripout *.ipynb
```

