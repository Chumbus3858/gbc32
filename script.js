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

// ============ VIBRANT MULTI-COLOR CODE RAIN ============
function createCodeRain(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = canvas.offsetWidth / 2;
        canvas.height = canvas.offsetHeight / 2;
    }
    resize();
    window.addEventListener('resize', resize);

    const chars = 'ローカル関数戻値真偽01{}()=<>+-*/ABCDEFGHIJKLlocal function return if then end while';
    const headColors = ['#ffffff','#00ffcc','#39ff14','#ff4d00','#a855f7','#eab308'];
    const trailColors = ['#00ff41','#00ffcc','#39ff14','#00ff88','#66ff33','#a855f7','#3b82f6'];
    const fontSize = 10;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(0).map(() => Math.random() * -20 | 0);
    // Give each column a color
    const colColors = Array(columns).fill(0).map(() => trailColors[(Math.random() * trailColors.length) | 0]);

    let lastFrame = 0;
    function draw(time) {
        requestAnimationFrame(draw);
        if (time - lastFrame < 50) return;
        lastFrame = time;

        ctx.fillStyle = 'rgba(6, 6, 8, 0.06)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
            const char = chars[(Math.random() * chars.length) | 0];
            const x = i * fontSize;
            const y = drops[i] * fontSize;
            const r = Math.random();

            if (r > 0.92) {
                // Bright head flash
                ctx.fillStyle = headColors[(Math.random() * headColors.length) | 0];
                ctx.globalAlpha = 0.7 + Math.random() * 0.3;
            } else {
                ctx.fillStyle = colColors[i];
                ctx.globalAlpha = 0.06 + Math.random() * 0.18;
            }
            ctx.fillText(char, x, y);

            if (y > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
                colColors[i] = trailColors[(Math.random() * trailColors.length) | 0];
            }
            drops[i]++;
        }
        ctx.globalAlpha = 1;
    }
    requestAnimationFrame(draw);
}

createCodeRain('codeRain');
createCodeRain('codeRain2');
createCodeRain('ctaRain');

// ============ CARD 3D TILT ON HOVER (no glow/crack lines) ============
document.querySelectorAll('.bento-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const tiltX = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
        const tiltY = ((e.clientY - rect.top) / rect.height - 0.5) * -8;
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
