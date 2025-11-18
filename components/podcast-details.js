import { addGlobalStylesToShadowRoot } from "./global_styles.js";
import { PodcastEpisode } from "./podcast-episode.js";
import { GlobalState } from "./global-state.js";

//////////////////////////////////////////
// Main component for displaying the details of a podcast and its episodes
//////////////////////////////////////////

export class PodcastDetails extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({ mode: 'open' });

        // the components basic html structure
        this.shadowRoot.innerHTML = /*html*/`
<div class="container">
<header id="header"></header>
<main class="row g-3">
    <section class="col-md-6">
        <ul id="categories"></ul>
        <div id="details"></div>
    </section>
    <div class="col-md-6">
        <div class="card">
            <h3 class="card-header">Episodes</h3>
            <div class="card-body">
                <section id="episodes" class="card-text">
                    <img src="/assets/images/podcast_blue.svg" class="loading-indicator" id="loading-indicator">
                </section>
            </div>
        </div>
    </div>
</main>
</div>
        `;

        // the components css styles
        const style = document.createElement('style');
        style.textContent = /*css*/`
            .card {
                height: fit-content !important;
            }
            #categories {
                display: flex;
                flex-wrap: wrap;
                justify-content: flex-start;
                align-items: flex-start;
                padding: 0;
                gap: 5px;
                margin-bottom: 10px;
            }
            header img {
                width: 1em;
                margin-left: 10px;
                margin-right: 10px;
                cursor: pointer;
            }
            #loading-indicator {
                position: relative;
                width: 100px;
                height: 100px;
                left: calc(50% - 50px);
                z-index: 1000;
            }
            #favorite:hover {
                transform: scale(1.2);
                transition: transform 0.2s;
            }
            #details img {
                width: 100%;
                margin-bottom: 2em;
            }
            .badge {
                transition: transform 0.2s;
            }
            .badge:hover {
                transform: scale(1.05);
            }
        `;
        this.shadowRoot.appendChild(style);

        addGlobalStylesToShadowRoot(this.shadowRoot);
    }

    connectedCallback() {
        const params = new URL(document.location.toString()).searchParams;
        const id = params.get("id");

        // Create promises for both fetch operations
        const episodesPromise = this.fetchPodcastDetailsAndEpisodes(id);

        // Use Promise.all to wait for both promises to resolve
        Promise.all([episodesPromise]).then(() => {
            this.removeLoadingIndicator();
        }).catch(error => {
            // Handle any errors from either fetch operation
            console.error("Error fetching podcast details or episodes:", error);
            this.removeLoadingIndicator(); // Consider removing the loading indicator even on error to avoid a stuck loading state
        });
    }

    async fetchPodcastDetailsAndEpisodes(id) {
        let url = new URL('https://api.fyyd.de/0.2/podcast/episodes/');
        url.searchParams.append('podcast_id', id);

        try {
            const response = await fetch(url);
            const data = await response.json();
            this.insertPodcastDetails(data);
            this.insertPodcastEpisodes(data);
        } catch (error) {
            // Handle the error
            throw error; // Rethrow the error to be caught by Promise.all
        }
    }

    // creates a badge element for a category or subcategory
    createBadge(category_id) {
        const badgeElement = document.createElement('li')
        badgeElement.classList.add('badge', 'text-bg-primary');
        const linkElement = document.createElement('a');
        linkElement.href = `/?page=categories&id=${category_id}`;
        linkElement.classList.add('text-decoration-none', 'text-white');
        linkElement.addEventListener('click', (event) => {
            window.openNavigationLink(event);
        });
        linkElement.textContent = GlobalState.getCategoryString(category_id);
        badgeElement.appendChild(linkElement);
        return badgeElement;
    }

    // returns the id of the podcast from the url
    id() {
        const params = new URL(document.location.toString()).searchParams;
        return params.get("id");
    }

    insertPodcastDetails(data) {
        if (data == null || data.status == 0) {
            return;
        }

        const headerElement = this.shadowRoot.getElementById('header')

        const title = document.createElement('h1');
        // title.classList.add('card-title');
        title.innerHTML = data.data.title;
        const favorite = document.createElement('img');
        if (GlobalState.isFavoritePodcast(data.data.id)) {
            favorite.src = '/assets/images/favorite_blue_filled.svg';
        } else {
            favorite.src = '/assets/images/favorite_blue_empty.svg';
        }
        favorite.addEventListener('click', (event) => {
            const isFavorite = GlobalState.togglePodcastInFavorites(this.id());
            if (isFavorite) {
                event.target.src = '/assets/images/favorite_blue_filled.svg';
            } else {
                event.target.src = '/assets/images/favorite_blue_empty.svg';
            }
        });
        favorite.setAttribute('id', 'favorite');
        title.appendChild(favorite);
        headerElement.appendChild(title);

        const author = document.createElement('h2');
        // title.classList.add('card-title');
        author.innerHTML = data.data.author;
        headerElement.appendChild(author);


        const detailsElement = this.shadowRoot.getElementById('details')

        const image = document.createElement('img');
        image.classList.add('img-fluid', 'rounded');
        if (data.data.imgURL) {
            image.src = data.data.imgURL;
            image.onerror = () => {
                image.src = '/assets/images/podcast_black.svg';
            };
        } else {
            image.src = '/assets/images/podcast_black.svg';
        }
        detailsElement.appendChild(image);

        const description = document.createElement('p');
        // title.classList.add('card-title');
        description.innerHTML = data.data.description;
        detailsElement.appendChild(description);

        const link = document.createElement('a');
        // title.classList.add('card-title');
        link.href = data.data.htmlURL;
        link.textContent = "Go to podcast website";
        detailsElement.appendChild(link);

        const badgeElement = this.shadowRoot.getElementById('categories');
        for (const category_id of data.data.categories) {
            badgeElement.appendChild(this.createBadge(category_id));
        }
    }

    insertPodcastEpisodes(data) {
        if (data == null || data.status == 0) {
            return;
        }

        const parentElement = this.shadowRoot.getElementById('episodes');

        for (const episode of data.data.episodes) {
            let podcastEpisode = new PodcastEpisode();
            podcastEpisode.setAttribute('id', episode.id);
            podcastEpisode.setAttribute('title', episode.title);
            podcastEpisode.setAttribute('image', episode.imgURL);
            podcastEpisode.setAttribute('file', episode.enclosure);
            podcastEpisode.setAttribute('pubdate', episode.pubdate);
            podcastEpisode.setAttribute('duration', episode.duration_string);

            const episodeDescription = document.createElement('div');
            episodeDescription.innerHTML = episode.description;
            episodeDescription.setAttribute('slot', 'description');
            podcastEpisode.appendChild(episodeDescription);

            parentElement.append(podcastEpisode);
        }
    }

    removeLoadingIndicator() {
        this.shadowRoot.getElementById('loading-indicator').remove();
    }

}

customElements.define('podcast-details', PodcastDetails);
