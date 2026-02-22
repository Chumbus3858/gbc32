// ============ TV STATIC CANVAS ============
function createStaticCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function drawStatic() {
        const w = canvas.width;
        const h = canvas.height;
        const imageData = ctx.createImageData(w, h);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const v = Math.random() * 255;
            data[i] = v;
            data[i + 1] = v;
            data[i + 2] = v;
            data[i + 3] = 255;
        }
        ctx.putImageData(imageData, 0, 0);
        requestAnimationFrame(drawStatic);
    }
    drawStatic();
}

createStaticCanvas('loaderStatic');
createStaticCanvas('heroStatic');

// ============ CODE RAIN CANVAS ============
function createCodeRain(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const chars = 'local function end if then else return true false nil for in do while repeat until and or not table string math game workspace Players Lighting ReplicatedStorage ServerScriptService 01{}()=<>+-*/';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    function draw() {
        ctx.fillStyle = 'rgba(6, 6, 8, 0.06)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ff4d00';
        ctx.font = fontSize + 'px JetBrains Mono, monospace';

        for (let i = 0; i < drops.length; i++) {
            const char = chars[Math.floor(Math.random() * chars.length)];
            const x = i * fontSize;
            const y = drops[i] * fontSize;

            ctx.globalAlpha = 0.15 + Math.random() * 0.15;
            ctx.fillText(char, x, y);
            ctx.globalAlpha = 1;

            if (y > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
        requestAnimationFrame(draw);
    }
    draw();
}

createCodeRain('codeRain');
createCodeRain('codeRain2');

// ============ CURSOR GLOW ============
const cursorGlow = document.getElementById('cursorGlow');
if (cursorGlow) {
    document.addEventListener('mousemove', (e) => {
        cursorGlow.style.left = e.clientX + 'px';
        cursorGlow.style.top = e.clientY + 'px';
    });
}

// ============ CARD GLOW TRACKING ============
document.querySelectorAll('.bento-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--glow-x', x + '%');
        card.style.setProperty('--glow-y', y + '%');

        // Tilt
        const tiltX = ((e.clientX - rect.left) / rect.width - 0.5) * 6;
        const tiltY = ((e.clientY - rect.top) / rect.height - 0.5) * -6;
        card.style.transform = `perspective(800px) rotateY(${tiltX}deg) rotateX(${tiltY}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
});

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

// ============ TERMINAL TYPING ANIMATION ============
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
let cmdIndex = 0;
let charIndex = 0;
let deleting = false;

function typeCommand() {
    if (!terminalEl) return;
    const current = commands[cmdIndex];

    if (!deleting) {
        terminalEl.textContent = current.substring(0, charIndex);
        charIndex++;
        if (charIndex > current.length) {
            deleting = true;
            setTimeout(typeCommand, 2000);
            return;
        }
        setTimeout(typeCommand, 50 + Math.random() * 50);
    } else {
        terminalEl.textContent = current.substring(0, charIndex);
        charIndex--;
        if (charIndex < 0) {
            deleting = false;
            charIndex = 0;
            cmdIndex = (cmdIndex + 1) % commands.length;
            setTimeout(typeCommand, 300);
            return;
        }
        setTimeout(typeCommand, 25);
    }
}
setTimeout(typeCommand, 1200);

// ============ NAV SCROLL EFFECT ============
window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 80) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
}, { passive: true });

// ============ SMOOTH SCROLL ============
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const href = anchor.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ============ SCROLL REVEAL WITH STAGGER ============
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, i * 100);
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));

// ============ ACTIVE NAV LINK ============
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach(link => {
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

sections.forEach(section => sectionObserver.observe(section));

// ============ PARALLAX ON SCROLL ============
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const hero = document.querySelector('.hero-content');
    if (hero) {
        hero.style.transform = `translateY(${scrollY * 0.15}px)`;
        hero.style.opacity = Math.max(0, 1 - scrollY / 800);
    }
}, { passive: true });

// ============ MAGNETIC BUTTONS ============
document.querySelectorAll('.card-btn, .cta-btn, .contact-card').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
    });
});

// ============ TAG HOVER RIPPLE ============
document.querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('mouseenter', () => {
        tag.style.transform = 'translateY(-2px) scale(1.05)';
    });
    tag.addEventListener('mouseleave', () => {
        tag.style.transform = '';
    });
});

// ============ STAT COUNTER ANIMATION ============
const statValues = document.querySelectorAll('.stat-value');
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
                if (current >= num) {
                    current = num;
                    clearInterval(interval);
                }
                let display = hasComma ? current.toLocaleString() : current.toString();
                el.textContent = display + suffix;
            }, 30);
            statObserver.unobserve(el);
        }
    });
}, { threshold: 0.5 });

statValues.forEach(el => statObserver.observe(el));
