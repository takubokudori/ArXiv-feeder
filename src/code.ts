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
import Sheet = GoogleAppsScript.Spreadsheet.Sheet;
import Integer = GoogleAppsScript.Integer;
import {FeedInfo} from "./configuration";
import {Entry} from "./feeder";

/**
 * Run
 * @constructor
 */
function run(): void {
    execute(false);
}

/**
 * DryRun doesn't send to slack.
 * @constructor
 */
function dryRun(): void {
    execute(true);
}

function execute(dryRun: boolean): void {
    const sheet = ArXivSheet.getActiveArXivSheet();
    const acquiredIDs = sheet.getAcquiredIDs();
    const abortTiming = exports.CONFIG.abort ?? "no";
    switch (abortTiming) {
        case "immediately":
        case "yes":
        case "no":
            break;
        default:
            throw new Error(`Invalid abort parameter: ${abortTiming}`);
    }
    let errorMessage = "";

    for (let i = 0; i < exports.CONFIG.feeds.length; i++) {
        let feed: FeedInfo = exports.feedConfigToFeedInfo(exports.CONFIG, i);
        Logger.log(`Check ${feed.feed_url}`);
        let items: Entry[];
        try {
            items = exports.fetchFeedUrl(feed.feed_url).getEntries();
        } catch (e) {
            if (abortTiming === "immediately") throw e;
            const msg = `Failed to get feed ${feed.feed_url}: ${e}`;
            Logger.log(msg);
            errorMessage += `${msg}\n`;
            continue;
        }
        for (const item of items) {
            let title = item.title;
            if (feed.ignore_updated && item.is_updated) {
                Logger.log(`[Ignored] ${item.id} is the updated paper.`)
                continue;
            }
            if (acquiredIDs.has(item.id)) {
                Logger.log(`[Already] ${item.id}`);
                continue;
            }
            Logger.log(`[  New  ] ${item.id}`);
            let abst = formatText(item.description);
            try {
                if (!dryRun && feed.target_lang !== "" && feed.target_lang !== "en") {
                    abst = LanguageApp.translate(abst, "en", feed.target_lang);
                }
                if (!dryRun && feed.translate_title && feed.target_lang !== "" && feed.target_lang !== "en") {
                    title = LanguageApp.translate(title, "en", feed.target_lang);
                }
            } catch (e) {
                if (abortTiming === "immediately") throw e;
                const msg = `Failed to translate: ${e}`;
                Logger.log(msg);
                errorMessage += `${msg}\n`;
                continue;
            }
            const feedText = `${item.link}
${title}

${abst}`;
            Logger.log(feedText);
            let errSlack = false;
            if (!dryRun) {
                feed.slack_urls.forEach(slack_url => {
                    try {
                        postToSlack(slack_url, feedText);
                    } catch (e) {
                        if (abortTiming === "immediately") throw e;
                        errSlack = true;
                        const msg = `Failed to post to Slack ${slack_url}: ${e}`;
                        Logger.log(msg);
                        errorMessage += `${msg}\n`;
                    }
                });
            }
            if (!errSlack) {
                acquiredIDs.add(item.id);
                sheet.appendID(item.id);
            }
        }
    }
    if (errorMessage.length !== 0) {
        Logger.log(errorMessage);
        if (abortTiming === "yes") throw new Error(errorMessage);
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

function postToSlack(url: string, text: string): void {
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
