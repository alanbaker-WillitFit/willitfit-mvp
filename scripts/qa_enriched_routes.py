import requests, bs4, urllib.parse, collections
from xml.etree import ElementTree as ET

base = "http://127.0.0.1:3099"
session = requests.Session()
xml = session.get(base + "/sitemap.xml", timeout=20).text
root = ET.fromstring(xml)
ns = {"s":"http://www.sitemaps.org/schemas/sitemap/0.9"}
paths = [urllib.parse.urlparse(x.text).path or "/" for x in root.findall(".//s:loc", ns)]

status = {}
targets = set()
rows = []
for p in paths:
    try:
        r = session.get(base + p, timeout=10, allow_redirects=False)
    except Exception:
        status[p] = "ERR"
        continue
    status[p] = r.status_code
    if r.status_code != 200 or "text/html" not in r.headers.get("content-type", ""):
        continue
    soup = bs4.BeautifulSoup(r.text, "html.parser")
    for a in soup.find_all("a", href=True):
        h = a["href"].strip()
        if not h or h.startswith(("#", "mailto:", "tel:", "javascript:")):
            continue
        z = urllib.parse.urlparse(urllib.parse.urljoin("https://will-it-fit.net" + p, h))
        if z.netloc in ("will-it-fit.net", "www.will-it-fit.net"):
            targets.add(z.path or "/")
    title = soup.title.get_text(" ", strip=True) if soup.title else ""
    meta = soup.find("meta", attrs={"name":"description"})
    desc = meta.get("content", "").strip() if meta else ""
    can = soup.find("link", attrs={"rel":"canonical"})
    canon = can.get("href", "").strip() if can else ""
    rob = soup.find("meta", attrs={"name":"robots"})
    robots = rob.get("content", "").lower() if rob else ""
    rows.append((p, title, desc, canon, len(soup.find_all("h1")), len(soup.find_all("script", attrs={"type":"application/ld+json"})), robots, len(r.content)))

check = {}
for q in sorted(targets):
    try:
        rr = session.get(base + q, timeout=10, allow_redirects=False)
        check[q] = rr.status_code
    except Exception:
        check[q] = "ERR"

bad = {k:v for k,v in check.items() if not (isinstance(v,int) and 200 <= v < 400)}
orphans = sorted(set(paths) - targets - {"/"})
print("SITEMAP_COUNT", len(paths), "STATUS_COUNTS", dict(collections.Counter(status.values())))
print("INTERNAL_TARGETS", len(targets), "TARGET_STATUS", dict(collections.Counter(check.values())))
print("BROKEN_INTERNAL", len(bad))
for k,v in list(bad.items())[:50]: print("BROKEN", v, k)
print("ORPHANS", len(orphans))
for x in orphans[:80]: print("ORPHAN", x)

for label, idx in [("TITLE",1),("DESC",2)]:
    vals = collections.defaultdict(list)
    for row in rows:
        if row[idx]: vals[row[idx]].append(row[0])
    dup = {k:v for k,v in vals.items() if len(v)>1}
    print(label+"_MISSING", sum(1 for row in rows if not row[idx]), "DUP_GROUPS", len(dup), "DUP_PAGES", sum(len(v) for v in dup.values()))
    for k,v in list(dup.items())[:20]: print(label+"_DUP", len(v), v, k[:140])

print("CANON_MISSING", sum(1 for row in rows if not row[3]))
wrong = [(row[0], row[3]) for row in rows if row[3] and (urllib.parse.urlparse(row[3]).path or "/") != row[0]]
print("CANON_MISMATCH", len(wrong))
for x in wrong[:30]: print("CANON_BAD", *x)
print("H1_BAD", sum(1 for row in rows if row[4] != 1))
print("JSONLD_MISSING", sum(1 for row in rows if row[5] == 0))
print("NOINDEX_IN_SITEMAP", sum(1 for row in rows if "noindex" in row[6]))

families = collections.Counter()
for p in paths:
    if p.startswith("/airlines/") and "/fares/" in p: families["fare_pages"] += 1
    elif p.startswith("/airlines/") and p.endswith("/baggage"): families["airline_baggage_pages"] += 1
    elif p.startswith("/sizes/"): families["size_pages"] += 1
    elif p.startswith("/tips/"): families["tip_pages"] += 1
    elif p.startswith("/ask/"): families["ask_pages"] += 1
    elif p.startswith("/compare"): families["compare_pages"] += 1
    elif p.count("/") == 1 and p not in ["/","/airlines","/tips","/about","/contact","/products","/ask","/data","/privacy","/accessibility","/legal","/compare","/sizes"]:
        families["airline_summary_pages"] += 1
    else:
        families["other"] += 1
print("FAMILIES", dict(families))
if rows:
    print("MIN_BYTES", min((row[7],row[0]) for row in rows))
    print("MAX_BYTES", max((row[7],row[0]) for row in rows))
