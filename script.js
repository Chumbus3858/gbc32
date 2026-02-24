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

// ============ BULLET HOLE REVEAL — SPINNING HOLE + ORBITING ROCKS + HEAVY CRACKS ============
function createBinaryReveal(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const section = canvas.closest('section') || canvas.parentElement;

    const GAP_X = 28;
    const GAP_Y = 22;
    const FONT_SIZE = 13;
    const BASE_R = 160;
    const CRACK_R = 460;       // cracks reach further
    const FALL_SPEED = 0.4;
    const MORPH_CHANCE = 0.03;
    const SYMBOLS = '01{}()<>+-=.:;|/\\01010101アイウエオカキクケコ';
    const NUM_HOLE_PTS = 24;
    const SPIN_SPEED = 0.00012; // slow rotation (radians per ms)
    const NUM_ROCKS = 10;       // orbiting rock debris
    let cols = 0, rows = 0, cells = [];

    // Jagged bullet hole polygon
    let holePoints = [];
    let cracks = [];
    let rocks = [];

    function buildHole() {
        holePoints = [];
        for (let i = 0; i < NUM_HOLE_PTS; i++) {
            const angle = (i / NUM_HOLE_PTS) * Math.PI * 2;
            const rVariance = BASE_R * (0.55 + Math.random() * 0.65);
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

    // Build orbiting rock debris
    function buildRocks() {
        rocks = [];
        for (let i = 0; i < NUM_ROCKS; i++) {
            const orbitAngle = (i / NUM_ROCKS) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
            const orbitR = BASE_R * (1.15 + Math.random() * 0.55); // orbit just outside hole
            rocks.push({
                orbitAngle: orbitAngle,
                orbitR: orbitR,
                bobSpeed: 1.5 + Math.random() * 2.5,
                bobAmp: 4 + Math.random() * 8,
                bobPhase: Math.random() * Math.PI * 2,
                size: 5 + Math.random() * 10,
                // Each rock is an irregular polygon (3-5 vertices)
                numVerts: 3 + (Math.random() * 3 | 0),
                vertAngles: [],
                vertRadii: [],
                rotSpeed: (Math.random() - 0.5) * 0.003, // self-rotation
                rotPhase: Math.random() * Math.PI * 2,
            });
            // Build jagged rock shape
            const rock = rocks[i];
            for (let v = 0; v < rock.numVerts; v++) {
                rock.vertAngles.push((v / rock.numVerts) * Math.PI * 2 + (Math.random() - 0.5) * 0.5);
                rock.vertRadii.push(0.5 + Math.random() * 0.5); // radius multiplier
            }
        }
    }

    // Build crack lines — MORE of them, THICKER, MORE VISIBLE
    function buildCracks() {
        cracks = [];
        const NUM_CRACKS = 22 + (Math.random() * 10 | 0); // more cracks
        for (let i = 0; i < NUM_CRACKS; i++) {
            const angle = (i / NUM_CRACKS) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
            const startR = BASE_R * 1.05; // start OUTSIDE the hole edge
            const endR = startR + 80 + Math.random() * (CRACK_R - startR - 80);
            const segments = [];
            const steps = 5 + (Math.random() * 6 | 0);
            for (let s = 0; s <= steps; s++) {
                const t = s / steps;
                const r = startR + t * (endR - startR);
                const jitter = (Math.random() - 0.5) * 40 * t;
                const aJitter = (Math.random() - 0.5) * 0.18 * t;
                segments.push({
                    dx: Math.cos(angle + aJitter) * r + jitter,
                    dy: Math.sin(angle + aJitter) * r + jitter * 0.8,
                });
            }
            // Primary branch
            const branches = [];
            if (Math.random() < 0.65) {
                const branchIdx = 1 + (Math.random() * (steps - 1) | 0);
                const brAngle = angle + (Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.9);
                const brLen = 30 + Math.random() * 80;
                const origin = segments[Math.min(branchIdx, segments.length - 1)];
                const brSegs = [{ dx: origin.dx, dy: origin.dy }];
                for (let b = 1; b <= 3; b++) {
                    brSegs.push({
                        dx: origin.dx + Math.cos(brAngle) * brLen * (b / 3) + (Math.random() - 0.5) * 18,
                        dy: origin.dy + Math.sin(brAngle) * brLen * (b / 3) + (Math.random() - 0.5) * 12,
                    });
                }
                branches.push(brSegs);
            }
            // Secondary branch
            if (Math.random() < 0.4 && segments.length > 3) {
                const branchIdx = 2 + (Math.random() * (steps - 3) | 0);
                const brAngle = angle + (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.7);
                const brLen = 20 + Math.random() * 50;
                const origin = segments[Math.min(branchIdx, segments.length - 1)];
                const brSegs = [{ dx: origin.dx, dy: origin.dy }];
                for (let b = 1; b <= 2; b++) {
                    brSegs.push({
                        dx: origin.dx + Math.cos(brAngle) * brLen * (b / 2) + (Math.random() - 0.5) * 12,
                        dy: origin.dy + Math.sin(brAngle) * brLen * (b / 2) + (Math.random() - 0.5) * 10,
                    });
                }
                branches.push(brSegs);
            }
            // Tertiary micro-branch
            if (Math.random() < 0.25 && segments.length > 4) {
                const branchIdx = 3 + (Math.random() * (steps - 4) | 0);
                const brAngle = angle + (Math.random() - 0.5) * 1.5;
                const brLen = 15 + Math.random() * 30;
                const origin = segments[Math.min(branchIdx, segments.length - 1)];
                const brSegs = [{ dx: origin.dx, dy: origin.dy }];
                brSegs.push({
                    dx: origin.dx + Math.cos(brAngle) * brLen + (Math.random() - 0.5) * 8,
                    dy: origin.dy + Math.sin(brAngle) * brLen + (Math.random() - 0.5) * 6,
                });
                branches.push(brSegs);
            }
            cracks.push({ segments, branches, width: 1.0 + Math.random() * 2.2 });
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
        buildRocks();
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

    // Get the current jagged hole polygon path (animated + rotating)
    function getHolePath(time) {
        const spin = time * SPIN_SPEED; // slow rotation
        const pts = [];
        for (let i = 0; i < holePoints.length; i++) {
            const p = holePoints[i];
            const wobble = Math.sin(time * 0.001 * p.wobbleSpeed + p.phase) * p.wobbleAmp;
            const r = p.baseR + wobble;
            const a = p.angle + spin; // rotate the whole hole
            pts.push({
                x: Math.cos(a) * r,
                y: Math.sin(a) * r,
            });
        }
        return pts;
    }

    // Build canvas path from hole polygon with organic curves
    function traceHolePath(holePts) {
        ctx.beginPath();
        ctx.moveTo(holePts[0].x, holePts[0].y);
        for (let i = 1; i <= holePts.length; i++) {
            const cur = holePts[i % holePts.length];
            const prev = holePts[(i - 1) % holePts.length];
            const cpx = (prev.x + cur.x) / 2 + (Math.random() - 0.5) * 5;
            const cpy = (prev.y + cur.y) / 2 + (Math.random() - 0.5) * 5;
            ctx.quadraticCurveTo(cpx, cpy, cur.x, cur.y);
        }
        ctx.closePath();
    }

    // Draw orbiting 2D rocks
    function drawRocks(time) {
        if (mx < -999) return;
        const spin = time * SPIN_SPEED;
        ctx.save();
        ctx.translate(mx, my);

        for (const rock of rocks) {
            const orbitA = rock.orbitAngle + spin; // follow the hole rotation
            const bob = Math.sin(time * 0.001 * rock.bobSpeed + rock.bobPhase) * rock.bobAmp;
            const rx = Math.cos(orbitA) * rock.orbitR;
            const ry = Math.sin(orbitA) * rock.orbitR + bob;
            const selfRot = time * rock.rotSpeed + rock.rotPhase;

            ctx.save();
            ctx.translate(rx, ry);
            ctx.rotate(selfRot);

            // Draw irregular rock polygon
            ctx.beginPath();
            for (let v = 0; v < rock.numVerts; v++) {
                const va = rock.vertAngles[v];
                const vr = rock.size * rock.vertRadii[v];
                const vx = Math.cos(va) * vr;
                const vy = Math.sin(va) * vr;
                if (v === 0) ctx.moveTo(vx, vy);
                else ctx.lineTo(vx, vy);
            }
            ctx.closePath();

            // Dark rock fill with slight transparency
            ctx.fillStyle = 'rgba(60, 65, 75, 0.7)';
            ctx.fill();
            // Light edge highlight
            ctx.strokeStyle = 'rgba(140, 150, 165, 0.6)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            // Inner highlight on one side
            ctx.beginPath();
            const hlA = rock.vertAngles[0];
            const hlR = rock.size * rock.vertRadii[0] * 0.5;
            ctx.arc(Math.cos(hlA) * hlR * 0.3, Math.sin(hlA) * hlR * 0.3, rock.size * 0.25, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(180, 190, 200, 0.15)';
            ctx.fill();

            ctx.restore();
        }

        ctx.restore();
    }

    // Draw cracked glass around the hole — HEAVIER, MORE VISIBLE
    function drawCracks(time) {
        if (mx < -999) return;
        const spin = time * SPIN_SPEED;
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(spin); // cracks rotate with the hole

        // Radiating crack lines — STRONGER opacity + thickness
        for (const crack of cracks) {
            const segs = crack.segments;
            // Main crack — DARKER, more visible
            ctx.beginPath();
            ctx.moveTo(segs[0].dx, segs[0].dy);
            for (let s = 1; s < segs.length; s++) {
                ctx.lineTo(segs[s].dx, segs[s].dy);
            }
            ctx.strokeStyle = 'rgba(100, 110, 125, 0.75)';
            ctx.lineWidth = crack.width;
            ctx.stroke();

            // Dark shadow line behind crack (depth)
            ctx.beginPath();
            ctx.moveTo(segs[0].dx - 1, segs[0].dy + 1);
            for (let s = 1; s < segs.length; s++) {
                ctx.lineTo(segs[s].dx - 1, segs[s].dy + 1);
            }
            ctx.strokeStyle = 'rgba(30, 35, 45, 0.4)';
            ctx.lineWidth = crack.width * 0.6;
            ctx.stroke();

            // White refraction highlight
            ctx.beginPath();
            ctx.moveTo(segs[0].dx + 1.5, segs[0].dy - 0.5);
            for (let s = 1; s < segs.length; s++) {
                ctx.lineTo(segs[s].dx + 1.5, segs[s].dy - 0.5);
            }
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 0.6;
            ctx.stroke();

            // Branches — also stronger
            for (const br of crack.branches) {
                ctx.beginPath();
                ctx.moveTo(br[0].dx, br[0].dy);
                for (let b = 1; b < br.length; b++) ctx.lineTo(br[b].dx, br[b].dy);
                ctx.strokeStyle = 'rgba(100, 110, 125, 0.55)';
                ctx.lineWidth = 0.9;
                ctx.stroke();
                // Branch highlight
                ctx.beginPath();
                ctx.moveTo(br[0].dx + 1, br[0].dy - 0.5);
                for (let b = 1; b < br.length; b++) ctx.lineTo(br[b].dx + 1, br[b].dy - 0.5);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 0.4;
                ctx.stroke();
            }
        }

        // Concentric spider web rings — more visible
        for (let ring = 0; ring < 5; ring++) {
            const ringR = BASE_R * (1.1 + ring * 0.35); // start outside hole
            ctx.beginPath();
            const ringSteps = 70;
            for (let a = 0; a <= ringSteps; a++) {
                const angle = (a / ringSteps) * Math.PI * 2;
                const jit = (Math.sin(angle * 7 + ring * 2.3) * 5) + (Math.sin(time * 0.0005 + angle * 3) * 2.5);
                const px = Math.cos(angle) * (ringR + jit);
                const py = Math.sin(angle) * (ringR + jit);
                if (a === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.strokeStyle = `rgba(120, 130, 145, ${0.45 - ring * 0.07})`;
            ctx.lineWidth = 1.4 - ring * 0.2;
            ctx.stroke();
        }

        // Glass shard fragments near hole edge
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2 + Math.sin(time * 0.0003 + i) * 0.15;
            const r = BASE_R * (1.08 + Math.sin(i * 1.7) * 0.15); // outside hole
            const cx = Math.cos(a) * r;
            const cy = Math.sin(a) * r;
            const sz = 5 + (i % 4) * 4;
            ctx.beginPath();
            ctx.moveTo(cx - sz * 0.5, cy - sz * 0.3);
            ctx.lineTo(cx + sz * 0.5, cy - sz * 0.15);
            ctx.lineTo(cx + sz * 0.2, cy + sz * 0.45);
            ctx.lineTo(cx - sz * 0.3, cy + sz * 0.3);
            ctx.closePath();
            ctx.fillStyle = `rgba(200, 210, 225, ${0.08 + Math.sin(time * 0.002 + i) * 0.04})`;
            ctx.fill();
            ctx.strokeStyle = 'rgba(180, 190, 210, 0.3)';
            ctx.lineWidth = 0.6;
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
        if (t - last < 33) return;
        last = t;

        const W = canvas.width, H = canvas.height;

        // Clear to white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);

        if (mx > -999) {
            // Get animated + rotating jagged hole shape
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
            ctx.strokeStyle = 'rgba(200, 210, 220, 0.7)';
            ctx.lineWidth = 3;
            ctx.shadowColor = 'rgba(200, 220, 255, 0.5)';
            ctx.shadowBlur = 15;
            ctx.stroke();
            ctx.restore();

            // Draw radiating cracks + spider web rings (rotate with hole)
            drawCracks(t);

            // Draw orbiting rocks (follow rotation + bob up/down)
            drawRocks(t);
        } else {
            // Update cells when mouse off screen
            for (let c = 0; c < cols; c++) {
                for (let r = 0; r < rows; r++) {
                    const cell = cells[c][r];
                    cell.yOff += cell.speed;
                    if (cell.yOff >= GAP_Y) { cell.yOff -= GAP_Y; cell.ch = SYMBOLS[Math.random() * SYMBOLS.length | 0]; }
                    if (Math.random() < MORPH_CHANCE) cell.ch = SYMBOLS[Math.random() * SYMBOLS.length | 0];
                }
            }
        }

        // Dark shady edge vignette
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
