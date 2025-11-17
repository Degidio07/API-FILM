import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { OmdbService } from './app/services/omdb.service';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

document.addEventListener('DOMContentLoaded', () => {
	const form = document.getElementById('search-form') as HTMLFormElement | null;
	const input = document.getElementById('q') as HTMLInputElement | null;
	const results = document.getElementById('results') as HTMLElement | null;
	const details = document.getElementById('details') as HTMLElement | null;

	function renderSearchResults(data: any) {
		if (!results) return;
		results.innerHTML = '';
		const list = document.createElement('ul');
		(data.Search || []).forEach((item: any) => {
			const li = document.createElement('li');
			li.textContent = `${item.Title} (${item.Year})`;
			li.style.cursor = 'pointer';
			li.addEventListener('click', async () => {
				try {
					if (details) details.textContent = 'Caricamento...';
					const d = await OmdbService.getById(item.imdbID);
					renderDetails(d);
				} catch (err: any) {
					if (details) details.textContent = err.message || 'Errore';
				}
			});
			list.appendChild(li);
		});
		results.appendChild(list);
	}

	function renderDetails(d: any) {
		if (!details) return;
		details.innerHTML = `
			<h2>${d.Title} (${d.Year})</h2>
			<p><strong>Genere:</strong> ${d.Genre}</p>
			<p><strong>Regista:</strong> ${d.Director}</p>
			<p><strong>Trama:</strong> ${d.Plot}</p>
			${d.Poster && d.Poster !== 'N/A' ? `<img src="${d.Poster}" alt="Poster" style="max-width:200px">` : ''}
		`;
	}

	if (form && input) {
		form.addEventListener('submit', async (e) => {
			e.preventDefault();
			if (!input.value) return;
			if (results) results.textContent = 'Ricerca in corso...';
			try {
				const data = await OmdbService.searchByTitle(input.value);
				renderSearchResults(data);
				if (details) details.textContent = '';
			} catch (err: any) {
				if (results) results.textContent = err.message || 'Errore nella ricerca';
			}
		});
	}
});

const searchForm = document.getElementById("searchForm") as HTMLFormElement | null;
const searchInput = document.getElementById("searchInput") as HTMLInputElement | null;
const moviesGrid = document.getElementById("moviesGrid") as HTMLElement | null;
const loading = document.getElementById("loading") as HTMLElement | null;
const errorBox = document.getElementById("error") as HTMLElement | null;
const genreFilter = document.getElementById("genreFilter") as HTMLSelectElement | null;
const scrollTopBtn = document.getElementById("scrollTopBtn") as HTMLElement | null;

let movies: any[] = [];

function showLoading(show: boolean) {
	if (loading) loading.classList.toggle('hidden', !show);
}

function showError(msg?: string) {
	if (!errorBox) return;
	if (msg) {
		errorBox.textContent = msg;
		errorBox.classList.remove('hidden');
	} else {
		errorBox.classList.add('hidden');
	}
}

function escapeHtml(s: any): string {
	if (s === null || s === undefined) return '';
	return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}

searchForm?.addEventListener("submit", async (e) => {
	e.preventDefault();
	const query = searchInput?.value.trim() || '';
	if (!query) return;
	await fetchMovies(query);
});

genreFilter?.addEventListener("change", () => renderMovies());

async function fetchMovies(query: string) {
	showError();
	showLoading(true);
	if (moviesGrid) moviesGrid.innerHTML = "";
	try {
		const data = await OmdbService.searchByTitle(query);
		console.log('search response', data);
		const ids = (data.Search || []).map((s: any) => s.imdbID);
		const full = await Promise.all(ids.map((id: string) => OmdbService.getById(id).catch((e: any) => {
			console.error('detail error for', id, e);
			return null;
		})));
		movies = full.filter(Boolean);
		fillGenreFilter();
		renderMovies();
		if (movies.length === 0) showError('Nessun dettaglio disponibile per i risultati.');
	} catch (err: any) {
		console.error(err);
		showError(err?.message || 'Errore nella ricerca');
	} finally {
		showLoading(false);
	}
}

async function loadPopularMovies() {
	showLoading(true);
	showError();
	try {
		movies = await OmdbService.getPopular();
		console.log('Popular movies loaded:', movies.length);
		fillGenreFilter();
		renderMovies();
		if (movies.length === 0) showError('Nessun film disponibile');
	} catch (err: any) {
		console.error('Error loading popular movies:', err);
		showError(err?.message || 'Errore nel caricamento film');
	} finally {
		showLoading(false);
	}
}

function fillGenreFilter() {
	if (!genreFilter) return;
	const set = new Set<string>();
	movies.forEach((m) => m?.Genre?.split(', ').forEach((g: string) => set.add(g)));
	genreFilter.innerHTML = '<option value="">🎭 Tutti i generi</option>';
	[...set].sort().forEach((g) => {
		const opt = document.createElement('option');
		opt.value = g;
		opt.textContent = g;
		genreFilter.appendChild(opt);
	});
}

function renderMovies() {
	if (!moviesGrid) return;
	const filter = genreFilter?.value || '';
	const filtered = filter ? movies.filter((m) => m?.Genre?.includes(filter)) : movies;
	
	moviesGrid.innerHTML = filtered.length > 0
		? filtered.map((movie) => {
			const poster = movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster';
			return `
			<div class="movie-card relative bg-gradient-to-b from-gray-900/80 to-black/80 border border-red-600/20 rounded-2xl shadow-xl overflow-hidden cursor-pointer group hover:scale-105 transition-all duration-300 hover:border-red-600/50 hover:shadow-red-600/30">
			  <img src="${poster}" alt="${escapeHtml(movie.Title)}" class="w-full h-96 object-contain bg-black group-hover:blur-sm transition-all duration-500" />
			  <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-between p-4">
				<div>
				  <h2 class="text-xl font-bold text-white mb-1">${escapeHtml(movie.Title)}</h2>
				  <p class="text-xs text-gray-200 mb-2">${escapeHtml(movie.Year)} • ${escapeHtml(movie.Genre || '')}</p>
				  ${movie.Runtime ? `<p class='text-gray-300 text-sm'>🕒 ${escapeHtml(movie.Runtime)}</p>` : ''}
				  ${movie.imdbRating ? `<p class='text-yellow-400 text-sm font-semibold'>⭐ ${escapeHtml(movie.imdbRating)}/10</p>` : ''}
				</div>
				${movie.Plot ? `<p class='text-sm text-gray-100 italic line-clamp-3'>"${escapeHtml(movie.Plot)}"</p>` : ''}
			  </div>
			</div>`;
		}).join('')
		: '<div class="col-span-full text-center text-gray-500 py-12">Nessun film trovato con questo genere</div>';
}

window.addEventListener("scroll", () => {
	if (!scrollTopBtn) return;
	scrollTopBtn.classList.toggle("hidden", window.scrollY < 300);
});
scrollTopBtn?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// Carica film all'avvio della pagina
window.addEventListener('DOMContentLoaded', () => {
	loadPopularMovies();
});