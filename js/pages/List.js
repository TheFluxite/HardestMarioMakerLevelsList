import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <div class="list-container">
                <table class="list" v-if="list">
                    <tr v-for="([level, err], i) in list">
                        <td class="rank">
                            <p v-if="i + 1 <= 150" class="type-label-lg">#{{ i + 1 }}</p>
                            <p v-else class="type-label-lg">Legacy</p>
                        </td>
                        <td class="level" :class="{ 'active': selected == i, 'error': !level }">
                            <button @click="selected = i">
                                <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="level.verifier"></LevelAuthors>
                    <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Course ID</div>
                            <p>{{ level.id }}</p>
                        </li>
                    </ul>
                    <h2>Records</h2>
                    <p v-if="selected + 1 <= 150"><strong></p>
                    <p v-else>This level does not accept new records.</p>
                    <table class="records">
                        <tr v-for="record in level.records" class="record">
                            <td class="percent">
                                <p>{{ record.time }}%</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                            <td class="hz">
                                <p>{{ record.hz }}Hz</p>
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <div class="og">
                        <p class="type-label-md">Website layout made by <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a></p>
                    </div>
                    <template v-if="editors">
                        <h3>List Editors</h3>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <h1>Mario Maker 2 Hardest Levels Leaderboard – Submission Rules</h1>

    <p>These rules define the requirements for submitting cleared levels to the Super Mario Maker 2 hardest-levels leaderboard. Submissions must be verifiable, transparent, and fair. All entries are checked for compliance before being accepted.</p>

    <h2>Submission Requirements</h2>
    <ul>
        <li><strong>Format:</strong> Submissions must be provided as YouTube video links. Include the level name and course code in the video title or description.</li>
        <li><strong>Full Run Visible:</strong> The video must show the entire level run from start to finish. Only trimming before the level starts or after the clear screen is allowed.</li>
        <li><strong>Audio/Clicks Not Required:</strong> Audio commentary, microphone input, or controller sounds are not required. Game audio is sufficient.</li>
        <li><strong>Video Quality:</strong> Ensure gameplay is clearly visible. A resolution of at least 720p at 30 FPS is recommended.</li>
    </ul>

    <h2>Legitimacy</h2>
    <ul>
        <li><strong>No Cheating or Hacks:</strong> All runs must be legitimate. No cheat devices, save-state abuse, auto-players, or modified software.</li>
        <li><strong>Official Hardware:</strong> Completions must be done on a standard, unmodified Nintendo Switch running the official game.</li>
        <li><strong>Fair Play:</strong> The submitting player must be the one who actually completed the level. Shared accounts or pooled submissions are not allowed.</li>
    </ul>

    <h2>Level Criteria</h2>
    <ul>
        <li><strong>Leaderboard Levels Only:</strong> Only levels currently on the leaderboard are eligible. Removed levels may only accept submissions within 24 hours of removal.</li>
        <li><strong>Official Course:</strong> Submissions must be from the official, unmodified version uploaded via the in-game course sharing system.</li>
        <li><strong>No Unintended Skips:</strong> Do not use dev exits, glitches, or unintended shortcuts to bypass the level.</li>
    </ul>

    <h2>Additional Rules</h2>
    <ul>
        <li><strong>Post-Removal Submissions:</strong> Levels removed from the leaderboard can still accept submissions for 24 hours after removal.</li>
        <li><strong>Clear Goal and Screen:</strong> The video must clearly show the completion, including touching the flagpole or breaking the castle axe and the ensuing clear animation or screen.</li>
        <li><strong>Video Editing:</strong> Only minor trimming before the start or after the clear is allowed. Do not merge attempts or hide any part of the run.</li>
        <li class="note"><strong>Optional:</strong> Showing your Maker ID or username at the start can help verification.</li>
    </ul>

    <p>Submissions failing to meet these requirements may be rejected. Ensure your video clearly demonstrates the full, legitimate completion of the level.</p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selected: 0,
        errors: [],
        roleIconMap,
        store
    }),
    computed: {
        level() {
            return this.list[this.selected][0];
        },
        video() {
            if (!this.level.showcase) {
                return embed(this.level.verification);
            }

            return embed(
                this.toggledShowcase
                    ? this.level.showcase
                    : this.level.verification
            );
        },
    },
    async mounted() {
        // Hide loading spinner
        this.list = await fetchList();
        this.editors = await fetchEditors();

        // Error handling
        if (!this.list) {
            this.errors = [
                "Failed to load list. Retry in a few minutes or notify list staff.",
            ];
        } else {
            this.errors.push(
                ...this.list
                    .filter(([_, err]) => err)
                    .map(([_, err]) => {
                        return `Failed to load level. (${err}.json)`;
                    })
            );
            if (!this.editors) {
                this.errors.push("Failed to load list editors.");
            }
        }

        this.loading = false;
    },
    methods: {
        embed,
        score,
    },
};
