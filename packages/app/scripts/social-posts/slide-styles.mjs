export const slideStyles = `
*{box-sizing:border-box;margin:0;padding:0}
html{font-size:calc(16px * var(--scale))}
body{overflow:hidden;font-family:'Fixel Display',system-ui,sans-serif;color:var(--text);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
body.theme-dark{--canvas-a:#141414;--canvas-b:#0A0A0A;--text:#F5F5F5;--muted:rgba(245,245,245,.62);--faint:rgba(245,245,245,.40);--hairline:rgba(255,255,255,.12);--card:rgba(255,255,255,.04);--card-corner:rgba(255,255,255,.10);--card-raised:rgba(255,255,255,.06);--accent:rgb(0,255,136);--accent-corner:rgba(0,255,136,.28);--accent-bg:rgba(0,255,136,.07);--info:rgb(43,127,255);--info-corner:rgba(43,127,255,.30);--info-bg:rgba(43,127,255,.09);--screen:#0A0A0A;--pending:rgba(245,245,245,.22);--shadow:rgba(0,0,0,.62);--grain:.038}
body.theme-light{--canvas-a:#F8F8F8;--canvas-b:#F1F1F1;--text:#0A0A0A;--muted:rgba(10,10,10,.62);--faint:rgba(10,10,10,.40);--hairline:rgba(10,10,10,.10);--card:rgba(255,255,255,.78);--card-corner:#E5E5E5;--card-raised:#FFFFFF;--accent:rgb(16,185,129);--accent-corner:rgba(16,185,129,.34);--accent-bg:rgba(16,185,129,.08);--info:rgb(43,127,255);--info-corner:rgba(43,127,255,.30);--info-bg:rgba(43,127,255,.07);--screen:#0A0A0A;--pending:rgba(245,245,245,.22);--shadow:rgba(10,10,10,.16);--grain:.035}
.slide{position:relative;width:var(--slide-w);height:var(--slide-h);overflow:hidden;background:linear-gradient(180deg,var(--canvas-a) 0%,var(--canvas-b) 100%)}
.slide::before{content:'';position:absolute;inset:0;z-index:0;pointer-events:none;opacity:var(--grain);background-image:url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'240\' height=\'240\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/></filter><rect width=\'240\' height=\'240\' filter=\'url(%23n)\'/></svg>")}
.frame{position:absolute;left:var(--safe-x);right:var(--safe-x);top:var(--safe-y);bottom:var(--safe-y);display:flex;flex-direction:column;justify-content:flex-start;gap:3rem;z-index:2}
.head{flex:none;display:flex;align-items:center;justify-content:space-between;gap:2rem}
.body{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:2.25rem}
.body.top{justify-content:flex-start}
.body.spread{justify-content:space-between}
.foot{flex:none;margin-top:auto;display:flex;align-items:flex-end;justify-content:space-between;gap:2rem}
.stack{display:flex;flex-direction:column;gap:1.75rem}
.headline{font-weight:700;letter-spacing:-.03em;line-height:1.06;text-wrap:balance}
.h-xl{font-size:5.5rem;line-height:1.05}
.h-lg{font-size:4.5rem;line-height:1.06}
.h-md{font-size:3.75rem;line-height:1.08}
.h-sm{font-size:3.125rem;line-height:1.1}
.h-xs{font-size:2.625rem;line-height:1.12}
.secondary{font-size:2.5rem;line-height:1.32;font-weight:500;color:var(--muted);text-wrap:balance}
.secondary.strong{color:var(--text)}
.body-text{font-size:2.375rem;line-height:1.3;font-weight:500}
.meta{font-size:2rem;line-height:1.3;font-weight:500;color:var(--muted)}
.eyebrow{font-size:1.875rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--faint)}
.accent-text{color:var(--accent)}
.chips{display:flex;flex-wrap:wrap;gap:1rem}
.chip{display:inline-flex;align-items:center;gap:.85rem;padding:.85rem 1.6rem;border-radius:999px;border:1px solid var(--card-corner);background:var(--card);font-size:1.875rem;font-weight:500;line-height:1.2;color:var(--muted)}
.chip .icon{width:2rem;height:2rem;flex:none;color:var(--faint)}
.chip.note{border-color:var(--hairline);background:transparent;color:var(--muted)}
.chip.note .icon{color:var(--faint)}
.card{border-radius:1.5rem;border:1px solid var(--card-corner);background:var(--card);padding:2.25rem 2.5rem}
.rows{display:flex;flex-direction:column;gap:1.5rem}
.line-row{display:flex;align-items:center;gap:1.75rem;padding:1.9rem 2.25rem;border-radius:1.5rem;border:1px solid var(--card-corner);background:var(--card)}
.line-row .icon{width:2.75rem;height:2.75rem;flex:none;color:var(--muted)}
.line-row .label{font-size:2.375rem;font-weight:500;line-height:1.24}
.line-row.accent .icon{color:var(--accent)}
.check{display:flex;align-items:flex-start;gap:1.5rem}
.check .box{width:3.1rem;height:3.1rem;flex:none;border-radius:.7rem;border:2px solid var(--card-corner);background:var(--card);display:flex;align-items:center;justify-content:center;margin-top:.3rem}
.check .box .icon{width:2.05rem;height:2.05rem;color:var(--accent)}
.check.hollow .box{border-color:var(--hairline)}
.check .label{font-size:2.875rem;font-weight:500;line-height:1.24}
.flow{display:flex;flex-direction:column;max-width:41rem}
.two-col .flow{max-width:none}
.node{display:flex;align-items:center;gap:1.75rem;padding:2.35rem 2.5rem;border-radius:1.5rem;border:1px solid var(--card-corner);background:var(--card)}
.node .icon{width:2.9rem;height:2.9rem;flex:none;color:var(--muted)}
.node .label{display:block;font-size:2.625rem;font-weight:600;line-height:1.2}
.node .note{display:block;font-size:1.875rem;font-weight:500;color:var(--faint);line-height:1.24;margin-top:.45rem}
.node.accent{border-color:var(--accent-corner);background:var(--accent-bg)}
.node.accent .icon{color:var(--accent)}
.node.info{border-color:var(--info-corner);background:var(--info-bg)}
.node.info .icon{color:var(--info)}
.link{height:3.25rem;display:flex;align-items:center;justify-content:center}
.link .icon{width:2rem;height:3.25rem;color:var(--faint)}
.split{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;align-items:stretch}
.split .card{padding:2.75rem 2.5rem;display:flex;flex-direction:column;gap:1.25rem}
.split .card .icon{width:2.5rem;height:2.5rem;color:var(--muted);margin-bottom:.75rem}
.split .card.mine .icon{color:var(--accent)}
.split .col-head{font-size:1.75rem;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--faint);white-space:nowrap}
.split .col-value{font-size:3.125rem;font-weight:500;line-height:1.16;letter-spacing:-.015em}
.split .card.mine{border-color:var(--accent-corner);background:var(--accent-bg)}
.split .card.mine .col-head{color:var(--accent)}
.tiles{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem}
.tile{min-height:13.5rem;border-radius:1.5rem;border:1px solid var(--card-corner);background:var(--card);padding:2.25rem;display:flex;flex-direction:column;justify-content:space-between;gap:2.5rem}
.tile .icon{width:3rem;height:3rem;color:var(--muted)}
.tile .label{font-size:2.375rem;font-weight:600;line-height:1.2}
.brand{display:flex;align-items:center;gap:1.05rem}
.brand .mark{width:3.5rem;height:3.5rem;border-radius:1.05rem;overflow:hidden;flex:none;border:1px solid var(--card-corner)}
.brand .mark svg{width:100%;height:100%;display:block}
.brand .word{font-size:2.25rem;font-weight:600;letter-spacing:-.02em;line-height:1}
.domain{font-size:1.875rem;font-weight:500;color:var(--faint);letter-spacing:.02em}
.draft{position:absolute;right:var(--safe-x);top:calc(var(--safe-y) + .45rem);padding:.45rem 1rem;border-radius:.6rem;border:1px solid var(--hairline);color:var(--faint);font-size:1.5rem;font-weight:500;letter-spacing:.04em;z-index:9}
.phone{position:relative;flex:none;background:#050505;border:1px solid var(--card-corner);box-shadow:0 2.5rem 7rem var(--shadow)}
.phone .screen{position:relative;width:100%;height:100%;overflow:hidden;background:var(--screen)}
.phone .screen img{display:block;width:100%;height:100%;object-fit:cover;object-position:top center}
.phone .pending{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:2rem;background:#0A0A0A;color:var(--pending);font-size:1.75rem;font-weight:500;letter-spacing:.05em;line-height:1.4}
.phone .ring{position:absolute;border:.28rem solid var(--accent);border-radius:1.1rem;box-shadow:0 0 0 .28rem rgba(0,0,0,.5)}
.phone-bleed{position:absolute;z-index:1}
.phone-row{display:flex;flex:none}
.repo{display:flex;flex-direction:column;gap:1.5rem}
.repo .bar{display:flex;align-items:center;gap:1.1rem;padding-bottom:1.5rem;border-bottom:1px solid var(--hairline)}
.repo .dots{display:flex;gap:.65rem;flex:none}
.repo .dots i{display:block;width:.95rem;height:.95rem;border-radius:50%;background:var(--card-corner)}
.repo .path{font-family:'SF Mono',Menlo,monospace;font-size:1.75rem;color:var(--muted);line-height:1.2;white-space:nowrap}
.repo .files{display:flex;flex-direction:column;gap:1.2rem}
.repo .file{display:flex;align-items:flex-start;gap:1.1rem;font-family:'SF Mono',Menlo,monospace;font-size:1.75rem;line-height:1.34;color:var(--text);overflow-wrap:normal}
.repo .file .icon{width:2.1rem;height:2.1rem;flex:none;margin-top:.15rem;color:var(--faint)}
.annotation{font-size:1.875rem;line-height:1.32;font-weight:500;color:var(--faint)}
.counter{font-size:1.875rem;font-weight:600;letter-spacing:.1em;color:var(--faint);font-variant-numeric:tabular-nums}
.two-col{display:flex;align-items:center;gap:3rem}
.two-col .col-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:2.5rem}
.footnote{font-size:2.25rem;line-height:1.3;font-weight:500;color:var(--muted);max-width:46rem}
`;
