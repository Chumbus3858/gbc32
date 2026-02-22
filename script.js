// ============ CURSOR GLOW ============
const cursorGlow = document.getElementById('cursorGlow');
let mouseX = 0, mouseY = 0;
let glowX = 0, glowY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function animateGlow() {
    glowX += (mouseX - glowX) * 0.12;
    glowY += (mouseY - glowY) * 0.12;
    cursorGlow.style.left = glowX + 'px';
    cursorGlow.style.top = glowY + 'px';
    requestAnimationFrame(animateGlow);
}
animateGlow();

// Hide glow when mouse leaves window
document.addEventListener('mouseleave', () => {
    cursorGlow.style.opacity = '0';
});
document.addEventListener('mouseenter', () => {
    cursorGlow.style.opacity = '1';
});

// ============ SCROLL REVEAL ============
const revealElements = document.querySelectorAll(
    '.project-card, .service-card, .section-header, .stat, .contact-text, .contact-link, .contact-availability'
);

revealElements.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));

// Stagger service cards and project cards
document.querySelectorAll('.services-grid .service-card').forEach((card, i) => {
    card.style.transitionDelay = (i * 0.08) + 's';
});
document.querySelectorAll('.projects-grid .project-card').forEach((card, i) => {
    card.style.transitionDelay = (i * 0.1) + 's';
});

// ============ NAV SCROLL EFFECT ============
const nav = document.querySelector('.nav');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    if (currentScroll > 100) {
        nav.style.background = 'rgba(6, 6, 10, 0.95)';
        nav.style.padding = '16px 48px';
    } else {
        nav.style.background = 'rgba(6, 6, 10, 0.8)';
        nav.style.padding = '24px 48px';
    }

    lastScroll = currentScroll;
}, { passive: true });

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
                    link.style.color = '#ff1a1a';
                }
            });
        }
    });
}, {
    threshold: 0.3
});

sections.forEach(section => sectionObserver.observe(section));

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

// ============ STAT COUNTER ANIMATION ============
const statNumbers = document.querySelectorAll('.stat-number');
let statsCounted = false;

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !statsCounted) {
            statsCounted = true;
            statNumbers.forEach(stat => {
                const text = stat.textContent;
                const num = parseInt(text.replace(/[^0-9]/g, ''));
                const suffix = text.replace(/[0-9,]/g, '');
                if (isNaN(num)) return;

                let current = 0;
                const step = Math.max(1, Math.floor(num / 40));
                const interval = setInterval(() => {
                    current += step;
                    if (current >= num) {
                        current = num;
                        clearInterval(interval);
                    }
                    stat.textContent = current.toLocaleString() + suffix;
                }, 25);
            });
        }
    });
}, { threshold: 0.5 });

const statsBanner = document.querySelector('.stats-banner');
if (statsBanner) statsObserver.observe(statsBanner);

// ============ PROJECT CARD TILT ============
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `translateY(-4px) perspective(600px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
});

// ============ MAGNETIC BUTTONS ============
document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translateY(-2px) translate(${x * 0.15}px, ${y * 0.15}px)`;
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
    });
});
