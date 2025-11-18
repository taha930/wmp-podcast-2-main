import { addGlobalStylesToShadowRoot } from "./global_styles.js";
import { PodcastCard } from "./podcast-card.js";

//////////////////////////////////////////
// Component that displays a list of podcasts as cards in a responsive way
//////////////////////////////////////////

export class PodcastList extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({ mode: 'open' });

        // the components basic html structure
        this.shadowRoot.innerHTML = /*html*/`
        <section id="podcast-list"></section>
        `;

        // the components css styles
        const style = document.createElement('style');
        style.textContent = /*css*/`
            #podcast-list {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                justify-content: center;
                gap: 10px;
            }
            podcast-card {
                width: 300px;
            }
            .card {
                transition: transform 0.2s, border-color 0.5s;
            }
            .card:hover {
                border-color: black;
                transform: scale(1.02);
            }
            #loading-indicator {
                position: relative;
                width: 100px;
                top: 25%;
                z-index: 1000;
            }
        `;

        addGlobalStylesToShadowRoot(this.shadowRoot);

        this.shadowRoot.appendChild(style);
    }

    setToLoadingIndicator() {
        this.shadowRoot.getElementById('podcast-list').innerHTML = /*html*/`
<img id="loading-indicator" src="/assets/images/podcast_blue.svg" class="loading-indicator">
        `;
    }

    removeLoadingIndicator() {
        this.shadowRoot.getElementById('loading-indicator').remove();
    }

    clear() {
        this.shadowRoot.getElementById('podcast-list').innerHTML = '';
    }

    addPodcast(podcast) {
        const podcastCard = new PodcastCard();
        podcastCard.setAttribute('title', podcast.title);
        podcastCard.setAttribute('image', podcast.layoutImageURL);
        podcastCard.setAttribute('id', podcast.id);

        const podcastDescription = document.createElement('div');
        podcastDescription.innerHTML = podcast.description;
        podcastDescription.setAttribute('slot', 'description');
        podcastCard.appendChild(podcastDescription);

        this.shadowRoot.getElementById('podcast-list').appendChild(podcastCard);
    }

}

customElements.define('podcast-list', PodcastList);
