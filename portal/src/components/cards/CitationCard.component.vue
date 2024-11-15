<template>
    <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
        <h5 class="text-2xl font-medium">Citation</h5>
        <hr class="divider divider-gray pt-2" />
        <el-link plain @click="dialogVisible = true" type="primary">
            View citation details
        </el-link>

        <el-dialog v-model="dialogVisible" title="Citation" width="40%">
            <h4 class="text-1xl font-medium">
                Bibliography Entry
            </h4>
            <p class="spaced">
            <div v-html="bibliography"></div>
            </p>
            <hr class="divider divider-gray mt-4 pb-2" />
            <p class="spaced"></p>
            <div v-if="this.citation">
                <h4 class="text-1xl font-medium">
                    Related Published Work
                </h4>
                <p class="spaced">
                    Please also cite this <el-link type="primary" target="_blank" :href=this.citationDoi>published
                        work</el-link> based on the collection:
                </p>
                <p class="spaced">
                <div v-html="relatedPublishedWork"></div>
                </p>
                <hr class="divider divider-gray mt-4 pb-2" />
                <p class="spaced"></p>
            </div>
            <h4 class="text-1xl font-medium">
                Further Information
            </h4>
            <p class="spaced">
                The citation information above is not in any specific format or style, but is meant to provide the
                essential citation elements for a minimal bibliographic reference (Tromsø Recommendations 2019).
                See our <el-link type="primary" target="_blank"
                    href="https://www.ldaca.edu.au/resources/user-guides/portal/cite-data/">help</el-link>
                page for more detail on this topic.
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
    props: ['name', 'author', 'datePublished', 'id', 'memberOf', 'citation'],
    data() {
        return {
            // accessDate: this.getAccessDate(),
            // author: this.getAuthor(),
            // name: this.getName(),
            citationDoi: this.getCitationDoi(),
            bibliography: this.getBibliographyEntry(),
            relatedPublishedWork: this.getRelatedPublishedWork(),
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
        // getAccessDate() {
        //     const date = new Date();
        //     const year = date.getFullYear();
        //     const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
        //     const day = String(date.getDate()).padStart(2, '0');
        //     return `${year}-${month}-${day}`;
        // },
        // getAuthor() {
        //     let author = `${first(this.author)?.name[0]?.['@value']}`;
        //     return author;
        // },
        // getName() {
        //     let name = `${first(this.name)?.['@value']}`;
        //     return name;
        // },
        getCitationDoi() {
            let citationDoi = `${this.citation?.[0]?.['@id']}`;
            return citationDoi;
        },
        getBibliographyEntry() {
            let author = `<b>Author:</b> ${first(this.author)?.name[0]?.['@value']}`;
            let title = `<b>Title:</b> ${first(this.name)?.['@value']}`;
            // let memberOf = `${first(this.memberOf)?.name[0]?.['@value']}`;
            let publishedDate = `<b>Date:</b> ${first(this.datePublished)?.['@value']}`;
            let publisher = `<b>Publisher:</b> ${this.$store.state.configuration.ui.title}`;
            let baseUrl = `<b>Locator:</b> ${window.location.origin}`;
            let locator = `<b>Identifier:</b> ${this.id}`;
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
            const day = String(date.getDate()).padStart(2, '0');
            let accessDate = `<b>Access Date:</b> ${year}-${month}-${day}`;
            let variables = [author, title, publishedDate, publisher, baseUrl, locator, accessDate];
            let result = variables.filter(value => !String(value).includes("undefined")).join(", ");
            return result
            // if (memberOf === 'undefined') {   //collection level
            //     return `Author: ${author}, Title: ${title}, Date: ${publishedDate}, Publisher: ${publisher}, Locator: ${baseUrl}, Identifier: ${locator}, Access Date: ${accessDate}`
            // } else {   //object level
            //     return `Author: ${author}, Title: ${title}, ${memberOf}, Date: ${publishedDate}, Publisher: ${publisher}, Locator: ${locator}, Access Date: ${accessDate}`
            // }
        },
        getRelatedPublishedWork() {
            //let citationAuthor = `<b>Author:</b> TODO`;
            let citationTitle = `<b>Title:</b> ${first(this.citation)?.name[0]?.['@value']}`;
            let citationPublishedDate = `<b>Date:</b> ${first(this.citation)?.datePublished[0]?.['@value']}`;
            let citationPublisher = `<b>Publisher:</b> ${first(this.citation)?.publisher[0]?.['@value']}`;
            let citationLocator = `<b>Locator:</b> ${this.citation?.[0]?.['@id']}`;
            // if (citationTitle !== 'undefined') {
            let variables = [citationTitle, citationPublishedDate, citationPublisher, citationLocator];
            let result = variables.filter(value => !String(value).includes("undefined")).join(", ");
            return result
            // }
            // if (citationTitle !== 'undefined') {
            //     return `Author: ${citationAuthor}, Title: ${citationTitle}, Date: ${citationPublishedDate}, Publisher: ${citationPublisher}, Locator: ${citationLocator}`
            // } else {
            //     return 'No related published works'
            // }
        }
    }
}
</script>