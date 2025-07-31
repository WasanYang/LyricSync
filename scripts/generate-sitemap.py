import os
from datetime import date

# สมมติ songs เป็น list ของ dict ที่มี id และ lastmod
songs = [
    {"id": f"song-{i+1}", "lastmod": "2025-07-28"}
    for i in range(10)
]
site_url = "https://lyricsync.app"
batch_size = 5000
output_dir = "public"

def write_sitemap(batch, batch_num):
    filename = f"sitemap-songs-{batch_num}.xml"
    with open(os.path.join(output_dir, filename), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for song in batch:
            f.write(f"  <url>\n")
            f.write(f"    <loc>{site_url}/song/{song['id']}</loc>\n")
            f.write(f"    <lastmod>{song['lastmod']}</lastmod>\n")
            f.write(f"    <changefreq>monthly</changefreq>\n")
            f.write(f"    <priority>0.7</priority>\n")
            f.write(f"  </url>\n")
        f.write('</urlset>\n')
    return filename

# แบ่ง batch และเขียนไฟล์
sitemap_files = []
for i in range(0, len(songs), batch_size):
    batch = songs[i:i+batch_size]
    batch_num = (i // batch_size) + 1
    fname = write_sitemap(batch, batch_num)
    sitemap_files.append(fname)

# สร้าง sitemap index
with open(os.path.join(output_dir, "sitemap-index.xml"), "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
    f.write('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for fname in sitemap_files:
        f.write(f"  <sitemap>\n")
        f.write(f"    <loc>{site_url}/{fname}</loc>\n")
        f.write(f"    <lastmod>{date.today()}</lastmod>\n")
        f.write(f"  </sitemap>\n")
    f.write('</sitemapindex>\n')

print("Done! Generated:", sitemap_files, "and sitemap-index.xml")