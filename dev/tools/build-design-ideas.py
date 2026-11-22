"""Build two local comparison pages using the theme's existing copy and notes.

Run after dev/render-preview.mjs: python3 dev/tools/build-design-ideas.py
"""
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parents[2]
DEV = ROOT / 'dev'
FONT = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Instrument+Sans:wght@400;500;600&display=swap'
ESC = html.escape

def document(title, css, body, interactive=''):
    resize = """<script>new ResizeObserver(()=>parent.postMessage({kind:'samyo-idea-height',height:document.body.scrollHeight},location.origin)).observe(document.body);</script>"""
    return f'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{ESC(title)}</title><link rel="stylesheet" href="{FONT}"><link rel="stylesheet" href="{css}"><body>{body}{interactive}{resize}</body></html>'

def shell(title, prefix, ideas, recommendation, other, context):
    buttons = ''.join(f'<button type="button" data-idea="{i}" aria-pressed="false"><span>{i+1:02}</span>{ESC(idea[0])}</button>' for i, idea in enumerate(ideas))
    config = json.dumps({'title': title, 'prefix': prefix, 'ideas': ideas}, ensure_ascii=False).replace('</', '<\\/')
    body = f'''<header class="studio-head"><h1>{ESC(title)} · 10 directions</h1><a href="{other[1]}">{ESC(other[0])}</a></header>
<div class="studio-layout"><nav class="choices" aria-label="Choose a design direction">{buttons}<p>{ESC(recommendation)}</p></nav>
<main class="workspace"><div class="preview-intro"><div><h2 id="idea-title"></h2><p id="idea-description"></p></div><div class="size-controls" role="group" aria-label="Preview width"><button type="button" data-size="desktop" aria-pressed="true">Desktop</button><button type="button" data-size="phone" aria-pressed="false">Phone</button></div></div>
<div class="frame-surround"><iframe title="Design preview"></iframe></div><p class="measurement" id="measurement" aria-live="polite"></p><p class="studio-foot">{ESC(context)}<br>{ESC(recommendation)}</p></main></div><script type="application/json" id="idea-config">{config}</script><script src="design-ideas.js"></script>'''
    (DEV / f'{prefix}-ideas.html').write_text(document(title, 'design-ideas.css', body))

notes_ideas = [
    ('Tabbed panel · recommended', 'One stage at a time, with clear tabs and small note photos. A balanced choice for a shorter product page.'),
    ('Three compact columns', 'Opening, Heart and Dry-down side by side. All notes remain visible without interaction; phones use three short rows.'),
    ('Stage accordion', 'Only the selected stage expands. A simple, familiar layout with enough room for longer note lists.'),
    ('Horizontal timeline', 'A short left-to-right journey with one small photo per note. Phones turn it into three tight rows.'),
    ('Notes table', 'The fastest layout to scan: stage, ingredients and a short explanation, on three fine ruled rows.'),
    ('Photo chips', 'Small ingredient chips grouped by stage. Compact and friendly, with every note visible at once.'),
    ('Vertical tabs', 'A narrow stage selector beside a single detail panel. Good when descriptions are longer.'),
    ('Ingredient ribbon', 'A continuous ingredient strip, divided into three stages. A quiet option that occupies very little space.'),
    ('Photo accordion', 'Photos and ingredient names stay visible in each row; the explanation expands only when needed.'),
    ('Expandable summary', 'The shortest option: every note is named in a summary, with optional stage details underneath.'),
]

product = (DEV / 'product.html').read_text()
stages = []
for part in re.findall(r'<section class="pjr__stage"[\s\S]*?</section>', product):
    title = html.unescape(re.search(r'class="pjr__title"[^>]*>(.*?)</h3>', part).group(1))
    description = html.unescape(re.search(r'class="pjr__text"[^>]*>(.*?)</p>', part).group(1))
    notes = []
    for li in re.findall(r'<li class="pjr__note[^\"]*"[\s\S]*?</li>', part):
        name = html.unescape(re.search(r'class="pjr__note-name"[^>]*>(.*?)</span>', li).group(1))
        image = re.search(r'<img[^>]*src="([^"]+)"', li)
        notes.append({'name': name, 'image': html.unescape(image.group(1)) if image else ''})
    stages.append({'title': title, 'description': description, 'notes': notes})

def note_images(stage):
    return '<div class="cn-notes">' + ''.join(f'<div class="cn-note"><img src="{ESC(n["image"])}" alt="" width="52" height="52"><span>{ESC(n["name"])}</span></div>' for n in stage['notes']) + '</div>'

def description(stage):
    return f'<p class="cn-description">{ESC(stage["description"])}</p>'

def column(stage, index):
    subtitle = ['Top notes', 'Middle notes', 'Base notes'][index]
    return f'<div class="cn-column"><div><h3>{ESC(stage["title"])}</h3><span class="cn-label">{subtitle}</span></div>{description(stage)}{note_images(stage)}</div>'

def tab_content(vertical=False):
    nav = '<div class="cn-nav" role="tablist" aria-label="Fragrance stage">' + ''.join(f'<button type="button" id="tab-{i}" role="tab" aria-selected="{str(i==0).lower()}" aria-controls="panel-{i}" tabindex="{0 if i==0 else -1}">{ESC(s["title"])}</button>' for i,s in enumerate(stages)) + '</div>'
    panels = '<div>' + ''.join(f'<section class="cn-panel" id="panel-{i}" role="tabpanel" aria-labelledby="tab-{i}" {"hidden" if i else ""}><div><h3>{ESC(s["title"])}</h3>{description(s)}</div>{note_images(s)}</section>' for i,s in enumerate(stages)) + '</div>'
    return f'<div class="cn-vertical">{nav}{panels}</div>' if vertical else nav + panels

tabs_js = '''<script>(()=>{const tabs=[...document.querySelectorAll('[role=tab]')];const panels=[...document.querySelectorAll('[role=tabpanel]')];function select(index){tabs.forEach((t,i)=>{t.setAttribute('aria-selected',String(i===index));t.tabIndex=i===index?0:-1;panels[i].hidden=i!==index;});}tabs.forEach((t,i)=>{t.addEventListener('click',()=>select(i));t.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(i+1)%3;else if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(i+2)%3;else if(e.key==='Home')next=0;else if(e.key==='End')next=2;else return;e.preventDefault();select(next);tabs[next].focus();});});})();</script>'''
for v in range(1,11):
    if v in [1,7]: content = tab_content(v==7)
    elif v==2: content = '<div class="cn-columns">' + ''.join(column(s,i) for i,s in enumerate(stages)) + '</div>'
    elif v==3:
        content = '<div class="cn-accordion">' + ''.join(f'<details name="notes" {"open" if i==0 else ""}><summary>{ESC(s["title"])}</summary><div class="cn-panel">{description(s)}{note_images(s)}</div></details>' for i,s in enumerate(stages)) + '</div>'
    elif v==4: content = '<div class="cn-flow">' + ''.join(f'<div><h3>{ESC(s["title"])}</h3>{note_images(s)}</div>' for s in stages) + '</div>'
    elif v==5: content = '<table class="cn-table"><caption style="position:absolute;clip-path:inset(50%);width:1px;height:1px;overflow:hidden">Fragrance stages and ingredients</caption><tbody>' + ''.join(f'<tr><th scope="row">{ESC(s["title"])}</th><td>{note_images(s)}</td><td>{ESC(s["description"])}</td></tr>' for s in stages) + '</tbody></table>'
    elif v==6: content = '<div class="cn-chip-rows">' + ''.join(f'<div class="cn-chip-row"><h3>{ESC(s["title"])}</h3>{note_images(s)}</div>' for s in stages) + '</div>'
    elif v==8: content = '<div class="cn-ribbon">' + ''.join(f'<div><h3>{ESC(s["title"])}</h3>{note_images(s)}</div>' for s in stages) + '</div>'
    elif v==9: content = '<div class="cn-accordion cn-photos">' + ''.join(f'<details><summary><span class="cn-photo-summary"><strong>{ESC(s["title"])}</strong>{note_images(s)}</span></summary><p>{ESC(s["description"])}</p></details>' for s in stages) + '</div>'
    else:
        summary = '<div class="cn-overview">' + ''.join(f'<p><strong>{ESC(s["title"])}</strong>{ESC(", ".join(n["name"] for n in s["notes"]))}</p>' for s in stages) + '</div>'
        content = summary + '<details class="cn-expand"><summary>Explore the stages</summary><div class="cn-columns">' + ''.join(column(s,i) for i,s in enumerate(stages)) + '</div></details>'
    body = f'<main class="cn {"cn-wide" if v in [4,5,6,8,9,10] else ""}" data-variant="{v}"><header class="cn-head"><h2>How it unfolds</h2><p>Dior Homme Intense</p></header>{content}<p class="cn-foot">How long each stage lasts depends on the perfume, your skin and the weather.</p></main>'
    (DEV / f'notes-idea-{v}.html').write_text(document(notes_ideas[v-1][0], 'compact-notes-ideas.css', body, tabs_js if v in [1,7] else ''))

why_ideas = [
    ('Editorial rows · recommended', 'Keep the split layout, replace the small boxes with four spacious rows, and remove the oversized background wordmark.'),
    ('Four clear columns', 'A centred statement above four benefits. Balanced, direct and easy to scan on a large screen.'),
    ('Bottle portrait', 'Add an existing product cut-out as the visual anchor, with the story and benefits beside it.'),
    ('Espresso contrast', 'A dark, warm band with ivory text. Creates a strong pause between the lighter homepage sections.'),
    ('Olive editorial', 'A restrained olive field, a small ingredient cut-out and a simple benefit list.'),
    ('Type-led statement', 'Let the serif headline become the main visual. Keep the supporting benefits in a quiet row below.'),
    ('Scent ingredients', 'Use the existing lemon, cinnamon and vanilla images to make the fragrance story tangible.'),
    ('Compact assurance band', 'A much shorter headline and benefit band, useful when the homepage already has several large sections.'),
    ('Asymmetric emphasis', 'Give authenticity the most room, then arrange delivery, note information and help at a smaller scale.'),
    ('Expandable details', 'A calm introduction beside four disclosure rows. A compact alternative with optional explanation.'),
]
source = (ROOT/'sections/perfume-why.liquid').read_text()
schema = json.loads(re.search(r'{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}',source).group(1))
defaults = {s['id']:s.get('default','') for s in schema['settings'] if 'id' in s}
home = json.loads(re.sub(r'^\s*/\*[\s\S]*?\*/','',(ROOT/'templates/index.json').read_text()))
section = home['sections']['why']; defaults.update(section.get('settings',{}))
promises = [section['blocks'][k]['settings'] for k in section['block_order']]
rendered_why = re.search(r'<section id="PerfumeWhy-why"[\s\S]*?</section>',(DEV/'home.html').read_text()).group(0)
icons = re.findall(r'<svg[\s\S]*?</svg>',rendered_why)
for v in range(1,11):
    intro = f'<div class="why__intro"><h2>{ESC(defaults["heading"])}</h2><p>{re.sub("<[^>]+>","",defaults["text"])}</p><a href="collection.html">{ESC(defaults["link_label"])}</a></div>'
    if v==10:
        benefits = '<div class="why__accordions">' + ''.join(f'<details {"open" if i==0 else ""}><summary>{ESC(p["title"])}</summary><p>{ESC(p["text"])}</p></details>' for i,p in enumerate(promises)) + '</div>'
    else:
        benefits = '<ul class="why__benefits">' + ''.join(f'<li><span class="why__icon" aria-hidden="true">{icons[i]}</span><h3>{ESC(p["title"])}</h3><p>{ESC(p["text"])}</p>'+ ('<a href="find-your-scent.html">Find your scent</a>' if i==3 else '') + '</li>' for i,p in enumerate(promises)) + '</ul>'
    images = ['../dev/shop-images/samyo-dior-homme-intense.webp']
    if v==5: images = ['../assets/sample-scent-vanilla.webp']
    if v==7: images = [f'../assets/sample-scent-{s}.webp' for s in ['lemon','cinnamon','vanilla']]
    photo = '<figure class="why__photo" aria-hidden="true">' + ''.join(f'<img src="{src}" alt="">' for src in images) + '</figure>'
    body = f'<main class="why" data-v="{v}"><div class="why__layout">{intro}{photo}{benefits}</div></main>'
    (DEV/f'why-idea-{v}.html').write_text(document(why_ideas[v-1][0], 'why-ideas.css', body))

shell('Compact notes', 'notes', notes_ideas, 'My picks: 1 for a balanced compact layout; 8 for the shortest strip; 2 for every stage visible at once.', ('Why Samyó ideas', 'why-ideas.html'), 'Uses the existing Dior Homme Intense preview notes. These are design options; the current product template remains available at product.html.')
shell('Why Samyó', 'why', why_ideas, 'My picks: 1 for clarity; 3 for a stronger perfume identity.', ('Compact notes ideas', 'notes-ideas.html'), 'All 10 options use the current section’s copy and benefits. These previews let you choose a direction before it is applied.')
print('Built dev/notes-ideas.html, dev/why-ideas.html and 20 individual previews.')
