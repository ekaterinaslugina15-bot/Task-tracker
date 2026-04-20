        function toggleFaq(element) {
            const item = element.parentElement;
            item.classList.toggle('active');
            const arrow = element.querySelector('span');
            arrow.innerHTML = item.classList.contains('active') ? '▲' : '▼';
        }
      