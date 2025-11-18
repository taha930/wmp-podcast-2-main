import { addGlobalStylesToShadowRoot } from "./global_styles.js";
import { GlobalState } from "./global-state.js";
import { PodcastPlayer } from "./podcast-player.js";

//////////////////////////////////////////
// Component that displays the queued episodes as a popup playlist
//////////////////////////////////////////

export class PodcastPlaylist extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({ mode: 'open' });

        // the components basic html structure
        this.shadowRoot.innerHTML = /*html*/`
  <div class="modal-dialog border rounded">
    <div id="content" class="modal-content">
        <h3>Queued Episodes</h3>
        <ul id="playlist" class="list-group list-group-flush">
        </ul>
    </div>
  </div>
        `;

        // the components css styles
        const style = document.createElement('style');
        style.textContent = /*css*/`
            .modal-dialog {
                background-color: white;
                padding: 10px;
                margin: auto auto auto auto !important;
            }
            h3 {
                color: black !important;
            }
            #loading-indicator {
                position: absolute;
                width: 100px;
                top: 25%;
                left: calc(50% - 50px);
                z-index: 1000;
            }
            #playing-badge {
                @starting-style {
                    visibility: false;
                    opacity: 0;
                    width: 0;
                }
                margin-left: 5px;
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
            .list-group-item-action {
                cursor: pointer;
            }
            span {
                margin-left: 5px;
            }
        `;

        addGlobalStylesToShadowRoot(this.shadowRoot);

        this.shadowRoot.appendChild(style);
    }

    connectedCallback() {
        this.setToLoadingIndicator();
        this.fetchQueuedEpisodes();

        // Listen for changes to the queue and update the playlist accordingly
        window.addEventListener('queue-changed', (event) => {
            if (event.detail.command == 'added') {
                this.fetchSingleEpisode(event.detail.episodeId);
            } else if (event.detail.command == 'removed') {
                this.shadowRoot.getElementById(event.detail.episodeId).remove();
            }
        });
    }

    setToLoadingIndicator() {
        const content = this.shadowRoot.getElementById('content');
        const list = this.shadowRoot.getElementById('playlist');

        const loadingIndicator = document.createElement('img');
        loadingIndicator.src = '/assets/images/podcast_blue.svg';
        loadingIndicator.classList.add('loading-indicator');
        loadingIndicator.id = 'loading-indicator';
        content.insertBefore(loadingIndicator, list);
    }

    removeLoadingIndicator() {
        this.shadowRoot.getElementById('loading-indicator').remove();
    }


    async fetchQueuedEpisodes() {
        const queue = GlobalState.getEpisodeQueue();
        for (const episode of queue) {
            let url = new URL('https://api.fyyd.de/0.2/episode/');
            url.searchParams.append('episode_id', episode);

            try {
                const response = await fetch(url);
                const data = await response.json();

                this.insertEpisode(data.data);
            }
            catch (error) {
                // Handle the error
            }
        }

        this.removeLoadingIndicator();
    }

    async fetchSingleEpisode(id) {
        let url = new URL('https://api.fyyd.de/0.2/episode/');
        url.searchParams.append('episode_id', id);

        try {
            const response = await fetch(url);
            const data = await response.json();

            this.insertEpisode(data.data);
        }
        catch (error) {
            // Handle the error
        }
    }

    // Insert a single episode at the end of the playlist
    insertEpisode(episode) {
        if (!episode || episode.status == 0) {
            return;
        }

        const list = this.shadowRoot.getElementById('playlist');

        const episodeElement = document.createElement('li');
        episodeElement.classList.add('list-group-item', 'list-group-item-action');
        episodeElement.setAttribute('id', episode.id);
        const imageElement = document.createElement('img');
        imageElement.classList.add('rounded');
        imageElement.style.width = '32px';
        imageElement.style.height = '32px';
        if (episode.imgURL) {
            imageElement.src = episode.imgURL;
            imageElement.onerror = () => {
                imageElement.src = '/assets/images/podcast_black.svg';
            };
        } else {
            imageElement.src = '/assets/images/podcast_black.svg';
        }
        episodeElement.appendChild(imageElement);
        const titleElement = document.createElement('span');
        titleElement.textContent = episode.title;
        episodeElement.appendChild(titleElement);

        list.appendChild(episodeElement);

        const player = window.getPlayerComponent();

        // Show the playing badge if the episode is currently playing
        this.togglePlayingBadge(episodeElement);

        // Listen to the play event of the player and show the playing badge
        player.addEventListener('play', (event) => {
            this.togglePlayingBadge(episodeElement);
        });

        episodeElement.addEventListener('click', (event) => {
            player.loadByEpisodeId(episode.id);
        });

    }

    // Create the badge that indicates that an episode is currently playing
    #createPlayingBadge(category_id) {
        const badgeElement = document.createElement('span')
        badgeElement.classList.add('badge', 'text-bg-primary');
        badgeElement.id = 'playing-badge';
        badgeElement.textContent = "now playing";
        return badgeElement;
    }

    // Show or hide the playing badge for a given episode
    togglePlayingBadge(episodeElement) {
        const player = window.getPlayerComponent();
        const playingBadge = episodeElement.querySelector('#playing-badge');
        const id = episodeElement.getAttribute('id');
        if (player.getCurrentEpisodeId() == id) {
            if (!playingBadge) {
                episodeElement.insertBefore(this.#createPlayingBadge(), episodeElement.querySelector('img').nextSibling);
            }
        } else {
            if (playingBadge) {
                playingBadge.classList.add('is-deleting');
                setTimeout(() => {
                    playingBadge.remove();
                }, 500);
            }
        }
    }

}

customElements.define('podcast-playlist', PodcastPlaylist);
