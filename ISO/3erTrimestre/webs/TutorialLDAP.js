(function() {
    const searchInput = document.getElementById('searchInput');
    const searchInfo = document.getElementById('searchInfo');
    const cards = document.querySelectorAll('.phase-card');
    let originalContents = [];

    cards.forEach(card => {
        originalContents.push(card.innerHTML);
    });

    function restoreAll() {
        cards.forEach((card, idx) => {
            card.innerHTML = originalContents[idx];
            card.style.display = 'block';
        });
    }

    function highlightAndFilter() {
        const term = searchInput.value.trim().toLowerCase();
        if (term === "") {
            restoreAll();
            searchInfo.innerText = "[i] Búsqueda despejada — mostrando todas las secciones";
            return;
        }

        let matches = 0;
        cards.forEach((card, idx) => {
            const original = originalContents[idx];
            const textMatch = original.toLowerCase().includes(term);
            if (textMatch) {
                matches++;
                let highlighted = original;
                const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                highlighted = highlighted.replace(regex, `<span class="highlight">$1</span>`);
                card.innerHTML = highlighted;
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });

        if (matches === 0) {
            searchInfo.innerText = `[x] No se encontró "${term}" — prueba con: munge, autofs, slurm.conf, particion, ldap, nfs`;
            cards.forEach(c => c.style.display = 'none');
        } else {
            searchInfo.innerText = `[#] ${matches} sección(es) coinciden con "${term}"`;
        }
    }

    searchInput.addEventListener('input', highlightAndFilter);
})();