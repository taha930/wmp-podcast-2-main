import { addGlobalStylesToShadowRoot } from "./global_styles.js";
import { GlobalState } from "./global-state.js";
import { PodcastPlaylist } from "./podcast-playlist.js";

//////////////////////////////////////////
// The component for playing podcast episodes
//////////////////////////////////////////

export class PodcastPlayer extends HTMLElement {
    constructor() {
        super();

        this.player = new Audio();
        this.currentEpisodeId = null;

        const shadow = this.attachShadow({ mode: 'open' });

        // The components basic html structure
        shadow.innerHTML = /*html*/`
            <div class="text-bg-primary p-1 m-0">
                <section id="controls">
                    <button id="prev-button" class="rounded">
                        <img src="/assets/images/skip_prev_blue.svg" alt="previous" title="previous">
                    </button>
                    <button id="skip-backward-button" class="rounded">
                        <img src="/assets/images/backward_blue.svg" alt="go back 10 s" title="go back 10 s">
                    </button>
                    <button id="play-pause-button" class="rounded">
                        <img src="/assets/images/play_blue.svg" alt="play" title="play">
                    </button>
                    <button id="skip-forward-button" class="rounded">
                        <img src="/assets/images/forward_blue.svg" alt="skip 30 s" title="skip 30 s">
                    </button>
                    <button id="next-button" class="rounded">
                        <img src="/assets/images/skip_next_blue.svg" alt="next" title="next">
                    </button>
                    <button id="playlist-button" class="rounded">
                        <img src="/assets/images/playlist_white.svg" alt="show queue" title="show queue">
                    </button>
                </section>
                <section id="progress">
                    <span id="current-time">00:00:00</span>
                    <span class="progress">
                        <div id="progress-bar" class="progress-bar bg-secondary" role="progressbar" aria-label="Success example" style="width: 0%" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                    </span>
                    <span id="duration">00:00:00</span>
                </section>
                <section id="info">
                    <span id="source" class="p-0 m-0">No episode loaded</span>
                    <a id="episode-link" href="/?page=episode">
                        <img src="/assets/images/link_white.svg" alt="show episode details" title="show episode details">
                    </a>
                </section>
                <podcast-playlist class="rounded"></podcast-playlist>
            </div>
        `;

        // The components css styles
        const style = document.createElement('style');
        style.textContent = /*css*/`
            :host {
                width: 100%;
                padding: 0;
                margin: 0;
            }
            section {
                width: 100%;
                display: inline-flex;
                gap: 5px;
                align-items: center;
                justify-content: center;
                padding: 3px;
            }
            button {
                background-color: white;
                border: none;
                transition: transform 0.2s;
                width: 48px;
                height: 32px;
            }
            button:hover {
                transform: scale(1.05);
            }
            button:active {
                box-shadow: inset 1px 1px 5px 1px rgba(0, 0, 0, 0.2);
            }
            button img {
                padding: 0;
                margin: 0;
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
            #playlist-button {
                background: none;
                position: absolute;
                right: 20px;
                border: none;
                transition: transform 0.2s;
                width: 48px;
                height: 32px;
            }
            #info {
                height: 1.5em;
                min-height: 1.5em;
                max-height: 1.5em;
            }
            #info img {
                width: 1em;
                margin-left: 10px;
                cursor: pointer;
            }
            #info img:hover {
                transform: scale(1.2);
                transition: transform 0.2s;
            }
            #source {
                height: 1.5em;
                min-height: 1.5em;
                max-height: 1.5em;
            }
            .progress {
                width: 100%;
            }
            #progress {
                width: 100%;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 10px;
            }
            podcast-playlist {
                position: absolute;
                right: 25px;
                bottom: 100px;
                overflow-y: scroll;
                max-height: 50vh;
                max-width: 50vw;
                visibility: hidden;
                opacity: 0;
                transition: opacity 0.2s, visibility 0.2s;
                transition-behavior: allow-discrete;
                box-shadow: 0 0 16px 4px rgba(0, 0, 0, 0.2);
            }
        `;

        addGlobalStylesToShadowRoot(this.shadowRoot);

        shadow.appendChild(style);

        // Listen for when the audio starts playing
        this.player.addEventListener('canplay', () => {
            this.shadowRoot.getElementById('duration').textContent = this.#formatDuration(this.player.duration);
            this.play();
        });
        // Listen for the current time of the audio
        this.player.addEventListener('timeupdate', () => {
            this.shadowRoot.getElementById('current-time').textContent = this.#formatDuration(this.player.currentTime);
            this.shadowRoot.getElementById('progress-bar').style.width = `${(this.player.currentTime / this.player.duration) * 100}%`;
        });
        // Listen for when the audio ends and play the next episode
        this.player.addEventListener('ended', () => {
            const endedEpisode = this.currentEpisodeId;
            this.getNextEpisodeFromQueue();
            GlobalState.removeEpisodeFromQueue(endedEpisode);
        });
    }

    connectedCallback() {
        this.shadowRoot.getElementById('play-pause-button').addEventListener('click', () => {
            if (this.player.paused) {
                if (this.player.src === '') {
                    this.getFirstEpisodeFromQueue();
                } else {
                    this.play();
                }
            } else {
                this.pause();
            }
        });
        this.shadowRoot.getElementById('prev-button').addEventListener('click', () => {
            this.getPreviousEpisodeFromQueue();
        });
        this.shadowRoot.getElementById('next-button').addEventListener('click', () => {
            this.getNextEpisodeFromQueue();
        });
        this.shadowRoot.getElementById('skip-backward-button').addEventListener('click', () => {
            this.player.currentTime = Math.max(this.player.currentTime - 10, 0);

        });
        this.shadowRoot.getElementById('skip-forward-button').addEventListener('click', () => {
            this.player.currentTime = Math.min(this.player.currentTime + 30, this.player.duration);
        });
        this.shadowRoot.getElementById('playlist-button').addEventListener('click', () => {
            const playlist = this.shadowRoot.querySelector('podcast-playlist');
            if (playlist.style.visibility !== 'visible') {
                playlist.style.opacity = 1;
                playlist.style.visibility = 'visible';
            } else {
                playlist.style.opacity = 0;
                playlist.style.visibility = 'hidden';
            }
        });

        this.shadowRoot.getElementById('episode-link').addEventListener('click', (event) => {
            window.openNavigationLink(event);
        });
    }

    // Returns a formatted string of the duration in the format hh:mm:ss
    #formatDuration(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        const formattedHrs = hrs.toString().padStart(2, '0');
        const formattedMins = mins.toString().padStart(2, '0');
        const formattedSecs = secs.toString().padStart(2, '0');

        return `${formattedHrs}:${formattedMins}:${formattedSecs}`;
    }

    // Loads an audio file from an URL
    #loadByURL(url) {
        this.player.src = url;
        this.player.load();
    }

    // Returns the id of the currently loaded episode
    getCurrentEpisodeId() {
        return this.currentEpisodeId;
    }

    // Loads an episode by its id
    async loadByEpisodeId(id) {
        this.currentEpisodeId = String(id);

        if (!id) {
            this.shadowRoot.getElementById('source').textContent = "No episode loaded";
            return;
        }

        let url = new URL('https://api.fyyd.de/0.2/episode/');
        url.searchParams.append('episode_id', id);

        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data) {
                this.shadowRoot.getElementById('source').textContent = /*html*/`
                    ${data.data.title}
                `
                this.shadowRoot.getElementById('episode-link').href = `?page=episode&id=${id}`;
                this.#loadByURL(data.data.enclosure);
            }
        }
        catch (error) {
            // Handle the error
        }
    }

    // Loads the first episode from the episode queue
    getFirstEpisodeFromQueue() {
        const queue = GlobalState.getEpisodeQueue();
        const firstElement = queue.values().next().value;
        if (firstElement) {
            this.loadByEpisodeId(firstElement);
        }
    }

    // If the currently played episode is in the queue, 
    // this loads the previous episode from the episode queue if it exists.
    getPreviousEpisodeFromQueue() {
        const queue = GlobalState.getEpisodeQueue();

        if (!queue.has(this.currentEpisodeId)) {
            this.getFirstEpisodeFromQueue();
            return;
        }

        const iterator = queue.values();
        let previousEpisode = null;
        let episode = iterator.next();

        while (episode.value !== this.currentEpisodeId) {
            previousEpisode = episode;
            episode = iterator.next();
        }

        if (previousEpisode) {
            this.loadByEpisodeId(previousEpisode.value);
        }
    }

    // If the currently played episode is in the queue,
    // this loads the next episode from the episode queue if it exists.
    getNextEpisodeFromQueue() {
        const queue = GlobalState.getEpisodeQueue();

        if (!queue.has(this.currentEpisodeId)) {
            this.getFirstEpisodeFromQueue();
            return;
        }

        const iterator = queue.values();
        let episode = iterator.next();

        while (!episode.done && episode.value !== this.currentEpisodeId) {
            episode = iterator.next();
        }

        this.loadByEpisodeId(iterator.next().value);
    }

    play() {
        this.player.play();
        this.shadowRoot.getElementById('play-pause-button').innerHTML = '<img src="/assets/images/pause_blue.svg" alt="pause" title="pause">';

        const event = new CustomEvent('play', {
            detail: { episodeId: this.currentEpisodeId }
        });
        this.dispatchEvent(event);
    }

    pause() {
        this.player.pause();
        this.shadowRoot.getElementById('play-pause-button').innerHTML = '<img src="/assets/images/play_blue.svg" alt="play" title="play">';
    }

}

customElements.define('podcast-player', PodcastPlayer);