// src/pages/CategoryDetail.tsx
import { useParams, Link } from "react-router-dom";
import { CATEGORIES } from "./Categories";
import type { Category } from "./Categories";
import { useEffect, useMemo, useState, useCallback } from "react";

export default function CategoryDetail() {
  const { id } = useParams<{ id: string }>();
  const cat = useMemo<Category | undefined>(() => CATEGORIES.find((c) => c.id === id), [id]);

  // ----- Find a hero image (static) -----
  const [heroSrc, setHeroSrc] = useState<string | null>(null);
  const [heroChecked, setHeroChecked] = useState(false);

  useEffect(() => {
    if (!id) return;
    const v = `?v=${Date.now()}`;
    const base = `/images/categories/${id}`;

    const candidates: string[] = [
      // simple one-file hero
      `${base}.jpeg${v}`, `${base}.jpg${v}`, `${base}.webp${v}`, `${base}.png${v}`,
      // hero.* names
      `${base}/hero.jpeg${v}`, `${base}/hero.jpg${v}`, `${base}/hero.webp${v}`, `${base}/hero.png${v}`,
      // responsive variants (if present)
      `${base}/hero-1440.jpeg${v}`, `${base}/hero-1440.jpg${v}`, `${base}/hero-1440.webp${v}`, `${base}/hero-1440.png${v}`,
      `${base}/hero-960.jpeg${v}`,  `${base}/hero-960.jpg${v}`,  `${base}/hero-960.webp${v}`,  `${base}/hero-960.png${v}`,
      `${base}/hero-480.jpeg${v}`,  `${base}/hero-480.jpg${v}`,  `${base}/hero-480.webp${v}`,  `${base}/hero-480.png${v}`,
    ];

    let cancelled = false;
    (async () => {
      for (const url of candidates) {
        if (await probeImage(url)) { if (!cancelled) setHeroSrc(url); break; }
      }
      if (!cancelled) setHeroChecked(true);
    })();

    return () => { cancelled = true; };
  }, [id]);

  // ----- Gallery (up to 5 images) -----
  const [gallery, setGallery] = useState<string[]>([]);
  const [galleryChecked, setGalleryChecked] = useState(false);

  useEffect(() => {
    if (!id) return;
    const v = `?v=${Date.now()}`;
    const base = `/images/categories/${id}`;
    const exts = ["jpeg", "jpg", "webp", "png"];
    const patterns = (n: number) => [`${base}/gallery/${n}`, `${base}-${n}`];

    let cancelled = false;
    (async () => {
      const found: string[] = [];
      for (let n = 1; n <= 8; n++) {
        let added = false;
        for (const p of patterns(n)) {
          for (const ext of exts) {
            const url = `${p}.${ext}${v}`;
            if (await probeImage(url)) { found.push(url); added = true; break; }
          }
          if (added) break;
        }
      }
      if (!cancelled) { setGallery(found); setGalleryChecked(true); }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // If no explicit hero found, use the first gallery image as hero
  useEffect(() => {
    if (!heroSrc && galleryChecked && gallery.length > 0) {
      setHeroSrc(gallery[0]);
    }
  }, [heroSrc, galleryChecked, gallery]);

  return (
    <div>
      <Styles />

      <div className="page">
        <Link to="/categories" className="back">← Back to Categories</Link>

        {!cat ? (
          <div className="panel">
            <h1 className="heading">Category Not Found</h1>
            <p>Sorry, this category doesn’t exist.</p>
          </div>
        ) : (
          <>
            {/* STATIC HERO with srcset to avoid blur */}
            <figure className="hero" aria-label={`${cat.name} hero`}>
              {(heroChecked || galleryChecked) && heroSrc ? (
                <>
                  <ResponsiveHero src={heroSrc} alt={`${cat.name} — illustrative image`} />
                  <figcaption className="heroCaption">{cat.name}</figcaption>
                </>
              ) : (
                <div className="placeholder">
                  <div className="phTitle">{cat.name}</div>
                  <div className="phBadge">{cat.sector}</div>
                </div>
              )}
            </figure>

            {/* HEADER */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 8px" }}>
              <span className="badge">{cat.sector}</span>
              <h1 className="heading" style={{ margin: 0 }}>{cat.name}</h1>
            </div>

            {/* LONG DESCRIPTION */}
            <p style={{ marginTop: 0 }}>{cat.longDescription || cat.description}</p>

            {/* GALLERY */}
            {galleryChecked && gallery.length > 0 && (
              <GalleryThumbnails images={gallery} />
            )}

            {/* IMPACT TIPS */}
            <div className="panel" style={{ marginTop: 12 }}>
              <h2 className="subHd">Impact Tips</h2>
              <ul style={{ marginLeft: 18 }}>
                {cat.tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>

            {/* TAGS */}
            <div className="panel" style={{ marginTop: 12 }}>
              <h3 className="subHd" style={{ fontSize: "calc(var(--fz-heading) - 10px)" }}>Tags</h3>
              <div className="tags">
                {cat.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Hero that auto-uses -480/-960/-1440 companions if they exist */
function ResponsiveHero({ src, alt }: { src: string; alt: string }) {
  const [srcset, setSrcset] = useState<string | null>(null);
  const [fallback, setFallback] = useState<string>(src);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [path, q = ""] = src.split("?");
      const query = q ? `?${q}` : "";
      const dot = path.lastIndexOf(".");
      if (dot < 0) { setSrcset(null); setFallback(src); return; }

      const base = path.slice(0, dot);
      const ext  = path.slice(dot + 1); // jpg/jpeg/webp/png
      const sizes = [480, 960, 1440];

      const entries = await Promise.all(
        sizes.map(async (w) => {
          const url = `${base}-${w}.${ext}${query}`;
          return (await probeImage(url)) ? `${url} ${w}w` : null;
        })
      );

      if (cancelled) return;
      const list = entries.filter(Boolean) as string[];
      if (list.length) {
        setSrcset(list.join(", "));
        setFallback(list[list.length - 1].split(" ")[0]); // largest as default src
      } else {
        setSrcset(null);
        setFallback(src);
      }
    })();
    return () => { cancelled = true; };
  }, [src]);

  return srcset ? (
    <img
      src={fallback}
      srcSet={srcset}
      sizes="(max-width: 700px) 100vw, 1000px"
      alt={alt}
      decoding="async"
    />
  ) : (
    <img src={fallback} alt={alt} decoding="async" />
  );
}

/** Thumbnails + lightbox */
function GalleryThumbnails({ images }: { images: string[] }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const openAt = useCallback((i: number) => { setIdx(i); setOpen(true); }, []);
  const close = useCallback(() => setOpen(false), []);
  const next = useCallback(() => setIdx((i) => (i + 1) % images.length), [images.length]);
  const prev = useCallback(() => setIdx((i) => (i - 1 + images.length) % images.length), [images.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, next, prev]);

  return (
    <>
      <section aria-label="Gallery" className="panel" style={{ marginTop: 12 }}>
        <h2 className="subHd">Gallery</h2>
        <div className="thumbGrid">
          {images.map((src, i) => (
            <button
              key={src}
              className="thumbBtn"
              onClick={() => openAt(i)}
              aria-label={`Open image ${i + 1} of ${images.length}`}
            >
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      </section>

      {open && images.length > 0 && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer">
          <button className="lbClose" onClick={close} aria-label="Close">×</button>
          <button className="lbPrev" onClick={prev} aria-label="Previous image">‹</button>
          <figure className="lbFigure">
            <img src={images[idx]} alt="" />
            <figcaption className="lbCaption">{`${idx + 1} / ${images.length}`}</figcaption>
          </figure>
          <button className="lbNext" onClick={next} aria-label="Next image">›</button>
        </div>
      )}
    </>
  );
}

/** Simple image probe */
function probeImage(url: string): Promise<boolean> {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(true);
    img.onerror = () => res(false);
    img.src = url;
  });
}

/* ---------------- STYLES ---------------- */
function Styles() {
  return (
    <style>{`
      :root{
        --fz-heading: clamp(24px, 3.2vw, 36px);
        --fz-body: clamp(15px, 1.9vw, 16px);
        --clr-heading: #0e5f3a;
        --clr-body: #223c2f;
        --border: #e4efe8;
        --panel: #ffffff;
        --panel-soft: #f6fbf8;
        --green: #127c4c;
        --green-2: #14935a;
      }
      .page { font-size: var(--fz-body); color: var(--clr-body); line-height:1.6; letter-spacing:.1px; padding: 16px; max-width: 1000px; margin: 0 auto; }
      .heading { font-size: var(--fz-heading); color: var(--clr-heading); font-weight: 900; line-height: 1.2; margin: 0 0 10px 0; }
      .subHd { font-size: calc(var(--fz-heading) - 6px); color: var(--clr-heading); font-weight: 900; margin: 18px 0 8px; }
      .badge { display:inline-block; font-size:12px; font-weight:800; background:#e9f6ef; color:#0e5f3a; border:1px solid #cfe8dc; padding:4px 10px; border-radius:999px; margin-right:10px; }
      .panel { background: var(--panel); border:1px solid var(--border); border-radius:16px; box-shadow:0 10px 26px rgba(0,0,0,.06); padding:16px; }
      .back { display:inline-block; margin-bottom:12px; background: var(--green); color:#fff; padding:8px 12px; border-radius:10px; text-decoration:none; font-weight:800; }

      .hero { position: relative; width: 100%; aspect-ratio: 16/9; border-radius: 16px; overflow: hidden; border: 1px solid var(--border); background: var(--panel-soft); display: grid; place-items: center; }
      .hero img { width: 100%; height: 100%; object-fit: cover; display:block; }
      .heroCaption { position:absolute; left: 12px; bottom: 12px; background: rgba(0,0,0,.45); color:#fff; padding: 6px 10px; border-radius: 8px; font-size: 12px; }

      .placeholder { width:100%; height:100%; background: linear-gradient(135deg, var(--green), var(--green-2)); color: #fff; display:grid; place-items:center; text-align:center; padding: 12px; }
      .phTitle { font-weight: 900; font-size: calc(var(--fz-heading) - 2px); line-height: 1.1; }
      .phBadge { margin-top: 6px; display:inline-block; background: rgba(255,255,255,.18); padding: 4px 10px; border-radius: 999px; font-weight: 800; }

      .tags { display:flex; flex-wrap:wrap; gap:8px; }
      .tag { background:#e9f6ef; color:#0e5f3a; border:1px solid #cfe8dc; padding:4px 10px; border-radius:999px; font-weight:700; font-size:12px; }

      .thumbGrid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
      @media (max-width: 1000px){ .thumbGrid{ grid-template-columns: repeat(4, 1fr); } }
      @media (max-width: 700px){ .thumbGrid{ grid-template-columns: repeat(2, 1fr); } }
      .thumbBtn { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; padding: 0; background: #fff; cursor: pointer; }
      .thumbBtn img { width: 100%; height: 100px; object-fit: cover; display:block; }

      .lightbox { position: fixed; inset: 0; background: rgba(0,0,0,.75); display:grid; grid-template-columns: auto 1fr auto; grid-template-rows: auto 1fr auto; place-items: center; z-index: 50; }
      .lbFigure { grid-column: 2; grid-row: 2; max-width: 92vw; max-height: 82vh; position: relative; }
      .lbFigure img { width: 100%; height: auto; max-height: 82vh; object-fit: contain; display:block; border-radius: 10px; }
      .lbCaption { position: absolute; right: 10px; bottom: 10px; color: #fff; font-weight: 800; background: rgba(0,0,0,.35); padding: 4px 8px; border-radius: 999px; font-size: 12px; }

      .lbClose, .lbPrev, .lbNext {
        background: rgba(255,255,255,.9); border: none; font-size: 28px; width: 44px; height: 44px; border-radius: 50%;
        display:grid; place-items:center; cursor: pointer; box-shadow: 0 8px 20px rgba(0,0,0,.3);
      }
      .lbClose { position: absolute; top: 16px; right: 16px; }
      .lbPrev { grid-column: 1; grid-row: 2; }
      .lbNext { grid-column: 3; grid-row: 2; }
    `}</style>
  );
}
