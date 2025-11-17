import { environment } from '../envirionment';

const buildUrl = (params: Record<string, string>) => {
	const qs = Object.entries(params)
		.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
		.join('&');
	return `${environment.omdbBaseUrl}/?apikey=${environment.omdbApiKey}&${qs}`;
};

export const OmdbService = {
	async searchByTitle(title: string) {
		const url = buildUrl({ s: title, type: 'movie' });
		const res = await fetch(url);
		const data = await res.json();
		if (data.Response === 'False') throw new Error(data.Error || 'Nessun risultato');
		return data; // { Search: [...], totalResults, Response }
	},

	async getById(imdbId: string) {
		const url = buildUrl({ i: imdbId, plot: 'short' });
		const res = await fetch(url);
		const data = await res.json();
		if (data.Response === 'False') throw new Error(data.Error || 'Non trovato');
		return data;
	},

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
