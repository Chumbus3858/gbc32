// ============ LOADING SCREEN ============
const loader = document.getElementById('loader');
const loaderPercent = document.getElementById('loaderPercent');
const loaderFill = document.getElementById('loaderFill');
const nav = document.getElementById('nav');

let progress = 0;
const loadInterval = setInterval(() => {
    progress += Math.random() * 12 + 3;
    if (progress >= 100) {
        progress = 100;
        clearInterval(loadInterval);
        setTimeout(() => {
            loader.classList.add('done');
            nav.classList.add('visible');
        }, 300);
    }
    loaderPercent.textContent = Math.floor(progress) + '%';
    loaderFill.style.width = progress + '%';
}, 80);

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
