# ArXiv feeder

A Google Apps Script (GAS) to send translated arXiv feeds to Slack.

If you want to get feeds other than arXiv, please use [Feeder](https://github.com/takubokudori/Feeder).

# Usage

0. Install and setup [clasp](https://github.com/google/clasp) and npm and Slack webhook.

1. Clone this.

```
git clone https://github.com/takubokudori/ArXiv-feeder
```

2. Create `config.ts` and write a configuration.

```
cd ArXiv-feeder
yarn install --dev
vi src/config.ts
```

* An example to config.ts

```
import {GlobalFeedConfig} from "./configuration";

export const CONFIG: GlobalFeedConfig = {
    slack_urls: [
        "https://hooks.slack.com/services/Y0ur/w5bHO0k/URL",
        "https://hooks.slack.com/services/Y0ur/w5bHO0k/URL2",
    ],
    abort: "no",
    target_lang: "ja",
    translate_title: true,
    ignore_updated: false,
    feeds: [
        "https://rss.arxiv.org/rss/cs.DC",
        // I want to ignore the updated papers in the math.QA feed and send them only to the first webhook URL.
        {feed_url: "https://rss.arxiv.org/atom/math.QA", ignore_updated: true, slack_urls: [0]}
    ],
};
```

Edit parameters.

- slack_urls : Slack webhook URLs.
- abort: Abort timing. `"no"` by default.
    - "immediately": Abort immediately when an error occurs.
    - "yes": Accumulate a log when an error occurs and finally abort.
    - "no": Accumulate a log when an error occurs and finally do not abort.
- source_lang : Source language. `"en"` by default.
- target_lang : Target language. No translation by default.
- translate_title : If this is true, titles will be translated. `false` by default.
- ignore_updated : If this is true, updated papers will be ignored. `false` by default.
- feeds : ArXiv RSS URLs.
    - feeds can specify a URL string, or a config object.
    - Each feed can have its own configurations, which can override the global configurations.

3. Upload to GAS.

```
clasp create ArXiv-feeder
# Create "sheets" script.
clasp push
```

4. Grant the app. (First, execute `dryRun` to initialize the acquired ID list.)

5. Set a `run` trigger.

![trigger](https://user-images.githubusercontent.com/16149911/113476401-4951fa00-94b6-11eb-8548-126c409b0425.PNG)

# LICENSE

See ./LICENSE

## ChangeLog

### v1.1.1(2024/2/16)

- Fix arxiv id
- Append the categories to the end of the title
- Changed to consider a paper that contains `replace` in `announce_type` as an updated paper.

### v1.1.0(2024/2/12)

- Support [Re-implemented arXiv RSS](https://blog.arxiv.org/2024/01/31/attention-arxiv-users-re-implemented-rss/)
