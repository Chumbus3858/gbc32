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

// ============ BULLET HOLE REVEAL — JAGGED GLASS + RADIATING CRACKS ============
function createBinaryReveal(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const section = canvas.closest('section') || canvas.parentElement;

    const GAP_X = 28;
    const GAP_Y = 22;
    const FONT_SIZE = 13;
    const BASE_R = 160;        // average hole radius
    const CRACK_R = 420;       // how far cracks reach
    const FALL_SPEED = 0.4;
    const MORPH_CHANCE = 0.03;
    const SYMBOLS = '01{}()<>+-=.:;|/\\01010101アイウエオカキクケコ';
    const NUM_HOLE_PTS = 24;   // jagged polygon vertices
    let cols = 0, rows = 0, cells = [];

    // Jagged bullet hole polygon — irregular shape, NOT a circle
    let holePoints = [];       // {angle, baseR, wobbleSpeed, wobbleAmp}
    let cracks = [];

    function buildHole() {
        holePoints = [];
        for (let i = 0; i < NUM_HOLE_PTS; i++) {
            const angle = (i / NUM_HOLE_PTS) * Math.PI * 2;
            // Each vertex has a different radius — creates jagged irregular shape
            const rVariance = BASE_R * (0.55 + Math.random() * 0.65);
            // Some vertices punch inward sharply (like real bullet impact)
            const isPunch = Math.random() < 0.3;
            const r = isPunch ? rVariance * 0.6 : rVariance;
            holePoints.push({
                angle: angle,
                baseR: r,
                wobbleSpeed: 0.3 + Math.random() * 0.7,
                wobbleAmp: 2 + Math.random() * 5,
                phase: Math.random() * Math.PI * 2,
            });
        }
    }

    // Build crack lines radiating outward from hole edge
    function buildCracks() {
        cracks = [];
        const NUM_CRACKS = 16 + (Math.random() * 8 | 0);
        for (let i = 0; i < NUM_CRACKS; i++) {
            const angle = (i / NUM_CRACKS) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            // Start from hole edge, extend outward
            const startR = BASE_R * 0.7;
            const endR = startR + 60 + Math.random() * (CRACK_R - startR - 60);
            const segments = [];
            const steps = 4 + (Math.random() * 5 | 0);
            for (let s = 0; s <= steps; s++) {
                const t = s / steps;
                const r = startR + t * (endR - startR);
                const jitter = (Math.random() - 0.5) * 35 * t;
                const aJitter = (Math.random() - 0.5) * 0.15 * t;
                segments.push({
                    dx: Math.cos(angle + aJitter) * r + jitter,
                    dy: Math.sin(angle + aJitter) * r + jitter * 0.8,
                });
            }
            // Fork branches
            const branches = [];
            if (Math.random() < 0.55) {
                const branchIdx = 1 + (Math.random() * (steps - 1) | 0);
                const brAngle = angle + (Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.8);
                const brLen = 25 + Math.random() * 70;
                const origin = segments[Math.min(branchIdx, segments.length - 1)];
                const brSegs = [{ dx: origin.dx, dy: origin.dy }];
                for (let b = 1; b <= 3; b++) {
                    const bt = b / 3;
                    brSegs.push({
                        dx: origin.dx + Math.cos(brAngle) * brLen * bt + (Math.random() - 0.5) * 15,
                        dy: origin.dy + Math.sin(brAngle) * brLen * bt + (Math.random() - 0.5) * 10,
                    });
                }
                branches.push(brSegs);
            }
            // Secondary fork
            if (Math.random() < 0.3 && segments.length > 3) {
                const branchIdx = 2 + (Math.random() * (steps - 3) | 0);
                const brAngle = angle + (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.6);
                const brLen = 20 + Math.random() * 40;
                const origin = segments[Math.min(branchIdx, segments.length - 1)];
                const brSegs = [{ dx: origin.dx, dy: origin.dy }];
                for (let b = 1; b <= 2; b++) {
                    brSegs.push({
                        dx: origin.dx + Math.cos(brAngle) * brLen * (b / 2) + (Math.random() - 0.5) * 10,
                        dy: origin.dy + Math.sin(brAngle) * brLen * (b / 2) + (Math.random() - 0.5) * 8,
                    });
                }
                branches.push(brSegs);
            }
            cracks.push({ segments, branches, width: 0.8 + Math.random() * 1.8 });
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
        buildHole();
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

    // Get the current jagged hole polygon path (animated)
    function getHolePath(time) {
        const pts = [];
        for (let i = 0; i < holePoints.length; i++) {
            const p = holePoints[i];
            const wobble = Math.sin(time * 0.001 * p.wobbleSpeed + p.phase) * p.wobbleAmp;
            const r = p.baseR + wobble;
            pts.push({
                x: Math.cos(p.angle) * r,
                y: Math.sin(p.angle) * r,
            });
        }
        return pts;
    }

    // Check if a point is inside the jagged polygon (ray casting)
    function pointInHole(px, py, holePts) {
        let inside = false;
        for (let i = 0, j = holePts.length - 1; i < holePts.length; j = i++) {
            const xi = holePts[i].x, yi = holePts[i].y;
            const xj = holePts[j].x, yj = holePts[j].y;
            if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }

    // Build canvas path from hole polygon
    function traceHolePath(holePts) {
        ctx.beginPath();
        ctx.moveTo(holePts[0].x, holePts[0].y);
        // Use quadratic curves between points for organic jagged edges
        for (let i = 1; i <= holePts.length; i++) {
            const cur = holePts[i % holePts.length];
            const prev = holePts[(i - 1) % holePts.length];
            const cpx = (prev.x + cur.x) / 2 + (Math.random() - 0.5) * 6;
            const cpy = (prev.y + cur.y) / 2 + (Math.random() - 0.5) * 6;
            ctx.quadraticCurveTo(cpx, cpy, cur.x, cur.y);
        }
        ctx.closePath();
    }

    // Draw cracked glass around the hole
    function drawCracks(time) {
        if (mx < -999) return;
        ctx.save();
        ctx.translate(mx, my);

        // Radiating crack lines
        for (const crack of cracks) {
            const segs = crack.segments;
            // Main crack
            ctx.beginPath();
            ctx.moveTo(segs[0].dx, segs[0].dy);
            for (let s = 1; s < segs.length; s++) {
                ctx.lineTo(segs[s].dx, segs[s].dy);
            }
            ctx.strokeStyle = 'rgba(180, 190, 200, 0.5)';
            ctx.lineWidth = crack.width;
            ctx.stroke();

            // White refraction highlight offset by 1px
            ctx.beginPath();
            ctx.moveTo(segs[0].dx + 1.5, segs[0].dy + 1);
            for (let s = 1; s < segs.length; s++) {
                ctx.lineTo(segs[s].dx + 1.5, segs[s].dy + 1);
            }
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Branches
            for (const br of crack.branches) {
                ctx.beginPath();
                ctx.moveTo(br[0].dx, br[0].dy);
                for (let b = 1; b < br.length; b++) ctx.lineTo(br[b].dx, br[b].dy);
                ctx.strokeStyle = 'rgba(160, 170, 180, 0.35)';
                ctx.lineWidth = 0.7;
                ctx.stroke();
            }
        }

        // Concentric spider web rings (3 rings with jitter)
        for (let ring = 0; ring < 4; ring++) {
            const ringR = BASE_R * (0.8 + ring * 0.35);
            ctx.beginPath();
            const ringSteps = 60;
            for (let a = 0; a <= ringSteps; a++) {
                const angle = (a / ringSteps) * Math.PI * 2;
                const jit = (Math.sin(angle * 7 + ring) * 4) + (Math.sin(time * 0.0005 + angle * 3) * 2);
                const px = Math.cos(angle) * (ringR + jit);
                const py = Math.sin(angle) * (ringR + jit);
                if (a === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.strokeStyle = `rgba(180, 190, 200, ${0.3 - ring * 0.06})`;
            ctx.lineWidth = 1.2 - ring * 0.2;
            ctx.stroke();
        }

        // Glass shard fragments near hole edge (small triangles)
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 + Math.sin(time * 0.0003 + i) * 0.1;
            const r = BASE_R * (0.7 + Math.sin(i * 1.7) * 0.15);
            const cx = Math.cos(a) * r;
            const cy = Math.sin(a) * r;
            const sz = 6 + (i % 3) * 4;
            ctx.beginPath();
            ctx.moveTo(cx - sz * 0.5, cy - sz * 0.3);
            ctx.lineTo(cx + sz * 0.4, cy - sz * 0.1);
            ctx.lineTo(cx + sz * 0.1, cy + sz * 0.4);
            ctx.closePath();
            ctx.fillStyle = `rgba(200, 210, 220, ${0.06 + Math.sin(time * 0.002 + i) * 0.03})`;
            ctx.fill();
            ctx.strokeStyle = 'rgba(200, 210, 220, 0.2)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        ctx.restore();
    }

    // Dark edge vignette
    function drawEdgeVignette() {
        const w = canvas.width, h = canvas.height;
        const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.15, w / 2, h / 2, Math.max(w, h) * 0.7);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.4, 'rgba(220,220,220,0.08)');
        grad.addColorStop(0.65, 'rgba(140,140,140,0.3)');
        grad.addColorStop(0.85, 'rgba(50,50,50,0.6)');
        grad.addColorStop(1, 'rgba(10,10,10,0.85)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    let last = 0;
    function draw(t) {
        requestAnimationFrame(draw);
        if (t - last < 33) return; // ~30fps
        last = t;

        const W = canvas.width, H = canvas.height;

        // Clear to white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);

        if (mx > -999) {
            // Get animated jagged hole shape
            const holePts = getHolePath(t);

            // Draw dark void + falling symbols CLIPPED to jagged hole
            ctx.save();
            ctx.translate(mx, my);
            traceHolePath(holePts);
            ctx.clip();

            // Dark void behind the text
            ctx.fillStyle = '#060812';
            ctx.fillRect(-BASE_R * 1.5, -BASE_R * 1.5, BASE_R * 3, BASE_R * 3);

            // Falling + morphing symbols inside the hole
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = FONT_SIZE + 'px monospace';

            for (let c = 0; c < cols; c++) {
                const col = cells[c];
                const baseX = c * GAP_X + GAP_X / 2 - mx;

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

                    const drawY = r * GAP_Y + GAP_Y / 2 + cell.yOff - my;
                    if (drawY < -BASE_R * 1.5 || drawY > BASE_R * 1.5) continue;
                    if (baseX < -BASE_R * 1.5 || baseX > BASE_R * 1.5) continue;

                    // Brightness falloff from center
                    const d = Math.sqrt(baseX * baseX + drawY * drawY);
                    const alpha = Math.max(0, 1 - d / (BASE_R * 1.1)) * 0.9;
                    if (alpha <= 0) continue;

                    const green = 80 + (1 - d / BASE_R) * 175;
                    ctx.fillStyle = `rgba(${20 + (Math.random() * 15 | 0)}, ${green | 0}, ${40 + (Math.random() * 20 | 0)}, ${alpha})`;
                    ctx.fillText(cell.ch, baseX, drawY);
                }
            }

            ctx.restore();

            // Jagged hole border — frosted glass edge glow
            ctx.save();
            ctx.translate(mx, my);
            traceHolePath(holePts);
            ctx.strokeStyle = 'rgba(200, 210, 220, 0.6)';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = 'rgba(200, 220, 255, 0.4)';
            ctx.shadowBlur = 12;
            ctx.stroke();
            ctx.restore();

            // Draw all the radiating cracks + spider web rings
            drawCracks(t);
        } else {
            // Update cells even when mouse is off so they don't freeze
            for (let c = 0; c < cols; c++) {
                for (let r = 0; r < rows; r++) {
                    const cell = cells[c][r];
                    cell.yOff += cell.speed;
                    if (cell.yOff >= GAP_Y) { cell.yOff -= GAP_Y; cell.ch = SYMBOLS[Math.random() * SYMBOLS.length | 0]; }
                    if (Math.random() < MORPH_CHANCE) cell.ch = SYMBOLS[Math.random() * SYMBOLS.length | 0];
                }
            }
        }

        // Dark shady edge vignette — always drawn
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
