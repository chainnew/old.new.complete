#!/usr/bin/env python3
"""
UI/Stencil Builder Module - Compiles Scraped Data into Artillery Kits.

Part of Godmode System.
Run: python ui_stencil_builder.py --input-db enhanced_themes.db --build-kits
Outputs: artillery_kit/ dir with stencil_code/, tweaked_pdfs/, ui_graph.gexf, mermaid_viz.md
"""

import json
import csv
import os
from pathlib import Path
import logging
from networkx import nx, write_gexf  # For graphs
from reportlab.pdfgen import canvas  # Bundle PDFs if needed

class KitBuilder:
    def __init__(self, db_path: str = 'enhanced_themes.db'):
        self.db_path = db_path
        self.output_dir = Path('artillery_kit')
        self.output_dir.mkdir(exist_ok=True)
        self.top_themes = self.load_top_themes()  # Query DB for high-score UI/tweaks/stencils

    def load_top_themes(self) -> List[Dict]:
        # Connect to DB, query ui_mods_score >20, doc_enhance >15, has stencils/tweaks
        # Return list[dict] with all enhanced fields
        pass  # Full DB query as in previous

    def build_stencil_kit(self):
        """Compile all stencils into kit (code dir + package.json)"""
        stencils = []
        code_dir = self.output_dir / 'stencil_code'
        code_dir.mkdir(exist_ok=True)

        for theme in self.top_themes:
            for pattern in theme.get('stencil_patterns', []):
                if pattern.get('code'):
                    lang = pattern.get('lang', 'js')
                    filename = code_dir / f"{pattern['name']}.{lang}"
                    with open(filename, 'w') as f:
                        f.write(pattern['code'])
                    pattern['file_path'] = str(filename)
                    stencils.append(pattern)

        # package.json for kit
        kit_meta = {
            'name': 'godmode-stencil-kit',
            'version': '1.0.0',
            'description': 'Compiled UI/Doc Stencils from Scraped Repos',
            'stencils': [s['name'] for s in stencils],
            'total_patterns': len(stencils),
            'sources': [t['full_name'] for t in self.top_themes]
        }
        with open(code_dir / 'package.json', 'w') as f:
            json.dump(kit_meta, f, indent=2)

        # Export JSON
        with open(self.output_dir / 'stencils.json', 'w') as f:
            json.dump({'stencils': stencils}, f, indent=2)
        logging.info(f"Stencil kit built: {len(stencils)} patterns in {code_dir}")

    def build_tweak_bundle(self):
        """Bundle tweaked resumes into PDF+JSON kit"""
        tweaks = []
        pdf_dir = self.output_dir / 'tweaked_pdfs'
        pdf_dir.mkdir(exist_ok=True)

        for theme in self.top_themes:
            for variant in theme.get('tweaked_variants', []):
                # Generate/update PDF if not exists
                pdf_path = pdf_dir / f"{theme['full_name']}_{variant['name']}.pdf"
                if not pdf_path.exists() and HAS_REPORTLAB:
                    self._gen_pdf(variant, pdf_path)  # Similar to analyzer

                variant['pdf_path'] = str(pdf_path)
                tweaks.extend(theme['tweaked_variants'])

        # Bundle JSON
        with open(self.output_dir / 'tweaked_resumes.json', 'w') as f:
            json.dump({'tweaks': tweaks, 'total': len(tweaks)}, f, indent=2)

        # NEW: Master PDF (if reportlab, merge into one 'kit.pdf')
        if HAS_REPORTLAB and len(tweaks) > 0:
            master_pdf = pdf_dir / 'master_tweak_kit.pdf'
            c = canvas.Canvas(str(master_pdf), pagesize=letter)
            y = 750
            c.drawString(100, y, "Godmode Tweak Kit - All Resume Variants")
            y -= 30
            for tweak in tweaks[:10]:  # Sample
                c.drawString(100, y, f"- {tweak['name']}: {tweak.get('features', [])}")
                y -= 20
                if y < 50:
                    c.showPage()
                    y = 750
            c.save()
            logging.info(f"Master tweak PDF: {master_pdf}")

        logging.info(f"Tweak bundle built: {len(tweaks)} variants")

    def build_ui_graph(self):
        """Build and export dependency graphs"""
        G = nx.DiGraph()
        for theme in self.top_themes:
            repo = theme['full_name']
            graph = theme.get('ui_graph', {})
            G.add_node(repo, desc=theme['description'])
            for dep in graph.get('depends_on', []):
                G.add_edge(dep, repo, type='depends')
            for ext in graph.get('extends', []):
                G.add_edge(repo, ext, type='extends')

        # GEXF for Gephi
        if HAS_NX:
            write_gexf(G, self.output_dir / 'ui_graph.gexf')
            logging.info("UI graph exported to GEXF (open in Gephi)")

        # CSV (always)
        with open(self.output_dir / 'ui_graph.csv', 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['source', 'target', 'type'])
            for u, v, data in G.edges(data=True):
                writer.writerow([u, v, data.get('type', '')])

        # Mermaid viz in MD (always)
        mermaid = "graph TD\n"
        for u, v in G.edges():
            mermaid += f"{u} --> {v}\n"
        with open(self.output_dir / 'ui_graph_mermaid.md', 'w') as f:
            f.write(f"# UI Dependency Graph\n```mermaid\n{mermaid}```\n")
        logging.info("Graph built: CSV + Mermaid + GEXF")

    def build_doc_enhancers(self):
        """Compile doc enhancers into scripts/kit"""
        enhancers = [t for t in self.top_themes if t['doc_enhance_score'] > 20]
        enhancer_kit = {'enhancers': [], 'total_score': sum(e['doc_enhance_score'] for e in enhancers)}

        for e in enhancers:
            enhancer_kit['enhancers'].append({
                'repo': e['full_name'],
                'enhance_score': e['doc_enhance_score'],
                'features': e['ai_features'],
                'tweak_code': e.get('stencil_patterns', [{}])[0].get('code', '')  # Sample code for enhancement
            })

        with open(self.output_dir / 'doc_enhancers.json', 'w') as f:
            json.dump(enhancer_kit, f, indent=2)

        # NEW: Gen simple enhancer script (e.g., PDF to HTML wrapper)
        if enhancer_kit['enhancers']:
            script = """
# Godmode Doc Enhancer Script (generated)
import json
themes = json.load(open('doc_enhancers.json'))
for enhancer in themes['enhancers'][:5]:
    print(f"Enhance with {enhancer['repo']}: Score {enhancer['enhance_score']}")
# Add your PDF converter logic here
"""
            with open(self.output_dir / 'doc_enhancer_runner.py', 'w') as f:
                f.write(script)
            logging.info("Doc enhancers kit + runner script built")

    def build_full_kit(self):
        """Pipeline: Build all"""
        self.build_stencil_kit()
        self.build_tweak_bundle()
        self.build_ui_graph()
        self.build_doc_enhancers()

        # NEW: Summary report
        summary = {
            'kit_stats': {
                'total_stencils': sum(len(t.get('stencil_patterns', [])) for t in self.top_themes),
                'total_tweaks': sum(len(t.get('tweaked_variants', [])) for t in self.top_themes),
                'total_graph_nodes': len(self.load_graph_nodes()),  # Helper
                'total_enhancers': len([t for t in self.top_themes if t['doc_enhance_score'] > 20]),
                'estimated_impact': 'Ready for old.new artillery deploy!'
            },
            'export_dir': str(self.output_dir)
        }
        with open(self.output_dir / 'kit_summary.json', 'w') as f:
            json.dump(summary, f, indent=2)
        logging.info(f"Full artillery kit ready in {self.output_dir}")

# Helpers like _gen_pdf (canvas impl), load_graph_nodes (nx size)

def main_builder():
    parser = argparse.ArgumentParser(description="UI/Stencil Builder - Compile Kits")
    parser.add_argument('--input-db', default='enhanced_themes.db')
    parser.add_argument('--build-kits', action='store_true')  # All
    parser.add_argument('--only-stencils', action='store_true')
    # ...

    args = parser.parse_args()
    builder = KitBuilder(args.input_db)

    if args.build_kits:
        builder.build_full_kit()
    elif args.only_stencils:
        builder.build_stencil_kit()
    # ... (if flags)

if __name__ == "__main__":
    main_builder()
