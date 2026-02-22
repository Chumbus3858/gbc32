// ============ PERFORMANCE: THROTTLED TV STATIC ============
// Renders at low-res then CSS scales up — 10fps instead of 60
function createStaticCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    // Render at 1/4 resolution for performance
    const SCALE = 4;
    let w = 0, h = 0;
    let imageData = null;

    function resize() {
        w = Math.ceil(canvas.offsetWidth / SCALE);
        h = Math.ceil(canvas.offsetHeight / SCALE);
        canvas.width = w;
        canvas.height = h;
        imageData = ctx.createImageData(w, h);
    }
    resize();
    window.addEventListener('resize', resize);

    let lastFrame = 0;
    function drawStatic(time) {
        requestAnimationFrame(drawStatic);
        if (time - lastFrame < 100) return; // 10fps cap
        lastFrame = time;
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 16) { // Skip pixels for speed
            const v = (Math.random() * 255) | 0;
            data[i] = v; data[i+1] = v; data[i+2] = v; data[i+3] = 255;
            // Fill 4 pixels at once
            if (i+4 < data.length) { data[i+4] = v; data[i+5] = v; data[i+6] = v; data[i+7] = 255; }
            if (i+8 < data.length) { data[i+8] = v; data[i+9] = v; data[i+10] = v; data[i+11] = 255; }
            if (i+12 < data.length) { data[i+12] = v; data[i+13] = v; data[i+14] = v; data[i+15] = 255; }
        }
        ctx.putImageData(imageData, 0, 0);
    }
    requestAnimationFrame(drawStatic);
}

createStaticCanvas('loaderStatic');
createStaticCanvas('heroStatic');
createStaticCanvas('portfolioStatic');

// ============ OPTIMIZED CODE RAIN — 20fps ============
function createCodeRain(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = canvas.offsetWidth / 2; // Half-res
        canvas.height = canvas.offsetHeight / 2;
    }
    resize();
    window.addEventListener('resize', resize);

    const chars = 'ローカル関数戻り値真偽01{}()=<>+-*/ABCDEFlocal function return if then end';
    const fontSize = 10;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(0).map(() => Math.random() * -20 | 0);

    let lastFrame = 0;
    function draw(time) {
        requestAnimationFrame(draw);
        if (time - lastFrame < 50) return; // 20fps cap
        lastFrame = time;

        ctx.fillStyle = 'rgba(6, 6, 8, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
            const char = chars[(Math.random() * chars.length) | 0];
            const x = i * fontSize;
            const y = drops[i] * fontSize;

            // Brighter at head, dimmer trail
            const brightness = Math.random();
            if (brightness > 0.92) {
                ctx.fillStyle = '#00ffcc'; // Bright cyan head
                ctx.globalAlpha = 0.6;
            } else {
                ctx.fillStyle = '#ff4d00';
                ctx.globalAlpha = 0.12 + Math.random() * 0.12;
            }
            ctx.fillText(char, x, y);

            if (y > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
        ctx.globalAlpha = 1;
    }
    requestAnimationFrame(draw);
}

createCodeRain('codeRain');
createCodeRain('codeRain2');

// ============ CURSOR GLOW (throttled) ============
const cursorGlow = document.getElementById('cursorGlow');
if (cursorGlow) {
    let mx = 0, my = 0, cx = 0, cy = 0;
    document.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    // Smooth follow at 60fps via rAF instead of per-mousemove
    (function followCursor() {
        cx += (mx - cx) * 0.15;
        cy += (my - cy) * 0.15;
        cursorGlow.style.transform = `translate(${cx - 200}px, ${cy - 200}px)`;
        requestAnimationFrame(followCursor);
    })();
}

// ============ CARD GLOW + TILT + CRACKS ============
const glowColors = ['#ff4d00','#00ffcc','#a855f7','#3b82f6','#22c55e','#ef4444','#eab308','#ff00ff','#00ff88'];

document.querySelectorAll('.bento-card').forEach(card => {
    const crackOverlay = card.querySelector('.card-crack');

    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--glow-x', x + '%');
        card.style.setProperty('--glow-y', y + '%');
        card.style.setProperty('--crack-x', x + '%');
        card.style.setProperty('--crack-y', y + '%');

        const tiltX = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
        const tiltY = ((e.clientY - rect.top) / rect.height - 0.5) * -8;
        card.style.transform = `perspective(800px) rotateY(${tiltX}deg) rotateX(${tiltY}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
});

// ============ CARD BUTTON EFFECTS — COIN FLIP + RANDOM GLOW ============
document.querySelectorAll('.card-btn').forEach(btn => {
    let flipTimeout = null;

    btn.addEventListener('mouseenter', () => {
        // Start coin flip
        btn.classList.add('coin-flipping');
        // Random glow color cycle
        const interval = setInterval(() => {
            const color = glowColors[(Math.random() * glowColors.length) | 0];
            btn.style.setProperty('--btn-glow', color);
            btn.style.borderColor = color;
            btn.style.boxShadow = `0 0 20px ${color}, 0 0 40px ${color}44, inset 0 0 15px ${color}22`;
        }, 200);

        flipTimeout = setTimeout(() => {
            btn.classList.remove('coin-flipping');
            clearInterval(interval);
            btn.style.borderColor = '';
            btn.style.boxShadow = '';
        }, 5000);

        btn._glowInterval = interval;
    });

    btn.addEventListener('mouseleave', () => {
        btn.classList.remove('coin-flipping');
        if (flipTimeout) clearTimeout(flipTimeout);
        if (btn._glowInterval) clearInterval(btn._glowInterval);
        btn.style.borderColor = '';
        btn.style.boxShadow = '';
        btn.style.setProperty('--btn-glow', '');
    });
});

// ============ CTA BUTTON ENHANCED — GLINT SWEEP ============
const ctaBtn = document.querySelector('.cta-btn');
if (ctaBtn) {
    // Continuous glint
    setInterval(() => {
        ctaBtn.classList.remove('glint-sweep');
        void ctaBtn.offsetWidth; // Force reflow
        ctaBtn.classList.add('glint-sweep');
    }, 3000);
}

// ============ LOADING SCREEN ============
const loader = document.getElementById('loader');
const loaderPercent = document.getElementById('loaderPercent');
const loaderFill = document.getElementById('loaderFill');
const loaderText = document.getElementById('loaderText');
const nav = document.getElementById('nav');

const loadMessages = [
    'Initializing...',
    'Loading modules...',
    'Compiling scripts...',
    'Rendering UI...',
    'Connecting services...',
    'Deploying...',
    'Ready.'
];

let progress = 0;
let msgIndex = 0;
const loadInterval = setInterval(() => {
    progress += Math.random() * 12 + 3;
    if (progress >= 100) {
        progress = 100;
        clearInterval(loadInterval);
        if (loaderText) loaderText.textContent = 'Ready.';
        setTimeout(() => {
            loader.classList.add('done');
            nav.classList.add('visible');
        }, 400);
    }
    const newMsgIndex = Math.min(Math.floor((progress / 100) * loadMessages.length), loadMessages.length - 1);
    if (newMsgIndex !== msgIndex) {
        msgIndex = newMsgIndex;
        if (loaderText) loaderText.textContent = loadMessages[msgIndex];
    }
    loaderPercent.textContent = Math.floor(progress) + '%';
    loaderFill.style.width = progress + '%';
}, 80);

// ============ TERMINAL TYPING ============
const terminalEl = document.getElementById('terminalText');
const commands = [
    'cat skills.lua',
    'roblox-studio --deploy',
    'luau compile --strict --native',
    'git push origin main',
    'echo "Available for hire"',
    'npm run build && ship',
    'test --combat --vfx --ui'
];
let cmdIdx = 0, charIdx = 0, isDeleting = false;

function typeCommand() {
    if (!terminalEl) return;
    const current = commands[cmdIdx];
    if (!isDeleting) {
        terminalEl.textContent = current.substring(0, charIdx);
        charIdx++;
        if (charIdx > current.length) {
            isDeleting = true;
            setTimeout(typeCommand, 2000);
            return;
        }
        setTimeout(typeCommand, 50 + Math.random() * 50);
    } else {
        terminalEl.textContent = current.substring(0, charIdx);
        charIdx--;
        if (charIdx < 0) {
            isDeleting = false;
            charIdx = 0;
            cmdIdx = (cmdIdx + 1) % commands.length;
            setTimeout(typeCommand, 300);
            return;
        }
        setTimeout(typeCommand, 25);
    }
}
setTimeout(typeCommand, 1200);

// ============ NAV SCROLL (single passive listener) ============
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(() => {
            const y = window.scrollY;
            nav.classList.toggle('scrolled', y > 80);

            // Parallax hero (GPU-accelerated)
            const hero = document.querySelector('.hero-content');
            if (hero) {
                hero.style.transform = `translate3d(0, ${y * 0.12}px, 0)`;
                hero.style.opacity = Math.max(0, 1 - y / 800);
            }
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
        if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), i * 80);
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ============ ACTIVE NAV ============
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            document.querySelectorAll('.nav-links a').forEach(link => {
                link.style.color = '';
                link.style.textShadow = '';
                if (link.getAttribute('href') === '#' + id) {
                    link.style.color = '#ff4d00';
                    link.style.textShadow = '0 0 20px rgba(255, 77, 0, 0.4)';
                }
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
