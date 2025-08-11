<template>
    <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
        <h5 class="text-2xl font-medium">Citation</h5>
        <hr class="divider divider-gray pt-2" />
        <el-link plain @click="dialogVisible = true" type="primary">
            View citation details for this item
        </el-link>

        <el-dialog v-model="dialogVisible" title="Citation" width="40%">
            <div v-if="this.creditText">
                <h4 class="text-1xl font-medium">
                    Suggested Citation
                </h4>
                <p class="spaced">
                <div v-html="suggestedCitation"></div>
                </p>
                <hr class="divider divider-gray mt-4 pb-2" />
                <p class="spaced"></p>
            </div>
            <h4 class="text-1xl font-medium">
                Elements for a Bibliographic Reference
            </h4>
            <p class="spaced">
            <div v-html="bibliography"></div>
            </p>
            <hr class="divider divider-gray mt-4 pb-2" />
            <p class="spaced"></p>
            <!-- <div v-if="this.citation">
                <h4 class="text-1xl font-medium">
                    Related Published Work
                </h4>
                <p class="spaced">
                    Please also cite other published work based on the collection:
                </p>
                <p class="spaced">
                <div v-html="relatedPublishedWork"></div>
                </p>
                <hr class="divider divider-gray mt-4 pb-2" />
                <p class="spaced"></p>
            </div> -->
            <h4 class="text-1xl font-medium">
                Further Information
            </h4>
            <p class="spaced">
                The <i>Elements for a Bibliographic Reference</i> information above is not in any specific format or
                style, but is meant to provide the
                essential citation elements for a minimal bibliographic reference.
            </p>
            <p class="spaced" v-if="this.citeDataText">
            <div v-html="citeDataText"></div>
            </p>
        </el-dialog>
    </el-card>
</template>

<style scoped>
.spaced {
    padding-top: 16px;
}
</style>

<script>

import { first } from "lodash";
import { ref } from 'vue';

export default {
    props: ['name', 'author', 'datePublished', 'id', 'memberOf', 'citation', 'creator', 'doi', 'creditText'],
    data() {
        return {
            suggestedCitation: this.getSuggestedCitation(),
            bibliography: this.getBibliographyEntry(),
            // relatedPublishedWork: this.getRelatedPublishedWork(),
            citeDataText: this.$store.state.configuration.ui.citeData?.help.text,
        }
    },
    setup() {
        const dialogVisible = ref(false)

        function openDialog() {
            dialogVisible.value = true
        }

        return {
            dialogVisible,
            openDialog
        }
    },
    methods: {
        getSuggestedCitation() {
            let result = `${first(this.creditText)?.['@value']}`;
            return result
        },
        getBibliographyEntry() {
            let author = '';
            if (Array.isArray(this.author) && this.author.length > 0) {
                author = `<b>Author:</b> ${this.author.map(a => a?.name?.[0]?.['@value'] || a?.['@value']).filter(Boolean).join(', ')}`;
            } else if (Array.isArray(this.creator) && this.creator.length > 0) {
                author = `<b>Creator:</b> ${this.creator.map(a => a?.name?.[0]?.['@value'] || a?.['@value']).filter(Boolean).join(', ')}`;
            } else {
                author = `<b>Author:</b> undefined`;
            }
            let title = `<b>Title:</b> ${first(this.name)?.['@value']}`;
            let publishedDate = `<b>Date:</b> ${first(this.datePublished)?.['@value']}`;
            let publisher = `<b>Publisher:</b> ${this.$store.state.configuration.ui.title}`;
            let url = `<b>Locator:</b> ${decodeURIComponent(window.location.href)}`;
            let identifier = `<b>Identifier:</b> ${first(this.doi) ? first(this.doi)['@value'] : this.id}`;
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
            const day = String(date.getDate()).padStart(2, '0');
            let accessDate = `<b>Access Date:</b> ${year}-${month}-${day}`;
            let variables = [author, title, publishedDate, publisher, url, identifier, accessDate];
            let result = variables.filter(value => !String(value).includes("undefined")).join(", ");
            return result
        },
        // getRelatedPublishedWork() {
        //     if (!Array.isArray(this.citation) || this.citation.length === 0) {
        //         return '';
        //     }
        //     return this.citation.map(cite => {
        //         let citationAuthor = `<b>Author:</b> ${Array.isArray(cite.author) && cite.author.length > 0
        //                 ? cite.author.map(a => a?.name?.[0]?.['@value']).filter(Boolean).join(', ')
        //                 : 'undefined'
        //             }`;
        //         let citationTitle = `${cite.name?.[0]?.['@value'] || 'undefined'}`;
        //         let citationPublishedDate = `<b>Date:</b> ${cite.datePublished?.[0]?.['@value'] || 'undefined'}`;
        //         let citationPublisher = `<b>Publisher:</b> ${cite.publisher?.[0]?.['@value'] || 'undefined'}`;
        //         let citationLocator = `<b>Locator:</b> ${cite['@id'] || 'undefined'}`;
        //         // Filter out undefined values and join
        //         let variables = [citationAuthor, citationPublishedDate, citationPublisher, citationLocator];
        //         let head = citationTitle;
        //         let result = variables.filter(value => !value.includes("undefined")).join(", ");
        //         let combined = `${head}<br>${result}`
        //         return combined;
        //     }).join("<br><br>"); // Separate citations with line breaks
        // }

    }
}
</script>