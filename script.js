(function () {
	// Tabs
	const tabs = document.querySelectorAll('.tab');
	const views = document.querySelectorAll('.view');

	function activateTab(name) {
		tabs.forEach((t) => {
			const target = t.getAttribute('data-tab');
			const isActive = target === name;
			t.classList.toggle('is-active', isActive);
			t.setAttribute('aria-selected', isActive ? 'true' : 'false');
		});
		views.forEach((v) => {
			v.classList.toggle('is-active', v.id === `view-${name}`);
		});
	}

	tabs.forEach((tab) => {
		tab.addEventListener('click', () => {
			const target = tab.getAttribute('data-tab');
			activateTab(target);
		});
	});

	// Landing CTA
	const ctaStart = document.getElementById('cta-start');
	if (ctaStart) {
		ctaStart.addEventListener('click', () => activateTab('applications'));
	}
	document.querySelectorAll('[data-tab-jump]')?.forEach((btn) => {
		btn.addEventListener('click', () => activateTab(btn.getAttribute('data-tab-jump')));
	});

	// Storage helpers
	function getItems(key) {
		try {
			return JSON.parse(localStorage.getItem(key) || '[]');
		} catch (_) {
			return [];
		}
	}
	function setItems(key, items) {
		localStorage.setItem(key, JSON.stringify(items));
	}

	// Applications
	const appForm = document.getElementById('form-application');
	const appListEl = document.getElementById('applications-list');
	let apps = getItems('apps');

	function renderApps() {
		appListEl.innerHTML = '';
		if (apps.length === 0) {
			appListEl.innerHTML = '<div class="hint">No applications yet.</div>';
			return;
		}
		apps.forEach((a, idx) => {
			const el = document.createElement('div');
			el.className = 'card';
			el.innerHTML = `
				<h3 class="card-title">${escapeHtml(a.title)} <span class="badge">${escapeHtml(a.type)}</span></h3>
				<div class="card-meta">Status: <strong>${escapeHtml(a.status)}</strong></div>
				${a.notes ? `<div>${escapeHtml(a.notes)}</div>` : ''}
				<div class="card-actions">
					<button class="btn" data-action="advance">Advance Status</button>
					<button class="btn" data-action="delete">Delete</button>
				</div>
			`;
			el.addEventListener('click', (e) => {
				const action = e.target.getAttribute('data-action');
				if (!action) return;
				if (action === 'delete') {
					apps.splice(idx, 1);
					setItems('apps', apps);
					renderApps();
				}
				if (action === 'advance') {
					const order = ['Draft', 'Submitted', 'In Review', 'Approved'];
					const current = order.indexOf(a.status);
					const next = current < order.length - 1 ? order[current + 1] : 'Approved';
					apps[idx].status = next;
					setItems('apps', apps);
					renderApps();
				}
			});
			appListEl.appendChild(el);
		});
	}

	appForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const type = document.getElementById('app-type').value.trim();
		const title = document.getElementById('app-title').value.trim();
		const status = document.getElementById('app-status').value;
		const notes = document.getElementById('app-notes').value.trim();
		if (!title || !type) return;
		apps.push({ type, title, status, notes, createdAt: Date.now() });
		setItems('apps', apps);
		appForm.reset();
		renderApps();
	});

	// Reminders
	const remForm = document.getElementById('form-reminder');
	const remListEl = document.getElementById('reminders-list');
	let reminders = getItems('reminders');

	function renderReminders() {
		remListEl.innerHTML = '';
		if (reminders.length === 0) {
			remListEl.innerHTML = '<div class="hint">No reminders yet.</div>';
			return;
		}
		reminders
			.sort((a,b) => a.when - b.when)
			.forEach((r, idx) => {
				const el = document.createElement('div');
				el.className = 'card';
				const whenStr = new Date(r.when).toLocaleString();
				el.innerHTML = `
					<h3 class="card-title">${escapeHtml(r.title)}</h3>
					<div class="card-meta">Due: <strong>${whenStr}</strong></div>
					<div class="card-actions">
						<button class="btn" data-action="delete">Delete</button>
					</div>
				`;
				el.addEventListener('click', (e) => {
					const action = e.target.getAttribute('data-action');
					if (action === 'delete') {
						reminders.splice(idx, 1);
						setItems('reminders', reminders);
						renderReminders();
					}
				});
				remListEl.appendChild(el);
			});
	}

	remForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const title = document.getElementById('rem-title').value.trim();
		const when = new Date(document.getElementById('rem-datetime').value).getTime();
		if (!title || !when || Number.isNaN(when)) return;
		reminders.push({ title, when });
		setItems('reminders', reminders);
		remForm.reset();
		renderReminders();
	});

	// Basic reminder ticker (while page open)
	if (Notification && Notification.permission !== 'denied') {
		Notification.requestPermission().catch(() => {});
	}
	setInterval(() => {
		const now = Date.now();
		const due = reminders.filter(r => r.when <= now);
		if (due.length > 0) {
			due.forEach(r => {
				try { new Notification('Reminder', { body: r.title }); } catch (_) {}
			});
			reminders = reminders.filter(r => r.when > now);
			setItems('reminders', reminders);
			renderReminders();
		}
	}, 15000);

	// Community posts
	const postForm = document.getElementById('form-post');
	const postsListEl = document.getElementById('posts-list');
	let posts = getItems('posts');

	function renderPosts() {
		postsListEl.innerHTML = '';
		if (posts.length === 0) {
			postsListEl.innerHTML = '<div class="hint">No posts yet. Be the first to share.</div>';
			return;
		}
		posts.slice().reverse().forEach((p, idx) => {
			const el = document.createElement('div');
			el.className = 'card';
			const ts = new Date(p.createdAt).toLocaleString();
			el.innerHTML = `
				<h3 class="post-title">${escapeHtml(p.title || 'Untitled')}</h3>
				<div class="card-meta">${ts}</div>
				<div class="post-content">${escapeHtml(p.text)}</div>
				<div class="card-actions reactions">
					<button class="reaction-btn" data-action="like" aria-pressed="${p.liked ? 'true' : 'false'}">👍 ${p.likes || 0}</button>
					<button class="reaction-btn" data-action="dislike" aria-pressed="${p.disliked ? 'true' : 'false'}">👎 ${p.dislikes || 0}</button>
					<button class="btn" data-action="delete" data-index="${idx}">Delete</button>
				</div>
			`;
			el.addEventListener('click', (e) => {
				const action = e.target.getAttribute('data-action');
				if (!action) return;
				const originalIndex = posts.length - 1 - Number(el.querySelector('[data-index]')?.getAttribute('data-index') || idx);
				if (action === 'delete') {
					posts.splice(originalIndex, 1);
					setItems('posts', posts);
					renderPosts();
				}
				if (action === 'like') {
					const item = posts[originalIndex] || p;
					item.likes = (item.likes || 0) + (item.liked ? -1 : 1);
					item.liked = !item.liked;
					if (item.liked && item.disliked) { item.disliked = false; item.dislikes = Math.max(0, (item.dislikes || 0) - 1); }
					setItems('posts', posts);
					renderPosts();
				}
				if (action === 'dislike') {
					const item = posts[originalIndex] || p;
					item.dislikes = (item.dislikes || 0) + (item.disliked ? -1 : 1);
					item.disliked = !item.disliked;
					if (item.disliked && item.liked) { item.liked = false; item.likes = Math.max(0, (item.likes || 0) - 1); }
					setItems('posts', posts);
					renderPosts();
				}
			});
			postsListEl.appendChild(el);
		});
	}

	postForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const title = document.getElementById('post-title').value.trim();
		const text = document.getElementById('post-text').value.trim();
		if (!text) return;
		posts.push({ title, text, likes: 0, dislikes: 0, liked: false, disliked: false, createdAt: Date.now() });
		setItems('posts', posts);
		postForm.reset();
		renderPosts();
	});

	function escapeHtml(str) {
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	// Initial renders
	renderApps();
	renderReminders();
	renderPosts();
})(); 