<p align="center">
  <img src="./assets/techpivot-streaming-slack-notifier-logo.png" alt="TechPivot Streaming Slack Notifier Logo" />
</p>

<h1 align="center">Streaming Slack Notify</h1>

<h4 align="center">
  The definitive <a href="https://github.com/features/actions">Github Action</a>
  for streaming workflow job status to Slack.
</h4>
<h6 align="center">
  Actively maintained by <a href="https://www.techpivot.net">TechPivot</a> and the community.
</h4>

<p align="center">
  <a href="https://github.com/techpivot/streaming-slack-notify/actions">
    <img src="https://github.com/techpivot/streaming-slack-notify/workflows/Main/badge.svg?branch=master" />
  </a>
  <a href="https://codeclimate.com/repos/5eb1cb1c668cc4318e007908/maintainability">
    <img src="https://api.codeclimate.com/v1/badges/0ffe5bd35f9e43f827b9/maintainability" />
  </a>
  <a href="https://github.com/techpivot/streaming-slack-notify/releases">
    <img src="https://img.shields.io/github/v/release/techpivot/streaming-slack-notify" />
  </a>
  <a href="https://github.com/techpivot/streaming-slack-notify/issues">
    <img src="https://img.shields.io/github/issues/techpivot/streaming-slack-notify.svg" />
  </a>
  <a href="https://github.com/techpivot/streaming-slack-notify/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/techpivot/streaming-slack-notify" />
  </a>
  <a href="https://github.com/techpivot/streaming-slack-notify/stargazers">
    <img src="https://img.shields.io/github/stars/techpivot/streaming-slack-notify.svg?style=social&label=Stars&maxAge=2592000" />
  </a>
</p>

## Overview

1. [Motivation](#motivation)
1. [Sample Output](#sample-output)
1. [Features](#features)
1. [Usage](#features)
1. [Configuration Options](#configuration-options)
1. [Contributing](#contributing)
1. [License](#license)

## Motivation

The existing Slack actions were only displayed at the conclusion of
workflow runs, which results in ambiguous job status for long-running workflows. Additionally, existing actions contained limited information and often prioritized the wrong data elements. This GitHub action attempts to solve those issues.

## Sample Output

### Event: `push`

### Event: `pull_request`

Default output if you've not set any attachment will look like this.

## Features

- Ability to display job step status from beginning of workflow to end
- Support for **push**, **pull_request** events
- Clean and consistent Slack UI
- Lightweight, minimal dependencies, and pure TypeScript/JavaScript
- Minimal configuration options
- Fast: Typically completes in 500-700ms

## Usage

### Create Slack API Token

### Save API Token in GitHub Secrets

1. On GitHub, navigate to the main page of the repository.
1. Under your repository name, click **Settings**.
   Repository settings button
1. In the left sidebar, click **Secrets**.
1. In the **Name** field, specify: `SLACK_ACCESS_TOKEN`
1. In the **Value** field, paste the Slack API Token generated in the previous section.
1. Click **Add secret**.

> Additional Reference: [GitHub Storing Encrypted Secrets](https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets#creating-encrypted-secrets)

### Update Workflow Action YAML

Incorporate this action into your workflow by copying and pasting the snippets below into workflow .yml file accordingly.

Currently, this action needs to be injected inbetween every step to achieve the best results.

At the **very first part of your workflow**, add this action. The **first time** the action is run, the **channel** field is required as well as any of the optional [configuration settings](#user-content-configuration-options). Add the following snippet at the very beginning of a single job, or in an initialization job that is a pre-req for a multi-job workflow.

**First Action**

```yaml
- uses: techpivot/streaming-slack-notify@v1
  with:
    slack_access_token: ${{ secrets.SLACK_ACCESS_TOKEN }}
    channel: '#builds'
```

> **Note**: Ensure the `channel` value is enclosed in quotes.

Next, copy the same snippet without any configuration options in between every other step as such:

**Actions In Between Other Steps**

```yaml
- uses: techpivot/streaming-slack-notify@v1
  with:
    slack_access_token: ${{ secrets.SLACK_ACCESS_TOKEN }}

- run: echo "My custom step 1"

- uses: techpivot/streaming-slack-notify@v1
  with:
    slack_access_token: ${{ secrets.SLACK_ACCESS_TOKEN }}

- run: echo "My custom step 2"
### ... continued
```

In order to handle failures and properly simulate the conclusion of the workflow _(while running inside the workflow)_, the **final** action needs to include the `if: always()` block and an additional variable: `is_final_step: true`.

**Final Action**

```yaml
- uses: techpivot/streaming-slack-notify@v1
  if: always()
  with:
    slack_access_token: ${{ secrets.SLACK_ACCESS_TOKEN }}
    is_final_step: true
```

## Configuration Options

All configuration options are action inputs and should be used inside the YAML `with:` section as key/value pairs.

| Parameter         | Description                                                                                                                                                                                                        | Required |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| `slack_app_token` | Your Slack APP token received when registering your workspace                                                                                                                                                      | **Yes**  |
| `channel`         | Slack Channel, private group, or IM channel to send message to. Can be an encoded ID, or a name. This is required to send the first Slack message. Subsequent github actions calls can omit this value for brevity | **Yes**  |
| `username`        | The slack bot user name                                                                                                                                                                                            | No       |
| `icon_url`        | URL to an image to use as the icon for this message                                                                                                                                                                | No       |
| `icon_emoji`      | Emoji to use as the icon for this message. Overrides `icon_url`                                                                                                                                                    | No       |

## How It Works

## Contributing

Bug reports and feature requests via [issues](https://github.com/techpivot/streaming-slack-notify/issues) are welcome. Additionally, [pull requests](https://github.com/techpivot/streaming-slack-notify/pulls) are also welcome!

### Helping Out

1. Fork this repo
2. Modify the corresponding `./packages` as necessary.
3. Ensure to `format`, `lint`, and `build` _(See `package.json` scripts for more info)_
4. Submit a PR

### Developer Reference

- Project setup is a Monorepo using Yarn workspaces. This works fairly well for shared dependencies,
  specifically, the `common` package. We resolve using relative paths and not aliases (e.g. `../../common`)
  as this works 100% of the time cross platform. When using aliases/path resolves it works when
  compiling but not currently in VSCode. _More investigation is needed to migrate to aliases._

- If you need to run any of the the NPM/Yarn commands on a system
  that may not have anything installed, we provide a docker-compose
  helper.

  ```bash
  docker-compose up

  # Then in another terminal:
  docker exec -it streaming-slack-notify bash
  ```

- [Slack Message Builder](https://api.slack.com/docs/messages/builder)
  > Use the Slack debug payload from existing actions to seed a message builder and then iterate as necessary.

## License

[MIT](LICENSE) © 2020 TechPivot

---

> **[TechPivot](https://www.techpivot.net)** &nbsp;&nbsp;&middot;&nbsp;&nbsp;
> GitHub [@techpivot](https://github.com/techpivot) &nbsp;&nbsp;&middot;&nbsp;&nbsp;
> LinkedIn [techpivot](https://www.linkedin.com/company/techpivot/) &nbsp;&nbsp;&middot;&nbsp;&nbsp;
> Twitter [@techpivot](https://twitter.com/techpivot)
