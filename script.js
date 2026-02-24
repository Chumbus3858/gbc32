// ============ REALISTIC TV STATIC (hero + loader only) ============
function createStaticCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    const SCALE = 2; // finer grain for realism
    let w = 0, h = 0, imageData = null;

    function resize() {
        w = Math.ceil(canvas.offsetWidth / SCALE);
        h = Math.ceil(canvas.offsetHeight / SCALE);
        canvas.width = w; canvas.height = h;
        imageData = ctx.createImageData(w, h);
    }
    resize();
    window.addEventListener('resize', resize);

    let lastFrame = 0;
    let bandOffset = 0;

    function drawStatic(time) {
        requestAnimationFrame(drawStatic);
        if (time - lastFrame < 66) return; // ~15fps for that flickery CRT feel
        lastFrame = time;
        const data = imageData.data;
        const rowBytes = w * 4;

        // Random horizontal band (interference artifact)
        const hasBand = Math.random() < 0.3;
        const bandY = hasBand ? ((Math.random() * h) | 0) : -1;
        const bandHeight = hasBand ? (2 + (Math.random() * 6) | 0) : 0;
        bandOffset = (bandOffset + (Math.random() * 3 - 1)) | 0;

        for (let y = 0; y < h; y++) {
            const rowStart = y * rowBytes;
            // Horizontal scan line darkening — every other line is dimmer
            const scanDim = (y & 1) ? 0.7 : 1.0;
            // Horizontal band artifact — bright interference bar
            const inBand = hasBand && y >= bandY && y < bandY + bandHeight;
            const bandBoost = inBand ? 40 + (Math.random() * 30) : 0;

            for (let x = 0; x < w; x++) {
                const i = rowStart + x * 4;
                // Per-pixel noise with slight horizontal correlation
                let v = (Math.random() * 180) | 0;
                // Cluster adjacent pixels slightly (horizontal smear like real analog)
                if (x > 0 && Math.random() < 0.3) {
                    v = (v * 0.6 + data[i - 4] * 0.4) | 0;
                }
                v = ((v * scanDim + bandBoost) | 0);
                if (v > 255) v = 255;
                data[i] = v; data[i + 1] = v; data[i + 2] = v; data[i + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }
    requestAnimationFrame(drawStatic);
}

// Only create static for loader and hero — NOT portfolio or CTA
createStaticCanvas('loaderStatic');
createStaticCanvas('heroStatic');

// ============ BROKEN WINDOW REVEAL — CRACKED GLASS + FALLING SYMBOLS ============
function createBinaryReveal(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const section = canvas.closest('section') || canvas.parentElement;

    const GAP_X = 30;
    const GAP_Y = 24;
    const FONT_SIZE = 13;
    const HOLE_R = 220;       // inner clear hole radius
    const CRACK_R = 340;      // outer crack reach
    const FALL_SPEED = 0.4;
    const MORPH_CHANCE = 0.03;
    const SYMBOLS = '01{}()<>+-=.:;|/\\01010101アイウエオカキクケコ';
    let cols = 0, rows = 0, cells = [];

    // Generate jagged crack lines radiating from center of hole
    let cracks = [];
    function buildCracks() {
        cracks = [];
        const NUM_CRACKS = 14 + (Math.random() * 6 | 0);
        for (let i = 0; i < NUM_CRACKS; i++) {
            const angle = (i / NUM_CRACKS) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
            const len = HOLE_R * 0.7 + Math.random() * (CRACK_R - HOLE_R) * 0.9;
            const segments = [];
            const steps = 5 + (Math.random() * 4 | 0);
            for (let s = 0; s <= steps; s++) {
                const t = s / steps;
                const r = HOLE_R * 0.85 + t * (len - HOLE_R * 0.85);
                const jitter = (Math.random() - 0.5) * 28 * t;
                segments.push({
                    dx: Math.cos(angle + jitter * 0.01) * r + jitter,
                    dy: Math.sin(angle + jitter * 0.01) * r + jitter * 0.7,
                });
            }
            // Sub-branches
            const branches = [];
            if (Math.random() < 0.6) {
                const branchAt = 1 + (Math.random() * (steps - 2) | 0);
                const brAngle = angle + (Math.random() - 0.5) * 1.2;
                const brLen = 30 + Math.random() * 60;
                const brSteps = 3;
                const origin = segments[branchAt];
                const brSegs = [{ dx: origin.dx, dy: origin.dy }];
                for (let b = 1; b <= brSteps; b++) {
                    const bt = b / brSteps;
                    brSegs.push({
                        dx: origin.dx + Math.cos(brAngle) * brLen * bt + (Math.random() - 0.5) * 12,
                        dy: origin.dy + Math.sin(brAngle) * brLen * bt + (Math.random() - 0.5) * 8,
                    });
                }
                branches.push(brSegs);
            }
            cracks.push({ segments, branches, width: 1 + Math.random() * 1.5 });
        }
    }

    function buildGrid() {
        cols = Math.floor(canvas.width / GAP_X) + 1;
        rows = Math.floor(canvas.height / GAP_Y) + 3;
        cells = [];
        for (let c = 0; c < cols; c++) {
            const col = [];
            for (let r = 0; r < rows; r++) {
                col.push({
                    ch: SYMBOLS[Math.random() * SYMBOLS.length | 0],
                    speed: FALL_SPEED + Math.random() * 0.3,
                    yOff: 0,
                });
            }
            cells.push(col);
        }
    }

    function resize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        buildGrid();
        buildCracks();
    }
    resize();
    window.addEventListener('resize', resize);

    // Mouse tracking
    let mx = -9999, my = -9999;
    section.addEventListener('mousemove', (e) => {
        const r = canvas.getBoundingClientRect();
        mx = e.clientX - r.left;
        my = e.clientY - r.top;
    });
    section.addEventListener('mouseleave', () => { mx = -9999; my = -9999; });

    // Draw cracked glass edges around the hole
    function drawCracks() {
        if (mx < -999) return;
        ctx.save();
        ctx.translate(mx, my);

        // Draw each crack line
        for (let i = 0; i < cracks.length; i++) {
            const crack = cracks[i];
            const segs = crack.segments;

            // Main crack line
            ctx.beginPath();
            ctx.moveTo(segs[0].dx, segs[0].dy);
            for (let s = 1; s < segs.length; s++) {
                ctx.lineTo(segs[s].dx, segs[s].dy);
            }
            ctx.strokeStyle = 'rgba(80, 90, 100, 0.6)';
            ctx.lineWidth = crack.width;
            ctx.stroke();

            // Thin white highlight beside crack (glass refraction)
            ctx.beginPath();
            ctx.moveTo(segs[0].dx + 1, segs[0].dy + 1);
            for (let s = 1; s < segs.length; s++) {
                ctx.lineTo(segs[s].dx + 1, segs[s].dy + 1);
            }
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Sub-branches
            for (const br of crack.branches) {
                ctx.beginPath();
                ctx.moveTo(br[0].dx, br[0].dy);
                for (let b = 1; b < br.length; b++) {
                    ctx.lineTo(br[b].dx, br[b].dy);
                }
                ctx.strokeStyle = 'rgba(80, 90, 100, 0.4)';
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }
        }

        // Concentric ring cracks (spider web pattern)
        for (let ring = 0; ring < 3; ring++) {
            const r = HOLE_R * (0.9 + ring * 0.25);
            ctx.beginPath();
            for (let a = 0; a < Math.PI * 2; a += 0.05) {
                const jit = (Math.random() - 0.5) * 6;
                const px = Math.cos(a) * (r + jit);
                const py = Math.sin(a) * (r + jit);
                if (a === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.strokeStyle = `rgba(80, 90, 100, ${0.35 - ring * 0.1})`;
            ctx.lineWidth = 1 - ring * 0.2;
            ctx.stroke();
        }

        ctx.restore();
    }

    // Dark edge vignette
    function drawEdgeVignette() {
        const w = canvas.width, h = canvas.height;
        const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.72);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.45, 'rgba(210,210,210,0.12)');
        grad.addColorStop(0.7, 'rgba(120,120,120,0.35)');
        grad.addColorStop(0.9, 'rgba(40,40,40,0.65)');
        grad.addColorStop(1, 'rgba(10,10,10,0.82)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    let last = 0;
    function draw(t) {
        requestAnimationFrame(draw);
        if (t - last < 40) return;
        last = t;

        const W = canvas.width, H = canvas.height;

        // Clear to white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = FONT_SIZE + 'px monospace';

        const R = HOLE_R;
        const R2 = R * R;

        // Update + draw cells ONLY inside the broken hole
        for (let c = 0; c < cols; c++) {
            const col = cells[c];
            const baseX = c * GAP_X + GAP_X / 2;

            for (let r = 0; r < rows; r++) {
                const cell = col[r];
                cell.yOff += cell.speed;
                if (Math.random() < MORPH_CHANCE) {
                    cell.ch = SYMBOLS[Math.random() * SYMBOLS.length | 0];
                }
                if (cell.yOff >= GAP_Y) {
                    cell.yOff -= GAP_Y;
                    cell.ch = SYMBOLS[Math.random() * SYMBOLS.length | 0];
                }

                const drawY = r * GAP_Y + GAP_Y / 2 + cell.yOff;
                if (drawY < -GAP_Y || drawY > H + GAP_Y) continue;

                // Only visible through the broken hole
                const dx = baseX - mx;
                const dy = drawY - my;
                const d2 = dx * dx + dy * dy;
                if (d2 > R2) continue;

                const dist = Math.sqrt(d2);
                const prox = 1 - dist / R;
                // Sharp edge — visible almost to the edge, then sharp cutoff
                const alpha = Math.min(1, prox * 2.5) * 0.85;

                ctx.fillStyle = '#0a1628';
                ctx.globalAlpha = alpha;
                ctx.fillText(cell.ch, baseX, drawY);
            }
        }
        ctx.globalAlpha = 1;

        // Dark background visible through hole (behind the text)
        if (mx > -999) {
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            const holeGrad = ctx.createRadialGradient(mx, my, 0, mx, my, R);
            holeGrad.addColorStop(0, 'rgba(6, 8, 18, 0.92)');
            holeGrad.addColorStop(0.8, 'rgba(6, 8, 18, 0.85)');
            holeGrad.addColorStop(1, 'rgba(6, 8, 18, 0)');
            ctx.fillStyle = holeGrad;
            ctx.beginPath();
            ctx.arc(mx, my, R, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Draw cracked glass edges
        drawCracks();

        // Dark edge vignette — shady overall
        drawEdgeVignette();
    }
    requestAnimationFrame(draw);
}

createBinaryReveal('codeRain');
createBinaryReveal('codeRain2');
createBinaryReveal('ctaRain');

// ============ HACKER TITLE — SCRAMBLE + RESOLVE LOOP ============
(function hackerTitle() {
    const el = document.querySelector('.title-chars');
    if (!el) return;
    const ORIGINAL = 'PORTFOLIO';
    const GLITCH_CHARS = '01@#$%&*!?/\\|{}[]<>^~+=:;アイウエオカキクケコ';
    const CYCLE_MS = 4000;  // full cycle duration
    const SCRAMBLE_MS = 1800; // how long it stays scrambled before resolving
    const FRAME_MS = 60;

    let phase = 'scramble'; // scramble | resolve | hold
    let timer = 0;
    let revealed = 0; // how many chars from left are locked to original

    function tick() {
        timer += FRAME_MS;

        if (phase === 'hold') {
            // Show original text, wait before next scramble
            if (timer > CYCLE_MS - SCRAMBLE_MS - 600) {
                phase = 'scramble';
                timer = 0;
                revealed = 0;
            }
        } else if (phase === 'scramble') {
            // Full random scramble
            let out = '';
            for (let i = 0; i < ORIGINAL.length; i++) {
                out += GLITCH_CHARS[Math.random() * GLITCH_CHARS.length | 0];
            }
            el.textContent = out;
            if (timer > SCRAMBLE_MS) {
                phase = 'resolve';
                timer = 0;
                revealed = 0;
            }
        } else if (phase === 'resolve') {
            // Resolve left to right — one char every ~80ms
            if (timer % 80 < FRAME_MS) {
                revealed = Math.min(revealed + 1, ORIGINAL.length);
            }
            let out = '';
            for (let i = 0; i < ORIGINAL.length; i++) {
                if (i < revealed) {
                    out += ORIGINAL[i];
                } else {
                    out += GLITCH_CHARS[Math.random() * GLITCH_CHARS.length | 0];
                }
            }
            el.textContent = out;
            if (revealed >= ORIGINAL.length) {
                phase = 'hold';
                timer = 0;
                el.textContent = ORIGINAL;
            }
        }

        setTimeout(tick, FRAME_MS);
    }
    tick();
})();

// ============ CARD 3D TILT ON HOVER (no glow/crack lines) ============
document.querySelectorAll('.bento-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const tiltX = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
        const tiltY = ((e.clientY - rect.top) / rect.height - 0.5) * -16;
        card.style.transform = `perspective(800px) rotateY(${tiltX}deg) rotateX(${tiltY}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

// ============ CARD BUTTON — BORDER TRACE + FLIP → GROW → WIGGLE → POOF ============
function spawnPoofClouds(btn) {
    const rect = btn.getBoundingClientRect();
    const scrollX = window.scrollX, scrollY = window.scrollY;
    for (let i = 0; i < 8; i++) {
        const poof = document.createElement('div');
        poof.className = 'poof-cloud';
        const angle = (i / 8) * Math.PI * 2;
        const dist = 20 + Math.random() * 30;
        poof.style.left = (rect.left + scrollX + rect.width / 2 + Math.cos(angle) * dist) + 'px';
        poof.style.top = (rect.top + scrollY + rect.height / 2 + Math.sin(angle) * dist) + 'px';
        poof.style.width = (8 + Math.random() * 12) + 'px';
        poof.style.height = poof.style.width;
        document.body.appendChild(poof);
        setTimeout(() => poof.remove(), 700);
    }
}

document.querySelectorAll('.card-btn').forEach(btn => {
    let animating = false;
    let timeouts = [];

    function clearAllAnims() {
        timeouts.forEach(t => clearTimeout(t));
        timeouts = [];
        btn.classList.remove('coin-flipping', 'btn-grow', 'btn-wiggle', 'btn-shrink', 'border-tracing');
        btn.style.transform = '';
        animating = false;
    }

    btn.addEventListener('mouseenter', () => {
        if (animating) return;
        animating = true;
        btn.classList.add('border-tracing');

        // Phase 1: 3 smooth slow flips (0.8s each = 2.4s)
        btn.classList.add('coin-flipping');

        // Phase 2: After flips, grow slightly
        timeouts.push(setTimeout(() => {
            btn.classList.remove('coin-flipping');
            btn.classList.add('btn-grow');

            // Phase 3: Wiggle fast for 4 seconds
            timeouts.push(setTimeout(() => {
                btn.classList.remove('btn-grow');
                btn.classList.add('btn-wiggle');

                // Phase 4: Shrink back + poof clouds
                timeouts.push(setTimeout(() => {
                    btn.classList.remove('btn-wiggle');
                    btn.classList.add('btn-shrink');
                    spawnPoofClouds(btn);

                    // Phase 5: Clean up
                    timeouts.push(setTimeout(() => {
                        clearAllAnims();
                    }, 400));
                }, 4000));
            }, 350));
        }, 2400));
    });

    btn.addEventListener('mouseleave', () => { clearAllAnims(); });
});

// ============ CTA CRACK + MATRIX REVEAL + GREEN ARROWS ============
const ctaSection = document.querySelector('.cta');
if (ctaSection) {
    const ctaCrack = ctaSection.querySelector('.cta-crack');
    const ctaArrows = ctaSection.querySelectorAll('.cta-arrow');
    let ctaRevealed = false;

    const ctaObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !ctaRevealed) {
                ctaRevealed = true;
                // Trigger crack
                if (ctaCrack) ctaCrack.classList.add('cracking');
                // Show arrows staggered
                ctaArrows.forEach((arrow, i) => {
                    setTimeout(() => arrow.classList.add('visible'), 800 + i * 200);
                });
            }
        });
    }, { threshold: 0.4 });
    ctaObserver.observe(ctaSection);
}

// ============ CTA BUTTON ENHANCED — GLINT SWEEP ============
const ctaBtn = document.querySelector('.cta-btn');
if (ctaBtn) {
    setInterval(() => {
        ctaBtn.classList.remove('glint-sweep');
        void ctaBtn.offsetWidth;
        ctaBtn.classList.add('glint-sweep');
    }, 3000);
}

// ============ LOADING SCREEN ============
const loader = document.getElementById('loader');
const loaderPercent = document.getElementById('loaderPercent');
const loaderFill = document.getElementById('loaderFill');
const loaderText = document.getElementById('loaderText');
const nav = document.getElementById('nav');

const loadMessages = ['Initializing...','Loading modules...','Compiling scripts...','Rendering UI...','Connecting services...','Deploying...','Ready.'];
let progress = 0, msgIndex = 0;
const loadInterval = setInterval(() => {
    progress += Math.random() * 12 + 3;
    if (progress >= 100) {
        progress = 100;
        clearInterval(loadInterval);
        if (loaderText) loaderText.textContent = 'Ready.';
        setTimeout(() => { loader.classList.add('done'); nav.classList.add('visible'); }, 400);
    }
    const newMsgIndex = Math.min(Math.floor((progress / 100) * loadMessages.length), loadMessages.length - 1);
    if (newMsgIndex !== msgIndex) { msgIndex = newMsgIndex; if (loaderText) loaderText.textContent = loadMessages[msgIndex]; }
    loaderPercent.textContent = Math.floor(progress) + '%';
    loaderFill.style.width = progress + '%';
}, 80);

// ============ TERMINAL TYPING ============
const terminalEl = document.getElementById('terminalText');
const commands = ['cat skills.lua','roblox-studio --deploy','luau compile --strict --native','git push origin main','echo "Available for hire"','npm run build && ship','test --combat --vfx --ui'];
let cmdIdx = 0, charIdx = 0, isDeleting = false;

function typeCommand() {
    if (!terminalEl) return;
    const current = commands[cmdIdx];
    if (!isDeleting) {
        terminalEl.textContent = current.substring(0, charIdx);
        charIdx++;
        if (charIdx > current.length) { isDeleting = true; setTimeout(typeCommand, 2000); return; }
        setTimeout(typeCommand, 50 + Math.random() * 50);
    } else {
        terminalEl.textContent = current.substring(0, charIdx);
        charIdx--;
        if (charIdx < 0) { isDeleting = false; charIdx = 0; cmdIdx = (cmdIdx + 1) % commands.length; setTimeout(typeCommand, 300); return; }
        setTimeout(typeCommand, 25);
    }
}
setTimeout(typeCommand, 1200);

// ============ NAV SCROLL ============
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(() => {
            const y = window.scrollY;
            nav.classList.toggle('scrolled', y > 80);
            const hero = document.querySelector('.hero-content');
            if (hero) { hero.style.transform = `translate3d(0, ${y * 0.12}px, 0)`; hero.style.opacity = Math.max(0, 1 - y / 800); }
            ticking = false;
        });
        ticking = true;
    }
}, { passive: true });

// ============ SMOOTH SCROLL ============
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const href = anchor.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// ============ SCROLL REVEAL ============
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) { setTimeout(() => entry.target.classList.add('visible'), i * 80); revealObserver.unobserve(entry.target); }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ============ ACTIVE NAV ============
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            document.querySelectorAll('.nav-links a').forEach(link => {
                link.style.color = ''; link.style.textShadow = '';
                if (link.getAttribute('href') === '#' + id) { link.style.color = '#ff4d00'; link.style.textShadow = '0 0 20px rgba(255, 77, 0, 0.4)'; }
            });
        }
    });
}, { threshold: 0.3 });
document.querySelectorAll('section[id]').forEach(s => sectionObserver.observe(s));

// ============ TAG HOVER ============
document.querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('mouseenter', () => { tag.style.transform = 'translateY(-2px) scale(1.05)'; });
    tag.addEventListener('mouseleave', () => { tag.style.transform = ''; });
});

// ============ STAT COUNTER ============
const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const text = el.textContent;
            const num = parseInt(text.replace(/[^0-9]/g, ''));
            if (isNaN(num) || num === 0) return;
            const suffix = text.replace(/[0-9,]/g, '');
            const hasComma = text.includes(',');
            let current = 0;
            const step = Math.max(1, Math.floor(num / 40));
            const interval = setInterval(() => {
                current += step;
                if (current >= num) { current = num; clearInterval(interval); }
                el.textContent = (hasComma ? current.toLocaleString() : current) + suffix;
            }, 30);
            statObserver.unobserve(el);
        }
    });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-value').forEach(el => statObserver.observe(el));
