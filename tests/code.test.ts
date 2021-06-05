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
import {
    GlobalFeedConfig,
    getSlackUrls,
    implementsFeed,
    feedConfigToFeedInfo
} from "../src/configuration";

export const CONFIG: GlobalFeedConfig = {
    slack_urls: [
        "https://hooks.slack.com/services/test1",
        "https://hooks.slack.com/services/test2",
        "https://hooks.slack.com/services/test3",
        "https://hooks.slack.com/services/test3",
    ],
    target_lang: "ja",
    translate_title: true,
    ignore_updated: false,
    feeds: [
        {feed_url: "0", slack_urls: [0]},
        {feed_url: "1"},
        {feed_url: "2", slack_urls: []},
        {feed_url: "3", slack_urls: [0, 1]},
        {feed_url: "4", slack_urls: [0, 1, "https://hooks.slack.com/services/test10"]},
        {feed_url: "5", ignore_updated: true, target_lang: "en"},
        "6",
    ],
};

function testGetSlackUrls(globalSlackUrls: string[], x: any, expected: string[]) {
    if (implementsFeed(x)) {
        expect(getSlackUrls(globalSlackUrls, x)).toEqual(expected);
    }
}

test('config', () => {
    let globalSlackUrls = CONFIG.slack_urls;
    testGetSlackUrls(globalSlackUrls, CONFIG.feeds[0], [
        "https://hooks.slack.com/services/test1",
    ]);
    testGetSlackUrls(globalSlackUrls, CONFIG.feeds[1], [
        "https://hooks.slack.com/services/test1",
        "https://hooks.slack.com/services/test2",
        "https://hooks.slack.com/services/test3",
        "https://hooks.slack.com/services/test3",
    ]);
    testGetSlackUrls(globalSlackUrls, CONFIG.feeds[2], [
        "https://hooks.slack.com/services/test1",
        "https://hooks.slack.com/services/test2",
        "https://hooks.slack.com/services/test3",
        "https://hooks.slack.com/services/test3",
    ]);
    testGetSlackUrls(globalSlackUrls, CONFIG.feeds[3], [
        "https://hooks.slack.com/services/test1",
        "https://hooks.slack.com/services/test2",
    ]);
    testGetSlackUrls(globalSlackUrls, CONFIG.feeds[4], [
        "https://hooks.slack.com/services/test1",
        "https://hooks.slack.com/services/test2",
        "https://hooks.slack.com/services/test10",
    ]);
    testGetSlackUrls(globalSlackUrls, CONFIG.feeds[6], [
        "https://hooks.slack.com/services/test1",
        "https://hooks.slack.com/services/test2",
        "https://hooks.slack.com/services/test3",
        "https://hooks.slack.com/services/test3",
    ]);
});

test('config_to_info', () => {
    expect(feedConfigToFeedInfo(CONFIG, 0)).toEqual({
        feed_url: "0",
        slack_urls: new Set<string>([
            "https://hooks.slack.com/services/test1",
        ]),
        target_lang: "ja",
        translate_title: true,
        ignore_updated: false,
    });
    expect(feedConfigToFeedInfo(CONFIG, 1)).toEqual({
        feed_url: "1",
        slack_urls: new Set<string>([
            "https://hooks.slack.com/services/test1",
            "https://hooks.slack.com/services/test2",
            "https://hooks.slack.com/services/test3",
        ]),
        target_lang: "ja",
        translate_title: true,
        ignore_updated: false,
    });
    expect(feedConfigToFeedInfo(CONFIG, 2)).toEqual({
        feed_url: "2",
        slack_urls: new Set<string>([
            "https://hooks.slack.com/services/test1",
            "https://hooks.slack.com/services/test2",
            "https://hooks.slack.com/services/test3",
        ]),
        target_lang: "ja",
        translate_title: true,
        ignore_updated: false,
    });
    expect(feedConfigToFeedInfo(CONFIG, 3)).toEqual({
        feed_url: "3",
        slack_urls: new Set<string>([
            "https://hooks.slack.com/services/test1",
            "https://hooks.slack.com/services/test2",
        ]),
        target_lang: "ja",
        translate_title: true,
        ignore_updated: false,
    });
    expect(feedConfigToFeedInfo(CONFIG, 4)).toEqual({
        feed_url: "4",
        slack_urls: new Set<string>([
            "https://hooks.slack.com/services/test1",
            "https://hooks.slack.com/services/test2",
            "https://hooks.slack.com/services/test10",
        ]),
        target_lang: "ja",
        translate_title: true,
        ignore_updated: false,
    });
    expect(feedConfigToFeedInfo(CONFIG, 5)).toEqual({
        feed_url: "5",
        slack_urls: new Set<string>([
            "https://hooks.slack.com/services/test1",
            "https://hooks.slack.com/services/test2",
            "https://hooks.slack.com/services/test3",
        ]),
        target_lang: "en",
        translate_title: true,
        ignore_updated: true,
    });
    expect(feedConfigToFeedInfo(CONFIG, 6)).toEqual({
        feed_url: "6",
        slack_urls: new Set<string>([
            "https://hooks.slack.com/services/test1",
            "https://hooks.slack.com/services/test2",
            "https://hooks.slack.com/services/test3",
        ]),
        target_lang: "ja",
        translate_title: true,
        ignore_updated: false,
    });
});
