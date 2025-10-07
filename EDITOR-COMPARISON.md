# Old.New Editor Comparison

## Overview
Old.New now has **two powerful document editors** with different rendering engines but the same intuitive interface.

---

## 📝 LaTeX Editor (Port 5173)
**Best for:** Academic documents, formal reports, publications

### Features:
- **LaTeX Code Generation** - Professional typesetting with LaTeX
- **3 Professional Styles:**
  - Blue Horizon (Modern professional)
  - Sleek Monochrome (Minimalist grayscale)
  - Modern Sidebar (Teal themed)
- **Variant Caching** - All 3 styles cached for instant switching
- **PDF Export** - Publication-ready documents
- **ATS Optimization** - Resume-friendly formatting

### Best For:
- ✅ Academic resumes
- ✅ Research papers
- ✅ Technical documentation
- ✅ Publication-ready documents
- ✅ Users familiar with LaTeX

---

## 🎨 Visual Editor (Port 5175)
**Best for:** Modern web documents, quick exports, visual content

### Features:
- **HTML/CSS Templates** - Modern web-native styling
- **SVG & Mermaid Support** - Diagrams, flowcharts, infographics
- **3 Visual Styles:**
  - Modern Blue (Clean & professional)
  - Minimal Gray (Elegant minimalism)
  - Creative Teal (Bold & creative)
- **Variant Caching** - All 3 styles cached for instant switching
- **Multi-Format Export:**
  - PDF (via html2canvas)
  - PNG (high-quality raster)
  - SVG (vector diagrams)
  - HTML (web-ready)

### Hybrid Rendering Engine:
- **HTML/CSS** → Structured documents (resumes, reports, letters)
- **Mermaid.js** → Flowcharts, sequence diagrams, class diagrams
- **SVG** → Infographics and data visualizations
- **Canvas** → Complex graphics fallback

### Best For:
- ✅ Web-optimized resumes
- ✅ Flowcharts & diagrams
- ✅ Infographics
- ✅ Quick PDF exports
- ✅ Users who prefer HTML/CSS
- ✅ ATS-friendly documents

---

## 🎯 Common Features (Both Editors)

### UI Layout:
- **Left Panel:** AI Chat - Get help, make changes, ask questions
- **Center Panel:** Document Preview - See your polished document
- **Top Bar:** Variant Switcher - Toggle between 3 cached styles instantly

### AI Capabilities:
- **xAI Grok Integration** - Powered by Grok-4-fast-reasoning
- **Smart Content Analysis** - Auto-detects document type
- **Style Generation** - Creates 3 variants automatically
- **Real-time Enhancement** - Polish grammar, strengthen language
- **Conversational Editing** - Chat to make changes

### User Experience:
- ✅ No code panel clutter - Just clean document preview
- ✅ Variant caching - Switch styles instantly
- ✅ Drag & drop upload
- ✅ Auto-save functionality
- ✅ Smooth animations & transitions
- ✅ Illuminated variant buttons

---

## 🚀 When to Use Each Editor

| Use Case | LaTeX Editor | Visual Editor |
|----------|-------------|---------------|
| Academic Resume | ✅ Best | ✓ Good |
| Creative Resume | ✓ Good | ✅ Best |
| Research Paper | ✅ Best | ✗ |
| Business Report | ✅ Best | ✓ Good |
| Flowchart/Diagram | ✗ | ✅ Best |
| Infographic | ✗ | ✅ Best |
| Cover Letter | ✅ Best | ✓ Good |
| Web Portfolio | ✗ | ✅ Best |
| Quick Export | ✓ Good | ✅ Best |
| Publication | ✅ Best | ✗ |

---

## 🔧 Technical Architecture

### LaTeX Editor Stack:
```
Frontend: React + TypeScript + Monaco Editor
LaTeX Engine: Custom LaTeX generator
PDF: Backend compilation (latexmk)
Templates: .tex files with variable injection
```

### Visual Editor Stack:
```
Frontend: React + TypeScript + Monaco Editor
Rendering: HTML/CSS + Mermaid.js + SVG
PDF: html2canvas + jsPDF (client-side)
Templates: HTML templates with CSS Grid/Flexbox
Diagrams: Mermaid.js syntax parsing
```

---

## 📱 Access URLs

- **Upload Landing:** http://localhost:5174
- **LaTeX Editor:** http://localhost:5173
- **Visual Editor:** http://localhost:5175
- **Backend API:** http://localhost:3000

---

## 🎨 Variant Caching System

Both editors implement intelligent variant caching:

1. **Initial Generation:** AI creates all 3 style variants
2. **Automatic Caching:** Each variant stored in memory
3. **Instant Switching:** Click variant buttons for immediate preview
4. **No Regeneration:** Cached variants load instantly
5. **Smooth Transitions:** Fade animations between variants

**Result:** Users can explore all 3 styles in seconds, not minutes!

---

## 💡 Pro Tips

- **Try both editors** - Each has unique strengths
- **Cache is your friend** - All 3 variants are always ready
- **Use the chat** - Ask the AI to make specific changes
- **Export options** - Visual editor has more format options
- **Academic users** - LaTeX editor produces publication-quality output
- **Speed matters** - Visual editor exports faster (client-side)

---

Generated for Old.New AI Document Enhancement Platform
