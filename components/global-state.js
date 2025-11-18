//////////////////////////////////////////
// This component handles the state of the application that is shared between components.
// The state is stored in the local storage of the browser.
//////////////////////////////////////////

export class GlobalState {
    constructor() {
        // super();
    }

    static clear() {
        window.localStorage.clear();
    }

    // initialize the local storage with some default values
    static async setup() {
        // Add categories
        try {
            const response = await fetch('https://api.fyyd.de/0.2/categories/');
            const data = await response.json();
            window.localStorage.setItem('categories', JSON.stringify(data.data));
        }
        catch (error) {
            // Handle the error
        }

        // Add Set for favorites
        if (!window.localStorage.getItem('favorites')) {
            const emptySet = new Set();
            window.localStorage.setItem('favorites', JSON.stringify(Array.from(emptySet)));
        }

        // Add queue for episodes
        if (!window.localStorage.getItem('queue')) {
            const emptySet = new Set();
            window.localStorage.setItem('queue', JSON.stringify(Array.from(emptySet)));
        }
    }

    //////////////////////////////////////////
    // Categories
    //////////////////////////////////////////

    // returns the name of a category or subcategory based on the id
    static getCategoryString(category_id) {
        const categories = this.getCategories();
        for (let category of categories) {
            if (category.subcategories) {
                for (let subcategory of category.subcategories) {
                    if (subcategory.id == category_id) {
                        return subcategory.name;
                    }
                }
            }
            if (category.id == category_id) {
                return category.name;
            }
        }
        return null;
    }

    // returns the object that contains all categories or subcategories
    static getCategories() {
        const categories = window.localStorage.getItem('categories');
        return JSON.parse(categories);
    }

    //////////////////////////////////////////
    // Favorites
    //////////////////////////////////////////

    // returns the favorites as a Set
    static getFavorites() {
        const array = JSON.parse(window.localStorage.getItem('favorites'));
        const favorites = new Set(array);
        return favorites;
    }

    // adds a podcast to the favorites
    // a "favorites-changed" event is dispatched with the id of the added podcast
    static addPodcastToFavorites(podcast_id) {
        const podcast_id_string = podcast_id.toString();
        const favorites = this.getFavorites();
        favorites.add(podcast_id_string);
        window.localStorage.setItem('favorites', JSON.stringify(Array.from(favorites)));

        const event = new CustomEvent('favorites-changed', {
            detail: {
                command: 'added',
                podcastId: podcast_id
            }
        });
        window.dispatchEvent(event);
    }

    // removes a podcast from the favorites
    // a "favorites-changed" event is dispatched with the id of the removed podcast
    static removePodcastFromFavorites(podcast_id) {
        const podcast_id_string = podcast_id.toString();
        const favorites = this.getFavorites();
        favorites.delete(podcast_id_string);
        window.localStorage.setItem('favorites', JSON.stringify(Array.from(favorites)));

        const event = new CustomEvent('favorites-changed', {
            detail: {
                command: 'removed',
                podcastId: podcast_id
            }
        });
        window.dispatchEvent(event);
    }

    // adds or removes a podcast from the favorites
    // a "favorites-changed" event is dispatched with the id of the added or removed podcast
    static togglePodcastInFavorites(podcast_id) {
        const podcast_id_string = podcast_id.toString();
        const favorites = this.getFavorites();
        let command = '';
        if (favorites.has(podcast_id_string)) {
            favorites.delete(podcast_id_string);
            command = 'removed';
        } else {
            favorites.add(podcast_id_string);
            command = 'added';
        }
        window.localStorage.setItem('favorites', JSON.stringify(Array.from(favorites)));

        const event = new CustomEvent('favorites-changed', {
            detail: {
                command: command,
                podcastId: podcast_id
            }
        });
        window.dispatchEvent(event);

        return favorites.has(podcast_id_string);
    }

    // returns true if a podcast is in the favorites
    static isFavoritePodcast(podcast_id) {
        const favorites = this.getFavorites();
        return favorites.has(podcast_id.toString());
    }

    //////////////////////////////////////////
    // Episode queue
    //////////////////////////////////////////

    // returns the ids of the queued episodes as a Set
    static getEpisodeQueue() {
        const array = JSON.parse(window.localStorage.getItem('queue'));
        const queue = new Set(array);
        return queue;
    }

    // adds an episode to the queue
    // a "queue-changed" event is dispatched with the id of the added episode
    static addEpisodeToQueue(episode_id) {
        const episode_id_string = episode_id.toString();
        const queue = this.getEpisodeQueue();
        queue.add(episode_id_string);
        window.localStorage.setItem('queue', JSON.stringify(Array.from(queue)));

        const event = new CustomEvent('queue-changed', {
            detail: {
                command: 'added',
                episodeId: episode_id
            }
        });
        window.dispatchEvent(event);
    }

    // removes an episode from the queue
    // a "queue-changed" event is dispatched with the id of the removed episode
    static removeEpisodeFromQueue(episode_id) {
        const episode_id_string = episode_id.toString();
        const queue = this.getEpisodeQueue();
        if (queue.has(episode_id_string)) {
            queue.delete(episode_id_string);
            window.localStorage.setItem('queue', JSON.stringify(Array.from(queue)));

            const event = new CustomEvent('queue-changed', {
                detail: {
                    command: 'removed',
                    episodeId: episode_id
                }
            });
            window.dispatchEvent(event);
        }
    }

    // returns true if an episode is in the queue
    static isEpisodeInQueue(episode_id) {
        const queue = this.getEpisodeQueue();
        return queue.has(episode_id.toString());
    }

    // adds or removes an episode from the queue
    // a "queue-changed" event is dispatched with the id of the added or removed episode
    static toggleEpisodeInQueue(episode_id) {
        const episode_id_string = episode_id.toString();
        const queue = this.getEpisodeQueue();
        let command = '';

        if (queue.has(episode_id_string)) {
            queue.delete(episode_id_string);
            command = 'removed';
        } else {
            queue.add(episode_id_string);
            command = 'added';
        }
        window.localStorage.setItem('queue', JSON.stringify(Array.from(queue)));

        const event = new CustomEvent('queue-changed', {
            detail: {
                command: command,
                episodeId: episode_id
            }
        });
        window.dispatchEvent(event);

        return queue.has(episode_id_string);
    }


}
