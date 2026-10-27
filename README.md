# TornDoc AI – Intelligent Line Spacing Detection & Torn Document Reconstruction System

An engineering research prototype and computer vision web application for analyzing scanned, photographed, and physically torn documents. The system performs empirical text-line segmentation, measures vertical and horizontal spacing, detects missing or interrupted text line voids, analyzes fractal torn boundaries, and reconstructs torn document fragments.

---

## 1. Mathematical Formulation & Core Algorithms

### Module 3: Intelligent Line Spacing Detection

Let $Top(i)$ and $Bottom(i)$ denote the vertical bounding coordinates of detected text line $i$, and $Baseline(i)$ denote its typographic baseline.

1. **Vertical Line Gap:**
   $$\text{Gap}(i) = \text{Top}(i+1) - \text{Bottom}(i)$$

2. **Baseline Spacing Rhythm:**
   $$\text{Spacing}(i) = \text{Baseline}(i+1) - \text{Baseline}(i)$$

3. **Average Inter-Line Gap:**
   $$\bar{G} = \frac{1}{M} \sum_{i=1}^{M} \text{Gap}(i)$$

4. **Robust Statistics (Median & IQR):**
   $$\tilde{G} = \text{Median}(\{\text{Gap}(i)\}), \quad \text{IQR} = Q_3 - Q_1$$

5. **Spacing Deviation & Anomaly Detection:**
   $$\text{Deviation}(i) = |\text{Gap}(i) - \tilde{G}|$$
   $$\text{Anomaly Flag} \iff \text{Deviation}(i) > k \times \text{IQR} \quad (k \approx 1.5)$$

6. **Severed / Missing Line Estimation:**
   $$\text{Probable Missing Lines} = \max\left(0, \left\lfloor \frac{\text{Gap}(i) + \frac{1}{2}\tilde{G}}{\tilde{S}} \right\rceil - 1\right)$$
   where $\tilde{S}$ is the median baseline spacing.

7. **Physical Metric Conversion:**
   $$\text{Distance}_{mm} = \text{Distance}_{px} \times \frac{25.4}{\text{DPI}}$$

---

### Module 4 & 5: Torn Boundary Analysis & Multi-Factor Fragment Matching

1. **Edge Curvature & Fractal Roughness:**
   For a boundary profile $P = \{(x_k, y_k)\}_{k=1}^N$, roughness is computed from the mean residual distance from the fitted least-squares line and second-order discrete curvature differences:
   $$\kappa_k = |(y_k - y_{k-1}) - (y_{k-1} - y_{k-2})|$$

2. **Multi-Objective Compatibility Scoring:**
   $$\text{Score}(A, B) = w_{\text{edge}} \cdot S_{\text{edge}} + w_{\text{spacing}} \cdot S_{\text{spacing}} + w_{\text{text}} \cdot S_{\text{text}} + w_{\text{geom}} \cdot S_{\text{geom}}$$
   - $S_{\text{edge}}$: Normalized Cross-Correlation (NCC) of complementary boundary profiles.
   - $S_{\text{spacing}}$: Baseline continuation alignment across the torn seam.
   - $S_{\text{text}}$: OCR token and word continuation across the seam.
   - $S_{\text{geom}}$: Aspect ratio and boundary dimension feasibility.

---

## 2. System Architecture

```
[ Uploaded Document Scans / PDF Pages ]
                     │
                     ▼
       ┌───────────────────────────┐
       │ Image Preprocessing Core  │
       │ - Grayscale Luma (BT.601) │
       │ - Gaussian & Median Denoise│
       │ - CLAHE Contrast Boost    │
       │ - Sauvola & Otsu Binarize │
       │ - Projection Skew Correct │
       └─────────────┬─────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │ Line Spacing Engine (HPP) │
       │ - Projection Oscilloscope │
       │ - Baseline Derivative Scan│
       │ - Gap(i) & Spacing(i)     │
       │ - Statistical Anomaly Flag│
       └─────────────┬─────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │ Torn Edge & Match Solver  │
       │ - Fractal Roughness Eval  │
       │ - NCC Contour Correlation │
       │ - Co-linear Shift Delta Y │
       └─────────────┬─────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │ Interactive Workbench     │
       │ - 2D Canvas Manipulation  │
       │ - Snap-to-Algorithmic Fit │
       │ - Seam Continuity Guides  │
       │ - PDF & CSV Report Export │
       └───────────────────────────┘
```

---

## 3. Pre-Loaded Academic Benchmark Suites

1. **1842 Archival Correspondence Manuscript**: Calligraphic handwritten letter with varying baseline slopes and ink bleed.
2. **Real Estate Commercial Deed Agreement**: Formal notarized legal contract with numbered covenants and serif typography.
3. **IEEE Transactions Scientific Article**: Two-column conference paper with mathematical formulas and heading gaps.
4. **Itemized Commercial Freight Invoice**: Tabular enterprise billing document with missing row gaps.
5. **Rare First-Edition Literary Prose Folio**: Historic letterpress printing with dropped cap and irregular torn edges.

---

## 4. API Endpoints

- `POST /api/upload`: Ingests and validates document files.
- `POST /api/preprocess`: Runs multi-stage CV restoration.
- `POST /api/detect-lines`: Segments text lines from projection profile.
- `POST /api/analyze-spacing`: Calculates gaps, deviations, and missing lines.
- `POST /api/detect-torn-edges`: Identifies irregular torn boundaries vs straight margins.
- `POST /api/match-fragments`: Evaluates multi-factor alignment compatibility.
- `POST /api/reconstruct`: Stores reconstructed composite session.
- `POST /api/ocr`: Runs OCR transcription and semantic continuation.
- `GET /api/results/:id`: Retrieves analysis data.
- `GET /api/report/:id`: Retrieves structured report.
- `GET /api/health`: Service health and engine diagnostics.

---

## 5. Execution Instructions

```bash
# Install dependencies
npm install

# Start full-stack development server on port 3000
npm run dev

# Run TypeScript lint check
npm run lint

# Build production bundle
npm run build
```
