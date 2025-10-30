# Subjective Ratings Stacked Bar Chart - Paste this into a Jupyter notebook cell

import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Load data
df = pd.read_csv('data_clean/data_participants.csv')

# Define the rating questions for each phase
pre_questions = {
    'pre_empathy': 'Expected the AI to be empathetic',
    'pre_encouraging': 'Expected the AI to be encouraging',
    'pre_honesty': 'Expected the AI to be honest',
    'pre_trust': 'Expected to trust the AI',
    'pre_sociality': 'Expected the AI to be social',
}

post_questions = {
    'post_visualization_helpful': 'Visualization helped understand AI behavior',
    'post_arrived_desired_character': 'Arrived at desired character',
    'post_trust': 'Trust in the AI after interaction',
    'post_see_visualization_again': 'Would like to see visualization again',
}

# Combine all questions
all_questions = {**pre_questions, **post_questions}

# Calculate percentage distribution for each question (1-7 scale)
def calculate_distribution(column):
    """Calculate percentage distribution for ratings 1-7"""
    total = df[column].notna().sum()
    if total == 0:
        return [0] * 7
    
    distribution = []
    for rating in range(1, 8):
        count = (df[column] == rating).sum()
        percentage = (count / total) * 100
        distribution.append(percentage)
    return distribution

# Prepare data
questions_list = list(all_questions.keys())
labels = list(all_questions.values())
data = [calculate_distribution(q) for q in questions_list]

# Color scheme (red to green gradient)
colors = ['#d73027', '#fc8d59', '#fee090', '#d9d9d9', '#91cf60', '#66bd63', '#1a9850']
rating_labels = ['1 (Not at all)', '2', '3', '4 (Neutral)', '5', '6', '7 (Extremely)']

# Create the stacked bar chart
fig, ax = plt.subplots(figsize=(14, 10))

# Create stacked bars
bar_width = 0.8
y_positions = np.arange(len(labels))

left = np.zeros(len(labels))
for i, (color, label) in enumerate(zip(colors, rating_labels)):
    values = [d[i] for d in data]
    bars = ax.barh(y_positions, values, bar_width, left=left, 
                   color=color, label=label, edgecolor='white', linewidth=0.5)
    
    # Add percentage labels (only if >= 5%)
    for j, (bar, value) in enumerate(zip(bars, values)):
        if value >= 5:
            x_pos = left[j] + value / 2
            ax.text(x_pos, bar.get_y() + bar.get_height() / 2, 
                   f'{int(value)}', 
                   ha='center', va='center', fontsize=9, fontweight='bold',
                   color='white' if i in [0, 1, 5, 6] else 'black')
    
    left += values

# Formatting
ax.set_yticks(y_positions)
ax.set_yticklabels(labels, fontsize=11)
ax.set_xlabel('Percentage (%)', fontsize=12, fontweight='bold')
ax.set_xlim(0, 100)
ax.set_xticks(np.arange(0, 101, 20))
ax.grid(axis='x', alpha=0.3, linestyle='--')

# Title
fig.suptitle('User Experience Evaluation', fontsize=16, fontweight='bold', y=0.98)
ax.set_title('% Response Distribution (1 = Not at all, 7 = Extremely)', 
             fontsize=12, pad=10)

# Legend
ax.legend(loc='upper center', bbox_to_anchor=(0.5, -0.05), 
         ncol=7, frameon=True, fontsize=10)

plt.tight_layout()
plt.savefig('figures/subjective_ratings_stacked_bars.png', dpi=300, bbox_inches='tight')
plt.show()

print("Chart saved to: figures/subjective_ratings_stacked_bars.png")

