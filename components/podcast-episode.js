import { addGlobalStylesToShadowRoot } from "./global_styles.js";
import { GlobalState } from "./global-state.js";
import { PodcastPlayer } from "./podcast-player.js";
import { PodcastEpisodeDetails } from "./podcast-episode-details.js";

//////////////////////////////////////////
// Responsive component for displaying a podcast episode as a card
//////////////////////////////////////////

export class PodcastEpisode extends HTMLElement {
    constructor() {
        super();

        // Bind the updateQueueStatus method to the class instance so it refers to the PodcastEpisode component when called as an event listener
        this.updateQueueStatus = this.updateQueueStatus.bind(this);

        this.attachShadow({ mode: 'open' });

        // the components basic html structure
        this.shadowRoot.innerHTML = /*html*/`
<div id="episode" class="card mb-3">
  <div class="row g-0">
    <div class="col-lg-4">
      <img id="episode-image" class="img-fluid rounded" alt="episode image" href="/assets/images/podcast_black.svg">
    </div>
    <div class="col-lg-8">
      <div class="card-body">
        <h5 class="card-title text-truncate" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Title">Title</h5>
        <p class="card-text text-muted">
            <span id="duration">Duration</span>,
            <span id="pubdate">Pubdate</span>
        </p>
        <p id="description" class="card-text">
            <slot name="description">No description available</slot>
        </p>
        <p>
            <a id="show-details" href="/?page=episode" class="link-primary stretched-link">Show details</a>
        </p>
        <section id="controls">
            <img id="play" src="/assets/images/play_blue.svg" alt="play episode" width="32" height="32" title="Play episode">
            <img id="queue" src="/assets/images/add_blue_empty.svg" alt="add/remove episode to/from queue" width="24" height="24" title="Add/remove episode to/from queue">
        </section>
      </div>
    </div>
  </div>
</div>
        `;

        // the components css styles
        const style = document.createElement('style');
        style.textContent = /*css*/`
            :host {
                display: block;
                container-type: inline-size; /* required for container queries */
            }
            .card {
                transition: transform 0.2s, border-color 0.2s;
            }
            .card:hover {
                border-color: black;
                transform: scale(1.02);
            }
            .text-muted {
                font-size: small;
            }
            #episode-image {
                height: 100%;
                width: 100%;
                object-fit: cover;
            }
            #description {
                display: -webkit-box;
                -webkit-line-clamp: 2; /* Number of lines */
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
            }
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
            /* Media query for when the card is less than 300px wide */
            @container (max-width: 250px) {
                .row {
                    display: flex !important;
                    flex-direction: column !important;
                    flex-wrap: wrap !important;
                }
                /* Ensure the image and card body take full width */
                .col-lg-4, .col-lg-8 {
                    flex: 0 0 100% !important;
                    max-width: 100% !important;
                    width: 100% !important;
                }
            }
        `;

        addGlobalStylesToShadowRoot(this.shadowRoot);

        this.shadowRoot.appendChild(style);
    }

    connectedCallback() {
        this.shadowRoot.getElementById('play').addEventListener('click', (event) => {
            window.getPlayerComponent().loadByEpisodeId(this.getAttribute('id'));
        });
        this.shadowRoot.getElementById('queue').addEventListener('click', (event) => {
            const isQueued = GlobalState.toggleEpisodeInQueue(this.getAttribute('id'));
            if (isQueued) {
                this.shadowRoot.getElementById('queue').src = '/assets/images/add_blue_filled.svg';
            } else {
                this.shadowRoot.getElementById('queue').src = '/assets/images/add_blue_empty.svg';
            }
        });
        this.shadowRoot.getElementById('show-details').addEventListener('click', (event) => {
            window.showEpisodeDetails(this.getAttribute('id'));
        });

        // add event listener to the player to show the playing badge when the episode is playing
        const player = window.getPlayerComponent();
        player.addEventListener('play', (event) => {
            this.togglePlayingBadge();
        });

        // use openNavigationLink to navigate to the episode details page
        this.shadowRoot.getElementById('show-details').addEventListener('click', (event) => {
            window.openNavigationLink(event);
        });

        // add event listener to the queue-changed event to update the queue status
        window.addEventListener('queue-changed', this.updateQueueStatus);
    }

    disconnectedCallback() {
        window.removeEventListener('queue-changed', this.updateQueueStatus);
    }

    static get observedAttributes() {
        return ['id', 'title', 'image', 'file', 'duration', 'pubdate'];
    }

    // creates a badge element that displays "now playing"
    #createPlayingBadge(category_id) {
        const badgeElement = document.createElement('span')
        badgeElement.classList.add('badge', 'text-bg-primary');
        badgeElement.id = 'playing-badge';
        badgeElement.textContent = "now playing";
        return badgeElement;
    }

    // update the elements that indicates whether the episode is in the queue
    updateQueueStatus(event) {
        const myId = this.getAttribute('id');
        if (event.detail.episodeId === myId) {
            if (event.detail.command == 'added') {
                this.shadowRoot.getElementById('queue').src = '/assets/images/add_blue_filled.svg';
            } else if (event.detail.command == 'removed') {
                this.shadowRoot.getElementById('queue').src = '/assets/images/add_blue_empty.svg';
            }
        }
    }

    togglePlayingBadge() {
        const player = window.getPlayerComponent();
        const controlsSection = this.shadowRoot.getElementById('controls');
        const playingBadge = this.shadowRoot.getElementById('playing-badge');
        if (player.getCurrentEpisodeId() === this.getAttribute('id')) {
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

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'title') {
            this.shadowRoot.querySelector('.card-title').textContent = newValue;
            this.shadowRoot.querySelector('.card-title').setAttribute('data-bs-title', newValue);
        }
        if (name === 'image') {
            const imgElement = this.shadowRoot.getElementById('episode-image');
            if (newValue) {
                imgElement.src = newValue;
                imgElement.onerror = () => {
                    imgElement.src = '/assets/images/podcast_black.svg';
                };
            } else {
                imgElement.src = '/assets/images/podcast_black.svg';
            }
        }
        if (name === 'duration') {
            this.shadowRoot.getElementById('duration').textContent = 'Duration: ' + newValue;
        }
        if (name === 'pubdate') {
            const date = new Date(newValue);
            this.shadowRoot.getElementById('pubdate').textContent = `Published: ${date.toLocaleDateString()}`;
        }
        if (name === 'id') {
            if (GlobalState.isEpisodeInQueue(newValue)) {
                this.shadowRoot.getElementById('queue').src = '/assets/images/add_blue_filled.svg';
            } else {
                this.shadowRoot.getElementById('queue').src = '/assets/images/add_blue_empty.svg';
            }
            this.togglePlayingBadge();
            this.shadowRoot.querySelector('a').href = `?page=episode&id=${newValue}`;
        }
    }

}

customElements.define('podcast-episode', PodcastEpisode);
