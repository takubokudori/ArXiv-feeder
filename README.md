# ArXiv feeder

A Google Apps Script (GAS) to send translated arXiv feeds to Slack.

# Usage

0. Install and setup [clasp](https://github.com/google/clasp) and npm and Slack webhook.

1. Clone this.

```
git clone https://github.com/takubokudori/ArXiv-feeder
```

2. Create `config.ts` and write a configuration.

```
cd ArXiv-feeder
npm install
vi src/config.ts
```

* An example to config.ts

```
const CONFIG = {
    slack_urls: [
        "https://hooks.slack.com/services/Y0ur/w5bHO0k/URL",
    ],
    feed_urls: [
        "http://export.arxiv.org/rss/cs.DC",
        "http://export.arxiv.org/rss/math.QA"
    ],
    target_lang: "ja",
    translate_title: true,
    ignore_updated: true,
};
```

Edit `slack_urls`, `feed_urls`, `target_lang`.

- slack_urls : Slack webhook URLs.
- feed_urls : ArXiv RSS URLs.
- target_lang : Language to be translated.
- translate_title : If this is true, titles will be translated.
- ignore_updated : If this is true, paper updates will be ignored.

3. Upload to GAS.

```
clasp create ArXiv-feeder
# Create "sheets" script.
clasp push
```

4. Grant the app. (First, execute `dryRun` to initialize the acquired ID list.)

5. Set a trigger.

![trigger](https://user-images.githubusercontent.com/16149911/113476401-4951fa00-94b6-11eb-8548-126c409b0425.PNG)

# LICENSE

See ./LICENSE

