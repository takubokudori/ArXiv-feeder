/*
Copyright 2021 takubokudori
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
import {feedConfigToFeedInfo} from "./configuration";
import Sheet = GoogleAppsScript.Spreadsheet.Sheet;
import Integer = GoogleAppsScript.Integer;

/**
 * Run
 * @constructor
 */
function Run() {
    execute(false);
}

/**
 * DryRun doesn't send to slack.
 * @constructor
 */
function DryRun() {
    execute(true);
}

function execute(dryRun: boolean) {
    const sheet = ArXivSheet.getActiveArXivSheet();

    const acquiredIDs = sheet.getAcquiredIDs();

    for (let i = 0; i < exports.CONFIG.feeds.length; i++) {
        let feed = feedConfigToFeedInfo(exports.CONFIG, i);
        Logger.log(`Check ${feed.feed_url}`);
        const items = getArxivFeed(feed.feed_url);
        for (const item of items) {
            // Split "My Awesome Paper. (arXiv:0123.456789v0 [ab.CD])"
            let title = item.title;
            let info = "";
            const p = title.lastIndexOf("(arXiv:");
            if (p !== -1) {
                info = title.substr(p); // (arXiv:0123.456789v0 [ab.CD])
                title = title.substr(0, p); // My Awesome Paper.
            }
            if (feed.ignore_updated && item.title.endsWith("UPDATED)")) {
                Logger.log(`${item.id} is the updated paper.`)
                continue;
            }
            if (acquiredIDs.has(item.id)) {
                Logger.log(`${item.id} is already acquired.`);
            } else {
                Logger.log(`${item.id} is new!`);
                let abst = formatText(item.abst);
                if (!dryRun && feed.target_lang !== "" && feed.target_lang !== "en") {
                    abst = LanguageApp.translate(abst, "en", feed.target_lang);
                }
                if (!dryRun && feed.translate_title && feed.target_lang !== "" && feed.target_lang !== "en") {
                    title = LanguageApp.translate(title, "en", feed.target_lang);
                }
                acquiredIDs.add(item.id);
                sheet.appendID(item.id);
                const vx = `${item.link}
${title} ${info}

${abst}`;
                Logger.log(vx);
                if (!dryRun) {
                    feed.slack_urls.forEach(slack_url => {
                        postToSlack(slack_url.trim(), vx);

                    })
                }
            }
        }
    }
}

class ArXivSheet {
    sheet: Sheet;

    constructor(sheet: Sheet) {
        this.sheet = sheet;
    }

    static getActiveArXivSheet() {
        return new ArXivSheet(SpreadsheetApp.getActiveSpreadsheet().getActiveSheet());
    }

    getRowsAsSet(row: Integer) {
        const lastRow = this.sheet.getLastRow();
        let arr = [];
        if (lastRow > 0) {
            arr = this.sheet.getRange(1, row, lastRow).getValues();
        }
        const l = [].concat(...arr);

        const ret = new Set<string>(l);
        ret.delete("");
        return ret;
    }

    getAcquiredIDs() {
        return this.getRowsAsSet(1);
    }

    appendID(id: string) {
        this.sheet.appendRow([`'${id}`]);
    }

}

function getArxivFeed(url: string) {
    const xml = UrlFetchApp.fetch(url).getContentText();
    const document = XmlService.parse(xml);
    const root = document.getRootElement();
    const atom = XmlService.getNamespace('http://purl.org/rss/1.0/');
    const items = root.getChildren("item", atom);
    const ret = new Array(0);
    for (const item of items) {
        const title = item.getChildText('title', atom);
        const abst = item.getChildText('description', atom);
        const link = item.getChildText('link', atom);
        const id = link.substr(link.lastIndexOf('/') + 1);
        ret.push(
            {
                id,
                title,
                link,
                abst
            }
        );
    }
    return ret;
}

function postToSlack(url: string, text: string) {
    UrlFetchApp.fetch(url,
        {
            'method': 'post',
            'contentType': 'application/json',
            'payload': JSON.stringify({'text': text})
        }
    );
}

function formatText(text: string): string {
    return text
        .replace(/\r/g, "")
        .replace(/\n/g, " ")
        .replace(/ {2}/g, " ")
        .replace(/\. /g, ".\r\n")
        .replace(/\.\n/g, ".\r\n")
        .replace(/\.\t/g, ".\r\n")
        .replace(/! /g, "!\r\n")
        .replace(/!\n/g, "!\r\n")
        .replace(/!\t/g, "!\r\n")
        .replace(/\? /g, "?\r\n")
        .replace(/\?\n/g, "?\r\n")
        .replace(/\?\t/g, "?\r\n")
        .replace(/Fig\.\r\n/g, "Fig. ")
        .replace(/et al\.\r\n/g, "et al. ")
        .replace(/et al,\.\r\n/g, "et al. ")
        .replace(/<p>/g, "")
        .replace(/<\/p>/g, "");
}
