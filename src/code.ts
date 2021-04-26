///<reference path="config.ts"/>
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
import Sheet = GoogleAppsScript.Spreadsheet.Sheet;
import Integer = GoogleAppsScript.Integer;

/**
 * Run
 * @constructor
 */
function Run() {
    Execute(false);
}

/**
 * DryRun doesn't send to slack.
 * @constructor
 */
function DryRun() {
    Execute(true);
}

function Execute(dryRun: boolean) {
    const sheet = ArXivSheet.GetActiveArXivSheet();
    const feedUrls = CONFIG.feed_urls;
    if (feedUrls === undefined) {
        Logger.log("feed_urls is empty!");
        return;
    }
    const slackUrls = CONFIG.slack_urls ?? [];
    const targetLang = CONFIG.target_lang ?? "";
    const translateTitle = CONFIG.translate_title ?? false;
    const ignoreUpdated = CONFIG.ignore_updated ?? false;

    const acquiredIDs = sheet.GetAcquiredIDs();
    for (let feedUrl of feedUrls) {
        feedUrl = feedUrl.trim();
        Logger.log(`Check ${feedUrl}`);
        const items = GetArxivFeed(feedUrl);
        for (const item of items) {
            // Split "My Awesome Paper. (arXiv:0123.456789v0 [ab.CD])"
            let title = item.title;
            let info = "";
            const p = title.lastIndexOf("(arXiv:");
            if (p !== -1) {
                info = title.substr(p); // (arXiv:0123.456789v0 [ab.CD])
                title = title.substr(0, p); // My Awesome Paper.
            }
            if (ignoreUpdated && item.title.endsWith("UPDATED)")) {
                Logger.log(`${item.id} is the updated paper.`)
                continue;
            }
            if (acquiredIDs.has(item.id)) {
                Logger.log(`${item.id} is already acquired.`);
            } else {
                Logger.log(`${item.id} is new!`);
                let abst = FormatText(item.abst);
                if (!dryRun && targetLang !== "" && targetLang !== "en") {
                    abst = LanguageApp.translate(abst, "en", targetLang);
                }
                if (!dryRun && translateTitle && targetLang !== "" && targetLang !== "en") {
                    title = LanguageApp.translate(title, "en", targetLang);
                }
                acquiredIDs.add(item.id);
                sheet.AppendID(item.id);
                const vx = `${item.link}
${title} ${info}

${abst}`;
                Logger.log(vx);
                if (!dryRun) {
                    for (const slackUrl of slackUrls) {
                        PostToSlack(slackUrl.trim(), vx);
                    }
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

    static GetActiveArXivSheet() {
        return new ArXivSheet(SpreadsheetApp.getActiveSpreadsheet().getActiveSheet());
    }

    GetRowsAsSet(row: Integer) {
        const lastRow = this.sheet.getLastRow();
        let arr = [];
        if (lastRow > 0) {
            arr = this.sheet.getRange(1, row, lastRow).getValues();
        }
        const l = [].concat(...arr);

        // @ts-ignore
        const ret = new Set<string>(l);
        ret.delete("");
        return ret;
    }

    GetAcquiredIDs() {
        return this.GetRowsAsSet(1);
    }

    AppendID(id: string) {
        this.sheet.appendRow([`'${id}`]);
    }

}

function GetArxivFeed(url: string) {
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

function PostToSlack(url: string, text: string) {
    UrlFetchApp.fetch(url,
        {
            'method': 'post',
            'contentType': 'application/json',
            'payload': JSON.stringify({'text': text})
        }
    );
}

function FormatText(text: string): string {
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
