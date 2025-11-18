import { addGlobalStylesToShadowRoot } from "./global_styles.js";
import { PodcastCard } from "./podcast-card.js";
import { PodcastEpisode } from "./podcast-episode.js";

//////////////////////////////////////////
// Responsive Carousel for displaying podcast or episode cards
//////////////////////////////////////////

export class PodcastCarousel extends HTMLElement {
    constructor() {
        super();

        // Bind the handleResize method to the class instance so it refers to the PodcastCarousel component when called as an event listener
        this.handleResize = this.handleResize.bind(this);

        this.podcastCardWidth = 200;
        this.podcastCardGap = 10;
        this.animationTime = 200;

        this.attachShadow({ mode: 'open' });

        // the components basic html structure
        this.shadowRoot.innerHTML = /*html*/`
        <section id="podcast-carousel" class="carousel slide" data-bs-ride="true">
            <div id="carousel-indicators" class="carousel-indicators">
            </div>
            <div class="carousel-inner" id="podcast-list">
            </div>
            <button class="carousel-control-prev" type="button" data-bs-target="#podcast-carousel" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#podcast-carousel" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Next</span>
            </button>
        </section>
        `;

        // the components css styles
        const style = document.createElement('style');
        style.textContent = /*css*/`
            #podcast-list {
                display: flex;
                flex-direction: row;
                flex-wrap: nowrap;
                justify-content: center;
                gap: ${this.podcastCardGap}px;
                min-height: ${this.podcastCardWidth}px;
            }
            podcast-card {
                width: ${this.podcastCardWidth}px;
            }
            podcast-episode {
                width: ${this.podcastCardWidth}px;
                min-width: ${this.podcastCardWidth}px;
                max-width: ${this.podcastCardWidth}px;
            }
            .card {
                transition: transform 0.2s, border-color 0.5s;
            }
            .card:hover {
                border-color: black;
                transform: scale(1.02);
            }
            #podcast-carousel {
                margin-bottom: 40px;
            }
            .carousel-indicators {
                position: absolute !important;
                top: calc(100%) !important;
            }
            .carousel-inner {
                padding: 10px;
                min-height: 150px;
            }
            .item {
                @starting-style {
                    opacity: 0;
                    display: none;
                }            
                opacity: 0;
                display: none;
                // transition: opacity ${this.animationTime}ms, display ${this.animationTime}ms;
                // transition-behavior: allow-discrete; 
            }
            .item.active {
                opacity: 1;
                display: block;
            }
            .carousel-control-next, .carousel-control-prev {
                background-color: var(--bs-secondary) !important;
                opacity: 0.5 !important;
                width: 50px !important;
                height: 50px !important;
                position: absolute !important;
                top: calc(50% - 25px) !important;
            }
            .carousel-control-next:hover, .carousel-control-prev:hover {
                background-color: var(--bs-gray-800) !important;
                opacity: 0.5 !important;
            }
            .carousel-control-next:active, .carousel-control-prev:active {
                background-color: var(--bs-gray-800) !important;
                opacity: 0.5 !important;
            }
            .carousel-control-prev {
                left: 0 !important;
            }
            .carousel-control-next {
                right: 0 !important;
            }
            .carousel-indicators > button {
                background-color: var(--bs-secondary) !important;
            }
            .carousel-indicators > button.active {
                background-color: var(--bs-primary) !important;
            }
            #loading-indicator {
                position: absolute;
                width: 100px;
                top: 25%;
                left: calc(50% - 50px);
                z-index: 1000;
            }
        `;

        addGlobalStylesToShadowRoot(this.shadowRoot);

        this.shadowRoot.appendChild(style);

        const script = document.createElement('script');
        script.src = '/scripts/bootstrap.bundle.min.js';
        this.shadowRoot.appendChild(script);

        this.items = [];
    }

    connectedCallback() {
        this.shadowRoot.querySelector('.carousel-control-next').addEventListener('click', () => {
            this.nextPage();
        });
        this.shadowRoot.querySelector('.carousel-control-prev').addEventListener('click', () => {
            this.prevPage();
        });
        window.addEventListener('resize', this.handleResize);
    }

    disconnectedCallback() {
        window.removeEventListener('resize', this.handleResize);
    }

    handleResize(event) {
        this.generateViews();
    }

    setToLoadingIndicator() {
        this.shadowRoot.getElementById('podcast-list').innerHTML = /*html*/`
            <img id="loading-indicator" src="/assets/images/podcast_blue.svg" class="loading-indicator">
        `;
    }

    removeLoadingIndicator() {
        const loadingIndicator = this.shadowRoot.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }

    clear() {
        this.shadowRoot.getElementById('podcast-list').innerHTML = '';
        this.shadowRoot.getElementById('carousel-indicators').innerHTML = '';
    }

    addPodcast(podcast) {
        this.items.push(podcast);

        const podcastCard = new PodcastCard();
        podcastCard.setAttribute('title', podcast.title);
        podcastCard.setAttribute('image', podcast.layoutImageURL);
        podcastCard.setAttribute('id', podcast.id);
        podcastCard.classList.add('item');

        const podcastDescription = document.createElement('div');
        podcastDescription.innerHTML = podcast.description;
        podcastDescription.setAttribute('slot', 'description');
        podcastCard.appendChild(podcastDescription);

        this.shadowRoot.getElementById('podcast-list').appendChild(podcastCard);
    }

    addEpisode(episode) {
        this.items.push(episode);

        const podcastEpisode = new PodcastEpisode();
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

        podcastEpisode.classList.add('item');

        this.shadowRoot.getElementById('podcast-list').appendChild(podcastEpisode);
    }

    findElementInItemsById(id) {
        for (const item of this.items) {
            if (item.id == id) {
                return item;
            }
        }
        return null;
    }

    removeElement(id) {
        const element = this.shadowRoot.getElementById(id);
        if (element) {
            element.remove();

            const index = this.items.indexOf(this.findElementInItemsById(id));
            if (index) {
                this.items.splice(index, 1);
            }
        }
        this.generateViews();
    }

    nextPage() {
        let page = 1;
        if (this.currentPage < this.numRequiredSlides) {
            page = this.currentPage + 1;
        }
        this.generateViews(page);
    }

    prevPage() {
        let page = this.numRequiredSlides;
        if (this.currentPage > 1) {
            page = this.currentPage - 1;
        }
        this.generateViews(page);
    }

    generateViews(page = 1) {
        const totalWidth = this.shadowRoot.getElementById('podcast-carousel').clientWidth;
        if (totalWidth === 0) {
            return;
        }
        this.totalNumPodcasts = this.items.length;
        this.numPodcastsPerSlide = Math.max(Math.floor(totalWidth / (this.podcastCardWidth + this.podcastCardGap)), 1);
        this.numRequiredSlides = Math.ceil(this.totalNumPodcasts / this.numPodcastsPerSlide);
        this.currentPage = page;

        this.#generateCarouselIndicators(page);
        this.#updateShownCarouselItems(page);
    }

    #generateCarouselIndicators(page) {
        const carouselIndicators = this.shadowRoot.getElementById('carousel-indicators');
        carouselIndicators.innerHTML = '';
        for (let slide = 1; slide <= this.numRequiredSlides; slide++) {
            const indicator = document.createElement('button');
            indicator.setAttribute('type', 'button');
            indicator.setAttribute('data-bs-target', '#podcast-carousel');
            if (slide === page) {
                indicator.classList.add('active');
                indicator.setAttribute('aria-current', 'true');
            }
            indicator.setAttribute('aria-label', `Slide ${slide}`);
            indicator.addEventListener('click', () => {
                this.generateViews(slide);
            });
            carouselIndicators.appendChild(indicator);
        }
    }

    #updateShownCarouselItems(page) {
        this.shadowRoot.querySelectorAll('.item').forEach((card, index) => {
            if ((index >= (page - 1) * this.numPodcastsPerSlide) && (index < page * this.numPodcastsPerSlide)) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

}

customElements.define('podcast-carousel', PodcastCarousel);
