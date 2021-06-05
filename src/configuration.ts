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
export interface Feed {
    feed_url: string;
    slack_urls?: (number | string)[];
    target_lang?: string;
    translate_title?: boolean;
    ignore_updated?: boolean;
}

export interface GlobalFeedConfig {
    slack_urls: string[];
    target_lang?: string;
    translate_title?: boolean;
    ignore_updated?: boolean;
    feeds: (string | Feed)[];
}

export interface FeedInfo {
    feed_url: string;
    slack_urls: Set<string>;
    target_lang: string;
    translate_title: boolean;
    ignore_updated: boolean;
}

export function feedConfigToFeedInfo(gfc: GlobalFeedConfig, i: number): FeedInfo {
    const globalSlackUrls = gfc.slack_urls ?? [];
    const globalTargetLang = gfc.target_lang ?? "";
    const globalTranslateTitle = gfc.translate_title ?? false;
    const globalIgnoreUpdated = gfc.ignore_updated ?? false;

    const feed = gfc.feeds[i];
    let feed_url: string;
    let slack_urls: string[] = globalSlackUrls;
    let target_lang: string;
    let translate_title: boolean;
    let ignore_updated: boolean;
    if (implementsFeed(feed)) {
        feed_url = feed.feed_url;
        if (typeof feed.slack_urls !== "undefined") {
            slack_urls = getSlackUrls(globalSlackUrls, feed);
        }
        ignore_updated = feed.ignore_updated ?? globalIgnoreUpdated;
        translate_title = feed.translate_title ?? globalTranslateTitle;
        target_lang = feed.target_lang ?? globalTargetLang;
    } else {
        feed_url = feed;
        ignore_updated = globalIgnoreUpdated;
        translate_title = globalTranslateTitle;
        target_lang = globalTargetLang;
    }
    feed_url = feed_url.trim();

    return {
        feed_url,
        slack_urls: new Set<string>(slack_urls),
        ignore_updated,
        translate_title,
        target_lang
    }
}


export function getSlackUrls(globalSlackUrls: string[], feed: Feed): string[] {
    const ret = [];
    if (typeof feed.slack_urls === "undefined") {
        return globalSlackUrls;
    } else {
        if (feed.slack_urls.length === 0) return globalSlackUrls;
        for (const slackUrl of feed.slack_urls) {
            if (typeof slackUrl === "number") {
                ret.push(globalSlackUrls[slackUrl]);
            } else {
                const x = slackUrl.trim();
                if (x.startsWith("https://hooks.slack.com/services/")) {
                    ret.push(x);
                }
            }
        }
    }
    return ret;
}

export function implementsFeed(x: any): x is Feed {
    return x !== null &&
        typeof x.feed_url === "string";
}
