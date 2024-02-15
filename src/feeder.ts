/*
Copyright 2024 takubokudori
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import Element = GoogleAppsScript.XML_Service.Element;

export interface Entry {
    id: string,
    title: string,
    categories: string,
    link: string,
    description: string,
    is_updated: boolean,
}

export function fetchFeedUrl(url: string): Feeder {
    const xml = UrlFetchApp.fetch(url).getContentText();
    const document = XmlService.parse(xml);
    const root = document.getRootElement();
    return getFeeder(root);
}

function categories2str(categories: Element[], func_cat2str: (x: Element) => string): string {
    if (categories.length === 0) {
        return "";
    }
    const str_categories = categories.map(func_cat2str);
    str_categories.sort();
    let ret = "("
    for (let i = 0; i < str_categories.length; i++) {
        if (str_categories[i] === "") continue;
        if (i != 0) {
            ret += ", ";
        }
        ret += str_categories[i];
    }
    ret += ")";
    return ret;
}

function getFeeder(root: Element): Feeder | null {
    const tag = root.getName().toLowerCase();
    switch (tag) {
        case 'feed':
            return new Feed(root);
        case 'rss':
            return new Rss(root);
        default:
            return null;
    }
}

export interface Feeder {
    getEntryElements(): Element[];

    getEntries(): Entry[];

    getTitle(entry: Element): string;

    getCategories(entry: Element): string;

    getLink(entry: Element): string;

    getDescription(entry: Element): string;

    getId(entry: Element): string;

    getIsUpdated(entry: Element): boolean;
}

export class Feed implements Feeder {
    static nameSpace = XmlService.getNamespace('http://www.w3.org/2005/Atom');
    static arxiv = XmlService.getNamespace("http://arxiv.org/schemas/atom");
    root: Element;

    constructor(root: Element) {
        this.root = root;
    }

    getEntryElements(): Element[] {
        return this.root.getChildren('entry', Feed.nameSpace);
    }

    getEntries(): Entry[] {
        return getEntriesData(this);
    }

    getTitle(entry: Element): string {
        return entry.getChild('title', Feed.nameSpace).getText();
    }

    getCategories(entry: Element): string {
        const categories = entry.getChildren('category', Feed.nameSpace);
        return categories2str(categories, (x) => x.getAttribute("term").getValue());
    }

    getId(entry: Element): string {
        const link = this.getLink(entry);
        return link.substring(link.lastIndexOf('/') + 1);
    }

    getLink(entry: Element): string {
        return entry.getChild('link', Feed.nameSpace).getAttribute('href').getValue();
    }

    getDescription(entry: Element): string {
        return entry.getChild('summary', Feed.nameSpace).getText();
    }

    getIsUpdated(entry: Element): boolean {
        return entry.getChild('announce_type', Feed.arxiv).getText().toLowerCase().indexOf("replace") !== -1;
    }
}

export class Rss implements Feeder {
    static arxiv = XmlService.getNamespace("http://arxiv.org/schemas/atom");
    root: Element;

    constructor(root: Element) {
        this.root = root;
    }

    getEntryElements(): Element[] {
        return this.root.getChild('channel').getChildren('item');
    }

    getEntries(): Entry[] {
        return getEntriesData(this);
    }

    getTitle(entry: Element): string {
        return entry.getChild('title').getText();
    }

    getCategories(entry: Element): string {
        const categories = entry.getChildren('category');
        return categories2str(categories, (x) => x.getText());
    }

    getId(entry: Element): string {
        const link = this.getLink(entry);
        return link.substring(link.lastIndexOf('/') + 1);
    }

    getLink(entry: Element): string {
        return entry.getChild('link').getText();
    }

    getDescription(entry: Element): string {
        return entry.getChild('description').getText();
    }

    getIsUpdated(entry: Element): boolean {
        return entry.getChild('announce_type', Feed.arxiv).getText().toLowerCase().indexOf("replace") !== -1;
    }
}

function getEntriesData(feeder: Feeder): Entry[] {
    const ret: Entry[] = new Array(0);
    for (const entry of feeder.getEntryElements()) {
        const id = feeder.getId(entry);
        const title = feeder.getTitle(entry);
        const categories = feeder.getCategories(entry);
        const link = feeder.getLink(entry);
        const description = feeder.getDescription(entry);
        const is_updated = feeder.getIsUpdated(entry);
        ret.push(
            {
                id,
                title,
                categories,
                link,
                description,
                is_updated,
            }
        );
    }
    return ret;
}
