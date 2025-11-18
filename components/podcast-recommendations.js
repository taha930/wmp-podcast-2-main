import { addGlobalStylesToShadowRoot } from "./global_styles.js";
import { PodcastList } from "./podcast-list.js";

//////////////////////////////////////////
// Main component for displaying a list of recommended podcasts
//////////////////////////////////////////

export class PodcastRecommendations extends HTMLElement {
    constructor() {
        super();

        const shadow = this.attachShadow({ mode: 'open' });

        // The components basic html structure
        const wrapper = document.createElement('header');
        wrapper.innerHTML = `
<podcast-list id="podcast-list" class="m-1"></podcast-list>
        `;

        addGlobalStylesToShadowRoot(this.shadowRoot);

        shadow.appendChild(wrapper);
    }

    connectedCallback() {
        const podcastList = this.shadowRoot.getElementById('podcast-list');
        podcastList.setToLoadingIndicator();

        this.fetchPodcasts();
    }

    async fetchPodcasts(title) {
        let url = new URL('https://api.fyyd.de/0.2/feature/podcast/hot/');

        try {
            const response = await fetch(url);
            const data = await response.json();

            this.insertSearchResults(data);

            // history.pushState(data, 'search results', '');
        }
        catch (error) {
            // Handle the error
        }

    }

    insertSearchResults(data) {
        const podcastList = this.shadowRoot.getElementById('podcast-list');
        podcastList.clear();

        if (data == null || data.status == 0) {
            return;
        }

        for (let podcast of data.data) {
            podcastList.addPodcast(podcast);
        };

        // Save state with dynamically inserted content in History
        const state = {
            searchTitle: this.shadowRoot.getElementById('search-title').value,
            podcastList: podcastList.innerHTML
        };
    }

}

customElements.define('podcast-recommendations', PodcastRecommendations);