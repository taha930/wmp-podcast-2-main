import { addGlobalStylesToShadowRoot } from "./global_styles.js";
import { GlobalState } from "./global-state.js";
import { PodcastCarousel } from "./podcast-carousel.js";

//////////////////////////////////////////
// Main component that displays the start page of the podcast app
//////////////////////////////////////////

export class PodcastStartpage extends HTMLElement {
    constructor() {
        super();

        // Bind the updateEpisodeQueue method to the class instance so it refers to the PodcastStartpage component when called as an event listener
        this.updateEpisodeQueue = this.updateEpisodeQueue.bind(this);

        this.attachShadow({ mode: 'open' });

        // the components basic html structure
        this.shadowRoot.innerHTML = /*html*/`
        <h1>Queued Episodes</h1>
        <podcast-carousel id="queued-episodes"></podcast-carousel>
        <h1>Latest Episodes of Your Favorite Podcasts</h1>
        <podcast-carousel id="latest-episodes"></podcast-carousel>
        <h1>Your Favorite Podcasts</h1>
        <podcast-carousel id="favorites"></podcast-carousel>
        <h1>Recommended Podcasts</h1>
        <podcast-carousel id="recommendations"></podcast-carousel>
        `;

        // the components css styles        
        const style = document.createElement('style');
        style.textContent = /*css*/`
        `;

        addGlobalStylesToShadowRoot(this.shadowRoot);

        this.shadowRoot.appendChild(style);
    }

    connectedCallback() {
        const latest_episodes = this.shadowRoot.getElementById('latest-episodes');
        latest_episodes.setToLoadingIndicator();
        const queued = this.shadowRoot.getElementById('queued-episodes');
        queued.setToLoadingIndicator();
        const favorites = this.shadowRoot.getElementById('favorites');
        favorites.setToLoadingIndicator();
        const recommendations = this.shadowRoot.getElementById('recommendations');
        recommendations.setToLoadingIndicator();

        window.addEventListener('queue-changed', this.updateEpisodeQueue);

        this.fetchLatestEpisodes();
        this.fetchQueuedEpisodes();
        this.fetchFavoritePodcasts();
        this.fetchRecommendedPodcasts();
    }

    disconnectedCallback() {
        window.removeEventListener('queue-changed', this.updateEpisodeQueue);
    }

    // Returns the age of an episode in days
    #getEpisodeAgeInDays(pubdate) {
        const publicationDate = new Date(pubdate);
        const currentDate = new Date();
        const timeDifference = currentDate - publicationDate;
        const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        return daysDifference;
    }

    updateEpisodeQueue(event) {
        if (event.detail.command == 'added') {
            this.fetchSingleEpisode(event.detail.episodeId);
        } else if (event.detail.command == 'removed') {
            const queuedEpisodes = this.shadowRoot.getElementById('queued-episodes');
            queuedEpisodes.removeElement(event.detail.episodeId);
        }
    }

    async fetchLatestEpisodes() {
        const latest_episodes = this.shadowRoot.getElementById('latest-episodes');

        const favoritesPodcasts = GlobalState.getFavorites();
        for (const favorite of favoritesPodcasts) {
            let url = new URL('https://api.fyyd.de/0.2/podcast/episodes');
            url.searchParams.append('podcast_id', favorite);
            url.searchParams.append('count', 2);

            try {
                const response = await fetch(url);
                const data = await response.json();

                for (const episode of data.data.episodes) {
                    const episodeAgeInDays = this.#getEpisodeAgeInDays(episode.pubdate);
                    if (episodeAgeInDays < 30) {
                        // only display episodes that are not older than 30 days
                        this.insertSearchResults(episode, latest_episodes, true);
                    }
                }
            }
            catch (error) {
                // Handle the error
                console.error(error);
            }
        }

        latest_episodes.removeLoadingIndicator();
        latest_episodes.generateViews();
    }

    async fetchQueuedEpisodes() {
        const queuedEpisodes = this.shadowRoot.getElementById('queued-episodes');

        const queue = GlobalState.getEpisodeQueue();
        for (const episode of queue) {
            let url = new URL('https://api.fyyd.de/0.2/episode/');
            url.searchParams.append('episode_id', episode);

            try {
                const response = await fetch(url);
                const data = await response.json();

                this.insertSearchResults(data.data, queuedEpisodes, true);
            }
            catch (error) {
                // Handle the error
            }
        }

        queuedEpisodes.removeLoadingIndicator();
        queuedEpisodes.generateViews();
    }

    async fetchSingleEpisode(id) {
        const queuedEpisodes = this.shadowRoot.getElementById('queued-episodes');

        let url = new URL('https://api.fyyd.de/0.2/episode/');
        url.searchParams.append('episode_id', id);

        try {
            const response = await fetch(url);
            const data = await response.json();

            this.insertSearchResults(data.data, queuedEpisodes, true);
        }
        catch (error) {
            // Handle the error
        }
        queuedEpisodes.generateViews();
    }

    async fetchFavoritePodcasts() {
        const favorites = this.shadowRoot.getElementById('favorites');

        const favoritesPodcasts = GlobalState.getFavorites();
        for (const favorite of favoritesPodcasts) {
            let url = new URL('https://api.fyyd.de/0.2/podcast/');
            url.searchParams.append('podcast_id', favorite);

            try {
                const response = await fetch(url);
                const data = await response.json();

                this.insertSearchResults(data.data, favorites);
            }
            catch (error) {
                // Handle the error
            }
        }

        favorites.removeLoadingIndicator();
        favorites.generateViews();
    }

    async fetchRecommendedPodcasts() {
        let url = new URL('https://api.fyyd.de/0.2/feature/podcast/hot/');
        const recommendations = this.shadowRoot.getElementById('recommendations');

        try {
            const response = await fetch(url);
            const data = await response.json();

            for (const podcast of data.data) {
                this.insertSearchResults(podcast, recommendations);
            }
        }
        catch (error) {
            // Handle the error
        }

        recommendations.removeLoadingIndicator();
        recommendations.generateViews();
    }



    insertSearchResults(data, element, isEpisode = false) {
        if (data == null || data.status == 0) {
            return;
        }

        if (isEpisode) {
            element.addEpisode(data);
        } else
            element.addPodcast(data);
    }
}

customElements.define('podcast-startpage', PodcastStartpage);
