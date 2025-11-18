import { GlobalState } from "./global-state.js";
import { addGlobalStylesToShadowRoot } from "./global_styles.js";
import { PodcastList } from "./podcast-list.js";

//////////////////////////////////////////
// Main component that displays the categories and the podcasts in a category
//////////////////////////////////////////

export class PodcastCategories extends HTMLElement {
    constructor() {
        super();

        const shadow = this.attachShadow({ mode: 'open' });

        // the components basic html structure
        this.shadowRoot.innerHTML = /*html*/`
            <ul id="categories"></ul>
            <h1 id="category-title"></h1>
            <podcast-list id="podcast-list" class="m-1"></podcast-list>
        `;

        // the components css styles
        const style = document.createElement('style');
        style.textContent = /*css*/`
            ul {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                padding-top: 10px;
                margin-bottom: 10px;
            }
            .badge {
                transition: transform 0.2s;
            }
            .badge:hover {
                transform: scale(1.05);
            }
            .badge.active {
                text-decoration: underline;
            }
        `;

        addGlobalStylesToShadowRoot(this.shadowRoot);
        this.shadowRoot.appendChild(style);

        this.createCategoryBadges();
    }

    // returns the id of the category from the url
    id() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    connectedCallback() {
        const podcastList = this.shadowRoot.getElementById('podcast-list');

        const id = this.id();
        if (id) {
            podcastList.setToLoadingIndicator();
            this.shadowRoot.getElementById('category-title').textContent = GlobalState.getCategoryString(id);
            this.fetchPodcasts(id);
        }
    }

    // creates a badge element for a category or subcategory
    createBadge(category_id) {
        const badgeElement = document.createElement('span')
        badgeElement.classList.add('badge', 'text-bg-primary');
        if (this.id() == category_id) {
            badgeElement.classList.add('active');
        }
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

    // creates the badges for all categories and subcategories
    createCategoryBadges() {
        const categoryList = this.shadowRoot.getElementById('categories');
        const categories = GlobalState.getCategories();
        for (const category of categories) {
            const badge = this.createBadge(category.id);
            categoryList.appendChild(badge);
            if (category.subcategories) {
                for (const subcategory of category.subcategories) {
                    const badge = this.createBadge(subcategory.id);
                    // display subcategories with grey background
                    badge.classList.add('bg-secondary');
                    categoryList.appendChild(badge);
                }
            }
        }
    }


    async fetchPodcasts(id) {
        let url = new URL('https://api.fyyd.de/0.2/category/');
        url.searchParams.append('category_id', id);

        try {
            const response = await fetch(url);
            const data = await response.json();

            this.insertSearchResults(data);
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

        for (let podcast of data.data.podcasts) {
            podcastList.addPodcast(podcast);
        };

        // Save state with dynamically inserted content in History
        const state = {
            searchTitle: this.shadowRoot.getElementById('search-title').value,
            podcastList: podcastList.innerHTML
        };
    }

}

customElements.define('podcast-categories', PodcastCategories);