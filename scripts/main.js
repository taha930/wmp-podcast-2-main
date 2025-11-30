"use strict";

import { PodcastStartpage } from '../components/podcast-startpage.js';
import { PodcastRecommendations } from '../components/podcast-recommendations.js';
import { PodcastFavorites } from '../components/podcast-favorites.js';
import { PodcastSearch } from '../components/podcast-search.js';
import { PodcastDetails } from '../components/podcast-details.js';
import { PodcastEpisodeDetails } from '../components/podcast-episode-details.js';
import { GlobalState } from '../components/global-state.js';
import { PodcastCategories } from '../components/podcast-categories.js';

//////////////////////////////////////////
// Add some global functions to window so they can be used in other components
//////////////////////////////////////////

// This functions is used for navigation when clicking on a link.
// It prevents the page from reloading and instead switches the main component.
// In addition, it stores the new url in the browser history.
window.openNavigationLink = function (event) {
    event.preventDefault();

    let target = event.target;
    if (target.tagName != 'a') {
        target = target.closest('a');
    }
    window.history.pushState(null, "navigation", target.href);
    switchMainComponent(getComponentForPage(target.href));
    getHeaderComponent().initLinksStyleFromUrl();
}

window.switchMainComponent = function (component) {
    if (!component) {
        return;
    }

    const main = document.getElementById('main-content');
    while (main.lastElementChild) {
        main.removeChild(main.lastElementChild);
    }

    component.setAttribute('id', 'main-component');
    main.appendChild(component);
}

window.getPlayerComponent = function () {
    return document.getElementById('footer-content').firstElementChild;
}

window.getHeaderComponent = function () {
    return document.getElementById('header-content').firstElementChild;
}

window.switchTheme = function () {
    // get current theme
    // switch to the other theme
}

window.showEpisodeDetails = function (id) {
    const modal = new PodcastEpisodeDetails();
    document.getElementById('main-content').appendChild(modal);
}

//////////////////////////////////////////
// functions that change the theme (experimental, currently not used in the project)
//////////////////////////////////////////

function removeTheme() {
    const links = document.getElementsByTagName("link");
    for (const link of links) {
        if (link.href.includes("theme")) {
            link.parentNode.removeChild(link);
        }
    }
}

function loadTheme(name) {
    removeTheme();

    let link = document.createElement("link");
    link.href = "/styles/" + name + ".css";
    link.type = "text/css";
    link.rel = "stylesheet";
    link.media = "screen,print";

    document.getElementsByTagName("head")[0].appendChild(link);
}

//////////////////////////////////////////
// Event listeners
//////////////////////////////////////////

// Handle navigation through the history (back and forward buttons)
window.addEventListener('popstate', (event) => {
    initStateFromUrl();
});

window.addEventListener('load', () => {
    // loadTheme('light-theme');
    initStateFromUrl();
    GlobalState.setup();
});

//////////////////////////////////////////
// Functions that handle the main component switching 
//////////////////////////////////////////

// switches the main component based on the current url
function initStateFromUrl() {
    switchMainComponent(getComponentForPage(document.location.toString()));
    getHeaderComponent().initLinksStyleFromUrl();
}

function getComponentForPage(page) {
    if (page.includes('search')) {
        return new PodcastSearch();
    } else
        if (page.includes('favorites')) {
            return new PodcastFavorites();
        } else
            if (page.includes('recommendations')) {
                return new PodcastRecommendations();
            } else
                if (page.includes('categories')) {
                    return new PodcastCategories();
                } else
                    if (page.includes('podcast')) {
                        return new PodcastDetails();
                    } else
                        if (page.includes('episode')) {
                            return new PodcastEpisodeDetails();
                        } else {
                            return new PodcastStartpage();
                        }
}