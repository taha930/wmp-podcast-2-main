import { addGlobalStylesToShadowRoot } from "./global_styles.js";
import { GlobalState } from "./global-state.js";

//////////////////////////////////////////
// Main component for displaying all favorite podcasts
//////////////////////////////////////////

export class PodcastFavorites extends HTMLElement {
    constructor() {
        super();

        const shadow = this.attachShadow({ mode: 'open' });

        // the components basic html structure
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
        let url = new URL('https://api.fyyd.de/0.2/podcast/');
        const podcastList = this.shadowRoot.getElementById('podcast-list');

        const favorites = GlobalState.getFavorites();
        for (const favorite of favorites) {
            url.searchParams.append('podcast_id', favorite);

            try {
                const response = await fetch(url);
                const data = await response.json();

                this.insertSearchResults(data);
            }
            catch (error) {
                // Handle the error
            }
        }

        podcastList.removeLoadingIndicator();

    }

    insertSearchResults(data) {
        const podcastList = this.shadowRoot.getElementById('podcast-list');

        if (data == null || data.status == 0) {
            return;
        }

        podcastList.addPodcast(data.data);
    }

}

customElements.define('podcast-favorites', PodcastFavorites);