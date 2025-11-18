import { addGlobalStylesToShadowRoot } from "./global_styles.js";
import { GlobalState } from "./global-state.js";

//////////////////////////////////////////
// Main component for displaying the details of a podcast episode
//////////////////////////////////////////


export class PodcastEpisodeDetails extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({ mode: 'open' });

        // the components basic html structure
        this.shadowRoot.innerHTML = /*html*/`
<img src="/assets/images/podcast_blue.svg" class="loading-indicator" id="loading-indicator">
<div class="container">
    <section class="row g-3">
        <section class="col-12">
            <h1 id="episode-title" class="col-12">Episode Title</h1>
            <h2 class="col-12">
                <span id="podcast-title">Podcast Title</span>
                <img id="favorite" src="/assets/images/favorite_blue_empty.svg" alt="add/remove to/from favorites" title="add/remove to/from favorites">
                <a id="podcast-link" href="/?page=podcast">
                    <img src="/assets/images/link_blue.svg" alt="show podcast details" title="show podcast details">
                </a>
            </h2>
        </section>
        <section class="col-md-3">
            <img id="episode-image" class="rounded" alt="episode image" src="/assets/images/podcast_black.svg">
        </section>
        <section id="meta-information" class="col-md-9 border rounded">
            Meta Information
        </section>
        <section id="controls" class="col-12">
            <img id="play" src="/assets/images/play_blue.svg" alt="play episode" width="32" height="32" title="Play episode">
            <img id="queue" src="/assets/images/add_blue_empty.svg" alt="add/remove episode to/from queue" width="24" height="24" title="Add/remove episode to/from queue">
        </section>
        <section class="col-12">
            <p id="episode-description">Episode description</p>
            <p><a id="website-link" href="#">Go to episode website</a></p>
        </section>
</div>
        `;

        // the components css styles
        const style = document.createElement('style');
        style.textContent = /*css*/`
            #controls > img {
                cursor: pointer;
                z-index: 1;
                position: relative;
            }
            #controls > img:hover {
                transform: scale(1.2);
                transition: transform 0.2s;
            }
            #playing-badge {
                @starting-style {
                    visibility: false;
                    opacity: 0;
                    width: 0;
                }
                visibility: true;
                opacity: 1;
                width: fit-content;
                transition: opacity 0.2s, visibility 0.2s, width 0.2s;
                transition-behavior: allow-discrete;
            }
            #playing-badge.is-deleting {
                visibility: false;
                opacity: 0;
                width: 0;
            }
            #loading-indicator {
                position: absolute;
                width: 100px;
                top: 25%;
                left: calc(50% - 50px);
                z-index: 1000;
            }
            #episode-image {
                width: 100%;
                // width: 200px;
                // margin: 0 20px 20px 0;
            }
            #episode-description {
                word-wrap: break-word;
                overflow-wrap: break-word;
            }
            h2 img {
                width: 1em;
                margin-left: 10px;
                cursor: pointer;
            }
            h2 img:hover {
                transform: scale(1.2);
                transition: transform 0.2s;
            }
            #controls img {
                cursor: pointer;
                z-index: 1;
                position: relative;
            }
            #controls img:hover {
                transform: scale(1.2);
                transition: transform 0.2s;
            }
        `;
        this.shadowRoot.appendChild(style);

        addGlobalStylesToShadowRoot(this.shadowRoot);
    }


    connectedCallback() {
        const params = new URL(document.location.toString()).searchParams;
        const id = params.get("id");
        console.log(document.location.toString());
        console.log(id);

        // Create promises for both fetch operations
        const episodeDetailsPromise = this.fetchEpisodeDetails(id);
        // const podcastDetailsPromise = this.fetchPodcastDetails(id);

        // Use Promise.all to wait for both promises to resolve
        Promise.all([episodeDetailsPromise]).then(() => {
            this.removeLoadingIndicator();
        }).catch(error => {
            // Handle any errors from either fetch operation
            console.error("Error fetching episode details or episodes:", error);
            this.removeLoadingIndicator(); // Consider removing the loading indicator even on error to avoid a stuck loading state
        });

        this.shadowRoot.getElementById('play').addEventListener('click', (event) => {
            window.getPlayerComponent().loadByEpisodeId(id);
        });

        this.shadowRoot.getElementById('queue').addEventListener('click', (event) => {
            const isQueued = GlobalState.toggleEpisodeInQueue(id);
            if (isQueued) {
                this.shadowRoot.getElementById('queue').src = '/assets/images/add_blue_filled.svg';
            } else {
                this.shadowRoot.getElementById('queue').src = '/assets/images/add_blue_empty.svg';
            }
        });

        // add event listener to the player to toggle the playing badge
        const player = window.getPlayerComponent();
        player.addEventListener('play', (event) => {
            this.togglePlayingBadge();
        });

        // use openNavigationLink to open the podcast details page
        this.shadowRoot.getElementById('podcast-link').addEventListener('click', (event) => {
            window.openNavigationLink(event);
        });
    }

    // creates the badge that displays "now playing"
    #createPlayingBadge(category_id) {
        const badgeElement = document.createElement('span')
        badgeElement.classList.add('badge', 'text-bg-primary');
        badgeElement.id = 'playing-badge';
        badgeElement.textContent = "now playing";
        return badgeElement;
    }

    // adds or removes the "now playing" badge
    togglePlayingBadge() {
        const player = window.getPlayerComponent();
        const playButton = this.shadowRoot.getElementById('play');
        const controlsSection = playButton.parentElement;
        const playingBadge = this.shadowRoot.getElementById('playing-badge');
        if (player.getCurrentEpisodeId() === this.id()) {
            if (!playingBadge) {
                const playButton = this.shadowRoot.getElementById('play');
                controlsSection.insertBefore(this.#createPlayingBadge(), playButton);
            }
        } else {
            if (playingBadge) {
                playingBadge.classList.add('is-deleting');
                setTimeout(() => {
                    controlsSection.removeChild(playingBadge);
                }, 500);
            }
        }
    }

    async fetchEpisodeDetails(id) {
        let url = new URL('https://api.fyyd.de/0.2/episode/');
        url.searchParams.append('episode_id', id);

        try {
            const response = await fetch(url);
            const data = await response.json();
            this.insertEpisodeDetails(data);
        } catch (error) {
            // Handle the error
            throw error; // Rethrow the error to be caught by Promise.all
        }
    }

    async fetchPodcastDetails(id) {
        let url = new URL('https://api.fyyd.de/0.2/podcast/');
        url.searchParams.append('podcast_id', id);

        try {
            const response = await fetch(url);
            const data = await response.json();
            this.insertPodcastDetails(data);
        } catch (error) {
            // Handle the error
            throw error; // Rethrow the error to be caught by Promise.all
        }
    }

    // returns the id of the episode from the url
    id() {
        const params = new URL(document.location.toString()).searchParams;
        return params.get("id");
    }

    insertEpisodeDetails(data) {
        console.log(data);

        if (data == null || data.status == 0) {
            return;
        }

        this.shadowRoot.getElementById('episode-title').textContent = data.data.title;

        const image = this.shadowRoot.getElementById('episode-image');

        if (data.data.imgURL) {
            image.src = data.data.imgURL;
            image.onerror = () => {
                image.src = '/assets/images/podcast_black.svg';
            };
        } else {
            image.src = '/assets/images/podcast_black.svg';
        }

        const metaInformation = this.shadowRoot.getElementById('meta-information');
        const date = new Date(data.data.pubdate);
        metaInformation.innerHTML = /*html*/`
            <p>Duration: ${data.data.duration_string}</p>
            <p>Published: ${date.toLocaleDateString()}</p>
        `

        this.shadowRoot.getElementById('episode-description').innerHTML = data.data.description;
        this.shadowRoot.getElementById('website-link').href = data.data.url;

        this.fetchPodcastDetails(data.data.podcast_id);

        if (GlobalState.isEpisodeInQueue(data.data.id)) {
            this.shadowRoot.getElementById('queue').src = '/assets/images/add_blue_filled.svg';
        } else {
            this.shadowRoot.getElementById('queue').src = '/assets/images/add_blue_empty.svg';
        }
        this.togglePlayingBadge();
    }

    insertPodcastDetails(data) {
        if (data == null || data.status == 0) {
            return;
        }

        const title = this.shadowRoot.getElementById('podcast-title');
        title.textContent = data.data.title;

        const favorite = this.shadowRoot.getElementById('favorite');
        if (GlobalState.isFavoritePodcast(data.data.id)) {
            favorite.src = '/assets/images/favorite_blue_filled.svg';
        } else {
            favorite.src = '/assets/images/favorite_blue_empty.svg';
        }
        favorite.addEventListener('click', (event) => {
            const isFavorite = GlobalState.togglePodcastInFavorites(data.data.id);
            if (isFavorite) {
                event.target.src = '/assets/images/favorite_blue_filled.svg';
            } else {
                event.target.src = '/assets/images/favorite_blue_empty.svg';
            }
        });

        const showPodcast = this.shadowRoot.getElementById('podcast-link');
        showPodcast.href = '/?page=podcast&id=' + data.data.id;
    }

    removeLoadingIndicator() {
        this.shadowRoot.getElementById('loading-indicator').remove();
    }

}

customElements.define('podcast-episode-details', PodcastEpisodeDetails);
