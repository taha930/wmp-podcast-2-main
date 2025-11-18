import { addGlobalStylesToShadowRoot } from "./global_styles.js";

import { PodcastList } from "./podcast-list.js";

//////////////////////////////////////////
// Main component for searching podcasts
//////////////////////////////////////////

export class PodcastSearch extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({ mode: 'open' });

        // the components basic html structure
        this.shadowRoot.innerHTML = /*html*/`
<div id="podcast-search">
    <label for="search-title" id="search-label">Title:</label>
    <input type="text" name="search-title" id="search-title" class="rounded">
    <button id="search-button" class="btn btn-primary">Search</button>
</div>

<podcast-list id="podcast-list" class="m-1"></podcast-list>
        `;

        // the components css styles
        const style = document.createElement('style');
        style.textContent = /*css*/`
        	#podcast-search {
                display: grid;
                height: 2rem;
                grid-template-columns: auto 50px auto 100px auto;
                align-items: center;
                column-gap: 5px;
        	}
            #search-label {
                grid-column: 2;
            }
            #search-title {
                grid-column: 3;
                height: 100%;
            }
            #search-button {
                grid-column: 4;
                height: 100%;
            }
            #podcast-search {
                margin: 10px;
            }
        `;

        addGlobalStylesToShadowRoot(this.shadowRoot);

        this.shadowRoot.appendChild(style);
    }

    connectedCallback() {
        this.shadowRoot.getElementById('search-button').addEventListener('click', (event) => {
            this.storeSearchInHistory();
            this.searchPodcasts();
        });

        this.shadowRoot.getElementById('search-title').addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                this.storeSearchInHistory();
                this.searchPodcasts();
            }
        });

        const urlParams = new URLSearchParams(window.location.search);
        const title = urlParams.get('title');
        if (title) {
            this.shadowRoot.getElementById('search-title').value = title;
            this.searchPodcasts();
        }
    }

    storeSearchInHistory() {
        const searchTitle = this.shadowRoot.getElementById('search-title').value;
        window.history.pushState(null, "search", `?page=search&title=${searchTitle}`);
    }

    searchPodcasts() {
        const searchTitle = this.shadowRoot.getElementById('search-title').value;
        const podcastList = this.shadowRoot.getElementById('podcast-list');
        podcastList.setToLoadingIndicator();

        this.fetchPodcasts(searchTitle);
    }

    async fetchPodcasts(title) {
        let url = new URL('https://api.fyyd.de/0.2/search/podcast/');
        url.searchParams.append('title', title);

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

customElements.define('podcast-search', PodcastSearch);
