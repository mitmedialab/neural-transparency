"""
Apply Qualitative Classifiers to Open-Ended Feedback using Claude Sonnet 4.5

This script:
1. Loads the open-ended feedback data
2. Applies all 20 classifiers using Claude Sonnet 4.5
3. Parses LLM responses to extract classification codes
4. Saves results to a new CSV with all ratings
"""

import pandas as pd
import numpy as np
import re
import time
from typing import Dict, List, Optional, Union
from qualitative_analysis_classifiers import CLASSIFIERS, CATEGORY_LABELS

# Anthropic API
try:
    import anthropic
except ImportError:
    print("Error: anthropic package not installed.")
    print("Install with: pip install anthropic")
    exit(1)

import os

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("Warning: python-dotenv not installed. Install with: pip install python-dotenv")
    print("Attempting to use environment variables directly...")

# Initialize Anthropic client
# Looks for CLAUDE_API_KEY in .env file or environment variables
api_key = os.environ.get("CLAUDE_API_KEY")
if not api_key:
    print("Error: CLAUDE_API_KEY not found in .env file or environment variables")
    print("Please add to .env file: CLAUDE_API_KEY='your-key-here'")
    exit(1)

client = anthropic.Anthropic(api_key=api_key)


def classify_with_claude(
    text: str,
    classifier_name: str,
    classifier_config: Dict,
    model: str = "claude-sonnet-4-20250514",
    temperature: float = 0.0,
    max_retries: int = 3
) -> Optional[str]:
    """
    Classify a piece of text using Claude.
    
    Args:
        text: The feedback text to classify
        classifier_name: Name of the classifier
        classifier_config: Configuration dict with 'prompt' and 'options'
        model: Claude model to use
        temperature: Temperature (0 for deterministic)
        max_retries: Number of retry attempts on failure
    
    Returns:
        Classification result as string (e.g., "1" or "1,2,3")
        Returns None if text is empty or classification fails
    """
    
    # Handle empty/missing text
    if pd.isna(text) or text.strip() == "":
        return None
    
    # Build the full prompt
    full_prompt = f"{classifier_config['prompt']}\n\nFeedback text to classify:\n\"{text}\""
    
    # Try classification with retries
    for attempt in range(max_retries):
        try:
            message = client.messages.create(
                model=model,
                max_tokens=100,  # Short response expected
                temperature=temperature,
                messages=[
                    {"role": "user", "content": full_prompt}
                ]
            )
            
            result = message.content[0].text.strip()
            
            # Parse the result - extract numbers from brackets
            # Expected format: [x] or [x, y, z]
            parsed = parse_classification_result(result, classifier_config)
            
            if parsed:
                return parsed
            else:
                print(f"  Warning: Could not parse result for {classifier_name}: {result}")
                return result  # Return raw if parsing fails
                
        except anthropic.APIError as e:
            print(f"  API Error on attempt {attempt + 1}/{max_retries}: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
            else:
                print(f"  Failed after {max_retries} attempts")
                return None
        except Exception as e:
            print(f"  Unexpected error: {e}")
            return None
    
    return None


def parse_classification_result(result: str, classifier_config: Dict) -> Optional[str]:
    """
    Parse the LLM result to extract classification code(s).
    
    Expected formats:
    - [1]
    - [1, 2, 3]
    - [x, y, z]
    
    Returns:
        Parsed result as string (e.g., "1" or "1,2,3")
        Returns None if parsing fails
    """
    
    # Look for content within brackets
    bracket_match = re.search(r'\[([^\]]+)\]', result)
    if bracket_match:
        content = bracket_match.group(1)
        
        # Extract all numbers
        numbers = re.findall(r'\d+', content)
        
        if numbers:
            # Validate numbers are in valid options
            valid_options = classifier_config['options']
            validated_numbers = [n for n in numbers if n in valid_options]
            
            if validated_numbers:
                if classifier_config.get('multiple', False):
                    return ','.join(validated_numbers)
                else:
                    return validated_numbers[0]  # Take first for single-value
    
    # Fallback: look for standalone numbers
    numbers = re.findall(r'\b\d+\b', result)
    if numbers:
        valid_options = classifier_config['options']
        if numbers[0] in valid_options:
            return numbers[0]
    
    return None


def apply_classifiers_to_dataframe(
    df: pd.DataFrame,
    classifiers: Dict,
    text_column: str = 'post_open_ended_feedback',
    start_index: int = 0,
    end_index: Optional[int] = None,
    verbose: bool = True
) -> pd.DataFrame:
    """
    Apply all classifiers to a DataFrame.
    
    Args:
        df: DataFrame with feedback text
        classifiers: Dictionary of classifier configurations
        text_column: Name of column containing text to classify
        start_index: Start row index (for resuming)
        end_index: End row index (None = process all)
        verbose: Print progress
    
    Returns:
        DataFrame with classification columns added
    """
    
    df_result = df.copy()
    
    # Initialize columns if not present
    for classifier_name in classifiers.keys():
        if classifier_name not in df_result.columns:
            df_result[classifier_name] = None
    
    # Determine range to process
    if end_index is None:
        end_index = len(df_result)
    
    total_rows = end_index - start_index
    total_classifiers = len(classifiers)
    
    print(f"\n{'='*80}")
    print(f"Starting Classification")
    print(f"{'='*80}")
    print(f"Rows to process: {start_index} to {end_index} ({total_rows} rows)")
    print(f"Classifiers: {total_classifiers}")
    print(f"Total API calls: {total_rows * total_classifiers}")
    print(f"Model: claude-sonnet-4-20250514")
    print(f"{'='*80}\n")
    
    start_time = time.time()
    api_calls = 0
    
    # Process each row
    for idx in range(start_index, end_index):
        row_num = idx + 1  # 1-indexed for display
        text = df_result.loc[idx, text_column]
        
        if verbose:
            print(f"\nRow {row_num}/{len(df_result)} (firebase_id: {df_result.loc[idx, 'firebase_id']})")
            
        # Skip if text is empty
        if pd.isna(text) or text.strip() == "":
            if verbose:
                print("  Skipping (empty feedback)")
            continue
        
        # Apply each classifier
        for classifier_idx, (classifier_name, classifier_config) in enumerate(classifiers.items(), 1):
            # Skip if already classified (for resuming)
            if pd.notna(df_result.loc[idx, classifier_name]):
                if verbose:
                    print(f"  [{classifier_idx}/{total_classifiers}] {classifier_name}: Already classified, skipping")
                continue
            
            if verbose:
                print(f"  [{classifier_idx}/{total_classifiers}] {classifier_name}...", end=" ", flush=True)
            
            result = classify_with_claude(text, classifier_name, classifier_config)
            df_result.loc[idx, classifier_name] = result
            api_calls += 1
            
            if verbose:
                # Map to label for display
                if result and classifier_name in CATEGORY_LABELS:
                    if ',' in str(result):  # Multiple values
                        labels = [CATEGORY_LABELS[classifier_name].get(r.strip(), r.strip()) for r in result.split(',')]
                        display = ', '.join(labels)
                    else:
                        display = CATEGORY_LABELS[classifier_name].get(str(result), result)
                    print(f"✓ [{result}] {display}")
                else:
                    print(f"✓ [{result}]")
            
            # Small delay to respect rate limits
            time.sleep(0.1)
        
        # Save progress every 5 rows
        if (idx + 1) % 5 == 0:
            df_result.to_csv('data_clean/open_ended_coded_progress.csv', index=False)
            elapsed = time.time() - start_time
            rows_done = idx - start_index + 1
            rate = rows_done / elapsed if elapsed > 0 else 0
            remaining = (total_rows - rows_done) / rate if rate > 0 else 0
            print(f"\n  Progress saved. API calls: {api_calls}, Rate: {rate:.1f} rows/min, ETA: {remaining/60:.1f} min")
    
    elapsed = time.time() - start_time
    
    print(f"\n{'='*80}")
    print(f"Classification Complete")
    print(f"{'='*80}")
    print(f"Total API calls: {api_calls}")
    print(f"Time elapsed: {elapsed/60:.1f} minutes")
    print(f"Average: {elapsed/api_calls:.2f} seconds per classification")
    print(f"{'='*80}\n")
    
    return df_result


def add_label_columns(df: pd.DataFrame, category_labels: Dict) -> pd.DataFrame:
    """
    Add human-readable label columns for each classifier.
    
    Args:
        df: DataFrame with numeric classification codes
        category_labels: Dictionary mapping codes to labels
    
    Returns:
        DataFrame with additional _label columns
    """
    
    df_labeled = df.copy()
    
    for classifier_name, label_map in category_labels.items():
        if classifier_name in df_labeled.columns:
            label_col_name = f"{classifier_name}_label"
            
            # Handle multiple values (comma-separated)
            def map_labels(value):
                if pd.isna(value):
                    return None
                value_str = str(value)
                if ',' in value_str:
                    codes = [c.strip() for c in value_str.split(',')]
                    labels = [label_map.get(c, c) for c in codes]
                    return ', '.join(labels)
                else:
                    return label_map.get(value_str, value_str)
            
            df_labeled[label_col_name] = df_labeled[classifier_name].apply(map_labels)
    
    return df_labeled


def classify_feedback(
    input_csv: str = 'data_clean/open_ended.csv',
    output_csv: Optional[str] = 'data_clean/open_ended_coded.csv',
    output_csv_labeled: Optional[str] = 'data_clean/open_ended_coded_with_labels.csv',
    text_column: str = 'post_open_ended_feedback',
    resume_from_progress: bool = True,
    save_progress: bool = True,
    verbose: bool = True
) -> pd.DataFrame:
    """
    Main function to classify open-ended feedback.
    
    This function can be called from a notebook or run as a script.
    
    Args:
        input_csv: Path to input CSV file
        output_csv: Path to save coded results (None to skip saving)
        output_csv_labeled: Path to save labeled results (None to skip saving)
        text_column: Name of column containing feedback text
        resume_from_progress: If True, resume from progress file if exists
        save_progress: If True, save progress every 5 rows
        verbose: Print progress messages
    
    Returns:
        DataFrame with all classifications and labels added
    """
    
    # Load data
    if verbose:
        print("Loading data...")
    df = pd.read_csv(input_csv)
    if verbose:
        print(f"Loaded {len(df)} rows")
    
    # Check for existing progress
    progress_file = 'data_clean/open_ended_coded_progress.csv'
    if resume_from_progress and os.path.exists(progress_file):
        if verbose:
            print(f"\nFound existing progress file: {progress_file}")
            print("Resuming from progress...")
        df = pd.read_csv(progress_file)
    
    # Apply classifiers
    df_coded = apply_classifiers_to_dataframe(
        df,
        CLASSIFIERS,
        text_column=text_column,
        verbose=verbose
    )
    
    # Add human-readable labels
    if verbose:
        print("\nAdding label columns...")
    df_coded_labeled = add_label_columns(df_coded, CATEGORY_LABELS)
    
    # Save results
    if output_csv:
        df_coded.to_csv(output_csv, index=False)
        if verbose:
            print(f"\n✓ Saved coded data to: {output_csv}")
    
    if output_csv_labeled:
        df_coded_labeled.to_csv(output_csv_labeled, index=False)
        if verbose:
            print(f"✓ Saved labeled data to: {output_csv_labeled}")
    
    # Generate summary statistics
    if verbose:
        print("\n" + "="*80)
        print("Classification Summary")
        print("="*80)
        
        for classifier_name in CLASSIFIERS.keys():
            if classifier_name in df_coded_labeled.columns:
                non_null = df_coded_labeled[classifier_name].notna().sum()
                print(f"{classifier_name}: {non_null}/{len(df_coded_labeled)} classified ({non_null/len(df_coded_labeled)*100:.1f}%)")
        
        print("="*80)
        print("\nDone! 🎉")
    
    return df_coded_labeled


def main():
    """
    Command-line execution function.
    """
    df_result = classify_feedback(
        input_csv='data_clean/open_ended.csv',
        output_csv='data_clean/open_ended_coded.csv',
        output_csv_labeled='data_clean/open_ended_coded_with_labels.csv',
        resume_from_progress=True,
        verbose=True
    )
    
    return df_result


if __name__ == "__main__":
    main()

