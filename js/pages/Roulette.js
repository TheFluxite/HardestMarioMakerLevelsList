import { fetchList } from '../content.js';
import { getThumbnailFromId, getYoutubeIdFromUrl, shuffle } from '../util.js';

import Spinner from '../components/Spinner.js';
import Btn from '../components/Btn.js';

export default {
    components: { Spinner, Btn },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-roulette">
            <div class="sidebar">
                <p class="type-label-md" style="color: #aaa">
                    Shameless copy of the Extreme Demon Roulette by <a href="https://matcool.github.io/extreme-demon-roulette/" target="_blank">matcool</a>.
                </p>
                <form class="options">
                    <div class="check">
                        <input type="checkbox" id="main" value="Main List" v-model="useMainList">
                        <label for="main">Main List</label>
                    </div>
                    <div class="check">
                        <input type="checkbox" id="extended" value="Extended List" v-model="useExtendedList">
                        <label for="extended">Extended List</label>
                    </div>
                    <Btn @click.native.prevent="onStart">{{ levels.length === 0 ? 'Start' : 'Restart'}}</Btn>
                </form>
                <p class="type-label-md" style="color: #aaa">
                    The roulette saves automatically.
                </p>
                <form class="save">
                    <p>Manual Load/Save</p>
                    <div class="btns">
                        <Btn @click.native.prevent="onImport">Import</Btn>
                        <Btn :disabled="!isActive" @click.native.prevent="onExport">Export</Btn>
                    </div>
                </form>
            </div>
            <section class="levels-container">
                <div class="levels">
                    <template v-if="levels.length > 0">
                        <!-- Completed Levels -->
                        <div class="level" v-for="(level, i) in levels.slice(0, progression.length)" :key="'done-'+i">
                            <a :href="level.video" class="video" target="_blank">
                                <img :src="getThumbnailFromId(getYoutubeIdFromUrl(level.video))" alt="">
                            </a>
                            <div class="meta">
                                <p>#{{ level.rank }}</p>
                                <h2>{{ level.name }}</h2>
                                <p style="color: #00b54b; font-weight: 700">Completed</p>
                            </div>
                        </div>

                        <!-- Current Level -->
                        <div class="level" v-if="!hasCompleted && currentLevel" :key="'current'">
                            <a :href="currentLevel.video" target="_blank" class="video">
                                <img :src="getThumbnailFromId(getYoutubeIdFromUrl(currentLevel.video))" alt="">
                            </a>
                            <div class="meta">
                                <p>#{{ currentLevel.rank }}</p>
                                <h2>{{ currentLevel.name }}</h2>
                                <p>{{ currentLevel.id }}</p>
                            </div>
                            <form class="actions" v-if="!givenUp">
                                <Btn @click.native.prevent="onComplete">Complete</Btn>
                                <Btn @click.native.prevent="onGiveUp" style="background-color: #e91e63;">Give Up</Btn>
                            </form>
                        </div>

                        <!-- Results -->
                        <div v-if="givenUp || hasCompleted" class="results">
                            <h1>Results</h1>
                            <p>Number of levels completed: {{ progression.length }}</p>
                            <p>Target: {{ target }}</p>
                            <p v-if="hasCompleted" style="color: #00b54b; font-weight: 700">
                                {{ completionMessage }}
                            </p>
                            <Btn v-if="givenUp && progression.length < target" @click.native.prevent="showRemaining = true">Show remaining levels</Btn>
                        </div>

                        <!-- Remaining Levels -->
                        <template v-if="(givenUp && showRemaining) || (hasCompleted && showRemaining)">
                            <div class="level" v-for="(level, i) in levels.slice(progression.length)" :key="'rem-'+i">
                                <a :href="level.video" target="_blank" class="video">
                                    <img :src="getThumbnailFromId(getYoutubeIdFromUrl(level.video))" alt="">
                                </a>
                                <div class="meta">
                                    <p>#{{ level.rank }}</p>
                                    <h2>{{ level.name }}</h2>
                                </div>
                            </div>
                        </template>
                    </template>
                    <template v-else>
                        <p>No levels loaded. Start a roulette to populate levels.</p>
                    </template>
                </div>
            </section>
            <div class="toasts-container">
                <div class="toasts">
                    <div v-for="(toast, idx) in toasts" :key="'t-'+idx" class="toast">
                        <p>{{ toast }}</p>
                    </div>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        loading: false,
        levels: [],
        progression: [], // each push represents one completed level; progression.length = number completed
        givenUp: false,
        showRemaining: false,
        useMainList: true,
        useExtendedList: true,
        toasts: [],
        fileInput: undefined,
        // target number of levels to beat
        target: 25,
    }),
    mounted() {
        // Create File Input
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.multiple = false;
        this.fileInput.accept = '.json';
        this.fileInput.addEventListener('change', this.onImportUpload);

        // Load progress from local storage
        const roulette = JSON.parse(localStorage.getItem('roulette'));

        if (!roulette) {
            return;
        }

        this.levels = roulette.levels || [];
        this.progression = roulette.progression || [];

        // If the current level(s) at load are "Deleted", auto-complete them
        this.$nextTick(() => {
            this.autoCompleteDeleted();
        });
    },
    computed: {
        currentLevel() {
            return this.levels[this.progression.length];
        },
        hasCompleted() {
            // Completed when reached target or finished whole list
            return (
                this.progression.length >= this.target ||
                this.progression.length === this.levels.length
            );
        },
        isActive() {
            // Active if a roulette has levels and it's not given up or completed
            return (
                this.levels.length > 0 &&
                !this.givenUp &&
                !this.hasCompleted
            );
        },
        completionMessage() {
            if (this.progression.length >= this.target) {
                return `Target reached — you completed ${this.progression.length} levels!`;
            } else if (this.progression.length === this.levels.length) {
                return `List finished — you completed all ${this.levels.length} levels!`;
            }
            return '';
        },
    },
    watch: {
        // watch the computed currentLevel so when it changes we auto-complete Deleted ones
        currentLevel() {
            this.autoCompleteDeleted();
        },
    },
    methods: {
        shuffle,
        getThumbnailFromId,
        getYoutubeIdFromUrl,
        async onStart() {
            if (this.isActive) {
                this.showToast('Give up before starting a new roulette.');
                return;
            }

            if (!this.useMainList && !this.useExtendedList) {
                return;
            }

            this.loading = true;

            const fullList = await fetchList();

            if (fullList.filter(([_, err]) => err).length > 0) {
                this.loading = false;
                this.showToast(
                    'List is currently broken. Wait until it\'s fixed to start a roulette.',
                );
                return;
            }

            const fullListMapped = fullList.map(([lvl, _], i) => ({
                rank: i + 1,
                id: lvl.id,
                name: lvl.name,
                video: lvl.verification,
            }));
            const list = [];
            if (this.useMainList) list.push(...fullListMapped.slice(0, 75));
            if (this.useExtendedList) {
                list.push(...fullListMapped.slice(75, 150));
            }

            // random up to 100 levels (keeps original behavior)
            this.levels = shuffle(list).slice(0, 100);
            this.showRemaining = false;
            this.givenUp = false;
            this.progression = [];

            // If resulting list has fewer items than target and is already empty, user is effectively done only after completing what exists.
            if (this.levels.length === 0) {
                this.showToast('No levels available to start.');
            }

            this.loading = false;
            this.save();

            // Immediately auto-complete any front-loaded "Deleted" levels
            this.$nextTick(() => {
                this.autoCompleteDeleted();
            });
        },
        save() {
            localStorage.setItem(
                'roulette',
                JSON.stringify({
                    levels: this.levels,
                    progression: this.progression,
                }),
            );
        },
        onComplete() {
            // mark current as completed — push an object snapshot of the level for export clarity
            const lvl = this.currentLevel;
            if (!lvl) {
                this.showToast('No current level to complete.');
                return;
            }

            this.progression.push({
                rank: lvl.rank,
                id: lvl.id,
                name: lvl.name,
            });

            // if reached completion criteria, auto-save and keep givenUp false
            this.save();
        },
        onGiveUp() {
            this.givenUp = true;

            // Remove saved roulette so a fresh start is possible.
            localStorage.removeItem('roulette');
        },
        onImport() {
            if (
                this.isActive &&
                !window.confirm('This will overwrite the currently running roulette. Continue?')
            ) {
                return;
            }

            // Show file picker (using showPicker when available)
            if (this.fileInput.showPicker) {
                this.fileInput.showPicker();
            } else {
                // fallback
                this.fileInput.click();
            }
        },
        async onImportUpload() {
            if (this.fileInput.files.length === 0) return;

            const file = this.fileInput.files[0];

            if (file.type !== 'application/json') {
                this.showToast('Invalid file.');
                return;
            }

            try {
                const roulette = JSON.parse(await file.text());

                if (!roulette.levels || !('progression' in roulette)) {
                    this.showToast('Invalid file.');
                    return;
                }

                this.levels = roulette.levels;
                this.progression = roulette.progression;
                this.save();
                this.givenUp = false;
                this.showRemaining = false;

                // Auto-complete any leading "Deleted" levels after import
                this.$nextTick(() => {
                    this.autoCompleteDeleted();
                });
            } catch {
                this.showToast('Invalid file.');
                return;
            }
        },
        onExport() {
            const file = new Blob(
                [JSON.stringify({
                    levels: this.levels,
                    progression: this.progression,
                })],
                { type: 'application/json' },
            );
            const a = document.createElement('a');
            a.href = URL.createObjectURL(file);
            a.download = 'tsl_roulette';
            a.click();
            URL.revokeObjectURL(a.href);
        },
        /**
         * Auto-complete consecutive "Deleted" levels starting from the current position.
         * Pushes a snapshot of each deleted level into progression and saves.
         */
        autoCompleteDeleted() {
            if (this.givenUp || this.hasCompleted) return;

            let autoCount = 0;
            // loop while there's a current level and it's id === 'Deleted' and we haven't completed target/list
            while (
                this.currentLevel &&
                this.currentLevel.id === 'Deleted' &&
                !this.hasCompleted &&
                !this.givenUp
            ) {
                const lvl = this.currentLevel;
                // push snapshot
                this.progression.push({
                    rank: lvl.rank,
                    id: lvl.id,
                    name: lvl.name,
                });
                autoCount += 1;
                // continue loop — computed currentLevel will update because progression changed
            }

            if (autoCount > 0) {
                this.save();
                this.showToast(`Auto-completed ${autoCount} deleted level${autoCount > 1 ? 's' : ''}.`);
            }
        },
        showToast(msg) {
            this.toasts.push(msg);
            setTimeout(() => {
                this.toasts.shift();
            }, 3000);
        },
    },
};
