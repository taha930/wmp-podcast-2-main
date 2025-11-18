import { addGlobalStylesToShadowRoot } from "./global_styles.js";
import { GlobalState } from "./global-state.js";

//////////////////////////////////////////
// Card for displaying a podcast
//////////////////////////////////////////

export class PodcastCard extends HTMLElement {
    constructor() {
        super();

        // Bind the updateFavoriteStatus method to the class instance so it refers to the PodcastCard component when called as an event listener
        this.updateFavoriteStatus = this.updateFavoriteStatus.bind(this);

        this.attachShadow({ mode: 'open' });

        // the components basic html structure
        this.shadowRoot.innerHTML = /*html*/`
<div id="podcast" class="card">
        <img id="podcast-image" class="card-img-to rounded" alt="podcast image" href="/assets/images/podcast_black.svg">
        <div class="card-body">
            <div class="card-title">
                <h4 id="title" class="text-truncate m-0" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Title">Title</h4>
                <img id="favorite" src="/assets/images/favorite_blue_empty.svg" alt="add/remove to/from favorites" title="add/remove to/from favorites">
            </div>
            <p class="card-text">
                <slot name="description">No description available</slot>
            </p>
            <a id="podcast-link" href="/?page=podcast" class="link-primary stretched-link">Show details</a>
        </div>
</div>
        `;

        // the components css styles
        const style = document.createElement('style');
        style.textContent = /*css*/`
            .card {
                transition: transform 0.2s, border-color 0.2s;
            }
            .card:hover {
                border-color: black;
                transform: scale(1.02);
            }
            .card-title {
                overflow: hidden;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            #podcast-image {
                height: 100%;
                width: 100%;
                object-fit: cover;
            }
            #favorite {
                z-index: 2; // this makes the image clickable when using stretched-link
                height: auto;
                cursor: pointer;
                min-width: 2em;
                max-width: 2em;
            }
            #favorite:hover {
                transform: scale(1.2);
                transition: transform 0.2s;
            }
            .card-text {
                height: 3rem;
                display: -webkit-box;
                -webkit-line-clamp: 2; /* Number of lines */
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        `;

        addGlobalStylesToShadowRoot(this.shadowRoot);

        this.shadowRoot.appendChild(style);
    }

    static get observedAttributes() {
        return ['title', 'image', 'id'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'title') {
            this.shadowRoot.getElementById('title').textContent = newValue;
            this.shadowRoot.getElementById('title').setAttribute('data-bs-title', newValue);
        }
        if (name === 'id') {
            this.shadowRoot.querySelector('a').href = `?page=podcast&id=${newValue}`;
            if (GlobalState.isFavoritePodcast(newValue)) {
                this.shadowRoot.getElementById('favorite').src = '/assets/images/favorite_blue_filled.svg';
            } else {
                this.shadowRoot.getElementById('favorite').src = '/assets/images/favorite_blue_empty.svg';
            }
        }
        if (name === 'image') {
            const imgElement = this.shadowRoot.getElementById('podcast-image');
            if (newValue) {
                imgElement.src = newValue;
                imgElement.onerror = () => {
                    imgElement.src = '/assets/images/podcast_black.svg';
                };
            } else {
                imgElement.src = '/assets/images/podcast_black.svg';
            }
        }
    }

    connectedCallback() {
        this.shadowRoot.getElementById('favorite').addEventListener('click', (event) => {
            const isFavorite = GlobalState.togglePodcastInFavorites(this.getAttribute('id'));
            if (isFavorite) {
                this.shadowRoot.getElementById('favorite').src = '/assets/images/favorite_blue_filled.svg';
            } else {
                this.shadowRoot.getElementById('favorite').src = '/assets/images/favorite_blue_empty.svg';
            }
        });
        this.shadowRoot.getElementById('podcast-link').addEventListener('click', (event) => {
            window.openNavigationLink(event);
        });

        window.addEventListener('favorites-changed', this.updateFavoriteStatus);
    }

    disconnectedCallback() {
        window.removeEventListener('favorites-changed', this.updateFavoriteStatus);
    }

    updateFavoriteStatus(event) {
        console.log('updateFavoriteStatus', event);
        if (event.detail.podcastId === this.getAttribute('id')) {
            if (event.detail.command === 'added') {
                this.shadowRoot.getElementById('favorite').src = '/assets/images/favorite_blue_filled.svg';
            } else {
                this.shadowRoot.getElementById('favorite').src = '/assets/images/favorite_blue_empty.svg';
            }
        }
    }

}

customElements.define('podcast-card', PodcastCard);
