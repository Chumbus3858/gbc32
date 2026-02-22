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
    'luau compile --strict',
    'git push origin main',
    'npm run build',
    'echo "Available for hire"'
];
let cmdIndex = 0;
let charIndex = 0;
let deleting = false;
let typeTimeout;

function typeCommand() {
    if (!terminalEl) return;
    const current = commands[cmdIndex];

    if (!deleting) {
        terminalEl.textContent = current.substring(0, charIndex);
        charIndex++;
        if (charIndex > current.length) {
            deleting = true;
            typeTimeout = setTimeout(typeCommand, 2000);
            return;
        }
        typeTimeout = setTimeout(typeCommand, 60 + Math.random() * 40);
    } else {
        terminalEl.textContent = current.substring(0, charIndex);
        charIndex--;
        if (charIndex < 0) {
            deleting = false;
            charIndex = 0;
            cmdIndex = (cmdIndex + 1) % commands.length;
            typeTimeout = setTimeout(typeCommand, 400);
            return;
        }
        typeTimeout = setTimeout(typeCommand, 30);
    }
}

setTimeout(typeCommand, 1200);

// ============ NAV SCROLL EFFECT ============
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 80) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
    lastScroll = y;
}, { passive: true });

// ============ SMOOTH SCROLL ============
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ============ SCROLL REVEAL ============
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
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
                if (link.getAttribute('href') === '#' + id) {
                    link.style.color = '#ff4d00';
                }
            });
        }
    });
}, { threshold: 0.3 });

sections.forEach(section => sectionObserver.observe(section));

// ============ CARD HOVER TILT ============
document.querySelectorAll('.bento-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(800px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
});
