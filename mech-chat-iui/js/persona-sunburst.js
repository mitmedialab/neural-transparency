// Persona Vector Sunburst Visualization using D3.js
// Two-ring design: inner ring shows categories, outer ring shows individual traits
//
// DATA FORMATS SUPPORTED:
//
// 1. API Format (hierarchical with trait pairs where one trait is active, other is 0):
//    {
//      empathy: {
//        empathetic: 0.803,   // Active trait (0-1 range)
//        unempathetic: 0      // Inactive trait (always 0)
//      },
//      encouraging: {
//        encouraging: 0.672,  // Active trait
//        discouraging: 0      // Inactive trait (always 0)
//      },
//      toxicity: {
//        toxic: 0,            // Inactive trait (always 0)
//        respectful: 0.895    // Active trait
//      }
//    }
//    Note: Only the non-zero trait from each pair is displayed
//
// 2. Custom Categories Format:
//    {
//      categories: [
//        {
//          name: "Category Name",
//          color: "#66BB6A",  // optional
//          startAngle: 0,     // optional
//          endAngle: 2.094,   // optional
//          items: [
//            { name: "Trait 1", value: 0.8 },
//            { name: "Trait 2", value: 0.3 }
//          ]
//        }
//      ]
//    }
//
// TRAIT CLASSIFICATION:
// - Positive traits (empathetic, encouraging, social, honest, etc.) → Green category
// - Negative traits (toxic, sycophantic, hallucinatory, etc.) → Red category
// - Values range from 0-1 (inactive traits marked with -1.0 are filtered out)
//
// VISUALIZATION DETAILS:
// - Inner ring: Colored categories with curved labels (Green=Positive, Red=Negative)
// - Category sizing: Angular size is proportional to number of traits in each category
// - Outer ring: Individual traits extending outward based on normalized values (0-100%)
// - Hover-to-reveal: No static labels - details shown in tooltips on hover
// - Enhanced hover effects: Segments brighten, enlarge, and show detailed tooltips
// - Interactive: Smooth hover transitions and click handlers
// - Animated: Fade-in animation on load
// - Clean design: "Hover to explore" hint in center guides users

/**
 * Creates a beautiful two-ring sunburst chart for persona vector data
 * @param {Object} personaData - Object containing categorized persona ratings or flat ratings
 * @param {string} containerId - The ID of the container element (without #)
 * @param {Object} options - Configuration options
 * @param {number} [options.width=900] - Width of the visualization
 * @param {number} [options.height=900] - Height of the visualization
 * @param {string} [options.centerLabel='Persona'] - Main center label
 * @param {string} [options.centerSubLabel='Vector'] - Sub-label in center
 * @param {boolean} [options.animate=true] - Whether to animate on load
 * @param {boolean} [options.showPercentages=true] - Whether to show percentages in labels
 * @param {number} [options.growthMultiplier=1.25] - Multiplier for bar extension (1.25 = bars grow 1.25x faster)
 * @param {boolean} [options.showLabels=true] - Whether to show perpendicular labels
 * @param {boolean} [options.oppositeLayout=false] - false = mirrored with neutral category (default), true = opposite traits π radians apart
 * @returns {Function} Cleanup function to remove tooltip
 */
function createPersonaSunburst(personaData, containerId, options = {}) {
    // Default configuration
    const config = {
        width: options.width || 900,
        height: options.height || 900,
        centerLabel: options.centerLabel || 'Persona',
        centerSubLabel: options.centerSubLabel || 'Vector',
        animate: options.animate !== false,
        showPercentages: options.showPercentages !== false,
        growthMultiplier: options.growthMultiplier !== undefined ? options.growthMultiplier : 1.25,
        showLabels: options.showLabels !== false,
        oppositeLayout: options.oppositeLayout === true // default false = mirrored (shows neutral), true = opposite
    };

    // Clear any existing SVG in the container
    d3.select(`#${containerId}`).selectAll('*').remove();

    // Transform data into categories structure
    const categories = transformToCategories(personaData, config);

    // Set up dimensions
    const width = config.width;
    const height = config.height;
    // Use more of the available space - only leave small margin for labels
    const radius = Math.min(width, height) / 2 - 20;

    // Create SVG container that fills its container
    const svg = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('style', 'max-width: 100%; max-height: 100%;');

    // Create a group for the sunburst, positioned for visual centering
    // Account for labels extending outward and visual weight distribution
    const g = svg.append('g')
        .attr('transform', `translate(${width / 2},${height * 0.44})`);

    // Define ring radii with better proportions
    // Smaller inner circles give bars more room to grow and show activation differences
    const innerRadius = radius * 0.18;
    const middleRadius = radius * 0.35;
    const maxOuterRadius = radius * 0.85; // Maximum extent for arc growth

    // Get container position to calculate tooltip placement
    const container = document.getElementById(containerId);
    const containerRect = container.getBoundingClientRect();
    
    // Add tooltip div - positioned just to the right of the visualization
    const tooltip = d3.select('body').append('div')
        .attr('class', 'persona-sunburst-tooltip')
        .style('opacity', 0)
        .style('position', 'fixed')
        .style('top', `${containerRect.top + 20}px`)
        .style('left', `${containerRect.right + 20}px`)
        .style('background-color', 'rgba(0, 0, 0, 0.9)')
        .style('color', 'white')
        .style('padding', '12px 16px')
        .style('border-radius', '8px')
        .style('pointer-events', 'none')
        .style('font-size', '14px')
        .style('font-family', 'system-ui, -apple-system, sans-serif')
        .style('line-height', '1.6')
        .style('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.3)')
        .style('z-index', '10000')
        .style('max-width', '250px');

    // Draw category arcs (inner ring)
    categories.forEach((category, catIndex) => {
        const categoryArc = g.append('path')
            .attr('d', d3.arc()
                .innerRadius(innerRadius)
                .outerRadius(middleRadius)
                .startAngle(category.startAngle)
                .endAngle(category.endAngle)
            )
            .attr('fill', category.color)
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .style('opacity', 0.9)
            .style('cursor', 'pointer');

        // Add hover effects to category
        categoryArc.on('mouseenter', function(event) {
            d3.select(this)
                .transition()
                .duration(200)
                .style('opacity', 1)
                .attr('stroke-width', 3);
            
            // Calculate average value for category
            const avgValue = category.items.reduce((sum, item) => sum + item.value, 0) / category.items.length;
            
            tooltip.transition()
                .duration(200)
                .style('opacity', 1);
            
            tooltip.html(`
                <strong>${category.name}</strong><br/>
                Average: ${avgValue.toFixed(2)}<br/>
                Items: ${category.items.length}
            `);
        })
        .on('mouseleave', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .style('opacity', 0.9)
                .attr('stroke-width', 2);
            
            tooltip.transition()
                .duration(200)
                .style('opacity', 0);
        });
    });

    // Draw item arcs (outer ring)
    categories.forEach(category => {
        const angleRange = category.endAngle - category.startAngle;
        
        // Check if this is a hierarchical category with mirrored items
        const isHierarchical = category.isHierarchical && category.items.length === 2;
        
        if (isHierarchical) {
            // Mirrored layout: split the category angle in half
            // Positive trait (left half) | Negative trait (right half)
            // They extend outward in complementary/opposing positions
            const halfAngle = angleRange / 2;
            const midAngle = category.startAngle + halfAngle;
            
            category.items.forEach((item, index) => {
                // Index 0 (positive): left half of category (from start to mid)
                // Index 1 (negative): right half of category (from mid to end)
                const itemStartAngle = index === 0 ? category.startAngle : midAngle;
                const itemEndAngle = index === 0 ? midAngle : category.endAngle;
                
                // Color based on trait polarity
                let baseColor;
                if (item.isNeutral) {
                    baseColor = '#9E9E9E'; // Grey for neutral traits
                } else if (item.isPositive) {
                    baseColor = '#4CAF50'; // Green for positive traits
                } else {
                    baseColor = '#F44336'; // Red for negative traits
                }
                
                drawItemArc(g, item, itemStartAngle, itemEndAngle, middleRadius, maxOuterRadius, radius, config, category, tooltip, index, baseColor);
            });
        } else {
            // Standard layout: divide angle equally among items
            const itemAngle = angleRange / category.items.length;
            
            category.items.forEach((item, index) => {
                const itemStartAngle = category.startAngle + index * itemAngle;
                const itemEndAngle = itemStartAngle + itemAngle;
                
                drawItemArc(g, item, itemStartAngle, itemEndAngle, middleRadius, maxOuterRadius, radius, config, category, tooltip, index);
            });
        }
    });

    // Center circle
    g.append('circle')
        .attr('r', innerRadius)
        .attr('fill', 'white')
        .attr('stroke', '#ccc')
        .attr('stroke-width', Math.max(3, radius * 0.01));

    // Add avatar image in center if available
    const selectedAvatar = localStorage.getItem('selectedAvatar') || window.selectedAvatar;
    
    if (selectedAvatar) {
        // Create a circular clipping path for the avatar (relative to g's coordinate system)
        const clipId = `avatar-clip-${containerId}`;
        svg.append('defs')
            .append('clipPath')
            .attr('id', clipId)
            .append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', innerRadius * 0.85);
        
        // Add the avatar image (positioned relative to g's center which is at 0,0)
        g.append('image')
            .attr('href', selectedAvatar)
            .attr('x', -innerRadius * 0.85)
            .attr('y', -innerRadius * 0.85)
            .attr('width', innerRadius * 1.7)
            .attr('height', innerRadius * 1.7)
            .attr('clip-path', `url(#${clipId})`)
            .attr('preserveAspectRatio', 'xMidYMid slice')
            .style('pointer-events', 'none')
            .attr('transform', `translate(0, 0)`);
    } else {
        // Fallback to text if no avatar is selected
        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '-0.5em')
            .style('font-size', `${Math.max(16, radius * 0.045)}px`)
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text(config.centerLabel);

        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '1.2em')
            .style('font-size', `${Math.max(14, radius * 0.038)}px`)
            .style('fill', '#666')
            .text(config.centerSubLabel);
    }

    // Animate on load
    if (config.animate) {
        g.selectAll('path')
            .attr('opacity', 0)
            .transition()
            .duration(800)
            .attr('opacity', 1);
    }

    // Return cleanup function
    return function cleanup() {
        tooltip.remove();
    };
}

/**
 * Draws a single item arc with all its interactions and labels
 * @param {Object} g - D3 group element
 * @param {Object} item - Item data
 * @param {number} itemStartAngle - Start angle
 * @param {number} itemEndAngle - End angle
 * @param {number} middleRadius - Middle radius
 * @param {number} maxOuterRadius - Maximum outer radius
 * @param {number} radius - Base radius
 * @param {Object} config - Configuration object
 * @param {Object} category - Parent category
 * @param {Object} tooltip - D3 tooltip element
 * @param {number} index - Item index within category
 * @param {string} baseColor - Optional override for item color (for mirrored traits)
 */
function drawItemArc(g, item, itemStartAngle, itemEndAngle, middleRadius, maxOuterRadius, radius, config, category, tooltip, index, baseColor) {
    
    // Use raw values with a growth multiplier to make bars extend further
    // No transformation, just amplify the extension
    const growthMultiplier = config.growthMultiplier || 1.25; // Default 1.25x growth
    const extension = item.value * growthMultiplier * (maxOuterRadius - middleRadius);
    const outerRadius = middleRadius + extension;

    // Determine fill color based on activation value
    // Higher activation = darker/more saturated, lower activation = lighter/less saturated
    // If baseColor provided (for mirrored traits), use it as base; otherwise use category color
    const baseColorToUse = baseColor ? baseColor : category.color;
    
    // Convert to HSL for better color control
    const baseHSL = d3.hsl(baseColorToUse);
    
    // Adjust lightness based on value: higher value = matches inner ring color, lower value = much lighter
    // Extreme range for very dramatic color differences
    const minLightness = 0.92; // Almost white at 0% activation
    const maxLightness = baseHSL.l; // Use the lightness of the inner ring color at 100% activation
    const lightness = minLightness - (item.value * (minLightness - maxLightness));
    
    const fillColor = d3.hsl(baseHSL.h, baseHSL.s, lightness);
    
    // Item arc
    const itemArc = g.append('path')
        .attr('d', d3.arc()
            .innerRadius(middleRadius)
            .outerRadius(outerRadius)
            .startAngle(itemStartAngle)
            .endAngle(itemEndAngle)
        )
        .attr('fill', fillColor)
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .style('opacity', 0.9)
        .style('cursor', 'pointer');

    // Store reference for sister trait highlighting
    itemArc.attr('data-trait-name', item.name);
    if (item.oppositeTrait) {
        itemArc.attr('data-opposite-trait', item.oppositeTrait);
    }
    
    // Add hover effects to items with enhanced visual feedback
    itemArc.on('mouseenter', function(event) {
        d3.select(this)
            .transition()
            .duration(200)
            .style('opacity', 1)
            .attr('stroke-width', 4)
            .style('filter', 'brightness(1.1)');
        
        // Highlight the opposite trait if it exists
        if (item.oppositeTrait) {
            g.selectAll('path[data-trait-name]')
                .filter(function() {
                    return d3.select(this).attr('data-trait-name') === item.oppositeTrait;
                })
                .transition()
                .duration(200)
                .attr('stroke', '#2196F3')
                .attr('stroke-width', 4)
                .style('opacity', 0.5);
        }
        
        tooltip.transition()
            .duration(200)
            .style('opacity', 1);
        
        // Show activation percentage, definition, and opposite trait
        const activationPercent = (item.value * 100).toFixed(0);
        const definition = getTraitDefinition(item.name);
        const oppositeTraitInfo = item.oppositeTrait ? 
            `<br/><span style="opacity: 0.8;">Opposite trait: ${item.oppositeTrait}</span>` : '';
        
        tooltip.html(`
            <strong style="font-size: 16px;">${item.name}</strong><br/>
            <span style="opacity: 0.7; font-size: 13px; font-style: italic;">${definition}</span><br/>
            <span style="opacity: 0.9;">Activation: ${activationPercent}%</span>${oppositeTraitInfo}
        `);
    })
    .on('mouseleave', function() {
        d3.select(this)
            .transition()
            .duration(200)
            .style('opacity', 0.9)
            .attr('stroke-width', 2)
            .style('filter', 'none');
        
        // Reset ALL item arcs to white stroke (clears any lingering highlights)
        g.selectAll('path[data-trait-name]')
            .transition()
            .duration(200)
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .style('opacity', 0.9);
        
        tooltip.transition()
            .duration(200)
            .style('opacity', 0);
    })
    .on('click', function() {
        // Click handler for future interactivity
    });
    
    // Add label for this trait (if enabled)
    if (config.showLabels) {
        const midAngle = (itemStartAngle + itemEndAngle) / 2;
        
        // Position labels at a fixed distance from center (just beyond the middle ring)
        // This keeps them from extending too far out and exiting the container
        const labelRadius = middleRadius + (radius * 0.08);
        
        const labelX = Math.sin(midAngle) * labelRadius;
        const labelY = -Math.cos(midAngle) * labelRadius;
        
        // Calculate rotation to keep text radially oriented (pointing outward from center like spokes)
        // Convert angle to degrees and adjust so text reads outward from center
        let rotation = (midAngle * 180 / Math.PI) - 90;
        let textAnchor = 'start';
        
        // Check if label would be upside down (left half of circle: 90° to 270°)
        // After the -90 adjustment, check if the adjusted rotation makes text upside down
        if (rotation > 90 && rotation < 270) {
            // Flip the text 180° to keep it readable
            rotation += 180;
            textAnchor = 'end';
        }
        
        // Create text element with trait name and activation value
        const labelGroup = g.append('g')
            .attr('transform', `translate(${labelX}, ${labelY}) rotate(${rotation})`)
            .style('cursor', 'pointer')
            .style('pointer-events', 'all'); // Enable pointer events for hover
        
        const textElement = labelGroup.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .attr('text-anchor', textAnchor)
            .attr('dominant-baseline', 'middle')
            .style('user-select', 'none');
        
        // Add trait name in black
        textElement.append('tspan')
            .style('font-size', `${Math.max(10, radius * 0.028)}px`)
            .style('font-weight', '500')
            .style('fill', '#333')
            .text(item.name);
        
        // Add activation value in smaller font
        textElement.append('tspan')
            .style('font-size', `${Math.max(8, radius * 0.022)}px`)
            .style('font-weight', '500')
            .style('fill', '#222')
            .text(` ${(item.value * 100).toFixed(0)}%`);
        
        // Add hover effects to label group that mirror the arc hover effects
        labelGroup.on('mouseenter', function(event) {
            // Trigger the arc hover effect
            itemArc.transition()
                .duration(200)
                .style('opacity', 1)
                .attr('stroke-width', 4)
                .style('filter', 'brightness(1.1)');
            
            // Highlight the opposite trait if it exists
            if (item.oppositeTrait) {
                g.selectAll('path[data-trait-name]')
                    .filter(function() {
                        return d3.select(this).attr('data-trait-name') === item.oppositeTrait;
                    })
                    .transition()
                    .duration(200)
                    .attr('stroke', '#2196F3')
                    .attr('stroke-width', 4)
                    .style('opacity', 0.5);
            }
            
            // Show tooltip
            tooltip.transition()
                .duration(200)
                .style('opacity', 1);
            
            // Show activation percentage, definition, and opposite trait
            const activationPercent = (item.value * 100).toFixed(0);
            const definition = getTraitDefinition(item.name);
            const oppositeTraitInfo = item.oppositeTrait ? 
                `<br/><span style="opacity: 0.8;">Sister trait: ${item.oppositeTrait}</span>` : '';
            
            tooltip.html(`
                <strong style="font-size: 16px;">${item.name}</strong><br/>
                <span style="opacity: 0.7; font-size: 13px; font-style: italic;">${definition}</span><br/>
                <span style="opacity: 0.9;">Activation: ${activationPercent}%</span>${oppositeTraitInfo}
            `);
        })
        .on('mouseleave', function() {
            // Reset the arc
            itemArc.transition()
                .duration(200)
                .style('opacity', 0.9)
                .attr('stroke-width', 2)
                .style('filter', 'none');
            
            // Reset ALL item arcs to white stroke (clears any lingering highlights)
            g.selectAll('path[data-trait-name]')
                .transition()
                .duration(200)
                .attr('stroke', 'white')
                .attr('stroke-width', 2)
                .style('opacity', 0.9);
            
            // Hide tooltip
            tooltip.transition()
                .duration(200)
                .style('opacity', 0);
        });
    }
}

/**
 * Transforms persona vector data into categories structure for two-ring sunburst
 * @param {Object} personaData - Object with categorized persona ratings or flat ratings
 * @param {Object} config - Configuration object with layout options
 * @returns {Array} - Array of category objects with items
 */
function transformToCategories(personaData, config = {}) {
    // Check if data is in new hierarchical format (categories with sub-traits)
    if (isHierarchicalFormat(personaData)) {
        return transformHierarchicalData(personaData, config);
    }
    
    // Check if data is already in categories format
    if (personaData.categories && Array.isArray(personaData.categories)) {
        const categories = personaData.categories.map((cat, idx) => ({
            name: cat.name,
            color: cat.color || getDefaultColor(idx),
            startAngle: cat.startAngle,
            endAngle: cat.endAngle,
            items: cat.items.map(item => {
                // Use raw values directly, no scaling
                return {
                    name: item.name,
                    value: Math.abs(item.value), // Just use absolute value of raw data
                    rawValue: item.value
                };
            })
        }));
        
        // If angles aren't provided, calculate proportionally based on item counts
        const needsAngleCalculation = categories.some(cat => cat.startAngle === undefined || cat.endAngle === undefined);
        if (needsAngleCalculation) {
            const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
            let currentAngle = 0;
            categories.forEach((category) => {
                const proportion = category.items.length / totalItems;
                const angleRange = proportion * 2 * Math.PI;
                
                category.startAngle = currentAngle;
                category.endAngle = currentAngle + angleRange;
                currentAngle += angleRange;
            });
        }
        
        return categories;
    }

    // First, filter to keep only dominant traits from each pair
    const { filteredData, oppositeTraits } = filterDominantTraits(personaData);
    
    // Group traits by positive vs negative semantic valuation
    const categoryMap = new Map();
    
    // Initialize two categories
    categoryMap.set('Positive Traits', {
        // name: 'Positive Traits',
        color: '#4CAF50', // Green for positive
        items: []
    });
    
    categoryMap.set('Negative Traits', {
        // name: 'Negative Traits',
        color: '#F44336', // Red for negative
        items: []
    });

    // Process each trait
    for (const [key, value] of Object.entries(filteredData)) {
        // Get effective trait classification
        const effectiveTrait = getEffectiveTrait(key, value);
        
        // Determine which category to place it in
        const categoryName = effectiveTrait.isPositive ? 'Positive Traits' : 'Negative Traits';
        
        categoryMap.get(categoryName).items.push({
            name: effectiveTrait.name,
            value: effectiveTrait.absValue, // Use raw value directly (0-1 range)
            rawValue: value,
            originalTrait: key,
            oppositeTrait: oppositeTraits[key] ? formatTraitName(oppositeTraits[key]) : null
        });
    }

    // Convert map to array, filter out empty categories, and assign angles
    const categories = Array.from(categoryMap.entries()).map(([name, cat]) => ({
        ...cat,
        name: name
    })).filter(cat => cat.items.length > 0);
    
    // Calculate total number of items across all categories
    const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
    
    // Assign angles proportional to the number of items in each category
    let currentAngle = 0;
    categories.forEach((category) => {
        const proportion = category.items.length / totalItems;
        const angleRange = proportion * 2 * Math.PI;
        
        category.startAngle = currentAngle;
        category.endAngle = currentAngle + angleRange;
        currentAngle += angleRange;
    });

    return categories;
}

/**
 * Checks if data is in hierarchical format (categories with sub-traits)
 * New API format: { empathy: { empathetic: 0.5, unempathetic: 0.3 }, ... }
 * @param {Object} data - Persona data
 * @returns {boolean} - True if hierarchical format
 */
function isHierarchicalFormat(data) {
    if (!data || typeof data !== 'object') return false;
    
    // Check if first-level values are objects (not numbers)
    const firstValue = Object.values(data)[0];
    return firstValue && typeof firstValue === 'object' && !Array.isArray(firstValue);
}

/**
 * Transforms hierarchical data into super-categories: Positive, Negative, and optionally Neutral
 * All positive traits on one side, all negative traits on another, neutral at bottom (mirror mode only)
 * @param {Object} hierarchicalData - Data in format { category: { trait1: val1, trait2: val2 } }
 * @param {Object} config - Configuration object with layout options
 * @returns {Array} - Array with 2 or 3 super-categories (Positive, Negative, and optionally Neutral)
 */
function transformHierarchicalData(hierarchicalData, config = {}) {
    const useOppositeLayout = config.oppositeLayout === true; // default false (mirrored with neutral)
    
    const traitPairs = [];
    
    // Collect trait pairs with their complementary traits
    for (const [categoryName, traits] of Object.entries(hierarchicalData)) {
        const traitEntries = Object.entries(traits);
        
        if (traitEntries.length !== 2) {
            console.warn(`⚠️ Category "${categoryName}" doesn't have exactly 2 traits, skipping`);
            continue;
        }
        
        const [trait1Name, trait1Value] = traitEntries[0];
        const [trait2Name, trait2Value] = traitEntries[1];
        
        // Classify traits (returns 'positive', 'negative', or 'neutral')
        const trait1Classification = classifyTrait(trait1Name);
        const trait2Classification = classifyTrait(trait2Name);
        
        // Store trait information with classification
        const trait1 = { 
            name: formatTraitName(trait1Name), 
            value: trait1Value, 
            originalTrait: trait1Name,
            classification: trait1Classification
        };
        
        const trait2 = { 
            name: formatTraitName(trait2Name), 
            value: trait2Value, 
            originalTrait: trait2Name,
            classification: trait2Classification
        };
        
        traitPairs.push({
            category: formatTraitName(categoryName),
            trait1: trait1,
            trait2: trait2
        });
        
    }
    
    // Separate positive, negative, and neutral items with configurable positioning
    const positiveItems = [];
    const negativeItems = [];
    const neutralItems = [];
    
    const totalPairs = traitPairs.length;
    
    if (useOppositeLayout) {
        // OPPOSITE LAYOUT: Traits positioned π radians (180°) apart (2 categories only: pos/neg)
        // - Positive traits: right semicircle (0° to 180°), evenly distributed
        // - Negative traits: left semicircle (180° to 360°), each exactly opposite its pair
        //
        // Example with 8 pairs:
        //   - Positive at ~11°, ~34°, ~56°, ~79°, ~101°, ~124°, ~146°, ~169°
        //   - Negative at ~191°, ~214°, ~236°, ~259°, ~281°, ~304°, ~326°, ~349°
        
        const angleStep = Math.PI / totalPairs;
        
        traitPairs.forEach((pair, index) => {
            // For opposite layout, we still use the old 2-category system (positive/negative only)
            // Neutral traits are treated as positive in this mode
            const trait1IsPositive = pair.trait1.classification !== 'negative';
            const trait2IsPositive = pair.trait2.classification !== 'negative';
            
            const positiveTrait = trait1IsPositive ? pair.trait1 : pair.trait2;
            const negativeTrait = !trait1IsPositive ? pair.trait1 : pair.trait2;
            
            // Positive trait: evenly distributed on right side (0° to 180°)
            const positiveAngle = angleStep * (index + 0.5);
            
            // Negative trait: exactly π radians opposite (180° away)
            const negativeAngle = positiveAngle + Math.PI;
        
        positiveItems.push({
            name: positiveTrait.name,
            value: positiveTrait.value,
            rawValue: positiveTrait.value,
            originalTrait: positiveTrait.originalTrait,
            oppositeTrait: negativeTrait.name,  // Store opposite trait
            category: pair.category,
            isPositive: true,
            pairIndex: index,
            angle: positiveAngle
        });
        
        negativeItems.push({
            name: negativeTrait.name,
            value: negativeTrait.value,
            rawValue: negativeTrait.value,
            originalTrait: negativeTrait.originalTrait,
            oppositeTrait: positiveTrait.name,  // Store opposite trait
            category: pair.category,
            isPositive: false,
            pairIndex: index,
            angle: negativeAngle
        });
        });
    } else {
        // MIRRORED LAYOUT: 3 categories - Positive (right), Negative (left), Neutral (bottom)
        // - Positive traits: right side of vertical
        // - Negative traits: left side of vertical
        // - Neutral traits: bottom section (centered at 270°)
        //
        // Layout:
        //   - Positive: right side, mirrored from 45° (upper right)
        //   - Negative: left side, mirrored from 135° (upper left)
        //   - Neutral: bottom, centered around 270° (bottom center)
        
        traitPairs.forEach((pair, index) => {
            const trait1Class = pair.trait1.classification;
            const trait2Class = pair.trait2.classification;
            
            // Helper to add trait item
            const addItem = (trait, oppositeTrait, targetArray, classification, angle) => {
                const isPositive = classification === 'positive';
                const isNeutral = classification === 'neutral';
                
                targetArray.push({
                    name: trait.name,
                    value: trait.value,
                    rawValue: trait.value,
                    originalTrait: trait.originalTrait,
                    oppositeTrait: oppositeTrait.name,
                    category: pair.category,
                    isPositive: isPositive,
                    isNeutral: isNeutral,
                    pairIndex: index,
                    angle: angle
                });
            };
            
            // Determine angles based on classification
            if (trait1Class === 'neutral' || trait2Class === 'neutral') {
                // Both traits in a neutral pair go to neutral section
                // Neutral is centered at π (270° standard = bottom)
                // Position opposite traits on OPPOSITE SIDES of the midline (mirrored)
                const neutralCenter = Math.PI; // 270° standard = bottom
                const totalNeutralPairs = traitPairs.filter(p => 
                    p.trait1.classification === 'neutral' || p.trait2.classification === 'neutral'
                ).length;
                
                // Calculate how many neutral pairs have been processed
                const neutralPairIndex = neutralItems.length / 2;
                
                // Neutral section size will be proportional, estimated here
                // Use a reasonable spread for neutral traits
                const neutralSectionSpread = Math.PI / 3; // About 60° spread
                const halfSpread = neutralSectionSpread / 2;
                
                // Position pairs with offset from center
                // Each pair gets a position offset from the midline
                const offsetStep = halfSpread / (totalNeutralPairs + 1);
                const pairOffset = offsetStep * (neutralPairIndex + 1);
                
                // Mirror across the center: one trait on left, one on right
                const angle1 = neutralCenter - pairOffset; // Left side of midline
                const angle2 = neutralCenter + pairOffset; // Right side of midline (mirrored)
                
                addItem(pair.trait1, pair.trait2, neutralItems, trait1Class, angle1);
                addItem(pair.trait2, pair.trait1, neutralItems, trait2Class, angle2);
            } else {
                // Standard positive/negative pair
                // Mirror axis at 0 radians (90° standard = top of circle)
                // Positive: right side (clockwise from top)
                // Negative: left side (counter-clockwise from top)
                const mirrorAxis = 0; // Top in D3 coords (90° standard)
                const nonNeutralPairs = traitPairs.filter(p => 
                    p.trait1.classification !== 'neutral' && p.trait2.classification !== 'neutral'
                ).length;
                
                // Calculate how many pos/neg pairs have been processed so far
                const pairNumber = (positiveItems.length + negativeItems.length) / 2;
                
                // Distribute pairs symmetrically around the top
                // Available arc excludes neutral section
                const maxOffset = Math.PI / 2; // Up to 90° on each side of top
                const offsetStep = maxOffset / (nonNeutralPairs + 1);
                const pairOffset = offsetStep * (pairNumber + 1);
                
                // Positive trait: right side (positive offset from mirror axis)
                const positiveAngle = mirrorAxis + pairOffset;
                
                // Negative trait: left side (negative offset from mirror axis)
                const negativeAngle = mirrorAxis - pairOffset;
                // Normalize to 0-2π range
                const normalizedNegativeAngle = negativeAngle < 0 ? negativeAngle + 2 * Math.PI : negativeAngle;
                
                if (trait1Class === 'positive') {
                    addItem(pair.trait1, pair.trait2, positiveItems, trait1Class, positiveAngle);
                    addItem(pair.trait2, pair.trait1, negativeItems, trait2Class, normalizedNegativeAngle);
                } else {
                    addItem(pair.trait2, pair.trait1, positiveItems, trait2Class, positiveAngle);
                    addItem(pair.trait1, pair.trait2, negativeItems, trait1Class, normalizedNegativeAngle);
                }
            }
        });
    }
    
    // Sort items by angle for proper rendering order
    positiveItems.sort((a, b) => a.angle - b.angle);
    negativeItems.sort((a, b) => a.angle - b.angle);
    neutralItems.sort((a, b) => a.angle - b.angle);
    
    // Remove the temporary angle property before creating categories
    const cleanPositiveItems = positiveItems.map(({angle, ...item}) => item);
    const cleanNegativeItems = negativeItems.map(({angle, ...item}) => item);
    const cleanNeutralItems = neutralItems.map(({angle, ...item}) => item);
    
    // Create categories based on layout mode
    let categories;
    
    if (useOppositeLayout || neutralItems.length === 0) {
        // OPPOSITE LAYOUT or NO NEUTRAL TRAITS: 2 categories (positive and negative)
        // Positive occupies right side, negative occupies left side
        categories = [
            {
                name: 'Positive Traits',
                color: '#4CAF50', // Green
                startAngle: 0,
                endAngle: Math.PI, // Right side: 0° to 180°
                items: cleanPositiveItems,
                isHierarchical: false
            },
            {
                name: 'Negative Traits',
                color: '#F44336', // Red  
                startAngle: Math.PI,
                endAngle: 2 * Math.PI, // Left side: 180° to 360°
                items: cleanNegativeItems,
                isHierarchical: false
            }
        ];
    } else {
        // MIRRORED LAYOUT with NEUTRAL TRAITS: 3 categories (positive, negative, neutral)
        // Arc sizes are PROPORTIONAL to number of traits in each category
        // Neutral category centered at 270° (standard coords) = 3π/2 (bottom of circle)
        // Note: D3 uses angle 0 at right (3 o'clock) with angles increasing clockwise
        // To convert standard degrees to D3 radians: D3_radians = (standard_degrees - 90) * π/180
        
        const totalItems = cleanPositiveItems.length + cleanNegativeItems.length + cleanNeutralItems.length;
        const fullCircle = 2 * Math.PI;
        
        // Calculate arc sizes proportional to item counts
        const neutralArcSize = (cleanNeutralItems.length / totalItems) * fullCircle;
        const positiveArcSize = (cleanPositiveItems.length / totalItems) * fullCircle;
        const negativeArcSize = (cleanNegativeItems.length / totalItems) * fullCircle;
        
        // Position neutral centered at 270° standard = bottom of circle
        // 270° standard = (270 - 90) = 180° in D3 = π radians
        const neutralCenter = Math.PI; // 270° standard coords = bottom
        const neutralStart = neutralCenter - neutralArcSize / 2;
        const neutralEnd = neutralCenter + neutralArcSize / 2;
        
        // Positive goes from end of neutral, clockwise (right side going up)
        const positiveStart = neutralEnd;
        const positiveEnd = positiveStart + positiveArcSize;
        
        // Negative goes from end of positive, clockwise (left side going down)
        const negativeStart = positiveEnd;
        const negativeEnd = negativeStart + negativeArcSize;
        
        categories = [
            {
                name: 'Neutral Traits',
                color: '#9E9E9E', // Grey
                startAngle: neutralStart,
                endAngle: neutralEnd,
                items: cleanNeutralItems,
                isHierarchical: false
            },
            {
                name: 'Positive Traits',
                color: '#4CAF50', // Green
                startAngle: positiveStart,
                endAngle: positiveEnd,
                items: cleanPositiveItems,
                isHierarchical: false
            },
            {
                name: 'Negative Traits',
                color: '#F44336', // Red  
                startAngle: negativeStart,
                endAngle: negativeEnd,
                items: cleanNegativeItems,
                isHierarchical: false
            }
        ];
    }
    
    return categories;
}

/**
 * Normalizes a value from a given scale to 0-100 percentage
 * @param {number} value - The value to normalize
 * @param {Object} scale - Object with min and max properties
 * @returns {number} - Normalized value (0-100)
 */
function normalizeValue(value, scale = { min: -2, max: 2 }) {
    // Clamp value to scale
    const clampedValue = Math.max(scale.min, Math.min(scale.max, value));
    // Normalize to 0-100
    return ((clampedValue - scale.min) / (scale.max - scale.min)) * 100;
}

/**
 * Dynamically detect trait pairs from API response
 * Trait pairs are detected when two traits' values sum to approximately 1.0 (±0.01)
 * This allows the visualization to work with any trait pairs the API returns
 * @param {Object} personaData - Raw API data with traits
 * @returns {Object} - Map of trait to its opposite trait
 */
function detectTraitPairs(personaData) {
    const traitPairs = {};
    const processed = new Set();
    
    const traits = Object.keys(personaData);
    
    // Check each trait against all other traits to find pairs that sum to ~1.0
    for (let i = 0; i < traits.length; i++) {
        const trait1 = traits[i];
        if (processed.has(trait1)) continue;
        
        for (let j = i + 1; j < traits.length; j++) {
            const trait2 = traits[j];
            if (processed.has(trait2)) continue;
            
            const val1 = personaData[trait1];
            const val2 = personaData[trait2];
            const sum = val1 + val2;
            
            // If values sum to approximately 1.0 (±0.01), they're a pair
            if (Math.abs(sum - 1.0) < 0.01) {
                traitPairs[trait1] = trait2;
                traitPairs[trait2] = trait1;
                processed.add(trait1);
                processed.add(trait2);
                break;
            }
        }
    }
    
    return traitPairs;
}

/**
 * Dynamically classify traits as positive, negative, or neutral based on common patterns
 * Uses heuristics to determine if a trait is generally positive, negative, or neutral
 * @param {string} traitName - Name of the trait
 * @returns {string} - 'positive', 'negative', or 'neutral'
 */
function classifyTrait(traitName) {
    const trait = traitName.toLowerCase();
    
    // Neutral traits (funny/serious, casual/formal)
    const neutralTraits = ['funny', 'serious', 'casual', 'formal'];
    if (neutralTraits.some(nt => trait.includes(nt))) {
        return 'neutral';
    }
    
    // Negative trait prefixes (must be at start of word)
    const negativePrefixes = ['un', 'dis', 'anti', 'in'];
    
    // Negative trait indicators (can appear anywhere)
    const negativeIndicators = [
        'toxic', 'harmful', 'rude', 'aggressive', 'hostile',
        'sycophant', 'deceptive', 'dishonest', 'fake',
        'hallucinat', 'inaccurate', 'wrong', 'false',
        'boring', 'dull', 'cold', 'unfriendly'
    ];
    
    // Positive trait indicators (contains)
    const positiveIndicators = [
        'empath', 'kind', 'caring', 'warm', 'friendly',
        'encourag', 'support', 'help', 'positive',
        'social', 'outgoing', 'engaging',
        'honest', 'truthful', 'genuine', 'authentic',
        'humorous', 'witty', 'playful',
        'accurate', 'correct', 'precise', 'factual',
        'respectful', 'polite', 'courteous',
        'creative', 'innovative', 'original',
        'relaxed', 'easy'
    ];
    
    // Check for negative prefixes (must be at start)
    for (const prefix of negativePrefixes) {
        if (trait.startsWith(prefix)) {
            return 'negative';
        }
    }
    
    // Check for negative indicators (can be anywhere)
    for (const indicator of negativeIndicators) {
        if (trait.includes(indicator)) {
            return 'negative';
        }
    }
    
    // Check for positive indicators
    for (const indicator of positiveIndicators) {
        if (trait.includes(indicator)) {
            return 'positive';
        }
    }
    
    // Default to positive if no clear indicators
    return 'positive';
}

/**
 * Filters trait pairs to keep only the dominant trait from each pair
 * Dynamically detects pairs and filters - works with any traits the API returns
 * @param {Object} personaData - Raw API data with trait pairs
 * @returns {Object} - Object with filteredData (dominant traits) and oppositeTraits (mapping)
 */
function filterDominantTraits(personaData) {
    // First, dynamically detect trait pairs from the data
    const traitPairs = detectTraitPairs(personaData);
    
    const processed = new Set();
    const result = {};
    const oppositeTraits = {}; // Map to store opposite trait names
    
    for (const [traitName, value] of Object.entries(personaData)) {
        const traitKey = traitName.toLowerCase();
        
        // Skip if already processed as part of a pair
        if (processed.has(traitKey)) {
            continue;
        }
        
        // Check if this trait has a pair (using dynamically detected pairs)
        const oppositeTrait = traitPairs[traitName];
        
        if (oppositeTrait && personaData[oppositeTrait] !== undefined) {
            // This is a trait pair - keep the dominant one (higher value)
            const oppositeValue = personaData[oppositeTrait];
            
            if (value >= oppositeValue) {
                result[traitName] = value;
                oppositeTraits[traitName] = oppositeTrait; // Store opposite
            } else {
                result[oppositeTrait] = oppositeValue;
                oppositeTraits[oppositeTrait] = traitName; // Store opposite
            }
            
            // Mark both as processed
            processed.add(traitKey);
            processed.add(oppositeTrait.toLowerCase());
        } else {
            // Not a paired trait, keep it as-is
            result[traitName] = value;
            processed.add(traitKey);
        }
    }
    
    return { filteredData: result, oppositeTraits };
}

/**
 * Gets the effective trait name and polarity based on the trait
 * Dynamically classifies traits using heuristics
 * @param {string} traitName - Original trait name from API
 * @param {number} value - Trait value (0-1 range)
 * @returns {Object} - { name, isPositive, absValue }
 */
function getEffectiveTrait(traitName, value) {
    // Use dynamic classification instead of predefined list
    const isPositive = classifyTrait(traitName);
    
    return {
        name: formatTraitName(traitName),
        isPositive: isPositive,
        absValue: value
    };
}

/**
 * Formats a trait name to be display-friendly
 * @param {string} name - Trait name
 * @returns {string} - Formatted name
 */
function formatTraitName(name) {
    return name
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Gets a short definition for a trait
 * @param {string} traitName - Trait name (formatted or raw)
 * @returns {string} - Short definition
 */
function getTraitDefinition(traitName) {
    const trait = traitName.toLowerCase().replace(/\s+/g, '');
    
    const definitions = {
        'empathetic': 'Understanding and sharing the feelings of others',
        'unempathetic': 'Lacking understanding or concern for others\' feelings',
        'empathy': 'Understanding and sharing the feelings of others',
        
        'warm': 'Friendly, kind, and affectionate in interactions',
        'cold': 'Distant, unfriendly, or emotionally detached',
        'warmth': 'Friendly, kind, and affectionate in interactions',
        
        'supportive': 'Providing encouragement and help to others',
        'unsupportive': 'Lacking encouragement or help for others',
        'supportiveness': 'Providing encouragement and help to others',
        
        'encouraging': 'Inspiring confidence and hope in others',
        'discouraging': 'Causing loss of confidence or hope',
        
        'social': 'Enjoying and seeking interaction with others',
        'unsocial': 'Avoiding or disinterested in social interaction',
        'sociality': 'Enjoying and seeking interaction with others',
        
        'humorous': 'Using wit and jokes to entertain',
        'humorless': 'Lacking in humor or playfulness',
        'humor': 'Using wit and jokes to entertain',
        
        'toxic': 'Harmful, offensive, or disrespectful behavior',
        'respectful': 'Showing consideration and courtesy',
        'toxicity': 'Harmful, offensive, or disrespectful behavior',
        
        'sycophantic': 'Excessive flattery to gain favor',
        'genuine': 'Authentic and sincere in interactions',
        'sycophancy': 'Excessive flattery to gain favor',
        
        'deceptive': 'Deliberately misleading or dishonest',
        'honest': 'Truthful and straightforward',
        'deceptiveness': 'Deliberately misleading or dishonest',
        
        'hallucinatory': 'Generating false information presented as fact',
        'factual': 'Providing accurate and verifiable information',
        'hallucination': 'Generating false information presented as fact',
        
        'casual': 'Relaxed and informal in approach',
        'formal': 'Following proper conventions and structure',
        
        'serious': 'Thoughtful and earnest in manner',
        'playful': 'Light-hearted and fun-loving',
        
        'outgoing': 'Friendly and socially confident',
        'reserved': 'Restrained and quiet in manner',
        
        'creative': 'Showing imagination and originality',
        'conventional': 'Following traditional approaches'
    };
    
    return definitions[trait] || 'A personality characteristic';
}

/**
 * Gets a default color for a category by index
 * @param {number} index - Category index
 * @returns {string} - Hex color code
 */
function getDefaultColor(index) {
    const colors = ['#9C27B0', '#2196F3', '#FF9800', '#4CAF50', '#F44336', '#757575'];
    return colors[index % colors.length];
}

/**
 * Updates an existing sunburst with new data (with animation)
 * @param {Object} personaData - New persona data
 * @param {string} containerId - Container element ID
 * @param {Object} options - Configuration options
 */
function updatePersonaSunburst(personaData, containerId, options = {}) {
    // For now, just recreate the sunburst
    // TODO: Implement smooth transition animation
    createPersonaSunburst(personaData, containerId, options);
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createPersonaSunburst,
        updatePersonaSunburst,
        transformToCategories,
        filterDominantTraits,
        normalizeValue,
        getDefaultColor,
        getEffectiveTrait,
        formatTraitName,
        detectTraitPairs,
        classifyTrait
    };
}

