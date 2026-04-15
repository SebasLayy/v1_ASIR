// === BARRA DE BUSQUEDA ===
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('searchClear');
const cards = document.querySelectorAll('.card');

function filterCards() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    let anyVisible = false;
    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        if (searchTerm === '' || text.includes(searchTerm)) {
            card.classList.remove('hidden');
            anyVisible = true;
        } else {
            card.classList.add('hidden');
        }
    });
    // Opcional: mostrar mensaje si no hay resultados
    let noResultMsg = document.getElementById('noResultMsg');
    if (!anyVisible && searchTerm !== '') {
        if (!noResultMsg) {
            noResultMsg = document.createElement('div');
            noResultMsg.id = 'noResultMsg';
            noResultMsg.className = 'card';
            noResultMsg.innerHTML = '<p># No se encontraron resultados para tu busqueda. Intenta con otras palabras como "OSPF", "VLAN", "NAT".</p>';
            document.getElementById('contentContainer').appendChild(noResultMsg);
        }
    } else if (noResultMsg) {
        noResultMsg.remove();
    }
}

searchInput.addEventListener('input', filterCards);
clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    filterCards();
});

// === EASTER EGG WWE (Stone Cold Steve Austin) ===
const trigger = document.getElementById('easterEggTrigger');
const modal = document.getElementById('easterEggModal');
const closeModalSpan = document.querySelector('.close-modal');

function showEasterEgg() {
    modal.style.display = 'flex';
    // Opcional: reproducir sonido de cristales rotos (comentado por politicas de autoplay)
    // const audio = new Audio('https://www.soundjay.com/misc/sounds/glass-breaking-03.mp3');
    // audio.play().catch(e => console.log("Audio no reproducido automaticamente"));
}

function hideModal() {
    modal.style.display = 'none';
}

trigger.addEventListener('click', showEasterEgg);
closeModalSpan.addEventListener('click', hideModal);
window.addEventListener('click', (e) => {
    if (e.target === modal) hideModal();
});

// Pequeño detalle: tambien se puede activar con tecla 'C' tres veces (bonus)
let cPressCount = 0;
let cTimeout;
document.addEventListener('keydown', (e) => {
    if (e.key === 'c' || e.key === 'C') {
        clearTimeout(cTimeout);
        cPressCount++;
        if (cPressCount === 3) {
            showEasterEgg();
            cPressCount = 0;
        }
        cTimeout = setTimeout(() => { cPressCount = 0; }, 800);
    }
});