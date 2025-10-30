# Persona Vector Sunburst Visualization - Complete Guide

## Overview

This project includes a beautiful, interactive D3.js **two-ring sunburst chart** for visualizing persona vector data. The sunburst provides an intuitive way to see multi-dimensional persona ratings at a glance, with categories in the inner ring and individual traits extending outward based on their activation values.

---

## Table of Contents

1. [Design Architecture](#design-architecture)
2. [Data Format](#data-format)
3. [Visual Encoding](#visual-encoding)
4. [Configuration Options](#configuration-options)
5. [Usage Examples](#usage-examples)
6. [Integration Points](#integration-points)
7. [Interactive Features](#interactive-features)
8. [Layout Modes](#layout-modes)
9. [Technical Implementation](#technical-implementation)
10. [Troubleshooting](#troubleshooting)
11. [Files Reference](#files-reference)

---

## Design Architecture

The visualization uses a **two-ring architecture**:

- **Inner Ring**: Shows categories (Positive, Negative, Neutral traits) with color coding
- **Outer Ring**: Individual traits that extend outward based on their activation values (0-100%)
- **Center Circle**: Displays selected avatar or customizable label

### Visual Design Features

✨ **Interactive**: Hover over segments to see detailed information in tooltips  
🎨 **Color-coded**: Green (positive), Red (negative), Grey (neutral) with gradient variations  
📊 **Two-Ring Design**: Clear separation between categories and individual traits  
🎭 **Animated**: Smooth fade-in animations on load  
📱 **Responsive**: Adapts to different screen sizes with SVG viewBox  
📏 **Visual Values**: Outer ring segments extend based on trait strength  
🧹 **Clean Design**: Hover-only labels keep the visualization uncluttered

---

## Data Format

### API Format (Hierarchical)

The sunburst expects data in a hierarchical format where each category contains trait pairs. **Only one trait from each pair has a non-zero value** (the other is always 0):

```javascript
{
  empathy: {
    empathetic: 0.803,   // Active trait (0-1 range)
    unempathetic: 0      // Inactive trait (always 0)
  },
  encouraging: {
    encouraging: 0.672,  // Active trait
    discouraging: 0      // Inactive trait
  },
  toxicity: {
    toxic: 0,            // Inactive trait
    respectful: 0.895    // Active trait
  },
  formality: {
    formal: 0,           // Inactive trait
    casual: 0.952        // Active trait (neutral category)
  }
}
```

**Key Points:**
- Values range from 0 to 1 (representing 0-100% activation)
- Only the non-zero trait from each pair is displayed
- Traits are automatically categorized as Positive, Negative, or Neutral

### Trait Pairs Reference

| Category | Positive/Neutral Trait | Negative/Neutral Trait | Classification |
|----------|----------------------|----------------------|----------------|
| Empathy | `empathetic` | `unempathetic` | Positive/Negative |
| Encouraging | `encouraging` | `discouraging` | Positive/Negative |
| Sociality | `social` | `antisocial` | Positive/Negative |
| Honesty | `honest` | `sycophantic` | Positive/Negative |
| Factual | `factual` | `hallucinatory` | Positive/Negative |
| Respectful | `respectful` | `toxic` | Positive/Negative |
| Funniness | `funny` | `serious` | Neutral/Neutral |
| Formality | `casual` | `formal` | Neutral/Neutral |

### Custom Categories Format (Alternative)

You can also provide custom categories:

```javascript
{
  categories: [
    {
      name: "Positive Traits",
      color: "#66BB6A",
      items: [
        { name: "Empathy", value: 0.85 },
        { name: "Honesty", value: 0.72 }
      ]
    },
    {
      name: "Communication Style",
      color: "#2196F3",
      items: [
        { name: "Formal", value: 0.45 },
        { name: "Direct", value: 0.88 }
      ]
    }
  ]
}
```

---

## Visual Encoding

### 1. Radial Extent (Bar Length)

**What it encodes:** Trait activation level

**Scaling method:** Linear with growth multiplier

```javascript
visual_extension = value × 1.25 × available_radius_range
```

- **Growth Multiplier**: 1.25 (default, configurable)
- **Purpose**: Amplifies small differences to make them more visible
- **Range**: Values stay in 0-1 range, multiplied by 1.25 for visual extension
- **Note**: No square-root transformation or minimum threshold applied

**Example:**
- Value 0.20 (20%) → extends 25% of available radius
- Value 0.80 (80%) → extends 100% of available radius

### 2. Color Intensity (Lightness)

**What it encodes:** Activation strength within each trait

**Formula:**
```javascript
minLightness = 0.92  // Almost white at 0% activation
maxLightness = baseHSL.l  // Category color at 100% activation
lightness = 0.92 - (value × (0.92 - baseHSL.l))
```

- **Higher values** (e.g., 0.8) → Darker, more saturated colors (match inner ring)
- **Lower values** (e.g., 0.2) → Lighter, less saturated colors (almost white)
- **Creates dramatic visual difference** between high and low activation

### 3. Angular Size (Arc Width)

**What it encodes:** Number of traits in each category

**Formula:**
```javascript
proportion = category.items.length / totalItems
angleRange = proportion × 2π
```

- Categories with more traits occupy larger angular sections
- Ensures fair representation regardless of category composition

### 4. Color Hue (Category)

- **Green (#4CAF50)**: Positive traits (empathetic, encouraging, honest, etc.)
- **Red (#F44336)**: Negative traits (toxic, sycophantic, hallucinatory, etc.)
- **Grey (#9E9E9E)**: Neutral traits (funny, serious, casual, formal)

---

## Configuration Options

### Basic Usage

```javascript
createPersonaSunburst(personaData, 'containerId', {
  width: 900,
  height: 900,
  animate: true
});
```

### All Available Options

```javascript
createPersonaSunburst(personaData, 'containerId', {
  // Size
  width: 900,                    // Width of SVG (default: 900)
  height: 900,                   // Height of SVG (default: 900)
  
  // Center labels
  centerLabel: 'Persona',        // Main center label (default: 'Persona')
  centerSubLabel: 'Vector',      // Sub-label (default: 'Vector')
  
  // Visual options
  animate: true,                 // Fade-in animation on load (default: true)
  showLabels: true,              // Show perpendicular trait labels (default: true)
  showPercentages: true,         // Show % values in labels (default: true)
  
  // Scaling options
  growthMultiplier: 1.25,        // Visual amplification factor (default: 1.25)
  
  // Layout options
  oppositeLayout: false          // false = mirrored (default), true = opposite (π apart)
});
```

### Key Configuration Parameters

#### `growthMultiplier` (default: 1.25)

Controls how much traits extend beyond the middle ring:

```javascript
// Default (1.25x) - recommended for most use cases
growthMultiplier: 1.25

// More conservative (1.0x) - true proportional scaling
growthMultiplier: 1.0

// More dramatic (1.5x) - emphasizes differences
growthMultiplier: 1.5
```

**Effect on display:**
- `1.0`: A 50% activation extends to 50% of available radius
- `1.25`: A 50% activation extends to 62.5% of available radius  
- `1.5`: A 50% activation extends to 75% of available radius

#### `oppositeLayout` (default: false)

Controls trait positioning:

- **`false` (Mirrored Layout - Default)**: 
  - Positive traits on right
  - Negative traits on left
  - Neutral traits at bottom
  - Traits mirror across vertical axis
  
- **`true` (Opposite Layout)**:
  - Positive traits on right semicircle (0° to 180°)
  - Negative traits on left semicircle (180° to 360°)
  - Each trait pair positioned π radians (180°) apart
  - No neutral category (neutral traits treated as positive)

---

## Usage Examples

### Example 1: Basic Sunburst

```javascript
const personaData = {
  empathy: { empathetic: 0.82, unempathetic: 0 },
  encouraging: { encouraging: 0.75, discouraging: 0 },
  toxicity: { toxic: 0, respectful: 0.91 }
};

createPersonaSunburst(personaData, 'myContainer', {
  width: 600,
  height: 600,
  animate: true
});
```

### Example 2: Opposite Layout Mode

```javascript
createPersonaSunburst(personaData, 'myContainer', {
  width: 900,
  height: 900,
  oppositeLayout: true  // Traits positioned 180° apart
});
```

### Example 3: Minimal Extension

```javascript
createPersonaSunburst(personaData, 'myContainer', {
  growthMultiplier: 1.0,  // No amplification, true proportions
  showLabels: false       // Clean look
});
```

### Example 4: Dramatic Visualization

```javascript
createPersonaSunburst(personaData, 'myContainer', {
  growthMultiplier: 1.5,  // 50% more extension
  showLabels: true,
  showPercentages: true
});
```

---

## Integration Points

### 1. Chat Interface (`js/chat.js`)

The `renderPersonaChart()` function uses the sunburst:

```javascript
function renderPersonaChart(personaData) {
  // Creates sunburst in #personaChartSunburst
  createPersonaSunburst(personaData, 'personaChartSunburst', {
    width: 380,
    height: 380,
    innerRadius: 45,
    animate: true,
    oppositeLayout: window.sunburstOppositeLayout
  });
}
```

### 2. Test Page (`test-sunburst.html`)

Demo page with multiple test personas:
```bash
open test-sunburst.html
```

Features:
- Real API data testing
- Mock data generation
- Layout toggle
- Multiple test personas

### 3. Custom Implementation

```html
<!-- Include D3.js -->
<script src="https://d3js.org/d3.v7.min.js"></script>

<!-- Include the sunburst module -->
<script src="js/persona-sunburst.js"></script>

<!-- Create a container -->
<div id="myPersonaChart"></div>

<!-- Initialize -->
<script>
  const data = { /* your persona data */ };
  createPersonaSunburst(data, 'myPersonaChart');
</script>
```

---

## Interactive Features

### Hover Effects

1. **Category Hover:**
   - Category brightens
   - Border thickens
   - Tooltip shows: category name, average value, item count

2. **Trait Hover:**
   - Trait brightens and enlarges
   - Border thickens
   - **Opposite trait highlights** in blue with reduced opacity
   - Tooltip shows: trait name, definition, activation %, opposite trait name

3. **Label Hover:**
   - Same effect as trait hover
   - Labels are positioned perpendicular to segments
   - Auto-rotated for readability (flipped on left side)

### Tooltip Content

**Category Tooltip:**
```
Positive Traits
Average: 0.78
Items: 4
```

**Trait Tooltip:**
```
Empathetic
Understanding and sharing the feelings of others
Activation: 82%
Opposite trait: Unempathetic
```

### Tooltip Positioning

- Fixed position to the right of the visualization
- Stays visible during hover
- Positioned at: `containerRect.right + 20px`

---

## Layout Modes

### Mirrored Layout (Default)

**Characteristics:**
- 3 categories: Positive (right), Negative (left), Neutral (bottom)
- Traits mirror across vertical axis at top
- Neutral category centered at 270° (bottom)
- Category sizes proportional to trait count

**Positioning:**
```
- Mirror axis: 0 radians (90° standard = top)
- Positive traits: right side (clockwise from top)
- Negative traits: left side (counter-clockwise from top)
- Neutral traits: bottom section (centered at π radians)
```

**Best for:**
- Datasets with neutral traits (funny/serious, casual/formal)
- Emphasizing semantic categories
- Balanced visual composition

### Opposite Layout

**Characteristics:**
- 2 categories only: Positive (right), Negative (left)
- Trait pairs positioned exactly π radians (180°) apart
- Each positive trait directly opposite its negative pair
- Neutral traits treated as positive

**Positioning:**
```
- Positive traits: 0° to 180° (right semicircle)
- Negative traits: 180° to 360° (left semicircle)
- Each pair: exactly π radians apart
```

**Best for:**
- Emphasizing trait pair relationships
- Datasets without neutral traits
- Showing opposition/complementarity

**Toggle between modes:**
```javascript
// In chat interface
window.sunburstOppositeLayout = !window.sunburstOppositeLayout;
createPersonaSunburst(data, 'container', {
  oppositeLayout: window.sunburstOppositeLayout
});
```

---

## Technical Implementation

### Extension Calculation

**Code (lines 345-349 in `persona-sunburst.js`):**
```javascript
const growthMultiplier = config.growthMultiplier || 1.25;
const extension = item.value * growthMultiplier * (maxOuterRadius - middleRadius);
const outerRadius = middleRadius + extension;
```

**Formula:**
```
extension = value × 1.25 × (maxOuterRadius - middleRadius)
outerRadius = middleRadius + extension
```

**Example calculation:**
- Value: 0.50 (50% activation)
- Growth multiplier: 1.25
- Available radius: 200px
- Extension: 0.50 × 1.25 × 200px = 125px
- Result: Bar extends 125px beyond middle ring

### Color Intensity Calculation

**Code (lines 360-365):**
```javascript
const baseHSL = d3.hsl(baseColorToUse);
const minLightness = 0.92; // Almost white at 0%
const maxLightness = baseHSL.l; // Category color at 100%
const lightness = minLightness - (item.value * (minLightness - maxLightness));
const fillColor = d3.hsl(baseHSL.h, baseHSL.s, lightness);
```

**Effect:**
- 0% activation → Lightness 0.92 (very light, almost white)
- 100% activation → Lightness = category color (full saturation)
- Creates dramatic visual gradient within each category

### Category Arc Calculation

**Code (lines 597-604):**
```javascript
const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
const proportion = category.items.length / totalItems;
const angleRange = proportion * 2 * Math.PI;

category.startAngle = currentAngle;
category.endAngle = currentAngle + angleRange;
```

**Formula:**
```
proportion = items_in_category / total_items
angleRange = proportion × 2π
```

### Trait Classification

**Code (lines 1045-1101):**
```javascript
function classifyTrait(traitName) {
  const trait = traitName.toLowerCase();
  
  // Neutral traits
  const neutralTraits = ['funny', 'serious', 'casual', 'formal'];
  if (neutralTraits.some(nt => trait.includes(nt))) {
    return 'neutral';
  }
  
  // Negative indicators
  const negativeIndicators = [
    'toxic', 'harmful', 'rude', 'sycophant', 'deceptive',
    'hallucinat', 'inaccurate', 'un', 'dis', 'anti'
  ];
  
  // Positive indicators
  const positiveIndicators = [
    'empath', 'kind', 'caring', 'encourag', 'support',
    'honest', 'respectful', 'accurate', 'factual'
  ];
  
  // Check indicators and return classification
  // ...
}
```

---

## Troubleshooting

### Sunburst not appearing?

1. **Check D3.js is loaded:**
   ```javascript
   console.log(typeof d3); // Should be 'object'
   ```

2. **Check function is defined:**
   ```javascript
   console.log(typeof createPersonaSunburst); // Should be 'function'
   ```

3. **Check container exists:**
   ```javascript
   console.log($('#myContainer').length); // Should be > 0
   ```

4. **Check data format:**
   ```javascript
   console.log(personaData); // Should be object with numeric values
   ```

5. **Check browser console** for errors

### Data format issues?

**Correct format:**
```javascript
{
  empathy: { empathetic: 0.8, unempathetic: 0 }  // ✓
}
```

**Incorrect formats:**
```javascript
{ empathy: 0.8 }                    // ✗ Missing trait names
{ empathetic: 0.8, unempathetic: 0.2 } // ✗ Both non-zero (should sum to ~1.0)
{ empathy: { value: 0.8 } }         // ✗ Wrong structure
```

### Values not visible?

**Problem:** Very small values (< 0.05) may produce small segments

**Solutions:**
1. Increase growth multiplier:
   ```javascript
   createPersonaSunburst(data, 'container', {
     growthMultiplier: 1.5  // Increase from 1.25
   });
   ```

2. Check color contrast (hover to verify data is present)

3. Ensure data values are in 0-1 range (not 0-100)

### Labels overlapping?

**Solutions:**
1. Increase visualization size:
   ```javascript
   createPersonaSunburst(data, 'container', {
     width: 1200,
     height: 1200
   });
   ```

2. Reduce number of traits if possible

3. Hide labels and use hover-only mode:
   ```javascript
   createPersonaSunburst(data, 'container', {
     showLabels: false
   });
   ```

### Tooltip not showing?

**Check:**
1. Z-index conflicts (tooltip uses z-index: 10000)
2. Pointer-events settings
3. Tooltip positioning (fixed position, right side of container)

**Debug:**
```javascript
// Check if tooltip exists
console.log(d3.selectAll('.persona-sunburst-tooltip').size());
```

### Colors look wrong?

**Ensure:**
1. Values are in 0-1 range (not 0-100 or -2 to 2)
2. Trait names match expected patterns for classification
3. Check browser color rendering

---

## API Reference

### `createPersonaSunburst(personaData, containerId, options)`

Creates a new sunburst visualization.

**Parameters:**
- `personaData` (Object): Persona ratings in hierarchical format
- `containerId` (String): ID of container element (without #)
- `options` (Object, optional): Configuration options

**Returns:** 
- Cleanup function to remove tooltip

**Example:**
```javascript
const cleanup = createPersonaSunburst(data, 'myChart', {
  animate: true,
  growthMultiplier: 1.25
});

// Later, if needed:
cleanup(); // Removes tooltip
```

### `updatePersonaSunburst(personaData, containerId, options)`

Updates an existing sunburst with new data (currently recreates it).

**Parameters:** Same as `createPersonaSunburst()`

---

## Files Reference

### Core Implementation
- **`js/persona-sunburst.js`** - Main sunburst visualization module
- **`js/chat.js`** - Integration with chat interface
- **`html/chat-content.html`** - HTML structure for sunburst container

### Documentation
- **`SUNBURST_VISUALIZATION_COMPLETE.md`** - This comprehensive guide
- **`DYNAMIC_TRAIT_DETECTION.md`** - Trait classification system
- **`TRAIT_POLARITY.md`** - Trait polarity detection

### Testing
- **`test-sunburst.html`** - Interactive test page
- **`test-persona-api.html`** - API integration testing
- **`test-persona-bargraph.html`** - Alternative bar chart visualization

### Styling
- **`css/main.css`** - Sunburst and tooltip styles

---

## Accurate Reporting for Research Papers

### Visual Encoding Summary

Use this language for accurate technical reporting:

**Radial Extent:**
> "Radial extent encodes trait activation level using linear scaling with a growth multiplier of 1.25. The visual extension formula is: `extension = value × 1.25 × available_radius_range`, where values range from 0 to 1."

**Color Intensity:**
> "Color lightness varies inversely with activation value, interpolating from near-white (lightness = 0.92) at 0% activation to the full category color at 100% activation. The formula is: `lightness = 0.92 - (value × (0.92 - baseHSL.l))`."

**Category Sizing:**
> "Angular size of category arcs is proportional to the number of traits in each category, calculated as: `angleRange = (items_in_category / total_items) × 2π`."

### What NOT to Report

- ✗ "Square-root scaling" (does not exist in code)
- ✗ "Minimum extension threshold" (does not exist in code)
- ✗ Multi-step scaling algorithm (it's a single multiplication)
- ✗ Any mention of `useSqrtScaling` or `minExtension` parameters (these don't exist)

---

## Performance

The sunburst is optimized for smooth performance:
- Renders 5-10 trait pairs instantly
- Smooth hover animations (200ms transitions)
- Efficient D3 updates
- Handles up to 20+ traits without performance degradation

---

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

Requires:
- D3.js v7+
- SVG support
- CSS transforms

---

## Future Enhancements

Potential improvements:
- [ ] Smooth data transitions (currently recreates on update)
- [ ] Export as PNG/SVG
- [ ] Comparison view (multiple personas side-by-side)
- [ ] Time-series animation
- [ ] Alternative layouts (radial tree, treemap)
- [ ] Configurable color schemes
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)

---

## Credits

Built with:
- [D3.js v7](https://d3js.org/) - Data visualization library
- [jQuery](https://jquery.com/) - DOM manipulation
- Designed at MIT Media Lab

---

## License

MIT License - See main project LICENSE file

---

**Last Updated:** October 10, 2025  
**Version:** 2.0  
**Status:** Production Ready

---

## Quick Reference

### Common Use Cases

**Default setup (recommended):**
```javascript
createPersonaSunburst(data, 'container');
```

**High contrast for small values:**
```javascript
createPersonaSunburst(data, 'container', {
  growthMultiplier: 1.5
});
```

**Clean presentation mode:**
```javascript
createPersonaSunburst(data, 'container', {
  showLabels: false,
  animate: false
});
```

**Toggle layout at runtime:**
```javascript
const currentLayout = window.sunburstOppositeLayout || false;
createPersonaSunburst(data, 'container', {
  oppositeLayout: !currentLayout
});
```

---

For questions or issues, check the browser console for detailed logging or refer to `test-sunburst.html` for working examples.

