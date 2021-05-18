<p align="center">
  <img src="./assets/techpivot-streaming-slack-notifier-logo.png" alt="TechPivot Streaming Slack Notifier Logo" />
</p>

<h1 align="center">Streaming Slack Notify</h1>

<h4 align="center">
  The definitive service for streaming GitHub action workflow jobs to Slack.
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

The existing GitHub actions that post to Slack were only displayed at the conclusion of
workflow runs, which results in ambiguous job status for long-running workflows. Additionally, existing actions contained limited information and often prioritized the wrong data elements. This service attempts to solve those issues by registering the Streaming Slack Notify GitHub and Slack applications, linking them together, and polling workflow runs via a lightweight cloud-native service.

## Sample Output

## Features

- Ability to display job step status from beginning of workflow to end
- Single slack message that continuously updates the current job statuses
- Support for **push**, **pull_request**, **schedule** events
- Clean and consistent Slack UI
- Lightweight, minimal dependencies, and pure TypeScript
- Lean AWS cloud footprint that utilizes free tier services and cost-optimized services
- Fully open sourced

## Usage

## How It Works

## Cost Optimization

The current infrastructure is deployed in a dedicated AWS account that is actively managed by TechPivot. In order to provide a public service such as this, various parts of the infrastrucure are cost-optimized including:

- EC2 Spot Instances - Reducing cost by running on small instances that can be interrupted and easily resumed by other instances from a large pool.
- Minimizing the number of EC2 Metrics - Metrics are free for the first 10 and \$0.30/month thereafter.
- Minimizing EBS volume size - Argueably the larger cost of these tiny instances is actually the size of the EBS volumes.
- Leveraging AWS free tier services including DynamoDB, Lambda, and API Gateway.

## Support

Please help support this project and [donate](https://github.com/sponsors/techpivot).

## License

[MIT](LICENSE) © 2021 TechPivot

---

> **[TechPivot](https://www.techpivot.net)** &nbsp;&nbsp;&middot;&nbsp;&nbsp;
> GitHub [@techpivot](https://github.com/techpivot) &nbsp;&nbsp;&middot;&nbsp;&nbsp;
> LinkedIn [techpivot](https://www.linkedin.com/company/techpivot/) &nbsp;&nbsp;&middot;&nbsp;&nbsp;
> Twitter [@techpivot](https://twitter.com/techpivot)
