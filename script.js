(function () {
	const searchInput = document.getElementById('searchInput');
	const results = document.getElementById('results');
	const mainHeading = document.getElementById('mainHeading');
	const notifyButton = document.getElementById('notifyButton');

	let currentTerm = '';

	function setButtonDefault(term) {
		notifyButton.textContent = term
			? `Notify Me About ${term} Offers`
			: 'Notify Me';
		notifyButton.classList.remove('is-set');
		notifyButton.disabled = false;
	}

	function setButtonAlertSet() {
		notifyButton.textContent = 'Alert Set!';
		notifyButton.classList.add('is-set');
		notifyButton.disabled = true;
	}

	function showResultsForTerm(term) {
		currentTerm = term;
		mainHeading.textContent = `No active offers for '${term}' right now.`;
		setButtonDefault(term);
		results.classList.add('visible');
	}

	// Handle Enter key on search
	searchInput.addEventListener('keydown', function (event) {
		if (event.key === 'Enter') {
			const value = searchInput.value.trim();
			if (value.length === 0) return;
			event.preventDefault();
			showResultsForTerm(value);
		}
	});

	// Click handler for notify
	notifyButton.addEventListener('click', function () {
		if (notifyButton.disabled) return;
		setButtonAlertSet();
	});
})(); 