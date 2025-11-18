import { addGlobalStylesToShadowRoot } from "./global_styles.js";

//////////////////////////////////////////
// Responsive header and navigation component.
//////////////////////////////////////////

export class PodcastHeader extends HTMLElement {
    constructor() {
        super();

        const shadow = this.attachShadow({ mode: 'open' });

        // the components basic html structure
        shadow.innerHTML = /*html*/`
        <link rel="stylesheet" type="text/css" href="styles/bootstrap.css">
        <nav class="navbar navbar-expand-sm navbar-dark text-bg-primary">
            <div class="container-fluid">
                <div>
                    <a href="?page=start" class="navbar-brand" id="brand">
                        <img src="assets/images/podcast_white.svg" alt="podcast logo">
                        WMP Where's My Podcast
                    </a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                </div>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav">
                        <li class="nav-item">
                            <a href="?page=start" class="nav-link" id="start-link">Start</a>
                        </li>
                        <li class="nav-item">
                            <a href="?page=search" class="nav-link" >Search</a>
                        </li>
                        <li class="nav-item">
                            <a href="?page=favorites" class="nav-link" >Favorites</a>
                        </li>
                        <li class="nav-item">
                            <a href="?page=recommendations" class="nav-link" >Recommendations</a>
                        </li>
                        <li class="nav-item">
                            <a href="?page=categories" class="nav-link" >Categories</a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
        `;

        // the components css styles
        const style = document.createElement('style');
        style.textContent = /*css*/`
            :host {
                width: 100%;
            }
        	nav {
                display: flex;
                gap: 5px;
                align-items: center;
                width: 100%;
        	}
            nav > a {
                flex-basis: 100px;
                flex-grow: 0;
                flex-shrink: 0;
            }
            nav > a:first-child {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                flex-basis: 300px;
                flex-grow: 1;
                flex-shrink: 0;
                color: black;
                font-weight: bold;
                font-size: 1.5rem;
                text-decoration: none;
            }
            .navbar-toggler {
                position: absolute;
                right: 10px;
            }
            #navbarNav {
                z-index: 1030;
            }
            .navbar-brand {
                font-weight: bold;
                display: inline-flex;
                align-items: center;
                gap: 5px;
            }
            .active {
                border-bottom: 2px solid white !important;
            }
            @media (max-width: 750px) and (min-width: 576px) {
                .container-fluid {
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start !important;
                }
            }
        `;

        shadow.appendChild(style);
        addGlobalStylesToShadowRoot(this.shadowRoot);

        this.shadowRoot.querySelector('.navbar-toggler').addEventListener('click', () => {
            this.toggleMenu();
        });
    }

    // hides the menu
    // required because bootstrap's JavaScript does not work with shadow dom
    hideMenu() {
        const toggleButton = this.shadowRoot.querySelector('.navbar-toggler');
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
        if (isExpanded) {
            const collapseContent = this.shadowRoot.querySelector('#navbarNav');

            toggleButton.setAttribute('aria-expanded', false);
            collapseContent.classList.toggle('show', false);
        }
    }

    // shows or hides the menu when the toggler is clicked
    toggleMenu() {
        const toggleButton = this.shadowRoot.querySelector('.navbar-toggler');
        const collapseContent = this.shadowRoot.querySelector('#navbarNav');

        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
        toggleButton.setAttribute('aria-expanded', !isExpanded);
        collapseContent.classList.toggle('show', !isExpanded);
    }

    connectedCallback() {
        this.shadowRoot.querySelectorAll('ul > li > a').forEach((element) => {
            element.addEventListener('click', (event) => {
                window.openNavigationLink(event);
                this.shadowRoot.querySelectorAll('ul > li > a').forEach((element) => {
                    element.classList.remove('active');
                });
                event.target.classList.add('active');
                this.hideMenu()
            });
        });
        this.shadowRoot.getElementById('brand').addEventListener('click', (event) => {
            window.openNavigationLink(event);
            this.shadowRoot.querySelectorAll('ul > li > a').forEach((element) => {
                element.classList.remove('active');
            });
            this.shadowRoot.getElementById('start-link').classList.add('active');
            this.hideMenu()
        });

        this.initLinksStyleFromUrl();
    }

    // highlights the currently active link based on the url
    initLinksStyleFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const pageParam = urlParams.get('page');
        if (pageParam) {
            this.shadowRoot.querySelectorAll('ul > li > a').forEach((element) => {
                if (element.href.includes(pageParam)) {
                    element.classList.add('active');
                } else {
                    element.classList.remove('active');
                }
            });
        } else {
            this.shadowRoot.getElementById('start-link').classList.add('active');
        }
    }
}

customElements.define('podcast-header', PodcastHeader);