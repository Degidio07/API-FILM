import { environment } from '../envirionment';
// Funzione per costruire l'URL delle richieste OMDB
const buildUrl = (params: Record<string, string>) => {
	const qs = Object.entries(params)
		.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
		.join('&');
		// Restituisce l'URL completo con i parametri di query
	return `${environment.omdbBaseUrl}/?apikey=${environment.omdbApiKey}&${qs}`;
};
// Servizio per interagire con l'API OMDB
export const OmdbService = {
	async searchByTitle(title: string) {
		const url = buildUrl({ s: title, type: 'movie' });
		const res = await fetch(url);
		const data = await res.json();
		// Gestisce gli errori di risposta
		if (data.Response === 'False') throw new Error(data.Error || 'Nessun risultato');
		return data; // { Search: [...], totalResults, Response }
	},
// Funzione per ottenere i dettagli di un film tramite il suo ID IMDb
	async getById(imdbId: string) {
		const url = buildUrl({ i: imdbId, plot: 'short' });
		const res = await fetch(url);
		const data = await res.json();
		if (data.Response === 'False') throw new Error(data.Error || 'Non trovato');
		return data;
	},
// Funzione per ottenere una lista di film popolari (simulata)
	async getPopular() {
		const url = buildUrl({ s: 'the', type: 'movie' });
		const res = await fetch(url);
		const data = await res.json();
		if (data.Response === 'False') throw new Error(data.Error || 'Nessun risultato');
		const ids = (data.Search || []).slice(0, 10).map((s: any) => s.imdbID);
		const full = await Promise.all(ids.map((id: string) => this.getById(id).catch(() => null)));
		return full.filter(Boolean);
	}
};
