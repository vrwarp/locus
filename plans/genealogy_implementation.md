# Genealogy Graph Implementation

## Overview
Implemented the "Genealogy Project" (Concept #44 / Moonshot 3.5), adding a network graph visualization of familial relationships (Spouse, Parent-Child, Sibling) to Locus.

## Changes Made
1. **Utility (`src/utils/genealogy.ts`)**:
   - `buildGenealogyGraph`: Parses the array of `Student` objects, grouping by `householdId` to infer spouses, parents, and children, and builds nodes and links.
   - `computeGenealogyLayout`: Implements a custom force-directed layout that groups households tightly while repelling separate households, allowing spouses to be drawn closer than siblings.
2. **Component (`src/components/GenealogyGraph.tsx`)**:
   - Renders the nodes and links on an SVG canvas.
   - Nodes are sized based on whether they are a parent or child.
   - Colors represent different households.
   - Interactions: Tooltips show Name, Age, and Role on hover.
3. **Integration (`src/components/RobertReport.tsx`)**:
   - Added a new 'Genealogy' tab to the Robert Report dashboard to house the graph.
4. **Testing**:
   - Added `GenealogyGraph.test.tsx` verifying component render states.
   - Updated `RobertReport.test.tsx` for the new tab functionality.

## Status
- **Genealogy Project** is now fully implemented and marked as `[DONE]`.
